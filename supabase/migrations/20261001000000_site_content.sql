-- Homepage content for the site editor.
-- draft and published are the same document until an admin saves or publishes.
-- No policies: the anon key cannot read this table. Edge Functions use the service role.

create table if not exists public.site_content (
  id text primary key,
  draft jsonb not null default '{}'::jsonb,
  published jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

revoke all on table public.site_content from anon, authenticated;

-- Current homepage: still hero image, and the seven Facebook reels in index.html.
-- poster/preview point at the files already in assets/reels/ so those cards can keep hover previews.
insert into public.site_content (id, draft, published)
select 'home', doc, doc
from (
  select $home${
    "hero": {
      "mediaType": "image",
      "image": "images/hero.jpg",
      "youtubeId": null,
      "heading": "",
      "tagline": "",
      "align": "center",
      "headingSize": "medium",
      "taglineSize": "medium",
      "button": {
        "enabled": false,
        "label": "",
        "url": ""
      }
    },
    "reels": {
      "seeAllUrl": "https://www.facebook.com/profile.php?id=61590653819104&sk=reels_tab",
      "cards": [
        {
          "platform": "facebook",
          "url": "https://www.facebook.com/reel/1602443878328369",
          "title": "BMX State Championships",
          "views": "19K views",
          "poster": "assets/reels/reel-05.jpg",
          "preview": "assets/reels/reel-05.mp4",
          "alt": "Aerial view of the 2026 AusCycling BMX Racing State Championships track"
        },
        {
          "platform": "facebook",
          "url": "https://www.facebook.com/reel/1625372742346893",
          "title": "Industry Icon",
          "views": "55K views",
          "poster": "assets/reels/reel-06.jpg",
          "preview": "assets/reels/reel-06.mp4",
          "alt": "Gladstone power station stacks at sunset"
        },
        {
          "platform": "facebook",
          "url": "https://www.facebook.com/reel/1078238531381064",
          "title": "Winter in Gladstone",
          "views": "94K views",
          "poster": "assets/reels/reel-07.jpg",
          "preview": "assets/reels/reel-07.mp4",
          "alt": "Aerial view of Gladstone harbour in winter"
        },
        {
          "platform": "facebook",
          "url": "https://www.facebook.com/reel/1102944838970685",
          "title": "Calliope River Camping",
          "views": "86K views",
          "poster": "assets/reels/reel-01.jpg",
          "preview": "assets/reels/reel-01.mp4",
          "alt": "Calliope River Camping reel thumbnail"
        },
        {
          "platform": "facebook",
          "url": "https://www.facebook.com/reel/1463893195790821",
          "title": "Pink in the Paddock",
          "views": "12K views",
          "poster": "assets/reels/reel-02.jpg",
          "preview": "assets/reels/reel-02.mp4",
          "alt": "Pink in the Paddock reel thumbnail"
        },
        {
          "platform": "facebook",
          "url": "https://www.facebook.com/reel/2857164057991263",
          "title": "Gladstone on the map",
          "views": "69K views",
          "poster": "assets/reels/reel-03.jpg",
          "preview": "assets/reels/reel-03.mp4",
          "alt": "Gladstone landmark reel thumbnail"
        },
        {
          "platform": "facebook",
          "url": "https://www.facebook.com/reel/897200610084903",
          "title": "Gladdy Show, Skids & Sunsets",
          "views": "37K views",
          "poster": "assets/reels/reel-04.jpg",
          "preview": "assets/reels/reel-04.mp4",
          "alt": "Gladdy Show, Skids and Sunsets reel thumbnail"
        }
      ]
    }
  }$home$::jsonb as doc
) seed
on conflict (id) do nothing;
