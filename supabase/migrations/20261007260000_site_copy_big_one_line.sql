insert into public.site_copy (key, value)
values
  (
    $copy$home.card.full-day-event-coverage.line$copy$,
    $copy$For those times when a quick one won’t cut it.$copy$
  ),
  (
    $copy$service.full-day-event-coverage.line$copy$,
    $copy$For those times when a quick one won’t cut it.$copy$
  ),
  (
    $copy$quote.full-day-event-coverage.summary$copy$,
    $copy$For those times when a quick one won’t cut it.$copy$
  )
on conflict (key) do update set value = excluded.value;
