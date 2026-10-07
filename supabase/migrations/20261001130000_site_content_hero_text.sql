-- Hero copy fields. Empty values keep the homepage on the logo only.
-- Existing media and reel data stay as they are.

update public.site_content
set
  draft = jsonb_set(
    draft,
    '{hero}',
    coalesce(draft->'hero', '{}'::jsonb) || jsonb_build_object(
      'heading', coalesce(draft#>>'{hero,heading}', ''),
      'tagline', coalesce(draft#>>'{hero,tagline}', ''),
      'align', coalesce(draft#>>'{hero,align}', 'center'),
      'headingSize', coalesce(draft#>>'{hero,headingSize}', 'medium'),
      'taglineSize', coalesce(draft#>>'{hero,taglineSize}', 'medium'),
      'button', coalesce(
        draft#>'{hero,button}',
        '{"enabled": false, "label": "", "url": ""}'::jsonb
      )
    ),
    true
  ),
  published = jsonb_set(
    published,
    '{hero}',
    coalesce(published->'hero', '{}'::jsonb) || jsonb_build_object(
      'heading', coalesce(published#>>'{hero,heading}', ''),
      'tagline', coalesce(published#>>'{hero,tagline}', ''),
      'align', coalesce(published#>>'{hero,align}', 'center'),
      'headingSize', coalesce(published#>>'{hero,headingSize}', 'medium'),
      'taglineSize', coalesce(published#>>'{hero,taglineSize}', 'medium'),
      'button', coalesce(
        published#>'{hero,button}',
        '{"enabled": false, "label": "", "url": ""}'::jsonb
      )
    ),
    true
  )
where id = 'home';
