import {
  busyBlocksSlot,
  combineSlots,
  corsHeaders,
  createServiceClient,
  fetchFreeBusy,
  insertCalendarEvent,
  json,
  refreshAccessToken,
  slotToEventTimes,
} from "../_shared/engine.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }
  if (req.method !== "POST") {
    return json({ error: "POST required" }, 405);
  }

  try {
    const body = await req.json();
    const {
      date,
      slot,
      name,
      email,
      phone,
      organisation,
      service,
      serviceLabel,
      location,
      details,
      crewMode = "one",
    } = body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return json({ error: "Valid date required" }, 400);
    }
    if (!slot || !["morning", "afternoon", "night"].includes(slot)) {
      return json({ error: "Valid slot required" }, 400);
    }

    const db = createServiceClient();
    const requireBoth = crewMode === "both";

    // Existing booking?
    const existing = await db.rest(
      `bookings?work_date=eq.${date}&status=eq.confirmed&select=id`
    );
    if (existing?.length) {
      return json({ error: "Date already booked" }, 409);
    }

    const [people, rules, rosterRows, connections] = await Promise.all([
      db.rest("people?select=*"),
      db.rest("shift_rules?select=*"),
      db.rest(
        `roster_entries?select=*&work_date=eq.${date}`
      ),
      db.rest("calendar_connections?select=*"),
    ]);

    const ruleMap = Object.fromEntries((rules || []).map((r) => [r.code, r]));
    const connByPerson = Object.fromEntries(
      (connections || []).map((c) => [c.person_id, c])
    );

    // FreeBusy for the day
    const busyByPerson = new Map();
    const timeMin = `${date}T00:00:00+10:00`;
    const timeMax = `${date}T23:59:59+10:00`;
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
        } catch {
          busyByPerson.set(conn.person_id, []);
        }
      })
    );

    const availability = (people || []).map((person) => {
      const row = (rosterRows || []).find((r) => r.person_id === person.id);
      if (!row) return { person, slots: [], inquire: true };
      const rule = ruleMap[row.shift_code] || { free_slots: [], inquire: true };
      let slots = [...(rule.free_slots || [])];
      const busy = busyByPerson.get(person.id) || [];
      slots = slots.filter((s) => !busyBlocksSlot(date, s, busy));
      return { person, slots, inquire: Boolean(rule.inquire) };
    });

    const combined = combineSlots(
      availability.map((a) => a.slots),
      requireBoth
    );
    if (!combined.includes(slot)) {
      return json({ error: "Slot no longer available" }, 409);
    }

    // Assignee: first person free for this slot
    const candidates = availability.filter((a) => a.slots.includes(slot));
    if (requireBoth && candidates.length < 2) {
      return json({ error: "Both crew members not free" }, 409);
    }
    const assignee = candidates[0]?.person;
    if (!assignee) {
      return json({ error: "No assignee available" }, 409);
    }

    let gcalEventId = null;
    const conn = connByPerson[assignee.id];
    if (conn) {
      const token = await refreshAccessToken(conn.google_refresh_token);
      const times = slotToEventTimes(date, slot);
      const event = await insertCalendarEvent(
        token.access_token,
        conn.calendar_id || "primary",
        {
          summary: `Gladstone Uncovered — ${serviceLabel || service || "Booking"}`,
          description: [
            name && `Client: ${name}`,
            email && `Email: ${email}`,
            phone && `Phone: ${phone}`,
            organisation && `Org: ${organisation}`,
            location && `Location: ${location}`,
            `Slot: ${slot}`,
            details,
          ]
            .filter(Boolean)
            .join("\n"),
          location: location || undefined,
          ...times,
        }
      );
      gcalEventId = event.id;
    }

    const inserted = await db.rest("bookings", {
      method: "POST",
      body: JSON.stringify({
        work_date: date,
        slot,
        service,
        service_label: serviceLabel,
        client_name: name,
        client_email: email,
        client_phone: phone,
        organisation,
        location,
        details,
        crew_mode: crewMode,
        assignee_person_id: assignee.id,
        gcal_event_id: gcalEventId,
        status: "confirmed",
      }),
    });

    return json({
      ok: true,
      booking: inserted?.[0] || inserted,
      assignee: assignee.name,
      googleEventCreated: Boolean(gcalEventId),
    });
  } catch (err) {
    console.error(err);
    return json({ error: String(err.message || err) }, 500);
  }
});
