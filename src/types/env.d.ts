interface ImportMetaEnv {
  readonly SUPABASE_URL: string
  readonly SUPABASE_ANON_KEY: string
  readonly GA_MEASUREMENT_ID: string
  readonly CLARITY_PROJECT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
