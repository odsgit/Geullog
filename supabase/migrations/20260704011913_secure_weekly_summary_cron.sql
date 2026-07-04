-- Supersedes the previous cron job: it used the public anon key as its only
-- auth, which anyone holding that key (published in every client bundle)
-- could reuse to trigger the function on demand and read all users' emails.
-- This adds a random per-project shared secret (generated server-side via
-- Vault, its plaintext value never appears in git) that the Edge Function
-- must see in the x-cron-secret header, in addition to the JWT check.

select cron.unschedule('weekly-summary-email');

select vault.create_secret(
  encode(extensions.gen_random_bytes(24), 'hex'),
  'weekly_summary_cron_secret',
  'Sent as x-cron-secret by the weekly-summary cron job; the Edge Function rejects requests where this does not match its CRON_SECRET env var.'
);

select
  cron.schedule(
    'weekly-summary-email',
    '0 0 * * 1',
    $$
    select
      net.http_post(
        url := 'https://xdbmuarvrnuwksgczsbf.supabase.co/functions/v1/weekly-summary',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkYm11YXJ2cm51d2tzZ2N6c2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNzU5MjgsImV4cCI6MjA5ODY1MTkyOH0.CKEznzhC-hGRmOVYd6tbzwjPEb8-0C79HDsIqN8ov84',
          'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'weekly_summary_cron_secret')
        ),
        body := '{}'::jsonb
      );
    $$
  );

-- Temporary: lets this migration session fetch the generated secret once so
-- it can be registered as the Edge Function's CRON_SECRET via
-- `supabase secrets set`. Only service_role (which can already read vault
-- directly) may call it. Dropped in the next migration once no longer needed.
create or replace function public.debug_get_weekly_summary_cron_secret()
returns text
language sql
security definer
set search_path = public, vault
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'weekly_summary_cron_secret';
$$;

grant execute on function public.debug_get_weekly_summary_cron_secret() to service_role;
