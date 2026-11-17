-- Dedicated email lead tracking (additive: extends the existing leads table + keeps capture_lead(p_email)).
alter table leads
  add column if not exists click_id text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists referrer text,
  add column if not exists device text,
  add column if not exists lang text,
  add column if not exists score numeric,
  add column if not exists submits int not null default 1,
  add column if not exists last_seen timestamptz not null default now();
create index if not exists leads_click_idx on leads (click_id);
alter table leads enable row level security;

-- Richer capture used by the quiz. Upserts by lower(email); anyone can call, it can only write lead rows.
create or replace function capture_lead(
  p_email text, p_click_id text, p_utm_source text default null, p_utm_medium text default null,
  p_utm_campaign text default null, p_referrer text default null, p_device text default null,
  p_lang text default null, p_score numeric default null
) returns void language plpgsql security definer set search_path = public as $$
declare e text := lower(trim(p_email));
begin
  if e is null or length(e) > 254 or e !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then return; end if;
  insert into public.leads (email, user_id, click_id, utm_source, utm_medium, utm_campaign, referrer, device, lang, score)
  values (e, auth.uid(), left(p_click_id,64), left(p_utm_source,80), left(p_utm_medium,80), left(p_utm_campaign,120), left(p_referrer,200), left(p_device,20), left(p_lang,10), p_score)
  on conflict (lower(email)) do update set
    last_seen = now(), submits = leads.submits + 1,
    click_id = coalesce(excluded.click_id, leads.click_id),
    utm_source = coalesce(leads.utm_source, excluded.utm_source),
    utm_medium = coalesce(leads.utm_medium, excluded.utm_medium),
    utm_campaign = coalesce(leads.utm_campaign, excluded.utm_campaign),
    referrer = coalesce(leads.referrer, excluded.referrer),
    device = coalesce(leads.device, excluded.device),
    lang = coalesce(leads.lang, excluded.lang),
    score = coalesce(excluded.score, leads.score);
end $$;
revoke all on function capture_lead(text,text,text,text,text,text,text,text,numeric) from public;
grant execute on function capture_lead(text,text,text,text,text,text,text,text,numeric) to anon, authenticated;

-- Backfill: emails captured only in click_links.
insert into leads (email, click_id, created_at, last_seen)
select lower(email), click_id, created_at, created_at from click_links
on conflict (lower(email)) do update set click_id = coalesce(leads.click_id, excluded.click_id);
