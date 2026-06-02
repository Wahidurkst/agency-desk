-- Agency Desk MVP Database Schema
-- Run this full file inside Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'client')),
  created_at timestamp with time zone default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'review', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  assignee_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  due_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  comment text not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  created_at timestamp with time zone default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.activity_logs enable row level security;

-- Clean old policies if you re-run this file.
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Members can view their workspace" on public.workspaces;
drop policy if exists "Users can create owned workspace" on public.workspaces;
drop policy if exists "Owners can update workspace" on public.workspaces;
drop policy if exists "Owners can delete workspace" on public.workspaces;
drop policy if exists "Users can view own memberships" on public.workspace_members;
drop policy if exists "Owner can add own first membership" on public.workspace_members;
drop policy if exists "Members can view projects" on public.projects;
drop policy if exists "Members can create projects" on public.projects;
drop policy if exists "Members can update projects" on public.projects;
drop policy if exists "Members can delete projects" on public.projects;
drop policy if exists "Members can view tasks" on public.tasks;
drop policy if exists "Members can create tasks" on public.tasks;
drop policy if exists "Members can update tasks" on public.tasks;
drop policy if exists "Members can delete tasks" on public.tasks;
drop policy if exists "Members can view comments" on public.task_comments;
drop policy if exists "Members can create comments" on public.task_comments;
drop policy if exists "Users can delete own comments" on public.task_comments;
drop policy if exists "Members can view activity logs" on public.activity_logs;
drop policy if exists "Members can create activity logs" on public.activity_logs;

create policy "Users can view own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Members can view their workspace"
on public.workspaces for select
to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = workspaces.id
    and wm.user_id = auth.uid()
  )
);

create policy "Users can create owned workspace"
on public.workspaces for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Owners can update workspace"
on public.workspaces for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Owners can delete workspace"
on public.workspaces for delete
to authenticated
using (owner_id = auth.uid());

create policy "Users can view own memberships"
on public.workspace_members for select
to authenticated
using (user_id = auth.uid());

create policy "Owner can add own first membership"
on public.workspace_members for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.workspaces w
    where w.id = workspace_members.workspace_id
    and w.owner_id = auth.uid()
  )
);

create policy "Members can view projects"
on public.projects for select
to authenticated
using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = projects.workspace_id
    and wm.user_id = auth.uid()
  )
);

create policy "Members can create projects"
on public.projects for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = projects.workspace_id
    and wm.user_id = auth.uid()
  )
);

create policy "Members can update projects"
on public.projects for update
to authenticated
using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = projects.workspace_id
    and wm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = projects.workspace_id
    and wm.user_id = auth.uid()
  )
);

create policy "Members can delete projects"
on public.projects for delete
to authenticated
using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = projects.workspace_id
    and wm.user_id = auth.uid()
  )
);

create policy "Members can view tasks"
on public.tasks for select
to authenticated
using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = tasks.workspace_id
    and wm.user_id = auth.uid()
  )
);

create policy "Members can create tasks"
on public.tasks for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = tasks.workspace_id
    and wm.user_id = auth.uid()
  )
);

create policy "Members can update tasks"
on public.tasks for update
to authenticated
using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = tasks.workspace_id
    and wm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = tasks.workspace_id
    and wm.user_id = auth.uid()
  )
);

create policy "Members can delete tasks"
on public.tasks for delete
to authenticated
using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = tasks.workspace_id
    and wm.user_id = auth.uid()
  )
);

create policy "Members can view comments"
on public.task_comments for select
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    join public.workspace_members wm on wm.workspace_id = t.workspace_id
    where t.id = task_comments.task_id
    and wm.user_id = auth.uid()
  )
);

create policy "Members can create comments"
on public.task_comments for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.tasks t
    join public.workspace_members wm on wm.workspace_id = t.workspace_id
    where t.id = task_comments.task_id
    and wm.user_id = auth.uid()
  )
);

create policy "Users can delete own comments"
on public.task_comments for delete
to authenticated
using (user_id = auth.uid());

create policy "Members can view activity logs"
on public.activity_logs for select
to authenticated
using (
  exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = activity_logs.workspace_id
    and wm.user_id = auth.uid()
  )
);

create policy "Members can create activity logs"
on public.activity_logs for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = activity_logs.workspace_id
    and wm.user_id = auth.uid()
  )
);
