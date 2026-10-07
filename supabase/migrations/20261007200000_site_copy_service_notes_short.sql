insert into public.site_copy (key, value)
values
  (
    $copy$service.aerial-video.note.0$copy$,
    $copy$Dedicated drone flight that captures a catalogue of aerial clips from a range of angles, for social, websites, promotions or your own edits.$copy$
  ),
  (
    $copy$service.aerial-video.note.1$copy$,
    $copy$Extra flights, a second drone and same-day delivery can be added when you build the package.$copy$
  ),
  ($copy$service.aerial-video.note.2$copy$, $copy$$copy$),
  (
    $copy$service.real-estate-drone-photography.note.0$copy$,
    $copy$Aerial photographs of the home, land and surrounding location, selected and edited for listings and advertising.$copy$
  ),
  (
    $copy$service.real-estate-drone-photography.note.1$copy$,
    $copy$Golden hour, waterways, labelled landmarks and 24-hour priority delivery can be added when you build the package.$copy$
  ),
  ($copy$service.real-estate-drone-photography.note.2$copy$, $copy$$copy$),
  (
    $copy$service.drone-inspections.note.0$copy$,
    $copy$A visual record of roofs, solar arrays and other hard-to-reach structures, without anyone climbing. This is not a structural or engineering inspection.$copy$
  ),
  (
    $copy$service.drone-inspections.note.1$copy$,
    $copy$Starting pricing covers one site in Gladstone, Boyne Island, Tannum Sands or Calliope.$copy$
  ),
  ($copy$service.drone-inspections.note.2$copy$, $copy$$copy$),
  ($copy$service.drone-inspections.note.3$copy$, $copy$$copy$),
  (
    $copy$service.event-highlights.note.0$copy$,
    $copy$A two-person crew films the people, energy and atmosphere from the ground and the air, then edits it into one cinematic, social-ready highlight.$copy$
  ),
  ($copy$service.event-highlights.note.1$copy$, $copy$$copy$),
  ($copy$service.event-highlights.note.2$copy$, $copy$$copy$),
  ($copy$service.event-highlights.note.3$copy$, $copy$$copy$),
  (
    $copy$service.full-day-event-coverage.note.0$copy$,
    $copy$A two-person crew stays with the event, filming from the ground and the air, then turns that coverage into cinematic, social-ready films and extra clips you can keep using after the day.$copy$
  ),
  (
    $copy$service.full-day-event-coverage.note.1$copy$,
    $copy$Additional hours, flights, edits or same-day clips can be added when you build the package.$copy$
  ),
  ($copy$service.full-day-event-coverage.note.2$copy$, $copy$$copy$),
  ($copy$service.full-day-event-coverage.note.3$copy$, $copy$$copy$)
on conflict (key) do update set value = excluded.value;
