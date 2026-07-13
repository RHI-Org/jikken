import pkg from '/home/node/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.js';
const { chromium } = pkg;

const BASE = process.env.BASE || 'http://localhost:8090';
const OUT = '/tmp/jikken-shots';
import { mkdirSync } from 'node:fs';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/home/node/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome',
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto(`${BASE}/preview`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/01-initial.png` });

// Open the Commands tab — Feature/Scenario selection lives here now, above
// the command shortcuts, not in the stage's top bar.
await page.getByRole('button', { name: 'Commands', exact: true }).click();
await page.waitForTimeout(300);

// Pick a scenario — the shared deterministic input. On the CLI tab this
// injects `jikken diff --scenario <id>` and runs it.
await page.getByLabel('Choose a scenario').selectOption({ label: 'Exclude employees' });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/02-situation-selected.png` });

// Run a command shortcut → CLI runs the engine and prints the conflict report
await page.getByRole('button', { name: 'diff --scenario conflict', exact: true }).first().click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/03-cli-conflict.png` });

// Open the Details tab (Design + Principles + Tech merged), expand the
// collapsed Principles section, and click principle #2 (Colors → dashboard + pin)
await page.getByRole('button', { name: 'Details', exact: true }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: /Principles \(10\)/ }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: /Colors functional/ }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/04-principle-dashboard-pin.png` });

// Click principle #3 (Exit codes → cli + pin)
await page.getByRole('button', { name: /Exit codes are the real product/ }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/05-principle-cli-pin.png` });

// Switch to SDK surface
await page.getByRole('button', { name: 'SDK', exact: true }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/06-sdk.png` });

// CI gate — governance: the pipeline runs and blocks the risky deploy
await page.getByRole('button', { name: 'CI gate', exact: true }).click();
await page.waitForTimeout(3800); // full pipeline choreography + verdict banner
await page.screenshot({ path: `${OUT}/06b-ci-blocked.png` });

// Hand-off (in the Details tab's Design section) — CLI run, then auto-switch
// to the CI gate where the pipeline resolves and blocks/ships the change
await page.getByRole('button', { name: 'Details', exact: true }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: /The hand-off/ }).click();
await page.waitForTimeout(5200); // cli run (1.6s) + pipeline choreography (~3.4s)
await page.screenshot({ path: `${OUT}/07-handoff-after.png` });

// Collapse panel → edge tab
await browser.close();
console.log('CONSOLE ERRORS:', errors.length ? JSON.stringify(errors, null, 2) : 'none');
console.log('shots in', OUT);
