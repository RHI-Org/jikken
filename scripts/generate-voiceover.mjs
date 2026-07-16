#!/usr/bin/env node
/**
 * Generates an AI voiceover for the product walkthrough video and muxes it
 * over the existing footage, producing a new narrated version.
 *
 * TTS provider: ElevenLabs when ELEVENLABS_API_KEY is set, otherwise
 * Replicate (MiniMax Speech-02-HD) via REPLICATE_API_TOKEN.
 *
 * Usage:
 *   REPLICATE_API_TOKEN=xxx node scripts/generate-voiceover.mjs [--replace]
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
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// ElevenLabs: "Adam" - pre-made deep male American voice.
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
const MODEL_ID = 'eleven_multilingual_v2';

// Replicate: MiniMax Speech-02-HD with a trustworthy male narrator voice.
// Both knobs overridable via env if the read doesn't fit.
const REPLICATE_TTS_MODEL = process.env.REPLICATE_TTS_MODEL || 'minimax/speech-02-hd';
const REPLICATE_TTS_VOICE = process.env.REPLICATE_TTS_VOICE || 'English_Trustworth_Man';

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

async function synthesizeElevenLabs(text, outPath) {
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function synthesizeReplicate(text, outPath) {
  const createResponse = await fetch(
    `https://api.replicate.com/v1/models/${REPLICATE_TTS_MODEL}/predictions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        Prefer: 'wait=60',
      },
      body: JSON.stringify({
        input: { text, voice_id: REPLICATE_TTS_VOICE, speed: 1, pitch: 0 },
      }),
    }
  );

  let prediction = await createResponse.json();
  if (!createResponse.ok) {
    throw new Error(`Replicate TTS failed: ${createResponse.status} - ${JSON.stringify(prediction)}`);
  }

  const startedAt = Date.now();
  while (!['succeeded', 'failed', 'canceled'].includes(prediction.status)) {
    if (Date.now() - startedAt > 5 * 60 * 1000) throw new Error('Replicate TTS timed out');
    await sleep(3000);
    const pollResponse = await fetch(prediction.urls.get, {
      headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
    });
    prediction = await pollResponse.json();
  }

  if (prediction.status !== 'succeeded') {
    throw new Error(`Replicate TTS ended "${prediction.status}": ${JSON.stringify(prediction.error)}`);
  }

  const url = typeof prediction.output === 'string' ? prediction.output : prediction.output?.[0];
  if (!url) throw new Error(`No audio URL in Replicate output: ${JSON.stringify(prediction.output)}`);

  const audio = await fetch(url);
  if (!audio.ok) throw new Error(`Audio download failed: ${audio.status}`);
  fs.writeFileSync(outPath, Buffer.from(await audio.arrayBuffer()));
}

async function synthesize(text, outPath) {
  if (ELEVENLABS_API_KEY) return synthesizeElevenLabs(text, outPath);
  return synthesizeReplicate(text, outPath);
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
  if (!ELEVENLABS_API_KEY && !REPLICATE_API_TOKEN) {
    console.error('Error: set ELEVENLABS_API_KEY or REPLICATE_API_TOKEN.');
    process.exit(1);
  }

  fs.mkdirSync(WORK_DIR, { recursive: true });

  const provider = ELEVENLABS_API_KEY
    ? `ElevenLabs (voice ${VOICE_ID})`
    : `Replicate ${REPLICATE_TTS_MODEL} (voice ${REPLICATE_TTS_VOICE})`;
  console.log(`Synthesizing ${SEGMENTS.length} narration segments via ${provider}...`);
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
