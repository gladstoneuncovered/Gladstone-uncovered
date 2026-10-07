insert into public.site_copy (key, value)
values
  ($copy$home.enquire.note$copy$, $copy$Tell us what you need and we’ll get back to you.$copy$)
on conflict (key) do update set value = excluded.value;
