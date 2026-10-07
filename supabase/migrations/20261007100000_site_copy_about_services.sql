insert into public.site_copy (key, value)
values
  ($copy$home.about.sub$copy$, $copy$More Than Just A Different Perspective.$copy$),
  (
    $copy$home.about.note$copy$,
    $copy$We capture the people, places and moments that make our region what it is.$copy$
  ),
  (
    $copy$home.about.note2$copy$,
    $copy$From local businesses and properties to events worth remembering, we combine ground and aerial videography to create content that stands out and gets seen.$copy$
  ),
  (
    $copy$home.about.note4$copy$,
    $copy$We know Gladstone, because it’s home.$copy$
  ),
  ($copy$home.about.signoff$copy$, $copy$Your event. Your business. Your story. Uncovered.$copy$),
  ($copy$home.services.title$copy$, $copy$Services.$copy$)
on conflict (key) do update set value = excluded.value;
