insert into public.site_copy (key, value)
values
  (
    $copy$home.card.real-estate-drone-photography.line$copy$,
    $copy$Give buyers a perspective they can’t get from the street.$copy$
  ),
  ($copy$service.real-estate-drone-photography.title$copy$, $copy$Real Estate$copy$),
  (
    $copy$service.real-estate-drone-photography.line$copy$,
    $copy$Give buyers a perspective they can’t get from the street.$copy$
  ),
  (
    $copy$service.real-estate-drone-photography.note.0$copy$,
    $copy$Our Real Estate Aerial Photography captures your property from above, showcasing the home, land and surrounding location in a way traditional photography can’t. You’ll receive a minimum of five professionally selected and edited images, ready for your agent to use across property listings and advertising.$copy$
  ),
  (
    $copy$service.real-estate-drone-photography.note.1$copy$,
    $copy$Take the listing further with golden hour photography, nearby waterways and local landmarks, or time your shoot around high tide to present the surrounding coastline and waterways at their best. We can also create a location image with nearby landmarks labelled, helping buyers understand exactly what’s around the property.$copy$
  ),
  (
    $copy$service.real-estate-drone-photography.note.2$copy$,
    $copy$Need it quickly? Priority bookings can be photographed and delivered within 24 hours.$copy$
  ),
  ($copy$service.real-estate-drone-photography.point.0$copy$, $copy$A minimum of five edited images$copy$),
  ($copy$service.real-estate-drone-photography.point.1$copy$, $copy$The home, land and surrounding location$copy$),
  ($copy$service.real-estate-drone-photography.point.2$copy$, $copy$Ready for listings and advertising$copy$),
  ($copy$service.real-estate-drone-photography.point.3$copy$, $copy$Delivered within 5 business days$copy$),
  ($copy$quote.real-estate-drone-photography.title$copy$, $copy$Real Estate Aerial Photography$copy$),
  (
    $copy$quote.real-estate-drone-photography.summary$copy$,
    $copy$Give buyers a perspective they can’t get from the street.$copy$
  ),
  ($copy$quote.real-estate-drone-photography.baseLabel$copy$, $copy$A minimum of five images$copy$),
  ($copy$quote.real-estate-drone-photography.overview.0$copy$, $copy$A minimum of five edited images$copy$),
  ($copy$quote.real-estate-drone-photography.overview.1$copy$, $copy$The home, land and surrounding location$copy$),
  ($copy$quote.real-estate-drone-photography.overview.2$copy$, $copy$Ready for listings and advertising$copy$),
  ($copy$quote.real-estate-drone-photography.overview.3$copy$, $copy$Delivered within 5 business days$copy$),
  (
    $copy$quote.real-estate-drone-photography.addons.hint$copy$,
    $copy$Optional. Priority booking turns off golden hour, waterways and landmark add-ons. Extra photographs can still be added.$copy$
  ),
  ($copy$quote.real-estate-drone-photography.addons.photos-10.label$copy$, $copy$Extra photographs$copy$),
  ($copy$quote.real-estate-drone-photography.addons.photos-10.detail$copy$, $copy$Another 10 images$copy$),
  ($copy$quote.real-estate-drone-photography.addons.ocean.label$copy$, $copy$Nearby waterways$copy$),
  ($copy$quote.real-estate-drone-photography.addons.ocean.detail$copy$, $copy$Ocean or river$copy$),
  ($copy$quote.real-estate-drone-photography.addons.high-tide.label$copy$, $copy$High tide$copy$),
  ($copy$quote.real-estate-drone-photography.addons.high-tide.detail$copy$, $copy$Coastline and waterways at their best$copy$),
  ($copy$quote.real-estate-drone-photography.addons.golden-hour.label$copy$, $copy$Golden hour$copy$),
  ($copy$quote.real-estate-drone-photography.addons.golden-hour.detail$copy$, $copy$Sunrise or sunset$copy$),
  ($copy$quote.real-estate-drone-photography.addons.landmarks.label$copy$, $copy$Location image$copy$),
  ($copy$quote.real-estate-drone-photography.addons.landmarks.detail$copy$, $copy$Nearby landmarks labelled$copy$),
  ($copy$quote.real-estate-drone-photography.addons.urgent.label$copy$, $copy$Priority booking$copy$),
  ($copy$quote.real-estate-drone-photography.addons.urgent.detail$copy$, $copy$Photographed and delivered within 24 hours$copy$)
on conflict (key) do update set value = excluded.value;
