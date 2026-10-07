insert into public.site_copy (key, value)
values
  (
    $copy$home.card.drone-inspections.line$copy$,
    $copy$Get a Clearer Look Without the Climb$copy$
  ),
  ($copy$service.drone-inspections.title$copy$, $copy$Inspections$copy$),
  (
    $copy$service.drone-inspections.line$copy$,
    $copy$Get a Clearer Look Without the Climb$copy$
  ),
  (
    $copy$service.drone-inspections.note.0$copy$,
    $copy$Need to know what’s happening on a roof, solar array or other hard to reach structure? Our aerial inspections give you a clear visual record from above, without the need for unnecessary access at height.$copy$
  ),
  (
    $copy$service.drone-inspections.note.1$copy$,
    $copy$We capture detailed photographs and video of the areas you nominate, helping identify visible damage, maintenance areas, repairs or anything else you want a closer look at. Suitable for roofs, solar panels, sheds, tanks, carports and other difficult to access structures.$copy$
  ),
  (
    $copy$service.drone-inspections.note.2$copy$,
    $copy$This service provides a visual record only and is not a structural, building or engineering inspection.$copy$
  ),
  (
    $copy$service.drone-inspections.note.3$copy$,
    $copy$Starting pricing covers one site within Gladstone, Boyne Island, Tannum Sands or Calliope.$copy$
  ),
  ($copy$service.drone-inspections.point.0$copy$, $copy$Photographs and video of nominated areas$copy$),
  ($copy$service.drone-inspections.point.1$copy$, $copy$Close-up aerial views where safe and practical$copy$),
  ($copy$service.drone-inspections.point.2$copy$, $copy$Coverage of visible damage, repairs and maintenance areas$copy$),
  ($copy$service.drone-inspections.point.3$copy$, $copy$Private cloud link to keep or share with a tradesperson$copy$),
  ($copy$quote.drone-inspections.title$copy$, $copy$Aerial Inspections$copy$),
  ($copy$quote.drone-inspections.summary$copy$, $copy$Get a Clearer Look Without the Climb$copy$),
  ($copy$quote.drone-inspections.baseDetail$copy$, $copy$Photographs and video$copy$),
  ($copy$quote.drone-inspections.overview.0$copy$, $copy$Photographs and video of nominated areas$copy$),
  ($copy$quote.drone-inspections.overview.1$copy$, $copy$Close-up aerial views where safe and practical$copy$),
  ($copy$quote.drone-inspections.overview.2$copy$, $copy$Coverage of visible damage, repairs and maintenance areas$copy$),
  ($copy$quote.drone-inspections.overview.3$copy$, $copy$Private cloud link to keep or share with a tradesperson$copy$)
on conflict (key) do update set value = excluded.value;
