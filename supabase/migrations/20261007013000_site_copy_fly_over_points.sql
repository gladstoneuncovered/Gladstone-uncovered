insert into public.site_copy (key, value)
values
  (
    $copy$service.aerial-video.note.2$copy$,
    $copy$Need more coverage? Extra flights and a second drone can be added when you build the package. Footage can also be delivered on the day.$copy$
  ),
  ($copy$service.aerial-video.point.0$copy$, $copy$One drone flight of up to 30 minutes$copy$),
  ($copy$service.aerial-video.point.2$copy$, $copy$Unedited footage as individual clips$copy$),
  ($copy$quote.aerial-video.overview.0$copy$, $copy$One drone flight of up to 30 minutes$copy$),
  ($copy$quote.aerial-video.overview.2$copy$, $copy$Unedited footage as individual clips$copy$),
  ($copy$quote.aerial-video.addons.hint$copy$, $copy$Optional. Extra flight time is either 30 or 60 minutes. Turnaround is either same day or within 24 hours.$copy$),
  ($copy$quote.aerial-video.addons.flight-30.label$copy$, $copy$Extra flight$copy$),
  ($copy$quote.aerial-video.addons.flight-30.detail$copy$, $copy$Another 30 minutes$copy$),
  ($copy$quote.aerial-video.addons.flight-60.label$copy$, $copy$Two extra flights$copy$),
  ($copy$quote.aerial-video.addons.flight-60.detail$copy$, $copy$Another 60 minutes$copy$),
  ($copy$quote.aerial-video.addons.second-drone.label$copy$, $copy$Second drone and operator$copy$),
  ($copy$quote.aerial-video.addons.second-drone.detail$copy$, $copy$Includes an extra flight$copy$),
  ($copy$quote.aerial-video.addons.same-day.label$copy$, $copy$Same-day delivery$copy$),
  ($copy$quote.aerial-video.addons.same-day.detail$copy$, $copy$Cloud link on the day$copy$),
  ($copy$quote.aerial-video.addons.within-24.label$copy$, $copy$24-hour delivery$copy$),
  ($copy$quote.aerial-video.addons.within-24.detail$copy$, $copy$Cloud link the next day$copy$),
  ($copy$quote.aerial-video.addons.usb.label$copy$, $copy$USB copy$copy$),
  ($copy$quote.aerial-video.addons.usb.detail$copy$, $copy$Footage on a USB$copy$)
on conflict (key) do update set value = excluded.value;
