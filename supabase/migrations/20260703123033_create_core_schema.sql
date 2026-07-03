-- Core schema for Geullog: profiles, generations, generation_versions, templates, usage_logs
-- All tables have RLS enabled with "own data only" policies.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  credits integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles for select
  using (id = auth.uid());

create policy "Users can insert own profile" on public.profiles for insert
  with check (id = auth.uid());

create policy "Users can update own profile" on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- generations
-- ---------------------------------------------------------------------------

create table public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  input_text text,
  input_image_urls jsonb not null default '[]'::jsonb,
  doc_type text not null,
  style text,
  tone text,
  target_audience text,
  length text,
  output_text text,
  tokens_used integer,
  created_at timestamptz not null default now()
);

create index generations_user_id_idx on public.generations (user_id);

alter table public.generations enable row level security;

create policy "Users can view own generations" on public.generations for select
  using (user_id = auth.uid());

create policy "Users can insert own generations" on public.generations for insert
  with check (user_id = auth.uid());

create policy "Users can update own generations" on public.generations for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own generations" on public.generations for delete
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- generation_versions (regeneration / tone-adjustment history for a generation)
-- ---------------------------------------------------------------------------

create table public.generation_versions (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.generations (id) on delete cascade,
  output_text text not null,
  version_number integer not null default 1,
  created_at timestamptz not null default now()
);

create index generation_versions_generation_id_idx on public.generation_versions (generation_id);

alter table public.generation_versions enable row level security;

create policy "Users can view own generation versions" on public.generation_versions for select
  using (
    exists (
      select 1 from public.generations g
      where g.id = generation_versions.generation_id
      and g.user_id = auth.uid()
    )
  );

create policy "Users can insert own generation versions" on public.generation_versions for insert
  with check (
    exists (
      select 1 from public.generations g
      where g.id = generation_versions.generation_id
      and g.user_id = auth.uid()
    )
  );

create policy "Users can delete own generation versions" on public.generation_versions for delete
  using (
    exists (
      select 1 from public.generations g
      where g.id = generation_versions.generation_id
      and g.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- templates
-- ---------------------------------------------------------------------------

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  doc_type text,
  style text,
  tone text,
  target_audience text,
  length text,
  prompt_text text,
  created_at timestamptz not null default now()
);

create index templates_user_id_idx on public.templates (user_id);

alter table public.templates enable row level security;

create policy "Users can view own templates" on public.templates for select
  using (user_id = auth.uid());

create policy "Users can insert own templates" on public.templates for insert
  with check (user_id = auth.uid());

create policy "Users can update own templates" on public.templates for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own templates" on public.templates for delete
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- usage_logs (append-only audit log: no update/delete policies)
-- ---------------------------------------------------------------------------

create table public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  generation_id uuid references public.generations (id) on delete set null,
  action text not null,
  tokens_used integer not null default 0,
  credits_charged integer not null default 0,
  created_at timestamptz not null default now()
);

create index usage_logs_user_id_idx on public.usage_logs (user_id);
create index usage_logs_generation_id_idx on public.usage_logs (generation_id);

alter table public.usage_logs enable row level security;

create policy "Users can view own usage logs" on public.usage_logs for select
  using (user_id = auth.uid());

create policy "Users can insert own usage logs" on public.usage_logs for insert
  with check (user_id = auth.uid());
