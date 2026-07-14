/**
 * jikken-simulate — Edge Function for the SDK / CI surface.
 *
 * Runs the SAME shared engine as the browser CLI tab and the Node CLI
 * (vendored via scripts/sync-edge-shared.mjs), so exit codes and decisions
 * are bit-identical on every surface, then appends the run to the
 * jikken_simulations audit log (which Realtime streams to the Dashboard).
 *
 * Auth (custom — deployed with verify_jwt disabled):
 *  - `x-jikken-key` header matching the JIKKEN_API_KEY secret (SDK / CI), or
 *  - a valid Supabase user JWT in Authorization (browser callers).
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { evaluateFlag } from './engine.ts';
import { SCENARIOS } from './scenarios.ts';
import type { ScenarioId } from './scenarios.ts';
import type { FlagConfig, MockUser } from './types.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  // supabase-js always attaches x-client-info and apikey to browser calls;
  // omitting them here fails the CORS preflight for the SDK tab / CLI persist.
  'Access-Control-Allow-Headers': 'authorization, content-type, x-jikken-key, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

/** Largest mock_users array a caller may submit — bounds engine work and audit-row size. */
const MAX_MOCK_USERS = 500;

/**
 * Constant-time key comparison: compare SHA-256 digests byte-by-byte so the
 * check's duration doesn't depend on how much of the key prefix matches.
 */
async function timingSafeKeyMatch(provided: string, expected: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(provided)),
    crypto.subtle.digest('SHA-256', enc.encode(expected)),
  ]);
  const av = new Uint8Array(a);
  const bv = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < av.length; i++) diff |= av[i] ^ bv[i];
  return diff === 0;
}

function defaultUsers(count = 25): MockUser[] {
  const segments = ['early_adopter', 'standard', 'premium', 'enterprise'];
  const countries = ['US', 'CA', 'UK', 'DE', 'FR'];
  return Array.from({ length: count }, (_, i) => {
    const id = `user_${String(i + 1).padStart(3, '0')}`;
    return {
      user_id: id,
      email: `${id}@example.com`,
      segment: segments[i % segments.length],
      country: countries[i % countries.length],
    };
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') {
    return json(405, { error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only' } });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey);

  // ── Auth: API key (machines) or user JWT (browsers) ──
  let userId: string | null = null;
  const apiKey = req.headers.get('x-jikken-key');
  const expectedKey = Deno.env.get('JIKKEN_API_KEY');
  if (apiKey && expectedKey && (await timingSafeKeyMatch(apiKey, expectedKey))) {
    // machine caller — authorized
  } else {
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) {
      return json(401, {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Provide a valid user token or x-jikken-key',
          details: [{ field: 'authorization', suggestion: 'Check your API key or sign in' }],
        },
      });
    }
    userId = data.user.id;
  }

  // ── Input ──
  let body: {
    flag_id?: string;
    scenario?: ScenarioId;
    mock_users?: MockUser[];
    surface?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json(400, {
      error: {
        code: 'INVALID_INPUT',
        message: 'Body must be JSON',
        details: [{ field: 'body', suggestion: 'Send {"flag_id":"dark-mode"} or {"scenario":"conflict"}' }],
      },
    });
  }

  if (body.mock_users !== undefined) {
    if (!Array.isArray(body.mock_users) || body.mock_users.length === 0 || body.mock_users.length > MAX_MOCK_USERS) {
      return json(400, {
        error: {
          code: 'INVALID_INPUT',
          message: `mock_users must be a non-empty array of at most ${MAX_MOCK_USERS} users`,
          details: [{ field: 'mock_users', suggestion: `Send 1–${MAX_MOCK_USERS} users, or omit the field for defaults` }],
        },
      });
    }
  }

  let flag: FlagConfig;
  let users: MockUser[];

  if (body.scenario) {
    const scenario = SCENARIOS[body.scenario];
    if (!scenario) {
      return json(400, {
        error: {
          code: 'INVALID_INPUT',
          message: `Unknown scenario '${body.scenario}'`,
          details: [{ field: 'scenario', suggestion: "Use 'all-clear', 'conflict', or 'warning'" }],
        },
      });
    }
    flag = scenario.flag;
    users = body.mock_users ?? scenario.users;
  } else if (body.flag_id) {
    if (!/^[a-z0-9-]+$/.test(body.flag_id)) {
      return json(400, {
        error: {
          code: 'INVALID_INPUT',
          message: 'Flag ID contains invalid characters',
          details: [{ field: 'flag_id', suggestion: 'Use lowercase letters, numbers, and hyphens only' }],
        },
      });
    }
    const { data, error } = await admin.from('jikken_flags').select('*').eq('id', body.flag_id).maybeSingle();
    if (error) return json(500, { error: { code: 'INTERNAL', message: error.message } });
    if (!data) {
      return json(404, {
        error: {
          code: 'FLAG_NOT_FOUND',
          message: `Flag '${body.flag_id}' is not registered`,
          details: [{ field: 'flag_id', suggestion: 'Check that the flag is registered in the system' }],
        },
      });
    }
    flag = data as FlagConfig;
    users = body.mock_users ?? defaultUsers();
  } else {
    return json(400, {
      error: {
        code: 'INVALID_INPUT',
        message: 'Provide flag_id or scenario',
        details: [{ field: 'flag_id', suggestion: 'Send {"flag_id":"dark-mode"} or {"scenario":"conflict"}' }],
      },
    });
  }

  const result = evaluateFlag(flag, users);

  const { error: insertError } = await admin.from('jikken_simulations').insert({
    simulation_id: result.simulation_id,
    flag_id: result.flag_id,
    scenario: body.scenario ?? null,
    surface: body.surface && ['cli', 'dashboard', 'sdk', 'presentation', 'ci'].includes(body.surface) ? body.surface : 'sdk',
    result: result.result,
    exit_code: result.exit_code,
    summary: result.summary,
    decisions: result.decisions,
    evaluated_at: result.evaluated_at,
    total_latency_ms: result.total_latency_ms,
    created_by: userId,
  });
  if (insertError) {
    console.error('audit insert failed:', insertError.message);
    // Simulation result still valid — return it; audit failure is logged.
  }

  return json(200, result);
});
