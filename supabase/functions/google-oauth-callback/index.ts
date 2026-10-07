import { createServiceClient, json } from "../_shared/engine.ts";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateRaw = url.searchParams.get("state");
    const siteUrl = Deno.env.get("SITE_URL") || "http://127.0.0.1:8080";

    if (!code || !stateRaw) {
      return Response.redirect(`${siteUrl}/admin.html?error=missing_code`, 302);
    }

    let personId;
    try {
      personId = JSON.parse(atob(stateRaw)).person_id;
    } catch {
      return Response.redirect(`${siteUrl}/admin.html?error=bad_state`, 302);
    }

    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error(text);
      return Response.redirect(`${siteUrl}/admin.html?error=token`, 302);
    }

    const tokens = await tokenRes.json();
    if (!tokens.refresh_token) {
      return Response.redirect(
        `${siteUrl}/admin.html?error=no_refresh_token`,
        302
      );
    }

    // Fetch primary calendar + email
    let googleEmail = null;
    try {
      const profile = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        { headers: { Authorization: `Bearer ${tokens.access_token}` } }
      );
      if (profile.ok) {
        const p = await profile.json();
        googleEmail = p.email;
      }
    } catch {
      /* optional */
    }

    const db = createServiceClient();
    // Upsert connection
    const existing = await db.rest(
      `calendar_connections?person_id=eq.${personId}&select=id`
    );
    const payload = {
      person_id: personId,
      google_refresh_token: tokens.refresh_token,
      calendar_id: "primary",
      google_email: googleEmail,
      updated_at: new Date().toISOString(),
      connected_at: new Date().toISOString(),
    };

    if (existing?.length) {
      await db.rest(`calendar_connections?id=eq.${existing[0].id}`, {
        method: "PATCH",
        body: JSON.stringify({
          google_refresh_token: tokens.refresh_token,
          google_email: googleEmail,
          updated_at: payload.updated_at,
        }),
      });
    } else {
      await db.rest("calendar_connections", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    return Response.redirect(
      `${siteUrl}/admin.html?connected=${encodeURIComponent(personId)}`,
      302
    );
  } catch (err) {
    console.error(err);
    const siteUrl = Deno.env.get("SITE_URL") || "http://127.0.0.1:8080";
    return Response.redirect(`${siteUrl}/admin.html?error=server`, 302);
  }
});
