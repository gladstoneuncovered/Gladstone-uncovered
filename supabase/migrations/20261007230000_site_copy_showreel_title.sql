insert into public.site_copy (key, value)
values
  (
    $copy$home.showreel.title$copy$,
    $copy$Your event. Your business. Your story. Uncovered.$copy$
  )
on conflict (key) do update set value = excluded.value;
