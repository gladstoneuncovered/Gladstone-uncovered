insert into public.site_copy (key, value)
values
  ($copy$home.card.event-highlights.title$copy$, $copy$The Highlight$copy$),
  (
    $copy$home.card.event-highlights.line$copy$,
    $copy$Your event, captured from every angle. Ground and aerial videography brought together into a cinematic highlight made to watch, share and remember.$copy$
  ),
  ($copy$service.event-highlights.title$copy$, $copy$The Highlight$copy$),
  (
    $copy$service.event-highlights.line$copy$,
    $copy$Your event. Captured from the ground and the air.$copy$
  ),
  ($copy$service.event-highlights.note.0$copy$, $copy$Some moments deserve more than a phone video.$copy$),
  (
    $copy$service.event-highlights.note.1$copy$,
    $copy$The Highlight captures the people, atmosphere and moments that make your event worth remembering. Our two-person crew combines cinematic ground videography with aerial footage, then brings it together into a professionally edited highlight made to watch, share and relive.$copy$
  ),
  (
    $copy$service.event-highlights.note.2$copy$,
    $copy$Perfect for celebrations, sporting events, community events, functions and everything in between.$copy$
  ),
  (
    $copy$service.event-highlights.note.3$copy$,
    $copy$Want more from your event? Extend your coverage, add another drone flight, create additional highlights or have content delivered while the event is still happening.$copy$
  ),
  ($copy$service.event-highlights.point.0$copy$, $copy$Up to 2 hours of event coverage$copy$),
  ($copy$service.event-highlights.point.1$copy$, $copy$Two-person crew$copy$),
  ($copy$service.event-highlights.point.2$copy$, $copy$Cinematic ground and aerial videography$copy$),
  ($copy$service.event-highlights.point.3$copy$, $copy$One dedicated drone flight$copy$),
  ($copy$service.event-highlights.point.4$copy$, $copy$Guests, atmosphere, details and key moments captured$copy$),
  ($copy$service.event-highlights.point.5$copy$, $copy$One professionally edited 30–90 second highlight$copy$),
  ($copy$service.event-highlights.point.6$copy$, $copy$Music, colour grading and professional finishing$copy$),
  ($copy$service.event-highlights.point.7$copy$, $copy$Social-media-ready delivery$copy$),
  ($copy$service.event-highlights.point.8$copy$, $copy$Private cloud link for viewing and sharing$copy$),
  ($copy$service.event-highlights.point.9$copy$, $copy$Delivery within 5 business days$copy$),
  ($copy$service.event-highlights.point.10$copy$, $copy$One minor revision$copy$),
  ($copy$quote.event-highlights.title$copy$, $copy$The Highlight$copy$),
  ($copy$quote.event-highlights.summary$copy$, $copy$Your event. Captured from the ground and the air.$copy$),
  ($copy$quote.event-highlights.baseLabel$copy$, $copy$The Highlight$copy$),
  ($copy$quote.event-highlights.basePrice$copy$, $copy$395$copy$),
  ($copy$quote.event-highlights.overview.0$copy$, $copy$Up to 2 hours of event coverage$copy$),
  ($copy$quote.event-highlights.overview.1$copy$, $copy$Two-person crew$copy$),
  ($copy$quote.event-highlights.overview.2$copy$, $copy$Cinematic ground and aerial videography$copy$),
  ($copy$quote.event-highlights.overview.3$copy$, $copy$One dedicated drone flight$copy$),
  ($copy$quote.event-highlights.overview.4$copy$, $copy$Guests, atmosphere, details and key moments captured$copy$),
  ($copy$quote.event-highlights.overview.5$copy$, $copy$One professionally edited 30–90 second highlight$copy$),
  ($copy$quote.event-highlights.overview.6$copy$, $copy$Music, colour grading and professional finishing$copy$),
  ($copy$quote.event-highlights.overview.7$copy$, $copy$Social-media-ready delivery$copy$),
  ($copy$quote.event-highlights.overview.8$copy$, $copy$Private cloud link for viewing and sharing$copy$),
  ($copy$quote.event-highlights.overview.9$copy$, $copy$Delivery within 5 business days$copy$),
  ($copy$quote.event-highlights.overview.10$copy$, $copy$One minor revision$copy$),
  (
    $copy$quote.event-highlights.addons.hint$copy$,
    $copy$Optional. Extra coverage, another flight and additional highlights can be added. Content can also be delivered while the event is still happening.$copy$
  ),
  ($copy$quote.event-highlights.addons.extra-video.label$copy$, $copy$Extra highlight$copy$),
  ($copy$quote.event-highlights.addons.extra-video.detail$copy$, $copy$Another professionally edited film$copy$),
  ($copy$quote.event-highlights.addons.extend-crew.label$copy$, $copy$Extra coverage$copy$),
  ($copy$quote.event-highlights.addons.extend-crew.detail$copy$, $copy$Another hour on the ground$copy$),
  ($copy$quote.event-highlights.addons.extra-flight.label$copy$, $copy$Extra flight$copy$),
  ($copy$quote.event-highlights.addons.extra-flight.detail$copy$, $copy$Another dedicated drone flight$copy$),
  ($copy$quote.event-highlights.addons.catalogue.label$copy$, $copy$Unedited catalogue$copy$),
  ($copy$quote.event-highlights.addons.catalogue.detail$copy$, $copy$At least 10 extra clips$copy$),
  ($copy$quote.event-highlights.addons.same-day.label$copy$, $copy$Same-day delivery$copy$),
  ($copy$quote.event-highlights.addons.same-day.detail$copy$, $copy$Content while the event is still happening$copy$),
  ($copy$quote.event-highlights.addons.same-day.note$copy$, $copy$We'll confirm$copy$),
  ($copy$quote.event-highlights.addons.no-drone.label$copy$, $copy$No drone$copy$),
  ($copy$quote.event-highlights.addons.no-drone.detail$copy$, $copy$Ground coverage only$copy$),
  (
    $copy$quote.event-highlights.acknowledgements.coverage.detail$copy$,
    $copy$I understand The Highlight captures selected moments rather than continuous event coverage. The standard package includes up to 2 hours of coverage, one dedicated drone flight and one professionally edited 30–90 second highlight. Specific people, moments or shots cannot be guaranteed unless agreed beforehand.$copy$
  )
on conflict (key) do update set value = excluded.value;
