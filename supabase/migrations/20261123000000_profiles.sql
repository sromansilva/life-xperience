-- Migración inicial: Tabla public.profiles, RLS, triggers y funciones asociadas.

-- 1. Tabla public.profiles
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  role        text not null default 'student' check (role in ('student', 'teacher')),
  name        text not null default '',
  last        text not null default '',
  grade       text not null default '',
  hair_color  text not null default '#2C1810',
  hair_style  text not null default 'A',
  skin_tone   text not null default '#FDBCB4',
  shirt_color text not null default '#6D28D9',
  pet         text not null default '🐶',
  level       integer not null default 1 constraint profiles_level_check check (level >= 1),
  xp          integer not null default 0 constraint profiles_xp_check check (xp >= 0),
  coins       integer not null default 50 constraint profiles_coins_check check (coins >= 0),
  streak      integer not null default 0 constraint profiles_streak_check check (streak >= 0),
  subject     text,
  group_name  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Asegurar columna updated_at si la tabla ya existía previamente
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- Asegurar constraints numéricos en caso de que la tabla ya existiese sin ellos
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_level_check' and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles add constraint profiles_level_check check (level >= 1);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_xp_check' and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles add constraint profiles_xp_check check (xp >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_coins_check' and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles add constraint profiles_coins_check check (coins >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_streak_check' and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles add constraint profiles_streak_check check (streak >= 0);
  end if;
end $$;

-- 2. Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Limpiar política anterior si existiera
drop policy if exists "own profile" on public.profiles;

-- Políticas separadas por operación para el propio usuario (auth.uid() = id)
-- No se habilita DELETE desde el cliente
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3. Trigger para actualizar updated_at automáticamente
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_profiles_updated on public.profiles;
create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- 3b. El rol no se puede cambiar desde el cliente (solo service_role).
-- Pendiente: xp/coins/level/streak siguen siendo editables por el propio usuario
-- porque el frontend llama a updateXP directo; moverlo a una RPC validada.
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.role is distinct from old.role and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'No se puede cambiar el rol desde el cliente';
  end if;
  return new;
end;
$$;

drop trigger if exists on_profiles_role_guard on public.profiles;
create trigger on_profiles_role_guard
  before update on public.profiles
  for each row execute procedure public.prevent_role_change();

-- 4. Función y trigger para creación automática de perfil al registrarse un usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    role,
    name,
    last,
    grade
  )
  values (
    new.id,
    coalesce(new.email, ''),
    case
      when new.raw_user_meta_data->>'role' in ('student', 'teacher') then new.raw_user_meta_data->>'role'
      else 'student'
    end,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'last', ''),
    coalesce(new.raw_user_meta_data->>'grade', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
