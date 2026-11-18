-- First-party analytics for the dashboard: one row per pageview / funnel event.
-- Written only by the `track` edge function (service role); RLS on with no policies = no public access.
create table if not exists public.events (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  vid text not null,          -- visitor id (the site's click id)
  sid text,                   -- per-tab session id
  name text not null,         -- pageview, quiz_started, question_viewed, ...
  path text,
  props jsonb,
  source text,                -- utm_source, 'ad click' (ttclid/fbclid), referrer host or 'direct'
  country text,               -- ISO-2
  device text
);
create index if not exists events_ts_idx on public.events (ts);
create index if not exists events_vid_idx on public.events (vid);
alter table public.events enable row level security;
