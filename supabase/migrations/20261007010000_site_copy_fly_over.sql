insert into public.site_copy (key, value)
values
  ($copy$home.card.aerial-video.title$copy$, $copy$Fly Over$copy$),
  (
    $copy$home.card.aerial-video.line$copy$,
    $copy$See your event, business, property or location from a perspective that stands out.$copy$
  ),
  ($copy$service.aerial-video.title$copy$, $copy$Fly Over$copy$),
  (
    $copy$service.aerial-video.line$copy$,
    $copy$See your event, business, property or location from a perspective that stands out.$copy$
  ),
  (
    $copy$service.aerial-video.note.0$copy$,
    $copy$Fly Over gives you a collection of aerial footage captured across a dedicated drone flight. We film a variety of angles, movements and perspectives to give you a catalogue of clips to use across social media, websites, promotions or your own projects.$copy$
  ),
  (
    $copy$service.aerial-video.note.1$copy$,
    $copy$Each flight includes one drone battery, providing up to approximately 30 minutes of flight time. Your footage is supplied as individual, unedited clips through a private cloud link within 24 hours, giving you the freedom to create and edit your content your way.$copy$
  ),
  (
    $copy$service.aerial-video.note.2$copy$,
    $copy$Need more coverage? Add an additional flight, request immediate footage delivery, or add a second drone and operator to capture more of the action at once.$copy$
  ),
  ($copy$service.aerial-video.point.0$copy$, $copy$One drone flight, up to approximately 30 minutes$copy$),
  ($copy$service.aerial-video.point.1$copy$, $copy$A catalogue of clips from a range of angles$copy$),
  ($copy$service.aerial-video.point.2$copy$, $copy$Unedited footage, supplied as individual clips$copy$),
  ($copy$service.aerial-video.point.3$copy$, $copy$Private cloud link within 24 hours$copy$),
  ($copy$quote.aerial-video.title$copy$, $copy$Fly Over$copy$),
  (
    $copy$quote.aerial-video.summary$copy$,
    $copy$See your event, business, property or location from a perspective that stands out.$copy$
  ),
  ($copy$quote.aerial-video.baseDetail$copy$, $copy$Up to about 30 minutes$copy$),
  ($copy$quote.aerial-video.overview.0$copy$, $copy$One drone flight, up to approximately 30 minutes$copy$),
  ($copy$quote.aerial-video.overview.1$copy$, $copy$A catalogue of clips from a range of angles$copy$),
  ($copy$quote.aerial-video.overview.2$copy$, $copy$Unedited footage, supplied as individual clips$copy$),
  ($copy$quote.aerial-video.overview.3$copy$, $copy$Private cloud link within 24 hours$copy$)
on conflict (key) do update set value = excluded.value;
