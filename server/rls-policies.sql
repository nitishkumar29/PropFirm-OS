alter table public.users enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.settings enable row level security;
alter table public.categories enable row level security;
alter table public.prop_firms enable row level security;
alter table public.accounts enable row level security;
alter table public.broker_accounts enable row level security;
alter table public.broker_transactions enable row level security;
alter table public.payouts enable row level security;
alter table public.allocations enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.expenses enable row level security;
alter table public.savings enable row level security;
alter table public.investments enable row level security;
alter table public.equipment enable row level security;
alter table public.donations enable row level security;
alter table public.flow_nodes enable row level security;
alter table public.flow_edges enable row level security;
alter table public.dashboards enable row level security;
alter table public.dashboard_widgets enable row level security;
alter table public.files enable row level security;
alter table public.goals enable row level security;

create policy if not exists users_select_self on public.users for select using (auth.uid() = id);
create policy if not exists users_update_self on public.users for update using (auth.uid() = id) with check (auth.uid() = id);

create policy if not exists workspaces_select_member on public.workspaces for select using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = public.workspaces.id and wm.user_id = auth.uid()
  )
);

create policy if not exists workspaces_manage_owner on public.workspaces for all using (
  owner_id = auth.uid()
) with check (owner_id = auth.uid());

create policy if not exists workspace_members_select_member on public.workspace_members for select using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = public.workspace_members.workspace_id and wm.user_id = auth.uid()
  )
);

create policy if not exists workspace_members_manage_owner on public.workspace_members for all using (
  exists (
    select 1 from public.workspaces w
    where w.id = public.workspace_members.workspace_id and w.owner_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.workspaces w
    where w.id = public.workspace_members.workspace_id and w.owner_id = auth.uid()
  )
);

create policy if not exists tenant_table_select on public.accounts for select using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = public.accounts.workspace_id and wm.user_id = auth.uid()
  )
);

create policy if not exists tenant_table_insert on public.accounts for insert with check (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = public.accounts.workspace_id and wm.user_id = auth.uid()
  )
);

create policy if not exists tenant_table_update on public.accounts for update using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = public.accounts.workspace_id and wm.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = public.accounts.workspace_id and wm.user_id = auth.uid()
  )
);
