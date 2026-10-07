// Shared availability + Google helpers for Edge Functions

export const SLOT_ORDER = ["morning", "afternoon", "night"];

export const SLOT_WINDOWS = {
  morning: { startHour: 6, endHour: 12 },
  afternoon: { startHour: 12, endHour: 18 },
  night: { startHour: 18, endHour: 24 },
};

export function corsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

export function json(data, status = 200, origin = "*") {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

export function combineSlots(sets, requireBoth) {
  if (!sets.length) return [];
  if (requireBoth) {
    return SLOT_ORDER.filter((slot) => sets.every((set) => set.includes(slot)));
  }
  const union = new Set();
  sets.forEach((set) => set.forEach((s) => union.add(s)));
  return SLOT_ORDER.filter((s) => union.has(s));
}

/** Busy interval overlaps a booking slot window on a Brisbane calendar day */
export function busyBlocksSlot(workDate, slot, busyIntervals) {
  const win = SLOT_WINDOWS[slot];
  if (!win) return false;
  const dayStart = Date.parse(`${workDate}T00:00:00+10:00`);
  const slotStart = dayStart + win.startHour * 3600000;
  const slotEnd = dayStart + win.endHour * 3600000;
  return busyIntervals.some((b) => {
    const a = Date.parse(b.start);
    const e = Date.parse(b.end);
    return a < slotEnd && e > slotStart;
  });
}

export function dayStateFromSlots(slots, anyInquire) {
  if (slots.length === 3) return "available";
  if (slots.length > 0) return "limited";
  if (anyInquire) return "inquire";
  return "unavailable";
}

export async function refreshAccessToken(refreshToken) {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token refresh failed: ${text}`);
  }
  return res.json();
}

export async function fetchFreeBusy(accessToken, calendarId, timeMin, timeMax) {
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      timeZone: "Australia/Brisbane",
      items: [{ id: calendarId }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`freeBusy failed: ${text}`);
  }
  const data = await res.json();
  const cal = data.calendars?.[calendarId];
  return cal?.busy || [];
}

export async function insertCalendarEvent(accessToken, calendarId, event) {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`events.insert failed: ${text}`);
  }
  return res.json();
}

export function slotToEventTimes(workDate, slot) {
  const win = SLOT_WINDOWS[slot] || SLOT_WINDOWS.morning;
  const pad = (n) => String(n).padStart(2, "0");
  const start = `${workDate}T${pad(win.startHour)}:00:00`;
  const endHour = win.endHour === 24 ? 23 : win.endHour;
  const endMin = win.endHour === 24 ? "59" : "00";
  const end = `${workDate}T${pad(endHour)}:${endMin}:00`;
  return {
    start: { dateTime: start, timeZone: "Australia/Brisbane" },
    end: { dateTime: end, timeZone: "Australia/Brisbane" },
  };
}

export function createServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SERVICE_ROLE_KEY");
  // Lightweight REST helper — avoids npm import in Deno deploy
  return {
    async rest(path, options = {}) {
      const res = await fetch(`${url}/rest/v1/${path}`, {
        ...options,
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: options.prefer || "return=representation",
          ...(options.headers || {}),
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Supabase ${path}: ${text}`);
      }
      if (res.status === 204) return null;
      return res.json();
    },
  };
}
