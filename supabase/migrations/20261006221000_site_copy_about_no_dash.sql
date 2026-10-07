insert into public.site_copy (key, value)
values
  (
    $copy$home.about.note$copy$,
    $copy$Gladstone Uncovered started with a simple idea to show off the Gladstone Region from a perspective people don’t often get to see.$copy$
  ),
  (
    $copy$home.about.note2$copy$,
    $copy$Now we bring that same approach to the people, businesses, properties and events that make our region what it is. We combine cinematic ground and aerial videography to capture the atmosphere, scale and moments that matter.$copy$
  ),
  (
    $copy$home.about.note4$copy$,
    $copy$We’re local. We know the region, and we’re here to uncover what makes it worth calling home.$copy$
  )
on conflict (key) do update set value = excluded.value;
