import { requireAdmin } from "../_shared/clerk-admin.ts";
import { corsHeaders, createServiceClient, json } from "../_shared/engine.ts";

const MAX_BYTES = 256 * 1024;

/**
 * Page content and the site-wide palette, fonts, and layout.
 * ids: home, services, about, pricing, bookings, site
 *
 * GET  /site-content?id=home            public → { id, published }
 * GET  /site-content?id=home&draft=1    admin  → { id, draft, published, updated_at }
 * POST /site-content?id=home            admin, JSON body is the document → saves draft
 * POST /site-content?id=home&publish=1  admin  → copies draft to published
 *                                         optional JSON body is saved as the draft first
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  const url = new URL(req.url);
  const id = pageId(url.searchParams.get("id"));
  if (!id) return json({ error: "Invalid page id" }, 400);

  try {
    if (req.method === "GET") {
      if (url.searchParams.get("draft") === "1") {
        const denied = await requireAdmin(req);
        if (denied) return denied;
        const row = await loadRow(id);
        return json({
          id,
          draft: row?.draft ?? null,
          published: row?.published ?? null,
          updated_at: row?.updated_at ?? null,
        });
      }

      const row = await loadRow(id);
      return json({ id, published: row?.published ?? null });
    }

    if (req.method === "POST") {
      const denied = await requireAdmin(req);
      if (denied) return denied;

      const parsed = await readDocument(req);
      if (!parsed.ok) return json({ error: parsed.error }, 400);

      const publish = url.searchParams.get("publish") === "1";
      const row = publish
        ? await publishContent(id, parsed.document)
        : await saveDraft(id, parsed.document);

      if (!row) return json({ error: publish ? "Nothing to publish" : "JSON body required" }, 400);

      if (publish) {
        return json({
          id,
          draft: row.draft,
          published: row.published,
          updated_at: row.updated_at,
        });
      }
      return json({ id, draft: row.draft, updated_at: row.updated_at });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    return json({ error: String(err.message || err) }, 500);
  }
});

function pageId(value) {
  const id = (value || "home").trim();
  return /^[a-z0-9_-]{1,64}$/.test(id) ? id : "";
}

async function readDocument(req) {
  const text = await req.text();
  if (!text.trim()) return { ok: true, document: null };
  if (text.length > MAX_BYTES) return { ok: false, error: "Content is too large" };
  let document;
  try {
    document = JSON.parse(text);
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }
  if (!document || typeof document !== "object" || Array.isArray(document)) {
    return { ok: false, error: "Content must be a JSON object" };
  }
  return { ok: true, document };
}

async function loadRow(id) {
  const db = createServiceClient();
  const rows = await db.rest(
    `site_content?id=eq.${encodeURIComponent(id)}&select=id,draft,published,updated_at`
  );
  return rows?.[0] || null;
}

async function saveDraft(id, document) {
  if (!document) return null;
  const db = createServiceClient();
  const existing = await loadRow(id);
  const updated_at = new Date().toISOString();
  if (existing) {
    const rows = await db.rest(`site_content?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ draft: document, updated_at }),
    });
    return rows?.[0] || { ...existing, draft: document, updated_at };
  }
  const rows = await db.rest("site_content", {
    method: "POST",
    body: JSON.stringify({ id, draft: document, published: {}, updated_at }),
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

async function publishContent(id, document) {
  const db = createServiceClient();
  const existing = await loadRow(id);
  const draft = document || existing?.draft;
  if (!draft || typeof draft !== "object" || Array.isArray(draft)) return null;

  const updated_at = new Date().toISOString();
  if (existing) {
    const rows = await db.rest(`site_content?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ draft, published: draft, updated_at }),
    });
    return rows?.[0] || { ...existing, draft, published: draft, updated_at };
  }
  const rows = await db.rest("site_content", {
    method: "POST",
    body: JSON.stringify({ id, draft, published: draft, updated_at }),
  });
  return Array.isArray(rows) ? rows[0] : rows;
}
