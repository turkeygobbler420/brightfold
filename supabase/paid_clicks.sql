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

-- Email opt-outs. Any mailer must skip addresses listed here.
create table if not exists unsubscribes (
  email text primary key,
  created_at timestamptz default now()
);
alter table unsubscribes enable row level security;
