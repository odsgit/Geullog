-- Anonymous free-trial abuse guard: one trial generation per hashed IP.
-- No select/insert policies are granted directly — only the SECURITY DEFINER
-- claim_trial() RPC (called with the anon key, no user session) can touch this
-- table, so an anonymous visitor can never read or forge other IPs' rows.

create table public.trial_usage (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create unique index trial_usage_ip_hash_idx on public.trial_usage (ip_hash);

alter table public.trial_usage enable row level security;

create or replace function public.claim_trial(p_ip_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.trial_usage (ip_hash) values (p_ip_hash);
  return jsonb_build_object('success', true);
exception
  when unique_violation then
    return jsonb_build_object('success', false, 'reason', 'already_used');
end;
$$;

grant execute on function public.claim_trial(text) to anon, authenticated;
