/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL — enables saving RSVPs and blessings for everyone (see README). */
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
