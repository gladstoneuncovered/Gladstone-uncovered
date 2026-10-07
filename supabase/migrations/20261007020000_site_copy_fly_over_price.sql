insert into public.site_copy (key, value)
values
  ($copy$service.aerial-video.point.1$copy$, $copy$A catalogue of footage from a range of angles$copy$),
  ($copy$service.aerial-video.point.2$copy$, $copy$Unedited footage provided as individual clips$copy$),
  ($copy$quote.aerial-video.overview.1$copy$, $copy$A catalogue of footage from a range of angles$copy$),
  ($copy$quote.aerial-video.overview.2$copy$, $copy$Unedited footage provided as individual clips$copy$),
  ($copy$quote.aerial-video.basePrice$copy$, $copy$150$copy$)
on conflict (key) do update set value = excluded.value;
