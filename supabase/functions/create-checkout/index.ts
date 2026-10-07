// Stripe Checkout for instant quotes — recalculates amount server-side
import { corsHeaders, json } from "../_shared/engine.ts";

const PACKAGES: Record<string, any> = {
  "real-estate": {
    title: "Real Estate Photography",
    basePriceCents: 29900,
    currency: "aud",
    sections: {
      location: {
        gladstone: 0,
        "boyne-tannum": 0,
        calliope: 0,
        "greater-region": 10000,
        elsewhere: "inquire",
      },
      property: {
        residential: 0,
        acreage: 5000,
        rural: 7500,
        commercial: 0,
        industrial: 10000,
      },
      addons: {
        urgent: 10000,
        "golden-hour": 10000,
        "ocean-views": 5000,
        "ocean-high-tide": 10000,
        landmarks: 7500,
      },
    },
  },
};

function calcAmount(packageId: string, selections: Record<string, any>) {
  const pkg = PACKAGES[packageId];
  if (!pkg) throw new Error("Unknown package");
  let total = pkg.basePriceCents;
  const loc = selections.location;
  const prop = selections.property;
  if (!loc || !prop) throw new Error("Location and property type required");

  const locPrice = pkg.sections.location[loc];
  if (locPrice === "inquire") throw new Error("This location requires enquiry");
  if (typeof locPrice !== "number") throw new Error("Invalid location");
  total += locPrice;

  const propPrice = pkg.sections.property[prop];
  if (typeof propPrice !== "number") throw new Error("Invalid property type");
  total += propPrice;

  const addons = Array.isArray(selections.addons) ? selections.addons : [];
  if (addons.includes("ocean-views") && addons.includes("ocean-high-tide")) {
    throw new Error("Choose one ocean/river views option");
  }
  for (const id of addons) {
    const p = pkg.sections.addons[id];
    if (typeof p !== "number") throw new Error(`Invalid add-on: ${id}`);
    total += p;
  }
  return { total, currency: pkg.currency, title: pkg.title };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return json({ error: "Stripe not configured" }, 500);

    const body = await req.json();
    const { packageId, selections, successUrl, cancelUrl, summary } = body;
    const { total, currency, title } = calcAmount(packageId, selections || {});

    // Prefer client amount only as a sanity check
    if (
      body.amountCents != null &&
      Number(body.amountCents) !== total
    ) {
      return json({ error: "Quote mismatch — refresh and try again" }, 400);
    }

    const siteUrl = Deno.env.get("SITE_URL") || "http://127.0.0.1:8080";
    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", successUrl || `${siteUrl}/quote-success.html?session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", cancelUrl || `${siteUrl}/quote.html?service=${packageId}`);
    params.set("billing_address_collection", "required");
    params.set("phone_number_collection[enabled]", "true");
    params.set("customer_creation", "always");
    params.set(
      "line_items[0][price_data][currency]",
      currency
    );
    params.set(
      "line_items[0][price_data][product_data][name]",
      title
    );
    params.set(
      "line_items[0][price_data][product_data][description]",
      String(summary || "Gladstone Uncovered booking").slice(0, 500)
    );
    params.set("line_items[0][price_data][unit_amount]", String(total));
    params.set("line_items[0][quantity]", "1");
    params.set("metadata[packageId]", packageId);
    params.set("metadata[selections]", JSON.stringify(selections || {}).slice(0, 450));

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const session = await stripeRes.json();
    if (!stripeRes.ok) {
      console.error(session);
      return json({ error: session.error?.message || "Stripe error" }, 500);
    }

    return json({ url: session.url, id: session.id, amountCents: total });
  } catch (err) {
    console.error(err);
    return json({ error: String(err.message || err) }, 400);
  }
});
