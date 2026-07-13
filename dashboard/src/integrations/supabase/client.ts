/**
 * Supabase client for the Dashboard — same org project as folio and the
 * Jikken presentation (bsfngnjvmostukrfhoxx), so the shared .experienceplus.ai
 * SSO cookie carries a session into the embedded/standalone Dashboard with no
 * separate login. Used for the jikken_flags / jikken_simulations data layer
 * and the History page's Realtime subscription.
 *
 * auth-storage.ts is vendored from RHI-Org/components/lib/auth-storage.ts
 * (via the Jikken presentation) — update the canonical source first, then
 * re-copy here.
 *
 * When the env vars are absent (e.g. a bare local checkout) `supabase` is null
 * and the store layer falls back to LocalStorage, so the dashboard still runs.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { sharedCookieStorage } from './auth-storage';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// Support both key names during Supabase's anon → publishable transition.
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(SUPABASE_URL!, SUPABASE_KEY!, {
      auth: {
        storage: sharedCookieStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
