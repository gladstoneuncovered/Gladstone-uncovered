insert into public.site_copy (key, value)
values
  (
    $copy$home.card.event-highlights.line$copy$,
    $copy$Show people what it was like to be there.$copy$
  ),
  (
    $copy$service.event-highlights.line$copy$,
    $copy$Show people what it was like to be there.$copy$
  ),
  (
    $copy$service.event-highlights.note.0$copy$,
    $copy$The best events have an atmosphere that’s hard to explain. That’s what we capture.$copy$
  ),
  (
    $copy$service.event-highlights.note.1$copy$,
    $copy$Our two-person crew gets amongst the action, capturing the people, energy and moments that give your event its character. Ground footage puts you in the middle of it, while aerial footage uncovers a completely different perspective from above.$copy$
  ),
  (
    $copy$service.event-highlights.note.2$copy$,
    $copy$We bring it all together into a cinematic, social-media-ready highlight designed to make people wish they were there.$copy$
  ),
  ($copy$service.event-highlights.note.3$copy$, $copy$$copy$),
  ($copy$service.event-highlights.point.0$copy$, $copy$Up to 2 hours of event coverage$copy$),
  ($copy$service.event-highlights.point.1$copy$, $copy$Two-person crew$copy$),
  ($copy$service.event-highlights.point.2$copy$, $copy$Ground and aerial videography$copy$),
  ($copy$service.event-highlights.point.3$copy$, $copy$One dedicated drone flight$copy$),
  ($copy$service.event-highlights.point.4$copy$, $copy$One professionally edited 30–90 second highlight$copy$),
  ($copy$service.event-highlights.point.5$copy$, $copy$Professional colour grading and finishing$copy$),
  ($copy$service.event-highlights.point.6$copy$, $copy$Private cloud delivery within 5 business days$copy$),
  ($copy$service.event-highlights.point.7$copy$, $copy$One minor revision$copy$),
  ($copy$quote.event-highlights.summary$copy$, $copy$Show people what it was like to be there.$copy$),
  ($copy$quote.event-highlights.overview.0$copy$, $copy$Up to 2 hours of event coverage$copy$),
  ($copy$quote.event-highlights.overview.1$copy$, $copy$Two-person crew$copy$),
  ($copy$quote.event-highlights.overview.2$copy$, $copy$Ground and aerial videography$copy$),
  ($copy$quote.event-highlights.overview.3$copy$, $copy$One dedicated drone flight$copy$),
  ($copy$quote.event-highlights.overview.4$copy$, $copy$One professionally edited 30–90 second highlight$copy$),
  ($copy$quote.event-highlights.overview.5$copy$, $copy$Professional colour grading and finishing$copy$),
  ($copy$quote.event-highlights.overview.6$copy$, $copy$Private cloud delivery within 5 business days$copy$),
  ($copy$quote.event-highlights.overview.7$copy$, $copy$One minor revision$copy$)
on conflict (key) do update set value = excluded.value;
