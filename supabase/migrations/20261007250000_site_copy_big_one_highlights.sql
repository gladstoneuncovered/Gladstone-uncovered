insert into public.site_copy (key, value)
values
  ($copy$home.card.full-day-event-coverage.title$copy$, $copy$The Big One$copy$),
  (
    $copy$home.card.full-day-event-coverage.line$copy$,
    $copy$Because sometimes, a quick one just won’t cut it.$copy$
  ),
  ($copy$service.full-day-event-coverage.title$copy$, $copy$The Big One$copy$),
  (
    $copy$service.full-day-event-coverage.line$copy$,
    $copy$Because sometimes, a quick one just won’t cut it.$copy$
  ),
  ($copy$quote.full-day-event-coverage.title$copy$, $copy$The Big One$copy$),
  (
    $copy$quote.full-day-event-coverage.summary$copy$,
    $copy$Because sometimes, a quick one just won’t cut it.$copy$
  ),
  ($copy$quote.full-day-event-coverage.baseLabel$copy$, $copy$The Big One$copy$),
  ($copy$home.card.event-highlights.title$copy$, $copy$The Highlights$copy$),
  ($copy$home.card.event-highlights.line$copy$, $copy$Let them see what they missed.$copy$),
  ($copy$service.event-highlights.title$copy$, $copy$The Highlights$copy$),
  ($copy$service.event-highlights.line$copy$, $copy$Let them see what they missed.$copy$),
  ($copy$quote.event-highlights.title$copy$, $copy$The Highlights$copy$),
  ($copy$quote.event-highlights.summary$copy$, $copy$Let them see what they missed.$copy$),
  ($copy$quote.event-highlights.baseLabel$copy$, $copy$The Highlights$copy$)
on conflict (key) do update set value = excluded.value;
