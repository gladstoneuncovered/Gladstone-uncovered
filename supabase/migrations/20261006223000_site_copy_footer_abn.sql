insert into public.site_copy (key, value)
values
  ($copy$footer.abn$copy$, $copy$$copy$)
on conflict (key) do update set value = excluded.value;
