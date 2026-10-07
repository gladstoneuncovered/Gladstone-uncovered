insert into public.site_copy (key, value)
values
  (
    $copy$home.about.note$copy$,
    $copy$We’re a locally owned two-person crew. We film events, people, property and places across the Gladstone Region from the ground and from the air — the big picture, and the moments inside it.$copy$
  ),
  (
    $copy$home.about.note2$copy$,
    $copy$We know this coastline, this industry, these communities. That knowledge is in the work.$copy$
  )
on conflict (key) do update set value = excluded.value;
