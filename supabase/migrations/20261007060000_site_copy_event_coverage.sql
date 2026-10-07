insert into public.site_copy (key, value)
values
  ($copy$home.card.full-day-event-coverage.title$copy$, $copy$Event Coverage$copy$),
  ($copy$home.card.full-day-event-coverage.line$copy$, $copy$Make more of the moment.$copy$),
  ($copy$service.full-day-event-coverage.title$copy$, $copy$Event Coverage$copy$),
  ($copy$service.full-day-event-coverage.line$copy$, $copy$Make more of the moment.$copy$),
  (
    $copy$service.full-day-event-coverage.note.0$copy$,
    $copy$A great event takes months to create and hours to unfold. The content it creates shouldn’t disappear when the day ends.$copy$
  ),
  (
    $copy$service.full-day-event-coverage.note.1$copy$,
    $copy$Event Coverage is designed to capture more of what makes your event worth showing. Our two-person crew stays amongst the action for up to five hours, capturing the energy, people, atmosphere and moments happening throughout the day. Ground coverage puts viewers in the middle of it, while aerial footage reveals perspectives they never got to see.$copy$
  ),
  (
    $copy$service.full-day-event-coverage.note.2$copy$,
    $copy$From that coverage, we create a collection of cinematic, social media ready content that keeps your event visible, shareable and worth talking about long after it’s over.$copy$
  ),
  (
    $copy$service.full-day-event-coverage.note.3$copy$,
    $copy$Extend your coverage with additional hours, aerial flights, edited content or same-day clips ready to share while your event is still happening.$copy$
  ),
  ($copy$service.full-day-event-coverage.point.0$copy$, $copy$Up to 5 hours of event coverage$copy$),
  ($copy$service.full-day-event-coverage.point.1$copy$, $copy$Two-person crew$copy$),
  ($copy$service.full-day-event-coverage.point.2$copy$, $copy$Cinematic ground coverage throughout the event$copy$),
  ($copy$service.full-day-event-coverage.point.3$copy$, $copy$Aerial coverage across up to three dedicated drone flights$copy$),
  ($copy$service.full-day-event-coverage.point.4$copy$, $copy$One professionally edited 60–90 second Event Highlight$copy$),
  ($copy$service.full-day-event-coverage.point.5$copy$, $copy$Two additional 15–45 second social edits$copy$),
  ($copy$service.full-day-event-coverage.point.6$copy$, $copy$Curated library of additional usable clips$copy$),
  ($copy$service.full-day-event-coverage.point.7$copy$, $copy$Private cloud delivery within 7 business days$copy$),
  ($copy$quote.full-day-event-coverage.title$copy$, $copy$Event Coverage$copy$),
  ($copy$quote.full-day-event-coverage.summary$copy$, $copy$Make more of the moment.$copy$),
  ($copy$quote.full-day-event-coverage.baseLabel$copy$, $copy$Event Coverage$copy$),
  ($copy$quote.full-day-event-coverage.basePrice$copy$, $copy$1095$copy$),
  ($copy$quote.full-day-event-coverage.overview.0$copy$, $copy$Up to 5 hours of event coverage$copy$),
  ($copy$quote.full-day-event-coverage.overview.1$copy$, $copy$Two-person crew$copy$),
  ($copy$quote.full-day-event-coverage.overview.2$copy$, $copy$Cinematic ground coverage throughout the event$copy$),
  ($copy$quote.full-day-event-coverage.overview.3$copy$, $copy$Aerial coverage across up to three dedicated drone flights$copy$),
  ($copy$quote.full-day-event-coverage.overview.4$copy$, $copy$One professionally edited 60–90 second Event Highlight$copy$),
  ($copy$quote.full-day-event-coverage.overview.5$copy$, $copy$Two additional 15–45 second social edits$copy$),
  ($copy$quote.full-day-event-coverage.overview.6$copy$, $copy$Curated library of additional usable clips$copy$),
  ($copy$quote.full-day-event-coverage.overview.7$copy$, $copy$Private cloud delivery within 7 business days$copy$),
  ($copy$quote.full-day-event-coverage.addons.hint$copy$, $copy$Optional. Extra hours, flights and edited content can be added.$copy$),
  ($copy$quote.full-day-event-coverage.addons.extra-reel.label$copy$, $copy$Extra edit$copy$),
  ($copy$quote.full-day-event-coverage.addons.extra-reel.detail$copy$, $copy$Another professionally edited film$copy$),
  ($copy$quote.full-day-event-coverage.addons.extra-hours.label$copy$, $copy$Extra coverage$copy$),
  ($copy$quote.full-day-event-coverage.addons.extra-hours.detail$copy$, $copy$Another hour on the ground$copy$),
  ($copy$quote.full-day-event-coverage.addons.extra-flight.label$copy$, $copy$Extra flight$copy$),
  ($copy$quote.full-day-event-coverage.addons.extra-flight.detail$copy$, $copy$Another dedicated drone flight$copy$),
  ($copy$quote.full-day-event-coverage.live.title$copy$, $copy$Same-day clips$copy$),
  (
    $copy$quote.full-day-event-coverage.live.hint$copy$,
    $copy$Optional. Each same-day edit uses one of the three included films. Example: 1 same-day edit means 1 during the event and 2 after. A same-day clip does not use one of those films.$copy$
  ),
  ($copy$quote.full-day-event-coverage.live.live-reel.label$copy$, $copy$Same-day edit$copy$),
  ($copy$quote.full-day-event-coverage.live.live-reel.detail$copy$, $copy$Ready to share while the event is still happening$copy$),
  ($copy$quote.full-day-event-coverage.live.live-basic.label$copy$, $copy$Same-day clip$copy$),
  ($copy$quote.full-day-event-coverage.live.live-basic.detail$copy$, $copy$An unedited clip delivered during the event$copy$),
  (
    $copy$quote.full-day-event-coverage.acknowledgements.coverage.detail$copy$,
    $copy$I understand Event Coverage captures selected moments throughout the event rather than continuous recording. The package includes up to 5 hours of coverage, up to three dedicated drone flights, one professionally edited 60–90 second Event Highlight, two additional 15–45 second social edits and a curated library of additional usable clips. Specific people, moments or shots cannot be guaranteed unless agreed beforehand.$copy$
  )
on conflict (key) do update set value = excluded.value;
