insert into public.site_copy (key, value)
values
  ($copy$home.card.something-else.title$copy$, $copy$Something Else?$copy$),
  ($copy$home.card.something-else.line$copy$, $copy$Have something different in mind?$copy$),
  ($copy$service.something-else.title$copy$, $copy$Something Else?$copy$),
  ($copy$service.something-else.line$copy$, $copy$Have something different in mind?$copy$),
  (
    $copy$service.something-else.note.0$copy$,
    $copy$Not every idea fits neatly into a package, and that doesn’t mean we can’t make it happen.$copy$
  ),
  (
    $copy$service.something-else.note.1$copy$,
    $copy$If you have an event, project, location or idea that isn’t covered by our existing services, tell us what you’re thinking. From one-off shoots and unique aerial requests to something completely different, we’ll work with you to see what’s possible.$copy$
  ),
  (
    $copy$service.something-else.note.2$copy$,
    $copy$Tell us your idea and let’s uncover what we can create.$copy$
  ),
  ($copy$service.something-else.enquire.title$copy$, $copy$Tell us your idea$copy$),
  ($copy$quote.chrome.somethingElse$copy$, $copy$Something Else?$copy$),
  ($copy$quote.chrome.somethingElseDetail$copy$, $copy$Have something different in mind?$copy$),
  ($copy$quote.chrome.emailUs$copy$, $copy$Enquire$copy$)
on conflict (key) do update set value = excluded.value;
