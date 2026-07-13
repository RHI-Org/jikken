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

// Pick a situation from the top-bar dropdown — the shared deterministic input.
// On the CLI tab this injects `jikken diff --scenario <id>` and runs it.
await page.getByLabel('Choose a situation').selectOption({ label: 'Exclude employees' });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/02-situation-selected.png` });

// Click a Quickstart chip → CLI runs the engine and prints the conflict report
await page.getByRole('button', { name: 'diff --scenario conflict', exact: true }).first().click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/03-cli-conflict.png` });

// Switch to Principles tab and click principle #2 (Colors → dashboard + pin)
await page.getByRole('button', { name: 'Principles (10)' }).click();
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

// Design tab + hand-off
await page.getByRole('button', { name: 'Design', exact: true }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: /The hand-off/ }).click();
await page.waitForTimeout(2200); // choreography: cli run then auto-switch to dashboard
await page.screenshot({ path: `${OUT}/07-handoff-after.png` });

// Collapse panel → edge tab
await browser.close();
console.log('CONSOLE ERRORS:', errors.length ? JSON.stringify(errors, null, 2) : 'none');
console.log('shots in', OUT);
