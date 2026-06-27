-- Reset total — borra TODO el esquema del pipeline para empezar de cero.
-- Ejecutar en Supabase → SQL Editor, y luego correr schema.sql y (opcional) seed.sql.
-- ⚠️ Borra todos los proyectos, pasos y artefactos. No toca auth.users (tus cuentas siguen).

drop trigger if exists on_project_created on public.projects;
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.seed_steps() cascade;
drop function if exists public.handle_new_user() cascade;

drop table if exists public.artifacts   cascade;
drop table if exists public.step_states cascade;
drop table if exists public.projects    cascade;
drop table if exists public.profiles    cascade;
