-- Seed people, shift rules, settings, and Sep–Oct 2026 roster

insert into public.people (id, name, email) values
  ('11111111-1111-1111-1111-111111111111', 'Dylan Talbot', null),
  ('22222222-2222-2222-2222-222222222222', 'Haydn Scott', null)
on conflict (name) do nothing;

insert into public.shift_rules (code, free_slots, inquire) values
  ('RD', array['morning','afternoon','night'], false),
  ('PDO', array['morning','afternoon','night'], false),
  ('8a-4p', array['night'], false),
  ('9a-5p', array['night'], false),
  ('6a-2p', array['night'], false),
  ('7a-3p', array['night'], false),
  ('2p-10p', array['morning'], false),
  ('3p-11p', array['morning'], false),
  ('6p-2a', '{}', true),
  ('LSL', '{}', false)
on conflict (code) do update set
  free_slots = excluded.free_slots,
  inquire = excluded.inquire;

insert into public.app_settings (key, value) values
  ('both_required_services', '["live"]'::jsonb),
  ('timezone', '"Australia/Brisbane"'::jsonb),
  ('slots', '{"morning":"6a–12","afternoon":"12–6","night":"6–12"}'::jsonb)
on conflict (key) do update set value = excluded.value;

-- Helper: resolve person ids
with dylan as (
  select id from public.people where name = 'Dylan Talbot' limit 1
), haydn as (
  select id from public.people where name = 'Haydn Scott' limit 1
), rows as (
  select * from (values
    ('2026-09-05','RD','RD'),
    ('2026-09-06','RD','RD'),
    ('2026-09-07','2p-10p','2p-10p'),
    ('2026-09-08','2p-10p','2p-10p'),
    ('2026-09-09','2p-10p','2p-10p'),
    ('2026-09-10','2p-10p','2p-10p'),
    ('2026-09-11','2p-10p','2p-10p'),
    ('2026-09-12','3p-11p','3p-11p'),
    ('2026-09-13','2p-10p','2p-10p'),
    ('2026-09-14','8a-4p','8a-4p'),
    ('2026-09-15','8a-4p','8a-4p'),
    ('2026-09-16','8a-4p','8a-4p'),
    ('2026-09-17','RD','RD'),
    ('2026-09-18','RD','RD'),
    ('2026-09-19','RD','RD'),
    ('2026-09-20','RD','RD'),
    ('2026-09-21','2p-10p','2p-10p'),
    ('2026-09-22','2p-10p','2p-10p'),
    ('2026-09-23','2p-10p','2p-10p'),
    ('2026-09-24','2p-10p','2p-10p'),
    ('2026-09-25','6p-2a','PDO'),
    ('2026-09-26','6p-2a','RD'),
    ('2026-09-27','2p-10p','RD'),
    ('2026-09-28','2p-10p','2p-10p'),
    ('2026-09-29','9a-5p','9a-5p'),
    ('2026-09-30','RD','6a-2p'),
    ('2026-10-01','RD','6a-2p'),
    ('2026-10-02','PDO','6a-2p')
  ) as t(work_date, dylan_shift, haydn_shift)
)
insert into public.roster_entries (work_date, person_id, shift_code)
select r.work_date::date, d.id, r.dylan_shift from rows r, dylan d
union all
select r.work_date::date, h.id, r.haydn_shift from rows r, haydn h
on conflict (work_date, person_id) do update set shift_code = excluded.shift_code;
