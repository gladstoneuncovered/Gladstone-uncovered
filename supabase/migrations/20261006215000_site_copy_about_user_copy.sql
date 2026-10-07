insert into public.site_copy (key, value)
values
  ($copy$home.about.sub$copy$, $copy$More Than Just a Different Perspective$copy$),
  (
    $copy$home.about.note$copy$,
    $copy$Gladstone Uncovered started with a simple idea — to show off the Gladstone Region from a perspective people don’t often get to see.$copy$
  ),
  (
    $copy$home.about.note2$copy$,
    $copy$Now, we bring that same approach to the people, businesses, properties and events that make our region what it is.$copy$
  ),
  (
    $copy$home.about.note3$copy$,
    $copy$Combining cinematic ground videography with aerial footage, we capture more than just what something looks like. We capture the atmosphere, the scale and the moments that make it worth remembering.$copy$
  ),
  (
    $copy$home.about.note4$copy$,
    $copy$We’re local, we know the region, and we genuinely enjoy uncovering what makes it worth calling home.$copy$
  ),
  (
    $copy$home.about.signoff$copy$,
    $copy$Your event. Your business. Your story. Uncovered.$copy$
  )
on conflict (key) do update set value = excluded.value;
