import { requireAdmin } from "../_shared/clerk-admin.ts";
import {
  corsHeaders,
  createServiceClient,
  fetchFreeBusy,
  json,
  refreshAccessToken,
} from "../_shared/engine.ts";

/** On-demand freeBusy sync into busy_cache */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const url = new URL(req.url);

    const from =
      url.searchParams.get("from") ||
      new Date().toISOString().slice(0, 10);
    const toDate = new Date(`${from}T12:00:00Z`);
    toDate.setUTCDate(toDate.getUTCDate() + 60);
    const to = url.searchParams.get("to") || toDate.toISOString().slice(0, 10);

    const db = createServiceClient();
    const connections = await db.rest("calendar_connections?select=*");
    let count = 0;

    for (const conn of connections || []) {
      const token = await refreshAccessToken(conn.google_refresh_token);
      const busy = await fetchFreeBusy(
        token.access_token,
        conn.calendar_id || "primary",
        `${from}T00:00:00+10:00`,
        `${to}T23:59:59+10:00`
      );

      // Clear old cache for person in range
      await db.rest(
        `busy_cache?person_id=eq.${conn.person_id}&starts_at=gte.${from}T00:00:00%2B10:00&ends_at=lte.${to}T23:59:59%2B10:00`,
        { method: "DELETE", prefer: "return=minimal" }
      );

      if (busy.length) {
        await db.rest("busy_cache", {
          method: "POST",
          body: JSON.stringify(
            busy.map((b) => ({
              person_id: conn.person_id,
              starts_at: b.start,
              ends_at: b.end,
            }))
          ),
        });
        count += busy.length;
      }
    }

    return json({ ok: true, intervals: count, from, to });
  } catch (err) {
    console.error(err);
    return json({ error: String(err.message || err) }, 500);
  }
});
