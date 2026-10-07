import { requireAdmin } from "../_shared/clerk-admin.ts";
import { corsHeaders, json } from "../_shared/engine.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const url = new URL(req.url);
    const personId = url.searchParams.get("person_id");
    if (!personId) {
      return json({ error: "person_id required" }, 400);
    }

    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");

    if (!clientId || !redirectUri) {
      return json({ error: "Google OAuth not configured" }, 500);
    }

    const state = btoa(JSON.stringify({ person_id: personId }));
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope:
        "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email",
      access_type: "offline",
      prompt: "consent",
      state,
    });

    return json({
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    });
  } catch (err) {
    return json({ error: String(err.message || err) }, 500);
  }
});
