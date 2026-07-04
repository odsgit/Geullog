-- Lets a template owner publish it to the public gallery at /templates.

alter table public.templates
  add column is_public boolean not null default false;

create policy "Anyone can view public templates" on public.templates for select
  using (is_public = true);
