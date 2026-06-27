-- Pipeline app — esquema Fase 0 (Supabase / Postgres)
-- Ejecutar en Supabase → SQL Editor.

-- Extensiones
create extension if not exists "pgcrypto";

-- ── Perfiles / roles ───────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  role       text not null default 'member',  -- 'admin' | 'member'
  created_at timestamptz not null default now()
);

-- Crear profile automáticamente al registrarse un usuario
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Proyectos ──────────────────────────────────────────────────────
create table if not exists public.projects (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  domain               text,
  briefing_doc_urls    text[] not null default '{}',  -- varios links (el briefing puede ser varios docs)
  structure_sheet_urls text[] not null default '{}',
  relume_urls          text[] not null default '{}',  -- opcional; a futuro puede sobrar
  status               text not null default 'active',
  created_by           uuid references auth.users (id),
  created_at           timestamptz not null default now()
);

-- ── Estado por paso (1..8) ─────────────────────────────────────────
create table if not exists public.step_states (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  step       int  not null check (step between 1 and 8),
  status     text not null default 'pending',  -- pending|running|needs_review|done|error
  logs       text,
  updated_at timestamptz not null default now(),
  unique (project_id, step)
);

-- ── Artefactos producidos por cada paso ────────────────────────────
create table if not exists public.artifacts (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  step       int  not null,
  type       text not null,  -- keyword_research|copy|wireframe|figma|ir|elementor
  label      text not null,
  url        text,
  payload    jsonb,
  created_at timestamptz not null default now()
);

-- Sembrar los 8 step_states al crear un proyecto
create or replace function public.seed_steps()
returns trigger language plpgsql as $$
begin
  insert into public.step_states (project_id, step)
  select new.id, gs from generate_series(1, 8) as gs
  on conflict do nothing;
  return new;
end; $$;

drop trigger if exists on_project_created on public.projects;
create trigger on_project_created
  after insert on public.projects
  for each row execute function public.seed_steps();

-- ── RLS: herramienta interna, cualquier usuario autenticado opera ──
alter table public.profiles    enable row level security;
alter table public.projects    enable row level security;
alter table public.step_states enable row level security;
alter table public.artifacts   enable row level security;

create policy "profiles self read"  on public.profiles    for select using (auth.uid() = id);
create policy "auth read projects"  on public.projects    for select using (auth.role() = 'authenticated');
create policy "auth write projects" on public.projects    for all    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth read steps"     on public.step_states for select using (auth.role() = 'authenticated');
create policy "auth write steps"    on public.step_states for all    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth read artifacts" on public.artifacts   for select using (auth.role() = 'authenticated');
create policy "auth write artifacts" on public.artifacts  for all    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
