#!/usr/bin/env node
/**
 * Assemble the combined jk.experienceplus.ai deployment.
 *
 * The presentation is the root app; the dashboard (built with base
 * /dashboard/) is copied under presentation/dist/dashboard so the Dashboard
 * surface's iframe is SAME-ORIGIN — the shared .experienceplus.ai SSO cookie
 * carries in with no CORS. Run after building both (see `vercel-build`).
 */
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const presentationDist = join(root, 'presentation', 'dist');
const dashboardDist = join(root, 'dashboard', 'dist');
const target = join(presentationDist, 'dashboard');

if (!existsSync(presentationDist)) throw new Error(`missing ${presentationDist} — build presentation first`);
if (!existsSync(dashboardDist)) throw new Error(`missing ${dashboardDist} — build dashboard first`);

rmSync(target, { recursive: true, force: true });
cpSync(dashboardDist, target, { recursive: true });
console.log(`assembled: dashboard/dist → presentation/dist/dashboard`);
