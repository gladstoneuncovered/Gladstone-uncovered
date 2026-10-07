/**
 * Password gate for private previews.
 * The preview password lives in PREVIEW_PASSWORD on Vercel.
 */

const COOKIE = "gu_preview";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
  });
}

function safeNext(value) {
  const next = String(value || "");
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}

function readCookie(header, name) {
  const parts = String(header || "").split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${name}=`)) return trimmed.slice(name.length + 1);
  }
  return "";
}

async function digest(value) {
  const data = new TextEncoder().encode(`gladstone-uncovered:${value}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function same(left, right) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}

function loginPage(next, invalid) {
  const action = `/__preview_login?next=${encodeURIComponent(next)}`;
  const message = invalid ? `<p class="error">That password isn’t right.</p>` : "";
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Gladstone Uncovered</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;800&display=swap" rel="stylesheet" />
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        min-height: 100svh;
        display: grid;
        place-items: center;
        padding: 1.5rem;
        background: #121212;
        color: #fff;
        font-family: Montserrat, "Avenir Next", "Segoe UI", sans-serif;
      }
      main { width: min(22rem, 100%); }
      img { width: 9.5rem; height: auto; display: block; margin: 0 auto 1.75rem; }
      h1 {
        margin: 0 0 0.4rem;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.22em;
        text-transform: uppercase;
      }
      p { margin: 0; color: rgba(255,255,255,0.72); font-size: 0.95rem; line-height: 1.6; }
      form { display: grid; gap: 0.75rem; margin-top: 1.35rem; }
      input {
        width: 100%;
        padding: 0.9rem 0.95rem;
        border: 1px solid rgba(255,255,255,0.28);
        background: transparent;
        color: #fff;
        font: inherit;
        font-size: 1rem;
      }
      input:focus { outline: none; border-color: #fff; }
      button {
        width: 100%;
        padding: 0.95rem 1rem;
        border: 0;
        background: #fff;
        color: #121212;
        font: inherit;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        cursor: pointer;
      }
      .error { margin-top: 0.85rem; color: #ffb4a8; }
    </style>
  </head>
  <body>
    <main>
      <img src="/images/logo.png" alt="Gladstone Uncovered" />
      <h1>Private preview</h1>
      <p>This site is locked until it goes live.</p>
      ${message}
      <form method="post" action="${escapeHtml(action)}">
        <input type="password" name="password" autocomplete="current-password" placeholder="Password" required />
        <button type="submit">Enter</button>
      </form>
    </main>
  </body>
</html>`;
}

function html(body, status) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}

async function previewGate(request) {
  if (process.env.PREVIEW_LOCK === "off") return;

  const url = new URL(request.url);
  const password = process.env.PREVIEW_PASSWORD || "";
  const next = safeNext(url.searchParams.get("next") || `${url.pathname}${url.search}`);

  if (!password) {
    return html(loginPage("/", false).replace(
      "<p>This site is locked until it goes live.</p>",
      "<p>This preview isn’t ready yet.</p>"
    ), 503);
  }

  if (url.pathname === "/images/logo.png") return;

  if (url.pathname === "/__preview_login" && request.method === "POST") {
    const form = await request.formData();
    const given = await digest(String(form.get("password") || ""));
    const expected = await digest(password);
    if (!same(given, expected)) return html(loginPage(next, true), 401);
    const destination = safeNext(url.searchParams.get("next"));
    return new Response(null, {
      status: 303,
      headers: {
        location: destination,
        "set-cookie": `${COOKIE}=${expected}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
        "cache-control": "no-store",
      },
    });
  }

  const expected = await digest(password);
  if (same(readCookie(request.headers.get("cookie"), COOKIE), expected)) return;

  return html(loginPage(safeNext(`${url.pathname}${url.search}`), false), 200);
}

export default async function middleware(request) {
  return previewGate(request);
}
