create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, user_id)
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  theme text default 'dark',
  currency text default 'USD',
  auto_backup boolean default true
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  kind text not null,
  color text
);

create table if not exists public.prop_firms (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  website text,
  metadata jsonb default '{}'::jsonb
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  prop_firm_id uuid references public.prop_firms(id) on delete set null,
  account_number text not null,
  size_amount numeric(12,2) not null,
  challenge_type text not null,
  platform text not null,
  status text not null,
  current_balance numeric(12,2) not null default 0,
  profit numeric(12,2) not null default 0,
  daily_drawdown numeric(12,2) default 0,
  max_drawdown numeric(12,2) default 0,
  purchase_date date,
  purchase_price numeric(12,2) default 0,
  notes text,
  unique(workspace_id, account_number)
);

create table if not exists public.broker_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  account_number text not null,
  platform text not null,
  base_currency text not null,
  current_balance numeric(12,2) not null default 0,
  equity numeric(12,2) default 0,
  floating_pl numeric(12,2) default 0,
  leverage text,
  status text not null,
  notes text,
  unique(workspace_id, account_number)
);

create table if not exists public.broker_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  broker_account_id uuid not null references public.broker_accounts(id) on delete cascade,
  transaction_date date not null,
  transaction_type text not null,
  amount numeric(12,2) not null,
  source text,
  notes text
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  payout_date date not null,
  payment_method text not null,
  transaction_id text not null,
  status text not null,
  notes text,
  screenshot_object_key text,
  unique(workspace_id, transaction_id)
);

create table if not exists public.allocations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  payout_id uuid not null references public.payouts(id) on delete cascade,
  category text not null,
  amount numeric(12,2) not null,
  notes text,
  color text
);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  entry_date date not null,
  entry_type text not null,
  description text not null,
  amount numeric(12,2) not null,
  balance numeric(12,2) not null default 0
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expense_date date not null,
  category text not null,
  description text not null,
  amount numeric(12,2) not null,
  notes text
);

create table if not exists public.savings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  amount numeric(12,2) not null,
  notes text
);

create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  amount numeric(12,2) not null,
  notes text
);

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  amount numeric(12,2) not null,
  notes text
);

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  amount numeric(12,2) not null,
  notes text
);

create table if not exists public.flow_nodes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  node_type text not null,
  label text not null,
  amount numeric(12,2) default 0,
  event_date date,
  notes text,
  tags text[] default '{}',
  parent_id uuid references public.flow_nodes(id) on delete cascade
);

create table if not exists public.flow_edges (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_node_id uuid not null references public.flow_nodes(id) on delete cascade,
  target_node_id uuid not null references public.flow_nodes(id) on delete cascade,
  edge_type text not null,
  weight numeric(12,2) default 1,
  notes text,
  check (source_node_id <> target_node_id)
);

create table if not exists public.dashboards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  layout jsonb default '{}'::jsonb,
  is_default boolean default false
);

create table if not exists public.dashboard_widgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  dashboard_id uuid not null references public.dashboards(id) on delete cascade,
  widget_type text not null,
  position jsonb default '{}'::jsonb,
  config jsonb default '{}'::jsonb
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  bucket text not null,
  object_key text not null,
  mime_type text,
  size_bytes bigint,
  checksum text,
  related_entity_type text,
  related_entity_id uuid,
  metadata jsonb default '{}'::jsonb,
  unique(workspace_id, object_key)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  description text,
  target_amount numeric(12,2) not null,
  current_amount numeric(12,2) not null default 0,
  status text not null default 'active'
);

create index if not exists idx_workspaces_owner on public.workspaces(owner_id);
create index if not exists idx_workspace_members_workspace on public.workspace_members(workspace_id);
create index if not exists idx_workspace_members_user on public.workspace_members(user_id);
create index if not exists idx_accounts_workspace on public.accounts(workspace_id);
create index if not exists idx_accounts_status on public.accounts(status);
create index if not exists idx_payouts_workspace on public.payouts(workspace_id);
create index if not exists idx_payouts_account on public.payouts(account_id);
create index if not exists idx_allocations_payout on public.allocations(payout_id);
create index if not exists idx_broker_transactions_workspace on public.broker_transactions(workspace_id);
create index if not exists idx_flow_nodes_workspace on public.flow_nodes(workspace_id);
create index if not exists idx_dashboards_workspace on public.dashboards(workspace_id);
create index if not exists idx_files_workspace on public.files(workspace_id);
create index if not exists idx_goals_workspace on public.goals(workspace_id);
