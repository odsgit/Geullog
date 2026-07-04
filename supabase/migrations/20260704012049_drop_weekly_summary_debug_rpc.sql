-- Cleanup: this helper was only needed once, to register the vault-generated
-- secret as the weekly-summary Edge Function's CRON_SECRET. No longer needed.
drop function if exists public.debug_get_weekly_summary_cron_secret();
