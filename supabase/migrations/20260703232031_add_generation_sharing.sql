-- Adds public sharing support for generations: an owner can flip is_public on
-- a generation to expose it (and its latest version) at /share/:id to anyone,
-- including unauthenticated visitors.

alter table public.generations
  add column is_public boolean not null default false;

create policy "Anyone can view public generations" on public.generations for select
  using (is_public = true);

create policy "Anyone can view versions of public generations" on public.generation_versions for select
  using (
    exists (
      select 1 from public.generations g
      where g.id = generation_versions.generation_id
      and g.is_public = true
    )
  );
