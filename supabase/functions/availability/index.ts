import {
  combineSlots,
  busyBlocksSlot,
  createServiceClient,
  corsHeaders,
  dayStateFromSlots,
  fetchFreeBusy,
  json,
  refreshAccessToken,
  SLOT_ORDER,
} from "../_shared/engine.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const crew = url.searchParams.get("crew") || "one";
    if (!from || !to) {
      return json({ error: "from and to (YYYY-MM-DD) required" }, 400);
    }

    const db = createServiceClient();
    const requireBoth = crew === "both";

    const [people, rules, roster, bookings, overrides, connections, settings] =
      await Promise.all([
        db.rest("people?select=*"),
        db.rest("shift_rules?select=*"),
        db.rest(
          `roster_entries?select=*,people(name)&work_date=gte.${from}&work_date=lte.${to}`
        ),
        db.rest(
          `bookings?select=*&status=eq.confirmed&work_date=gte.${from}&work_date=lte.${to}`
        ),
        db.rest(
          `overrides?select=*&work_date=gte.${from}&work_date=lte.${to}`
        ),
        db.rest("calendar_connections?select=*"),
        db.rest("app_settings?select=*"),
      ]);

    const ruleMap = Object.fromEntries(
      (rules || []).map((r) => [r.code, r])
    );
    const overrideMap = Object.fromEntries(
      (overrides || []).map((o) => [o.work_date, o])
    );
    const bookedDates = new Set((bookings || []).map((b) => b.work_date));

    // Group roster by date
    const byDate = new Map();
    for (const row of roster || []) {
      const d = row.work_date;
      if (!byDate.has(d)) byDate.set(d, []);
      byDate.get(d).push(row);
    }

    // FreeBusy per connected person
    const busyByPerson = new Map();
    const timeMin = `${from}T00:00:00+10:00`;
    const timeMax = `${to}T23:59:59+10:00`;

    await Promise.all(
      (connections || []).map(async (conn) => {
        try {
          const token = await refreshAccessToken(conn.google_refresh_token);
          const busy = await fetchFreeBusy(
            token.access_token,
            conn.calendar_id || "primary",
            timeMin,
            timeMax
          );
          busyByPerson.set(conn.person_id, busy);
        } catch (err) {
          console.error("freeBusy error", conn.person_id, err);
          busyByPerson.set(conn.person_id, []);
        }
      })
    );

    // Enumerate days
    const days = [];
    const cursor = new Date(`${from}T12:00:00Z`);
    const end = new Date(`${to}T12:00:00Z`);
    while (cursor <= end) {
      const dateStr = cursor.toISOString().slice(0, 10);
      const override = overrideMap[dateStr];
      if (override) {
        days.push({
          date: dateStr,
          state: override.state,
          slots:
            override.state === "available"
              ? [...SLOT_ORDER]
              : override.state === "limited"
                ? ["morning"]
                : [],
          bookable:
            !bookedDates.has(dateStr) &&
            (override.state === "available" || override.state === "limited"),
        });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
        continue;
      }

      if (bookedDates.has(dateStr)) {
        days.push({
          date: dateStr,
          state: "unavailable",
          slots: [],
          bookable: false,
          isBooked: true,
        });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
        continue;
      }

      const rows = byDate.get(dateStr);
      if (!rows || !rows.length) {
        days.push({
          date: dateStr,
          state: "inquire",
          slots: [],
          bookable: false,
        });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
        continue;
      }

      const perPerson = rows.map((row) => {
        const rule = ruleMap[row.shift_code] || {
          free_slots: [],
          inquire: true,
        };
        let slots = [...(rule.free_slots || [])];
        const busy = busyByPerson.get(row.person_id) || [];
        slots = slots.filter((slot) => !busyBlocksSlot(dateStr, slot, busy));
        return { slots, inquire: Boolean(rule.inquire) };
      });

      // If requireBoth and only one person on roster, treat missing as empty
      if (requireBoth && people?.length) {
        const present = new Set(rows.map((r) => r.person_id));
        for (const p of people) {
          if (!present.has(p.id)) {
            perPerson.push({ slots: [], inquire: false });
          }
        }
      }

      const slots = combineSlots(
        perPerson.map((p) => p.slots),
        requireBoth
      );
      const anyInquire = perPerson.some((p) => p.inquire);
      const state = dayStateFromSlots(slots, anyInquire);

      days.push({
        date: dateStr,
        state,
        slots,
        bookable: slots.length > 0,
        shifts: Object.fromEntries(
          rows.map((r) => [r.people?.name || r.person_id, r.shift_code])
        ),
      });

      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const settingsObj = Object.fromEntries(
      (settings || []).map((s) => [s.key, s.value])
    );

    return json({
      timezone: settingsObj.timezone || "Australia/Brisbane",
      days,
      connections: (connections || []).map((c) => ({
        person_id: c.person_id,
        calendar_id: c.calendar_id,
        connected: true,
      })),
    });
  } catch (err) {
    console.error(err);
    return json({ error: String(err.message || err) }, 500);
  }
});
