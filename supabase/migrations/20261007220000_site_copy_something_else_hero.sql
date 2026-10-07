insert into public.site_copy (key, value)
values
  (
    $copy$service.something-else.note.0$copy$,
    $copy$Not every idea fits neatly into a package.$copy$
  ),
  (
    $copy$service.something-else.note.1$copy$,
    $copy$If you have an event, project, location or idea that isn’t covered by our existing services, tell us what you’re thinking. We’ll work with you to see what’s possible.$copy$
  )
on conflict (key) do update set value = excluded.value;
