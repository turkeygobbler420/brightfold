-- Run once in the Supabase SQL editor. RLS on with no policies = only the service key (server) can read/write.
create table if not exists paid_clicks (
  click_id text primary key,
  payout numeric,
  paid_at timestamptz default now()
);
alter table paid_clicks enable row level security;

-- Links a browser's click id to the email entered at checkout, so a payment can be matched to an account.
create table if not exists click_links (
  click_id text primary key,
  email text not null,
  created_at timestamptz default now()
);
create index if not exists click_links_email_idx on click_links (email);
alter table click_links enable row level security;
-- TikTok match data for the server-side purchase event (email is optional: a row can exist before checkout).
alter table click_links alter column email drop not null;
alter table click_links add column if not exists ttclid text, add column if not exists ttp text,
  add column if not exists ua text, add column if not exists ip text, add column if not exists page_url text;
alter table paid_clicks add column if not exists tt_sent_at timestamptz; -- TikTok purchase sent (dedupe)
alter table paid_clicks add column if not exists amount numeric, add column if not exists currency text; -- what Whop actually collected

-- Email opt-outs. Any mailer must skip addresses listed here.
create table if not exists unsubscribes (
  email text primary key,
  created_at timestamptz default now()
);
alter table unsubscribes enable row level security;

-- Membership cancellation requests (to be actioned with the billing provider/network).
create table if not exists cancel_requests (
  click_id text primary key,
  email text not null,
  requested_at timestamptz default now()
);
alter table cancel_requests enable row level security;
