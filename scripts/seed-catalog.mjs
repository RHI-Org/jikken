/**
 * Seed public.jikken_catalog from the bundled @jikken/shared FEATURES.
 *
 * The bundled catalog is canonical; this pushes it into the table so the DB and
 * code start in sync. Run once after applying the jikken_catalog migration, and
 * again whenever the bundled catalog changes:
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-catalog.mjs
 *
 * Uses the service role (bypasses RLS). Never commit the key.
 */
import { createClient } from '@supabase/supabase-js';
import { FEATURES } from '../shared/src/index.ts';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(2);
}

const rows = FEATURES.map((f, i) => ({
  id: f.id,
  label: f.label,
  description: f.description,
  sort_order: i,
  situations: f.situations,
}));

const supabase = createClient(url, key);
const { error } = await supabase.from('jikken_catalog').upsert(rows, { onConflict: 'id' });
if (error) {
  console.error('seed failed:', error.message);
  process.exit(1);
}
console.log(`seeded ${rows.length} features → jikken_catalog`);
