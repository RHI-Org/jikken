#!/usr/bin/env node
/**
 * Generates an ElevenLabs AI voiceover for the product walkthrough video and
 * muxes it over the existing footage, producing a new narrated version.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=xxx node scripts/generate-voiceover.mjs [--replace]
 *
 * Output: presentation/public/media/jikken-walkthrough-vo.mp4
 * With --replace, the narrated version overwrites jikken-walkthrough.mp4.
 *
 * Requires @ffmpeg-installer/ffmpeg (installed by the workflow; no other deps).
 *
 * File: scripts/generate-voiceover.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// "Adam" - ElevenLabs pre-made male voice (deep, neutral American).
// Swap for another voice id if the read doesn't fit.
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
const MODEL_ID = 'eleven_multilingual_v2';

const VIDEO_IN = 'presentation/public/media/jikken-walkthrough.mp4';
const VIDEO_OUT = 'presentation/public/media/jikken-walkthrough-vo.mp4';
const WORK_DIR = '.voiceover-tmp';

// Narration segments and when each should start (seconds into the 82s video).
// Tune the start times to match the section cuts in the footage.
const SEGMENTS = [
  {
    start: 0.8,
    text:
      'Hi, I’m Ryan, a UX designer and software engineer. I created Jikken to explore how one complex workflow can remain coherent across multiple surfaces.',
  },
  {
    start: 14,
    text:
      'For the CLI, I prioritized ergonomics and fast scanning. Users can quickly understand the impact and act on a clear exit code.',
  },
  {
    start: 28,
    text:
      'In the Dashboard, I used progressive disclosure—showing the decision first, with users, rules, and metadata available when needed.',
  },
  {
    start: 42,
    text:
      'The SDK uses the same language and underlying model. Each surface is different, but the user should never have to relearn the system.',
  },
  {
    start: 56,
    text:
      'The CI gate turns that shared decision into governance by blocking a risky change before it reaches users.',
  },
  {
    start: 66,
    text:
      'I designed and built Jikken using an AI-native workflow, then iterated through synthetic UX research. It demonstrates how I think in systems, translate intent into working software, and refine the result across an entire experience.',
  },
];

async function synthesize(text, outPath) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ElevenLabs TTS failed: ${response.status} ${response.statusText} - ${body}`);
  }

  fs.writeFileSync(outPath, Buffer.from(await response.arrayBuffer()));
}

function resolveFfmpeg() {
  try {
    // eslint-disable-next-line no-undef
    return execFileSync('node', ['-e', "console.log(require('@ffmpeg-installer/ffmpeg').path)"], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return 'ffmpeg'; // fall back to a system binary
  }
}

async function main() {
  if (!ELEVENLABS_API_KEY) {
    console.error('Error: ELEVENLABS_API_KEY environment variable is not set.');
    process.exit(1);
  }

  fs.mkdirSync(WORK_DIR, { recursive: true });

  console.log(`Synthesizing ${SEGMENTS.length} narration segments (voice ${VOICE_ID})...`);
  const files = [];
  for (let i = 0; i < SEGMENTS.length; i++) {
    const outPath = path.join(WORK_DIR, `seg-${i}.mp3`);
    await synthesize(SEGMENTS[i].text, outPath);
    files.push(outPath);
    console.log(`  seg-${i} ok (${fs.statSync(outPath).size} bytes)`);
  }

  const ffmpeg = resolveFfmpeg();

  // Mix: original audio ducked to 25%, each narration segment delayed to its
  // start time, everything mixed into one track alongside the untouched video.
  const inputs = ['-i', VIDEO_IN];
  for (const f of files) inputs.push('-i', f);

  const delays = SEGMENTS.map(
    (seg, i) => `[${i + 1}:a]adelay=${Math.round(seg.start * 1000)}|${Math.round(seg.start * 1000)}[vo${i}]`
  );
  const voLabels = SEGMENTS.map((_, i) => `[vo${i}]`).join('');
  const filter = [
    '[0:a]volume=0.25[bg]',
    ...delays,
    `[bg]${voLabels}amix=inputs=${SEGMENTS.length + 1}:duration=first:normalize=0[out]`,
  ].join(';');

  console.log('Muxing narration over video...');
  execFileSync(
    ffmpeg,
    [
      '-y',
      ...inputs,
      '-filter_complex',
      filter,
      '-map',
      '0:v',
      '-map',
      '[out]',
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      VIDEO_OUT,
    ],
    { stdio: 'inherit' }
  );

  if (process.argv.includes('--replace')) {
    fs.renameSync(VIDEO_OUT, VIDEO_IN);
    console.log(`Replaced ${VIDEO_IN} with the narrated version.`);
  } else {
    console.log(`Wrote ${VIDEO_OUT}`);
  }

  fs.rmSync(WORK_DIR, { recursive: true, force: true });
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
