/**
 * Chunking cookie storage adapter for Supabase cross-subdomain SSO.
 *
 * Canonical source: github.com/RHI-Org/components/lib/auth-storage.ts
 *
 * Why this exists
 * ---------------
 * The previous custom cookie storage stored the full Supabase session JSON
 * in a single cookie. Browsers silently drop a single cookie >4 KB. Recent
 * @supabase/auth-js releases pushed the session JSON over that limit, which
 * is why "auth works for a sec, then bounces back to login" started happening
 * after package upgrades. This module chunks the value across multiple
 * cookies (~3500 bytes each) to stay under the per-cookie limit, while
 * keeping the same `domain=.experienceplus.ai` scoping the apps depend on
 * for cross-subdomain SSO.
 *
 * Compatibility
 * -------------
 * - Reads still work for legacy single-cookie sessions written by the old
 *   adapter (graceful migration — no forced logout on first deploy).
 * - On any setItem/removeItem we clean up both forms so we never leave
 *   orphaned chunks behind.
 *
 * Vanilla JS twin: ./auth-storage.js (used by static-HTML sites that load
 * supabase-js from a CDN).
 */

export interface ChunkedCookieStorageOptions {
  /** Parent domain to scope the cookie to. Default: `.experienceplus.ai`. */
  domain?: string;
  /** Cookie path. Default: `/`. */
  path?: string;
  /** SameSite. Default: `lax`. */
  sameSite?: 'strict' | 'lax' | 'none';
  /** Secure flag. Default: true (off only on localhost). */
  secure?: boolean;
  /** max-age in seconds. Default: 1 year. */
  maxAge?: number;
  /** Bytes per chunk. Default: 3500 (safely under 4096 per-cookie limit). */
  chunkSize?: number;
}

const DEFAULT_DOMAIN = '.experienceplus.ai';
const CHUNK_SUFFIX = '.';
const DEFAULT_CHUNK_SIZE = 3500;

function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local');
}

function buildAttrs(opts: Required<ChunkedCookieStorageOptions>, expired = false): string {
  const parts: string[] = [`path=${opts.path}`];
  if (!isLocalhost()) {
    parts.push(`domain=${opts.domain}`);
  }
  // Always mark the cookie Secure. `http://localhost` is a "potentially
  // trustworthy" (secure) origin per the spec, so browsers accept Secure
  // cookies there too — safe in local dev, and required everywhere else
  // (cross-subdomain SSO is always served over HTTPS). `opts.secure` is kept
  // for API compatibility but no longer gates the attribute.
  void opts.secure;
  parts.push('secure');
  parts.push(`samesite=${opts.sameSite}`);
  if (expired) {
    parts.push('expires=Thu, 01 Jan 1970 00:00:00 GMT');
  } else {
    parts.push(`max-age=${opts.maxAge}`);
  }
  return '; ' + parts.join('; ');
}

function readRawCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split('; ');
  for (const cookie of cookies) {
    const eq = cookie.indexOf('=');
    if (eq < 0) continue;
    if (cookie.substring(0, eq) === name) {
      return cookie.substring(eq + 1);
    }
  }
  return null;
}

function listChunkNames(baseKey: string): string[] {
  if (typeof document === 'undefined') return [];
  const prefix = baseKey + CHUNK_SUFFIX;
  const names: string[] = [];
  for (const cookie of document.cookie.split('; ')) {
    const eq = cookie.indexOf('=');
    if (eq < 0) continue;
    const k = cookie.substring(0, eq);
    if (k.length > prefix.length && k.startsWith(prefix)) {
      const idx = k.slice(prefix.length);
      // Only accept pure-numeric suffixes so we don't collide with sibling cookies.
      if (/^\d+$/.test(idx)) names.push(k);
    }
  }
  names.sort((a, b) => {
    const ai = parseInt(a.slice(prefix.length), 10);
    const bi = parseInt(b.slice(prefix.length), 10);
    return ai - bi;
  });
  return names;
}

export function createChunkedCookieStorage(options: ChunkedCookieStorageOptions = {}) {
  const opts: Required<ChunkedCookieStorageOptions> = {
    domain: options.domain ?? DEFAULT_DOMAIN,
    path: options.path ?? '/',
    sameSite: options.sameSite ?? 'lax',
    secure: options.secure ?? true,
    maxAge: options.maxAge ?? 60 * 60 * 24 * 365,
    chunkSize: options.chunkSize ?? DEFAULT_CHUNK_SIZE,
  };

  function setRaw(name: string, rawValue: string): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=${rawValue}${buildAttrs(opts)}`;
  }
  function expire(name: string): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=${buildAttrs(opts, true)}`;
  }

  return {
    getItem(key: string): string | null {
      // Prefer chunked form if any chunk cookies exist.
      const chunkNames = listChunkNames(key);
      if (chunkNames.length > 0) {
        let raw = '';
        for (const cn of chunkNames) {
          const part = readRawCookie(cn);
          if (part === null) return null; // missing chunk = treat as no session
          raw += part;
        }
        try {
          return decodeURIComponent(raw);
        } catch {
          return null;
        }
      }
      // Fallback: legacy single cookie written by the old adapter.
      const legacy = readRawCookie(key);
      if (legacy === null) return null;
      try {
        return decodeURIComponent(legacy);
      } catch {
        return null;
      }
    },

    setItem(key: string, value: string): void {
      // Always clean up any prior form first to avoid stale chunks.
      for (const cn of listChunkNames(key)) expire(cn);
      expire(key);

      const encoded = encodeURIComponent(value);
      if (encoded.length <= opts.chunkSize) {
        setRaw(key, encoded);
        return;
      }

      let offset = 0;
      let i = 0;
      while (offset < encoded.length) {
        setRaw(`${key}${CHUNK_SUFFIX}${i}`, encoded.slice(offset, offset + opts.chunkSize));
        offset += opts.chunkSize;
        i++;
      }
    },

    removeItem(key: string): void {
      expire(key);
      for (const cn of listChunkNames(key)) expire(cn);
    },
  };
}

/**
 * Default chunking cookie storage scoped to `.experienceplus.ai`.
 * Most callers should just import this directly:
 *
 *   import { createClient } from '@supabase/supabase-js';
 *   import { sharedCookieStorage } from '@rhi-org/components/lib/auth-storage';
 *
 *   export const supabase = createClient(URL, KEY, {
 *     auth: { storage: sharedCookieStorage, persistSession: true, autoRefreshToken: true }
 *   });
 */
export const sharedCookieStorage = createChunkedCookieStorage();
