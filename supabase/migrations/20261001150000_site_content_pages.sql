-- Services, about, pricing, and the bookings introduction.
-- The site row is the shared palette, fonts, and layout.
-- Public pages keep their HTML until a published document exists.

insert into public.site_content (id, draft, published)
select 'services', doc, doc
from (select $seed${
  "intro": {
    "eyebrow": "What we do",
    "heading": "Services",
    "paragraphs": [
      "Uncover a different perspective. With videography on the ground and from the skies, we have your next event covered. From sports carnivals and functions, to real estate photography, community events and inspections — see it differently with Gladstone Uncovered."
    ]
  },
  "aside": {
    "label": "Something else",
    "heading": "Write to us.",
    "text": "This sits outside the listed services. Send a message straight to admin@gladstoneuncovered.com."
  }
}$seed$::jsonb as doc) seed
on conflict (id) do nothing;

insert into public.site_content (id, draft, published)
select 'about', doc, doc
from (select $seed${
  "intro": {
    "eyebrow": "About us",
    "heading": "A different perspective on the place we call home.",
    "paragraphs": [
      "Gladstone Uncovered is a locally owned videography and aerial imaging business based in the Gladstone Region.",
      "We capture **events, people, property and places from the ground and the air**, combining cinematic ground footage with professional drone imagery to create content that is engaging, useful and built for the way people consume media today."
    ]
  },
  "blocks": [
    {
      "title": "More than just a drone",
      "paragraphs": [
        "Gladstone Uncovered started with a simple idea — **show our region from a different perspective.**",
        "What began with capturing the coastline, communities and landscapes around Gladstone has grown into a service built to help local people, businesses, clubs and organisations tell their own stories.",
        "Our focus is videography.",
        "From a two-hour event highlight to full day coverage, sporting events and community functions, we use a two-person crew to capture both the big picture and the moments happening within it.",
        "From the air, we provide another perspective — capturing events, properties, businesses and locations in a way that simply isn’t possible from the ground."
      ],
      "signoff": ""
    },
    {
      "title": "What we do",
      "paragraphs": [
        "Our services include **event videography, sporting and community event coverage, aerial videography, real estate drone photography and aerial inspections.**",
        "For events, we can provide everything from a short professionally edited social media highlight through to extended coverage with multiple edited reels, aerial footage and a catalogue of additional content that can continue to be used after the event.",
        "We can also provide **live event content**, delivering selected videos while your event is still happening so they can be shared across your social channels in real time.",
        "For property and business clients, we provide professional aerial photography, videography and inspection imagery without trying to be something we’re not. **We specialise in capturing the view from above.**"
      ],
      "signoff": ""
    },
    {
      "title": "Local knowledge. Different perspective.",
      "paragraphs": [
        "We’re based here. We know the coastline, the river, the industrial landscape, the sporting grounds, the communities and the locations that make the Gladstone Region what it is.",
        "That local knowledge matters.",
        "It helps us understand where to shoot, when to shoot and how to showcase a location or event in a way that feels authentic to Central Queensland.",
        "And we’re building Gladstone Uncovered for the long term.",
        "Our goal isn’t to become another generic content company. It’s to build a trusted local service capable of growing from community events and property imagery into increasingly complex commercial and industrial projects across the region."
      ],
      "signoff": ""
    },
    {
      "title": "Uncover a different perspective.",
      "paragraphs": [
        "Whether it’s a packed sporting event, a community celebration, a property hitting the market or a business wanting to show what it does — we’ll find the perspective worth capturing."
      ],
      "signoff": "Ground. Air. Gladstone Uncovered."
    }
  ]
}$seed$::jsonb as doc) seed
on conflict (id) do nothing;

insert into public.site_content (id, draft, published)
select 'pricing', doc, doc
from (select $seed${
  "intro": {
    "eyebrow": "Pricing",
    "heading": "Scoped to your project — not a one-size package.",
    "paragraphs": [
      "Rather than offering the same package to every client, we establish what you need, how the content will be used and when it needs to be delivered. Then we provide a clear quote."
    ]
  },
  "cards": [
    {
      "title": "Single project",
      "label": "Quote on enquiry",
      "text": "Ideal for a one-off shoot — a highlight film, commercial video, aerial videography or specialist real estate / inspection imagery.",
      "points": [
        "Scoped to location and duration",
        "Ground and/or aerial capture",
        "Agreed deliverables and timeline",
        "Digital delivery ready to publish"
      ],
      "buttonLabel": "Request a quote",
      "buttonUrl": "bookings.html",
      "featured": false
    },
    {
      "title": "Events & live content",
      "label": "Quote on enquiry",
      "text": "Coverage for festivals, sport, corporate functions and regional events — including rapid-turnaround social content where required.",
      "points": [
        "Half-day or full-day coverage",
        "Optional live event content",
        "Highlight film and social cutdowns",
        "Can combine ground + drone"
      ],
      "buttonLabel": "Request a quote",
      "buttonUrl": "bookings.html?service=events",
      "featured": true
    },
    {
      "title": "Commercial & aerial",
      "label": "Quote on enquiry",
      "text": "Brand films, project showcases and aerial videography for commercial and industrial clients — plus specialist aerial photography for property and inspections.",
      "points": [
        "Commercial video production",
        "Aerial videography",
        "Specialist aerial photography",
        "Scoped to site and approvals"
      ],
      "buttonLabel": "Request a quote",
      "buttonUrl": "bookings.html?service=commercial",
      "featured": false
    }
  ],
  "note": "Service availability and drone operations are subject to project scope, site permissions and applicable aviation approvals."
}$seed$::jsonb as doc) seed
on conflict (id) do nothing;

insert into public.site_content (id, draft, published)
select 'bookings', doc, doc
from (select $seed${
  "intro": {
    "eyebrow": "From booking to delivery",
    "heading": "Let’s uncover your next project.",
    "paragraphs": [
      "Build a quote for any service, or send a message and we’ll reply by email."
    ]
  }
}$seed$::jsonb as doc) seed
on conflict (id) do nothing;

insert into public.site_content (id, draft, published)
select 'site', doc, doc
from (select $seed${
  "palette": {
    "ink": "#121212",
    "inkSoft": "#2a2a2a",
    "muted": "#5c5c5c",
    "line": "#d8d8d8",
    "paper": "#ffffff",
    "paperWarm": "#f7f6f4"
  },
  "fonts": {
    "body": "Montserrat",
    "heading": "Montserrat"
  },
  "layout": {
    "width": "standard",
    "spacing": "standard"
  }
}$seed$::jsonb as doc) seed
on conflict (id) do nothing;
