// Stripe Checkout for service quotes. Authorises the card and captures later.
import { corsHeaders, json } from "../_shared/engine.ts";

type ServicePack = {
  id: string;
  title: string;
  basePriceCents: number;
  currency: string;
  depositPercent: number;
  locations: Record<string, number>;
  choiceKey: string;
  choiceName: string;
  choices: Record<string, number>;
  choiceLabels: Record<string, string>;
  addons: Record<string, number>;
  addonLabels: Record<string, string>;
  urgentDisables: string[];
  venueLabel: string;
  dateLabel: string;
  addonMax?: Record<string, number>;
  addonSteps?: string[];
  more?: {
    key: string;
    name: string;
    choices: Record<string, number>;
    labels: Record<string, string>;
  }[];
};

const PACKS: Record<string, ServicePack> = {
  "real-estate-drone-photography": {
    id: "real-estate-drone-photography",
    title: "Real Estate Drone Photography",
    basePriceCents: 15000,
    currency: "aud",
    depositPercent: 20,
    locations: {
      gladstone: 0,
      boyne: 0,
      calliope: 0,
      agnes: 10000,
    },
    choiceKey: "property",
    choiceName: "Property",
    choices: {
      residential: 0,
      vacant: 0,
      "small-commercial": 0,
      acreage: 7000,
      rural: 10000,
      "medium-commercial": 5000,
      "large-commercial": 10000,
    },
    choiceLabels: {
      residential: "Residential",
      vacant: "Vacant land",
      "small-commercial": "Small commercial",
      acreage: "Acreage",
      rural: "Rural",
      "medium-commercial": "Medium commercial",
      "large-commercial": "Large commercial and industrial",
    },
    addons: {
      "photos-10": 3000,
      ocean: 2000,
      "high-tide": 3000,
      "golden-hour": 5000,
      landmarks: 5000,
      urgent: 12500,
    },
    addonLabels: {
      "photos-10": "Additional 10 photographs",
      ocean: "Include nearby ocean or river",
      "high-tide": "On high tide",
      "golden-hour": "Golden hour",
      landmarks: "Distant aerial shot with edited labels of landmarks nearby",
      urgent: "Urgent — 24 hour delivery",
    },
    urgentDisables: ["ocean", "high-tide", "golden-hour", "landmarks"],
    venueLabel: "Property location",
    dateLabel: "Date of the shoot",
  },
  "drone-inspections": {
    id: "drone-inspections",
    title: "Drone Inspections",
    basePriceCents: 15000,
    currency: "aud",
    depositPercent: 20,
    locations: {
      gladstone: 0,
      boyne: 0,
      calliope: 0,
      agnes: 10000,
    },
    choiceKey: "subject",
    choiceName: "Inspection",
    choices: {
      roof: 0,
      solar: 0,
      structure: 0,
    },
    choiceLabels: {
      roof: "Roof",
      solar: "Solar panels",
      structure: "Structure — sheds, tanks, carports",
    },
    addons: {},
    addonLabels: {},
    urgentDisables: [],
    venueLabel: "Site location",
    dateLabel: "Date of the inspection",
  },
  "event-highlights": {
    id: "event-highlights",
    title: "Event Highlights",
    basePriceCents: 40000,
    currency: "aud",
    depositPercent: 20,
    locations: {
      gladstone: 0,
      boyne: 0,
      calliope: 0,
      greater: 10000,
    },
    choiceKey: "event",
    choiceName: "Event",
    choices: {
      celebrations: 0,
      sport: 0,
      community: 0,
    },
    choiceLabels: {
      celebrations: "Celebrations",
      sport: "Sport",
      community: "Community events",
    },
    addons: {
      "extra-video": 12500,
      "extend-crew": 12500,
      "extra-flight": 5000,
      catalogue: 10000,
      "no-drone": -5000,
    },
    addonLabels: {
      "extra-video": "Additional highlight video",
      "extend-crew": "Extend ground crew",
      "extra-flight": "Additional drone flight",
      catalogue: "Unedited video catalogue",
      "no-drone": "Drone footage not required",
    },
    urgentDisables: [],
    venueLabel: "Event location",
    dateLabel: "Date of event",
  },
  "full-day-event-coverage": {
    id: "full-day-event-coverage",
    title: "Full day Event Coverage",
    basePriceCents: 90000,
    currency: "aud",
    depositPercent: 20,
    locations: {
      gladstone: 0,
      boyne: 0,
      calliope: 0,
      greater: 10000,
    },
    choiceKey: "event",
    choiceName: "Event",
    choices: {
      celebrations: 0,
      sport: 0,
      community: 0,
    },
    choiceLabels: {
      celebrations: "Celebrations",
      sport: "Sport",
      community: "Community events",
    },
    addonSteps: ["addons", "live"],
    addons: {
      "extra-reel": 12500,
      "extra-hours": 12500,
      "extra-flight": 5000,
      "live-reel": 12500,
      "live-basic": 7500,
    },
    addonLabels: {
      "extra-reel": "Additional highlight reel",
      "extra-hours": "Additional coverage",
      "extra-flight": "Additional drone flight",
      "live-reel": "Live edited reel",
      "live-basic": "Live basic video",
    },
    addonMax: {
      "extra-reel": 12,
      "extra-hours": 12,
      "extra-flight": 8,
      "live-reel": 3,
      "live-basic": 12,
    },
    urgentDisables: [],
    venueLabel: "Event location",
    dateLabel: "Date of event",
  },
};

const LOCATION_LABELS: Record<string, string> = {
  gladstone: "Gladstone",
  boyne: "Boyne Island / Tannum Sands",
  calliope: "Calliope",
  agnes: "Agnes Water / 1770",
  greater: "Greater Gladstone Region",
};

function allowedReturnUrl(value: unknown) {
  const raw = String(value || "");
  const match = raw.match(/^https?:\/\/([^/?#]+)/i);
  if (!match) return false;
  const host = match[1].split(":")[0].toLowerCase();
  return [
    "127.0.0.1",
    "localhost",
    "gladstoneuncovered.com",
    "www.gladstoneuncovered.com",
  ].includes(host);
}

function readAddonPicks(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    if (typeof entry === "string") return { id: entry, qty: 1 };
    if (entry && typeof entry === "object") {
      const record = entry as Record<string, unknown>;
      return { id: String(record.id || ""), qty: Number(record.qty) };
    }
    return { id: "", qty: 0 };
  });
}

function quoteAmount(pack: ServicePack, selections: Record<string, unknown>) {
  const location = String(selections.location || "");
  const choice = String(selections[pack.choiceKey] || "");
  const addons = (pack.addonSteps || ["addons"]).flatMap((key) =>
    readAddonPicks(selections[key])
  );

  if (location === "other" || location === "outside" || location === "somewhere") {
    throw new Error("This location needs a confirmed price before payment");
  }
  if (choice === "other") {
    throw new Error("This option needs a confirmed price before payment");
  }
  if (!(location in pack.locations)) throw new Error("Invalid location");
  if (!(choice in pack.choices)) throw new Error("Invalid option");

  const ids = addons.map((item) => item.id);
  if (new Set(ids).size !== ids.length) throw new Error("Invalid add-on");
  if (ids.includes("high-tide") && !ids.includes("ocean")) {
    throw new Error("High tide is only available with ocean or river");
  }
  if (ids.includes("urgent")) {
    const blocked = ids.find((id) => pack.urgentDisables.includes(id));
    if (blocked) throw new Error("Urgent delivery can’t be combined with that add-on");
  }
  if (ids.includes("no-drone") && ids.includes("extra-flight")) {
    throw new Error("Drone footage can’t be removed and added in the same quote");
  }

  let total = pack.basePriceCents + pack.locations[location] + pack.choices[choice];
  const moreLines: string[] = [];
  for (const step of pack.more || []) {
    const id = String(selections[step.key] || "");
    if (id === "other") throw new Error("This option needs a confirmed price before payment");
    if (!(id in step.choices)) throw new Error("Invalid option");
    total += step.choices[id];
    moreLines.push(`${step.name}: ${step.labels[id] || id}`);
  }
  for (const item of addons) {
    const price = pack.addons[item.id];
    const max = (pack.addonMax && pack.addonMax[item.id]) || 1;
    if (typeof price !== "number") throw new Error(`Invalid add-on: ${item.id}`);
    if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > max) {
      throw new Error("Invalid add-on quantity");
    }
    total += price * item.qty;
  }
  return { total, addons, location, choice, moreLines };
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
    const pack = PACKS[String(body.packageId || "")];
    if (!pack) return json({ error: "Unknown service" }, 400);
    const pay = body.pay === "full" ? "full" : body.pay === "deposit" ? "deposit" : "";
    if (!pay) return json({ error: "Choose a deposit or the full amount" }, 400);

    const customer = body.customer || {};
    const name = String(customer.name || "").trim();
    const phone = String(customer.phone || "").trim();
    const email = String(customer.email || "").trim();
    const venue = String(customer.venue || "").trim();
    const eventDate = String(customer.eventDate || "").trim();
    const arrivalTime = String(customer.arrivalTime || "").trim();
    const message = String(customer.message || "").trim();
    if (!name || !phone || !email || !venue || !eventDate || !arrivalTime || !message) {
      return json({ error: "Customer details are incomplete" }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Enter a valid email address" }, 400);
    }

    const { total, addons, location, choice, moreLines } = quoteAmount(pack, body.selections || {});
    const hold =
      pay === "full" ? total : Math.round((total * pack.depositPercent) / 100);
    if (hold < 50) return json({ error: "Amount is too small to charge" }, 400);
    if (body.amountCents != null && Number(body.amountCents) !== hold) {
      return json({ error: "Quote mismatch — refresh and try again" }, 400);
    }

    const siteUrl = Deno.env.get("SITE_URL") || "http://127.0.0.1:8765";
    const successUrl = allowedReturnUrl(body.successUrl)
      ? String(body.successUrl)
      : `${siteUrl}/quote-held.html?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = allowedReturnUrl(body.cancelUrl)
      ? String(body.cancelUrl)
      : `${siteUrl}/services/${pack.id}/`;

    const addonText = addons.length
      ? addons
          .map((item) => {
            const label = pack.addonLabels[item.id] || item.id;
            return item.qty > 1 ? `${label} × ${item.qty}` : label;
          })
          .join(", ")
      : "None";
    const portion =
      pay === "full" ? "Full amount" : `${pack.depositPercent}% deposit`;
    const dollars = (cents: number) => `$${(cents / 100).toFixed(0)}`;
    const summary = [
      `${pack.title}`,
      `Estimate ${dollars(total)}`,
      `${portion} reserved until the job is confirmed: ${dollars(hold)}`,
      `Location: ${LOCATION_LABELS[location] || location}`,
      `${pack.choiceName}: ${pack.choiceLabels[choice] || choice}`,
      ...moreLines,
      `Add-ons: ${addonText}`,
      `${pack.venueLabel}: ${venue}`,
      `${pack.dateLabel}: ${eventDate}`,
      `Time we should arrive: ${arrivalTime}`,
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Email: ${email}`,
      message,
    ].join("\n");

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("managed_payments[enabled]", "false");
    params.set("success_url", successUrl);
    params.set("cancel_url", cancelUrl);
    params.set("customer_email", email);
    params.set("billing_address_collection", "required");
    params.set("customer_creation", "always");
    params.set("line_items[0][price_data][currency]", pack.currency);
    params.set(
      "line_items[0][price_data][product_data][name]",
      pay === "full" ? pack.title : `${pack.title} — ${pack.depositPercent}% deposit`
    );
    params.set(
      "line_items[0][price_data][product_data][description]",
      `Reserved until the job is confirmed. Estimate ${dollars(total)}.`.slice(0, 500)
    );
    params.set("line_items[0][price_data][unit_amount]", String(hold));
    params.set("line_items[0][quantity]", "1");
    params.set("payment_intent_data[capture_method]", "manual");
    params.set("payment_intent_data[description]", summary.slice(0, 1000));
    params.set("payment_intent_data[receipt_email]", email);
    params.set("payment_intent_data[metadata][packageId]", pack.id);
    params.set("payment_intent_data[metadata][pay]", pay);
    params.set("payment_intent_data[metadata][quoteCents]", String(total));
    params.set("payment_intent_data[metadata][holdCents]", String(hold));
    params.set("payment_intent_data[metadata][name]", name.slice(0, 500));
    params.set("payment_intent_data[metadata][phone]", phone.slice(0, 500));
    params.set("payment_intent_data[metadata][email]", email.slice(0, 500));
    params.set("payment_intent_data[metadata][venue]", venue.slice(0, 500));
    params.set("payment_intent_data[metadata][eventDate]", eventDate.slice(0, 500));
    params.set("payment_intent_data[metadata][arrivalTime]", arrivalTime.slice(0, 500));
    params.set("metadata[packageId]", pack.id);
    params.set("metadata[pay]", pay);
    params.set("metadata[quoteCents]", String(total));
    params.set("metadata[holdCents]", String(hold));

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

    return json({ url: session.url, id: session.id, amountCents: hold });
  } catch (err) {
    console.error(err);
    return json({ error: String(err.message || err) }, 400);
  }
});
