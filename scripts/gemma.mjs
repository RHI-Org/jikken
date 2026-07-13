#!/usr/bin/env node
/**
 * Gemma delegation harness (Parasail, OpenAI-compatible).
 *
 * Offloads well-specified / boilerplate generation to a cheap model.
 * Claude reviews + typechecks the output before integrating.
 *
 * Usage:
 *   node scripts/gemma.mjs <prompt-file> <out-file> [fast|smart]
 *
 * Auth: PARASAIL_API_KEY env var (never printed or committed).
 */
import { readFileSync, writeFileSync } from 'node:fs';

const MODELS = {
  fast: 'google/gemma-4-26B-A4B-it',
  smart: 'google/gemma-4-31B-it',
};

const [, , promptFile, outFile, tierArg = 'fast'] = process.argv;
if (!promptFile || !outFile) {
  console.error('usage: node scripts/gemma.mjs <prompt-file> <out-file> [fast|smart]');
  process.exit(2);
}

const key = process.env.PARASAIL_API_KEY;
if (!key) {
  console.error('PARASAIL_API_KEY not set');
  process.exit(2);
}

const model = MODELS[tierArg] ?? MODELS.fast;
const prompt = readFileSync(promptFile, 'utf8');

const res = await fetch('https://api.parasail.io/v1/chat/completions', {
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
  body: JSON.stringify({
    model,
    temperature: 0,
    messages: [
      {
        role: 'system',
        content:
          'You are a code generator. Output ONLY the file contents — no markdown fences, no commentary, no explanation. Follow the spec verbatim. Do not invent fields or values not present in the spec.',
      },
      { role: 'user', content: prompt },
    ],
  }),
});

if (!res.ok) {
  console.error(`Parasail ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const json = await res.json();
let out = json.choices?.[0]?.message?.content ?? '';
// Strip accidental code fences if the model adds them anyway.
out = out.replace(/^```[a-z]*\n/i, '').replace(/\n```\s*$/i, '');
writeFileSync(outFile, out);
console.error(`[gemma:${tierArg}] wrote ${out.length} chars → ${outFile}`);
