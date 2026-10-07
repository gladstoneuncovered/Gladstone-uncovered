insert into public.site_copy (key, value)
values
  (
    $copy$home.card.full-day-event-coverage.title$copy$,
    $copy$Build my package$copy$
  )
on conflict (key) do update set value = excluded.value;
