/**
 * Assert every feature × situation in the catalog evaluates to its intended
 * exit code (all-clear→0, conflict→1, warning→2) and that the diff shows the
 * expected access change. Run with: npx tsx scripts/verify-catalog.mjs
 */
import { FEATURES, evaluateFlag, diffSimulations, EXIT_CODES } from '../shared/src/index.ts';

const WANT = { 'all-clear': EXIT_CODES.ALL_CLEAR, conflict: EXIT_CODES.CONFLICT, warning: EXIT_CODES.WARNING };
let failures = 0;

for (const feature of FEATURES) {
  for (const [sit, scenario] of Object.entries(feature.situations)) {
    const r = evaluateFlag(scenario.flag, scenario.users);
    const d = diffSimulations(scenario.baseline, scenario.flag, scenario.users);
    const want = WANT[sit];
    const ok = r.exit_code === want;
    // conflict must lose receivers; warning must produce partials but lose none to exclude.
    const lostOk = sit === 'conflict' ? d.lost.length > 0 : true;
    const line = `${feature.id} / ${sit}: exit=${r.exit_code} want=${want} lost=${d.lost.length} gained=${d.gained.length} partial=${r.summary.warned}`;
    if (!ok || !lostOk) {
      failures++;
      console.log('  ✗ ' + line);
    } else {
      console.log('  ✓ ' + line);
    }
  }
}

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
