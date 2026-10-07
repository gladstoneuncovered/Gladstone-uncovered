insert into public.site_copy (key, value)
values
  ($copy$nav.contact$copy$, $copy$Contact$copy$)
on conflict (key) do nothing;
