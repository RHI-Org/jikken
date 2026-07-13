/**
 * Supabase client with cross-subdomain cookie auth.
 *
 * Same org Supabase project as folio (bsfngnjvmostukrfhoxx) — required so the
 * shared .experienceplus.ai SSO cookie carries a session from any other app
 * on the domain straight into Jikken, with no separate login.
 *
 * Cookie storage adapter is vendored from RHI-Org/components/lib/auth-storage.ts —
 * update there first, then re-copy here. This module handles chunking so sessions
 * larger than 4KB don't get silently dropped by the browser.
 */
import { createClient } from '@supabase/supabase-js';
import { sharedCookieStorage } from './auth-storage';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
// Support both key names during Supabase's transition from anon to publishable naming
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: sharedCookieStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
