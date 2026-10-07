import { json } from "./engine.ts";

/** Frontend API for the Gladstone Uncovered Clerk app. Matches js/config.js. */
const CLERK_ISSUER = "https://splendid-turkey-6858.clerk.accounts.dev";
const DEFAULT_ADMIN = "admin@gladstoneuncovered.com";

let jwksCache: { keys: JsonWebKey[] } | null = null;

function bytesToJson(bytes: Uint8Array) {
  return JSON.parse(new TextDecoder().decode(bytes));
}

function decodeBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function clerkJwks() {
  if (jwksCache) return jwksCache;
  const res = await fetch(`${CLERK_ISSUER}/.well-known/jwks.json`);
  if (!res.ok) throw new Error("Could not load Clerk signing keys");
  jwksCache = await res.json();
  return jwksCache;
}

async function verifySessionToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const header = bytesToJson(decodeBase64Url(parts[0]));
  const payload = bytesToJson(decodeBase64Url(parts[1]));
  if (header.alg !== "RS256" || !header.kid) return null;
  if (payload.iss !== CLERK_ISSUER) return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp < now - 5) return null;
  if (typeof payload.nbf === "number" && payload.nbf > now + 5) return null;
  if (!payload.sub) return null;

  const jwks = await clerkJwks();
  const jwk = (jwks?.keys || []).find((key) => key.kid === header.kid);
  if (!jwk) return null;

  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256" },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    decodeBase64Url(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
  );
  return valid ? payload : null;
}

function allowedEmails() {
  return (Deno.env.get("ADMIN_EMAILS") || DEFAULT_ADMIN)
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function clerkEmail(userId: string, secretKey: string) {
  const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!res.ok) return "";
  const user = await res.json();
  const emails = Array.isArray(user.email_addresses) ? user.email_addresses : [];
  const primary = emails.find((email) => email.id === user.primary_email_address_id);
  return String(primary?.email_address || emails[0]?.email_address || "");
}

/** Returns an error response, or null when the caller is an allowed admin. */
export async function requireAdmin(req: Request) {
  const secretKey = Deno.env.get("CLERK_SECRET_KEY") || "";
  if (!secretKey) {
    return json({ error: "Admin sign-in is not configured" }, 500);
  }

  const header = req.headers.get("authorization") || "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) return json({ error: "Unauthorized" }, 401);

  try {
    const payload = await verifySessionToken(token);
    if (!payload?.sub) return json({ error: "Unauthorized" }, 401);

    const email = (await clerkEmail(payload.sub, secretKey)).toLowerCase();
    if (!email || !allowedEmails().includes(email)) {
      return json({ error: "Unauthorized" }, 401);
    }
    return null;
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }
}
