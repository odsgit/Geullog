-- Schedules the weekly-summary Edge Function every Monday 00:00 UTC (09:00 KST).
-- The Authorization header uses the anon key (already public in the client
-- bundle, safe to commit) purely to satisfy the function's JWT verification —
-- the function itself uses its auto-injected SUPABASE_SERVICE_ROLE_KEY for the
-- actual privileged reads, so no secret value is stored in this migration.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select
  cron.schedule(
    'weekly-summary-email',
    '0 0 * * 1',
    $$
    select
      net.http_post(
        url := 'https://xdbmuarvrnuwksgczsbf.supabase.co/functions/v1/weekly-summary',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkYm11YXJ2cm51d2tzZ2N6c2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNzU5MjgsImV4cCI6MjA5ODY1MTkyOH0.CKEznzhC-hGRmOVYd6tbzwjPEb8-0C79HDsIqN8ov84"}'::jsonb,
        body := '{}'::jsonb
      );
    $$
  );
