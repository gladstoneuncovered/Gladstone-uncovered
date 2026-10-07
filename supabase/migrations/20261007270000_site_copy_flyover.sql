insert into public.site_copy (key, value)
values
  ($copy$home.card.aerial-video.title$copy$, $copy$Flyover$copy$),
  ($copy$service.aerial-video.title$copy$, $copy$Flyover$copy$),
  ($copy$quote.aerial-video.title$copy$, $copy$Flyover$copy$)
on conflict (key) do update set value = excluded.value;
