-- Run once in the Supabase SQL editor. RLS on with no policies = only the service key (server) can read/write.
create table if not exists paid_clicks (
  click_id text primary key,
  payout numeric,
  paid_at timestamptz default now()
);
alter table paid_clicks enable row level security;
