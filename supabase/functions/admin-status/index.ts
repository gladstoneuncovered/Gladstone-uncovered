import { requireAdmin } from "../_shared/clerk-admin.ts";
import { corsHeaders, createServiceClient, json } from "../_shared/engine.ts";

/** List people + connection status for admin UI */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const db = createServiceClient();
    const [people, connections] = await Promise.all([
      db.rest("people?select=*&order=name"),
      db.rest(
        "calendar_connections?select=person_id,calendar_id,google_email,connected_at"
      ),
    ]);

    const byPerson = Object.fromEntries(
      (connections || []).map((c) => [c.person_id, c])
    );

    return json({
      people: (people || []).map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        connected: Boolean(byPerson[p.id]),
        calendar_id: byPerson[p.id]?.calendar_id || null,
        google_email: byPerson[p.id]?.google_email || null,
        connected_at: byPerson[p.id]?.connected_at || null,
      })),
    });
  } catch (err) {
    return json({ error: String(err.message || err) }, 500);
  }
});
