-- Section headings pick up full stops. Reel view counts live in reel_stats
-- and refresh from Facebook through sync-reel-views.

insert into public.site_copy (key, value)
values
  ($copy$home.about.sub$copy$, $copy$More Than Just A Different Perspective.$copy$),
  ($copy$quote.chrome.heading$copy$, $copy$Build Your Package.$copy$),
  ($copy$quote.chrome.includedHeading$copy$, $copy$What’s included.$copy$),
  ($copy$service.aerial-video.includedHeading$copy$, $copy$What’s included.$copy$),
  ($copy$service.real-estate-drone-photography.includedHeading$copy$, $copy$What’s included.$copy$),
  ($copy$service.drone-inspections.includedHeading$copy$, $copy$What’s included.$copy$),
  ($copy$service.event-highlights.includedHeading$copy$, $copy$What’s included.$copy$),
  ($copy$service.full-day-event-coverage.includedHeading$copy$, $copy$What’s included.$copy$),
  ($copy$service.something-else.enquire.title$copy$, $copy$Tell us your idea.$copy$)
on conflict (key) do update set value = excluded.value;

create table if not exists public.reel_stats (
  id text primary key,
  views integer not null default 0 check (views >= 0),
  updated_at timestamptz not null default now()
);

comment on table public.reel_stats is
  'Facebook reel view counts. The public site reads these; sync-reel-views writes them.';

alter table public.reel_stats enable row level security;

grant select on table public.reel_stats to anon, authenticated;
revoke insert, update, delete on table public.reel_stats from anon, authenticated;

drop policy if exists reel_stats_read on public.reel_stats;
create policy reel_stats_read
  on public.reel_stats
  for select
  to anon, authenticated
  using (true);

insert into public.reel_stats (id, views)
values
  ($id$1602443878328369$id$, 19000),
  ($id$1625372742346893$id$, 55000),
  ($id$1078238531381064$id$, 94000),
  ($id$1102944838970685$id$, 86000),
  ($id$1463893195790821$id$, 12000),
  ($id$2857164057991263$id$, 69000),
  ($id$897200610084903$id$, 37000)
on conflict (id) do update set views = excluded.views;

do $$
begin
  perform cron.unschedule('sync-reel-views-daily');
exception
  when others then
    null;
end;
$$;

do $$
begin
  perform cron.schedule(
    'sync-reel-views-daily',
    '15 20 * * *',
    $job$
      select net.http_get(
        url := 'https://tcpglranzdomamazzbqb.supabase.co/functions/v1/sync-reel-views?force=1'
      );
    $job$
  );
exception
  when others then
    raise notice 'reel view cron not scheduled: %', sqlerrm;
end;
$$;
