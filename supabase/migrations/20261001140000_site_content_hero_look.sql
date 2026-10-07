-- Hero look. Defaults match the current full-bleed still: dark frame, white type,
-- square light button, and the existing scrim strength.

update public.site_content
set
  draft = jsonb_set(
    draft,
    '{hero,look}',
    coalesce(draft#>'{hero,look}', '{}'::jsonb) || jsonb_build_object(
      'background', coalesce(draft#>>'{hero,look,background}', '#0a0a0a'),
      'text', coalesce(draft#>>'{hero,look,text}', '#ffffff'),
      'overlay', coalesce(draft#>>'{hero,look,overlay}', '#060504'),
      'opacity', coalesce(draft#>'{hero,look,opacity}', '100'::jsonb),
      'buttonBackground', coalesce(draft#>>'{hero,look,buttonBackground}', '#ffffff'),
      'buttonText', coalesce(draft#>>'{hero,look,buttonText}', '#121212'),
      'buttonCorners', coalesce(draft#>>'{hero,look,buttonCorners}', 'square'),
      'buttonStyle', coalesce(draft#>>'{hero,look,buttonStyle}', 'solid'),
      'buttonSize', coalesce(draft#>>'{hero,look,buttonSize}', 'medium'),
      'mediaCorners', coalesce(draft#>>'{hero,look,mediaCorners}', 'square'),
      'fullBleed', coalesce(draft#>'{hero,look,fullBleed}', 'true'::jsonb)
    ),
    true
  ),
  published = jsonb_set(
    published,
    '{hero,look}',
    coalesce(published#>'{hero,look}', '{}'::jsonb) || jsonb_build_object(
      'background', coalesce(published#>>'{hero,look,background}', '#0a0a0a'),
      'text', coalesce(published#>>'{hero,look,text}', '#ffffff'),
      'overlay', coalesce(published#>>'{hero,look,overlay}', '#060504'),
      'opacity', coalesce(published#>'{hero,look,opacity}', '100'::jsonb),
      'buttonBackground', coalesce(published#>>'{hero,look,buttonBackground}', '#ffffff'),
      'buttonText', coalesce(published#>>'{hero,look,buttonText}', '#121212'),
      'buttonCorners', coalesce(published#>>'{hero,look,buttonCorners}', 'square'),
      'buttonStyle', coalesce(published#>>'{hero,look,buttonStyle}', 'solid'),
      'buttonSize', coalesce(published#>>'{hero,look,buttonSize}', 'medium'),
      'mediaCorners', coalesce(published#>>'{hero,look,mediaCorners}', 'square'),
      'fullBleed', coalesce(published#>'{hero,look,fullBleed}', 'true'::jsonb)
    ),
    true
  )
where id = 'home';
