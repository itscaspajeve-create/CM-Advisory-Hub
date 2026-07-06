-- PRU Life UK Consultant Dashboard — initial schema
-- Run this in the Supabase SQL Editor (or `supabase db push`) once.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- clients
create table if not exists public.clients (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  gender        text check (gender in ('male', 'female', 'other')),
  date_of_birth date,
  phone         text,
  email         text,
  occupation    text,
  client_source text,
  client_since  date default current_date,
  status        text not null default 'active'
                check (status in ('active', 'inactive', 'prospect')),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------- policies
create table if not exists public.policies (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid not null references public.clients (id) on delete cascade,
  policy_number      text not null,
  product_name       text not null,
  product_type       text,
  currency           text not null default 'PHP',
  sum_assured        numeric(14, 2),
  premium_amount     numeric(14, 2) not null default 0,
  premium_mode       text not null default 'annual'
                     check (premium_mode in ('annual', 'semi_annual', 'quarterly', 'monthly', 'single')),
  payment_method     text,
  issue_date         date,
  policy_anniversary date,
  payor              text,
  riders             text,
  status             text not null default 'inforce'
                     check (status in ('inforce', 'pending', 'lapsed', 'surrendered', 'claimed')),
  fund_allocation    text,
  created_at         timestamptz not null default now()
);

create index if not exists policies_client_id_idx on public.policies (client_id);
create index if not exists policies_status_idx on public.policies (status);

-- ---------------------------------------------------------------- pipeline
create table if not exists public.pipeline (
  id                  uuid primary key default gen_random_uuid(),
  prospect_name       text not null,
  stage               text not null default 'lead'
                      check (stage in ('lead', 'contacted', 'presented', 'proposal', 'closing', 'won', 'lost')),
  proposed_product    text,
  expected_ape        numeric(14, 2),
  probability         integer check (probability between 0 and 100),
  expected_close_date date,
  next_followup_date  date,
  notes               text,
  created_at          timestamptz not null default now()
);

create index if not exists pipeline_stage_idx on public.pipeline (stage);

-- ---------------------------------------------------------------- commissions
create table if not exists public.commissions (
  id              uuid primary key default gen_random_uuid(),
  policy_id       uuid not null references public.policies (id) on delete cascade,
  commission_type text not null default 'first_year'
                  check (commission_type in ('first_year', 'renewal', 'bonus', 'override', 'persistency')),
  rate            numeric(6, 3),
  amount          numeric(14, 2) not null default 0,
  expected_date   date,
  received_date   date,
  status          text not null default 'expected'
                  check (status in ('expected', 'received', 'clawback')),
  created_at      timestamptz not null default now()
);

create index if not exists commissions_policy_id_idx on public.commissions (policy_id);
create index if not exists commissions_status_idx on public.commissions (status);

-- ---------------------------------------------------------------- settings
-- Simple key/value store (e.g. MDRT goal), editable from the app.
create table if not exists public.settings (
  key   text primary key,
  value text not null
);

-- ---------------------------------------------------------------- RLS
-- Single-user app: any authenticated user gets full access;
-- anonymous users get nothing.
alter table public.clients      enable row level security;
alter table public.policies     enable row level security;
alter table public.pipeline     enable row level security;
alter table public.commissions  enable row level security;
alter table public.settings     enable row level security;

-- Idempotent: drop-then-create so the whole file can be re-run safely
-- (create policy has no "if not exists" in Postgres).
do $$
declare t text;
begin
  foreach t in array array['clients', 'policies', 'pipeline', 'commissions', 'settings']
  loop
    execute format(
      'drop policy if exists "authenticated full access" on public.%I', t);
    execute format(
      'create policy "authenticated full access" on public.%I
         for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;
