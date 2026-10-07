insert into public.site_copy (key, value)
values
  ($copy$home.enquire.kicker$copy$, $copy$Enquire$copy$),
  ($copy$home.enquire.title$copy$, $copy$Send a message.$copy$),
  ($copy$home.enquire.note$copy$, $copy$If the packages don’t fit, tell us what you need.$copy$)
on conflict (key) do nothing;
