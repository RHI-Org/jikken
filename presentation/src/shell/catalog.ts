/**
 * Catalog loader — Feature × Situation content from Supabase, with the bundled
 * @jikken/shared FEATURES as the offline / fallback source.
 *
 * The evaluation engine stays local and deterministic; this only swaps the
 * SOURCE of the menu content. If the `jikken_catalog` table is missing, empty,
 * unreachable, or returns a malformed row, we silently fall back to the bundled
 * catalog — so the presentation renders identically whether or not the table
 * has been provisioned. That fallback is what makes shipping this safe before
 * the shared-Supabase migration is applied.
 */
import { FEATURES, SITUATION_IDS, type FeatureDef, type SituationId } from '@jikken/shared';
import { supabase } from '@/integrations/supabase/client';

/** The bundled catalog — canonical offline source and fallback. */
export const BUNDLED_CATALOG = FEATURES;

interface CatalogRow {
  id: string;
  label: string;
  description: string;
  sort_order: number;
  situations: unknown;
}

/** A row is usable only if every situation archetype is present and shaped. */
function toFeatureDef(row: CatalogRow): FeatureDef | null {
  const s = row.situations as Record<string, unknown> | null;
  if (!s || typeof s !== 'object') return null;
  for (const id of SITUATION_IDS) {
    const scenario = s[id] as { flag?: unknown; baseline?: unknown; users?: unknown } | undefined;
    if (!scenario || !scenario.flag || !scenario.baseline || !Array.isArray(scenario.users)) {
      return null;
    }
  }
  return {
    id: row.id as FeatureDef['id'],
    label: row.label,
    description: row.description,
    situations: s as Record<SituationId, FeatureDef['situations'][SituationId]>,
  };
}

/**
 * Load the feature catalog. Resolves to the Supabase rows when they are present
 * and valid; otherwise to the bundled catalog. Never rejects.
 */
export async function loadCatalog(): Promise<FeatureDef[]> {
  try {
    const { data, error } = await supabase
      .from('jikken_catalog')
      .select('id, label, description, sort_order, situations')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) return BUNDLED_CATALOG;

    const mapped = data.map((r) => toFeatureDef(r as CatalogRow));
    if (mapped.some((f) => f === null)) return BUNDLED_CATALOG; // any bad row → trust the bundle
    return mapped as FeatureDef[];
  } catch {
    return BUNDLED_CATALOG;
  }
}
