// Texts the studio when a quote or message arrives. The Brevo key stays here.
import { corsHeaders, json } from "../_shared/engine.ts";

const ALLOWED_ORIGINS = new Set([
  "http://127.0.0.1:8765",
  "http://localhost:8765",
  "https://gladstoneuncovered.com",
  "https://www.gladstoneuncovered.com",
  "https://gladstone-uncovered.vercel.app",
]);

function clip(value: unknown, max: number) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function studioNumber(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("61") && digits.length === 11) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `61${digits.slice(1)}`;
  return "";
}

function plain(value: unknown, max: number) {
  return clip(value, max).replace(/[^\x20-\x7E\n]/g, "");
}

function messageFor(body: Record<string, unknown>) {
  const name = plain(body.name, 40);
  const phone = plain(body.phone, 16);
  const quote = plain(body.service, 40);
  if (!name || !phone || !quote) return "";
  return [name, phone, quote].join("\n").slice(0, 160);
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin") || "";
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : "";
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(allow || "*") });
  }
  if (req.method !== "POST") return json({ error: "POST required" }, 405, allow || "*");
  if (origin && !allow) return json({ error: "Origin not allowed" }, 403);

  const apiKey = Deno.env.get("BREVO_API_KEY");
  const recipient = studioNumber(Deno.env.get("SMS_TO") || "");
  if (!apiKey || !recipient) return json({ error: "Text alerts aren’t set up yet." }, 503, allow || "*");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request" }, 400, allow || "*");
  }

  const content = messageFor(body).slice(0, 160);
  if (!content) return json({ error: "Missing details" }, 400, allow || "*");

  const res = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: "Gladstone",
      recipient,
      content,
      type: "transactional",
      unicodeEnabled: false,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("brevo sms failed", res.status, detail.slice(0, 240));
    return json({ error: "Couldn’t send the text." }, 502, allow || "*");
  }

  return json({ ok: true }, 200, allow || "*");
});
