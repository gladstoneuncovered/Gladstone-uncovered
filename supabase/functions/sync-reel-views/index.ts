import { corsHeaders, createServiceClient, json } from "../_shared/engine.ts";

const STALE_MS = 6 * 60 * 60 * 1000;

function facebookToken() {
  const token =
    Deno.env.get("FACEBOOK_ACCESS_TOKEN") ||
    Deno.env.get("FACEBOOK_PAGE_ACCESS_TOKEN") ||
    "";
  if (token) return token;
  const id = Deno.env.get("FACEBOOK_APP_ID") || "";
  const secret = Deno.env.get("FACEBOOK_APP_SECRET") || "";
  return id && secret ? `${id}|${secret}` : "";
}

function insightViews(data) {
  const values = data?.video_insights?.data;
  if (!Array.isArray(values)) return null;
  for (const row of values) {
    const value = Number(row?.values?.[0]?.value);
    if (Number.isFinite(value) && value >= 0) return value;
  }
  return null;
}

async function videoViews(id, token) {
  const url = new URL(`https://graph.facebook.com/v21.0/${encodeURIComponent(id)}`);
  url.searchParams.set("fields", "id,views,video_insights.metric(post_video_views)");
  url.searchParams.set("access_token", token);
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Facebook ${res.status}`);
  const views = Number(data.views);
  if (Number.isFinite(views) && views >= 0) return views;
  return insightViews(data);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return json({ error: "GET or POST required" }, 405);
  }

  const force = new URL(req.url).searchParams.get("force") === "1";

  try {
    const db = createServiceClient();
    const rows = await db.rest("reel_stats?select=id,views,updated_at&order=id.asc");
    const newest = (rows || []).reduce((latest, row) => {
      const stamp = Date.parse(row?.updated_at);
      return Number.isFinite(stamp) && stamp > latest ? stamp : latest;
    }, 0);
    const fresh = newest && Date.now() - newest < STALE_MS;
    const token = facebookToken();

    if (!force && fresh) {
      return json({ ok: true, synced: false, reels: rows });
    }
    if (!token) {
      return json({ ok: true, synced: false, reason: "no_token", reels: rows });
    }

    const next = [];
    for (const row of rows || []) {
      try {
        const views = await videoViews(String(row.id), token);
        next.push({
          id: String(row.id),
          views: views == null ? row.views : views,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error("reel view failed", row.id, err);
        next.push({
          id: String(row.id),
          views: row.views,
          updated_at: row.updated_at,
        });
      }
    }

    const saved = await db.rest("reel_stats", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: JSON.stringify(next),
    });

    return json({ ok: true, synced: true, reels: saved || next });
  } catch (err) {
    console.error(err);
    return json({ error: String(err.message || err) }, 500);
  }
});
