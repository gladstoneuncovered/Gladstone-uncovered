insert into public.site_copy (key, value)
values
  (
    $copy$service.aerial-video.note.1$copy$,
    $copy$Extra 30 or 60 minute flights, a second drone, USB copy, 24-hour delivery and same-day delivery can be added when you build the package.$copy$
  ),
  ($copy$service.aerial-video.point.3$copy$, $copy$Private cloud link$copy$),
  ($copy$quote.aerial-video.overview.3$copy$, $copy$Private cloud link$copy$),
  (
    $copy$service.real-estate-drone-photography.note.1$copy$,
    $copy$Extra photographs, golden hour, waterways, high tide, labelled landmarks and 24-hour priority delivery can be added when you build the package. Priority booking replaces golden hour, waterways and landmark add-ons.$copy$
  ),
  (
    $copy$service.drone-inspections.note.1$copy$,
    $copy$Starting pricing covers one site in Gladstone, Boyne Island, Tannum Sands or Calliope. Agnes Water / 1770 and other locations can be added when you build the package.$copy$
  ),
  (
    $copy$service.event-highlights.note.1$copy$,
    $copy$Extra highlights, extra coverage, extra flights, additional footage and live content can be added when you build the package. Ground-only coverage is also available.$copy$
  ),
  (
    $copy$service.full-day-event-coverage.note.1$copy$,
    $copy$Extra hours, flights and edits can be added when you build the package. Same-day edits use one of the three included films and are ready to share during the event. Same-day clips are extra unedited clips delivered while the event is still happening.$copy$
  )
on conflict (key) do update set value = excluded.value;
