-- Referral system: every profile gets a short referral_code, and a new user
-- who signs up via ?ref=<code> credits both themselves and the referrer with
-- 5 bonus credits (once per referred user, enforced atomically).

alter table public.profiles
  add column referral_code text,
  add column referred_by uuid references public.profiles (id) on delete set null;

update public.profiles
  set referral_code = encode(extensions.gen_random_bytes(5), 'hex')
  where referral_code is null;

alter table public.profiles
  alter column referral_code set not null;

create unique index profiles_referral_code_idx on public.profiles (referral_code);

-- Extend the signup trigger so every new profile gets a referral_code too.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, referral_code)
  values (new.id, encode(extensions.gen_random_bytes(5), 'hex'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.apply_referral(p_referral_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_referrer_id uuid;
  v_updated uuid;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'reason', 'not_authenticated');
  end if;

  select id into v_referrer_id from public.profiles where referral_code = p_referral_code;

  if v_referrer_id is null then
    return jsonb_build_object('success', false, 'reason', 'invalid_code');
  end if;

  if v_referrer_id = v_user_id then
    return jsonb_build_object('success', false, 'reason', 'self_referral');
  end if;

  -- Atomic guard: only the first successful call per referred user applies the bonus.
  update public.profiles
    set referred_by = v_referrer_id, credits = credits + 5
    where id = v_user_id and referred_by is null
    returning id into v_updated;

  if v_updated is null then
    return jsonb_build_object('success', false, 'reason', 'already_referred');
  end if;

  update public.profiles set credits = credits + 5 where id = v_referrer_id;

  insert into public.usage_logs (user_id, action, credits_charged) values (v_user_id, 'referral_bonus', -5);
  insert into public.usage_logs (user_id, action, credits_charged) values (v_referrer_id, 'referral_bonus', -5);

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.apply_referral(text) to authenticated;
