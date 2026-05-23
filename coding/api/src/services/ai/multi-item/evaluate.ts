/**
 * Multi-item prompt evaluation harness.
 *
 * Runs all three prompt variants against every photo in a folder and
 * writes structured output you can review side-by-side.
 *
 * USAGE
 *   # 1. Put 5-15 test photos in coding/api/src/services/ai/multi-item/test-photos/
 *   # 2. From coding/api/:
 *   npx tsx src/services/ai/multi-item/evaluate.ts
 *
 *   # Optional flags:
 *   --variants A,B,C        which variants to run (default: all)
 *   --provider gemini       only gemini supported for now (Bedrock/OpenAI possible)
 *   --photos <dir>          override input dir (default: ./test-photos)
 *   --output <dir>          override output dir (default: ./eval-results)
 *
 * OUTPUT
 *   eval-results/
 *     <photo-name>.A.json    raw output from variant A
 *     <photo-name>.B.json    raw output from variant B
 *     <photo-name>.C.json    raw output from variant C (two-pass merged)
 *     summary.md             human-readable side-by-side comparison
 *     summary.csv            spreadsheet-friendly summary
 *
 * After running, open summary.md and grade each row 1-5 on:
 *   - Item count correct
 *   - Item names correct
 *   - Macros within ±20% of expected
 *   - Confidence calibrated (low-conf items are the ambiguous ones)
 *   - No phantom items
 *
 * Add your scores to summary.md, sum across all photos per variant.
 * The variant with the highest total score wins.
 */

import 'dotenv/config';
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, basename, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

import {
  VARIANT_A_PROMPT,
  VARIANT_B_PROMPT,
  VARIANT_C_PASS1_PROMPT,
  variantCPass2Prompt,
} from './prompts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------
function arg(name: string, fallback?: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1 || idx === process.argv.length - 1) return fallback;
  return process.argv[idx + 1];
}

const VARIANTS = (arg('variants', 'A,B,C') ?? 'A,B,C').split(',').map((v) => v.trim().toUpperCase());
const PROVIDER = arg('provider', 'gemini') ?? 'gemini';
const PHOTOS_DIR = arg('photos', join(__dirname, 'test-photos'))!;
const OUTPUT_DIR = arg('output', join(__dirname, 'eval-results'))!;

// ---------------------------------------------------------------
// Providers — Gemini direct fetch + Bedrock SDK
// ---------------------------------------------------------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';

const AWS_REGION = process.env.AWS_REGION ?? 'us-east-1';
const BEDROCK_MODEL_ID =
  process.env.BEDROCK_MODEL_ID ?? 'global.anthropic.claude-sonnet-4-6';

let bedrockClient: BedrockRuntimeClient | null = null;
function getBedrockClient(): BedrockRuntimeClient {
  if (!bedrockClient) {
    bedrockClient = new BedrockRuntimeClient({
      region: AWS_REGION,
      ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
              ...(process.env.AWS_SESSION_TOKEN
                ? { sessionToken: process.env.AWS_SESSION_TOKEN }
                : {}),
            },
          }
        : {}),
    });
  }
  return bedrockClient;
}

async function callBedrock(opts: {
  systemPrompt: string;
  userText: string;
  imageBuffer?: Buffer;
  mimeType?: string;
  maxOutputTokens?: number;
}): Promise<{ text: string; latency_ms: number; rawResponse: unknown }> {
  const content: Array<Record<string, unknown>> = [];
  if (opts.imageBuffer && opts.mimeType) {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: opts.mimeType,
        data: opts.imageBuffer.toString('base64'),
      },
    });
  }
  content.push({ type: 'text', text: opts.userText });

  const body = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: opts.maxOutputTokens ?? 1200,
    temperature: 0.2,
    system: opts.systemPrompt,
    messages: [{ role: 'user', content }],
  };

  const cmd = new InvokeModelCommand({
    modelId: BEDROCK_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(body),
  });

  const start = Date.now();
  const response = await getBedrockClient().send(cmd);
  const latency_ms = Date.now() - start;

  const raw = JSON.parse(new TextDecoder().decode(response.body)) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = raw.content?.find((c) => c.type === 'text')?.text?.trim() ?? '';
  return { text, latency_ms, rawResponse: raw };
}

// Rate limiting: free tier is 5 RPM for gemini-2.5-flash.
// We pace at MIN_GAP_MS between call starts to stay comfortably under.
const MIN_GAP_MS = 13_000; // ~4.6 RPM
let lastCallAt = 0;

async function paceGate(): Promise<void> {
  const since = Date.now() - lastCallAt;
  if (since < MIN_GAP_MS) {
    const wait = MIN_GAP_MS - since;
    await new Promise((r) => setTimeout(r, wait));
  }
  lastCallAt = Date.now();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callGemini(opts: {
  systemPrompt: string;
  userText: string;
  imageBuffer?: Buffer;
  mimeType?: string;
  responseJson: boolean;
  maxOutputTokens?: number;
  _retry?: boolean;
}): Promise<{ text: string; latency_ms: number; rawResponse: unknown }> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not set. Add to coding/api/.env');
  }
  await paceGate();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const parts: Array<Record<string, unknown>> = [{ text: opts.userText }];
  if (opts.imageBuffer && opts.mimeType) {
    parts.push({
      inlineData: {
        mimeType: opts.mimeType,
        data: opts.imageBuffer.toString('base64'),
      },
    });
  }

  const body = {
    systemInstruction: { parts: [{ text: opts.systemPrompt }] },
    contents: [{ role: 'user', parts }],
    generationConfig: {
      ...(opts.responseJson ? { responseMimeType: 'application/json' } : {}),
      temperature: 0.2,
      maxOutputTokens: opts.maxOutputTokens ?? 1200,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const start = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const latency_ms = Date.now() - start;

  const raw = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: {
      message?: string;
      details?: Array<{ retryDelay?: string }>;
    };
  };

  if (!res.ok) {
    // On 429, parse retryDelay and back off once
    if (res.status === 429 && !opts._retry) {
      const retryStr = raw.error?.details?.find((d) => d.retryDelay)?.retryDelay;
      const waitSec = retryStr ? parseInt(retryStr, 10) : 30;
      const ms = Math.max(15_000, (Number.isFinite(waitSec) ? waitSec : 30) * 1000 + 2000);
      console.log(`      [429 — waiting ${Math.round(ms / 1000)}s then retrying]`);
      await sleep(ms);
      return callGemini({ ...opts, _retry: true });
    }
    throw new Error(`Gemini ${res.status}: ${raw.error?.message ?? 'unknown'}`);
  }

  const text = raw.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  return { text, latency_ms, rawResponse: raw };
}

function extractJson(content: string): string {
  let s = content.trim();
  s = s
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  if (s[0] !== '{') {
    const m = s.match(/\{[\s\S]*\}/);
    if (m) s = m[0];
  }
  return s;
}

// ---------------------------------------------------------------
// Per-variant runners
// ---------------------------------------------------------------
interface VariantResult {
  variant: string;
  latency_ms: number;
  raw_text: string;
  parsed?: unknown;
  parse_error?: string;
  item_count?: number;
}

// Generic caller — picks provider based on global PROVIDER setting
async function callProvider(opts: {
  systemPrompt: string;
  userText: string;
  imageBuffer?: Buffer;
  mimeType?: string;
  responseJson: boolean;
  maxOutputTokens?: number;
}): Promise<{ text: string; latency_ms: number; rawResponse: unknown }> {
  if (PROVIDER === 'bedrock') {
    return callBedrock(opts);
  }
  return callGemini(opts);
}

async function runVariantA(imageBuffer: Buffer, mimeType: string): Promise<VariantResult> {
  const { text, latency_ms } = await callProvider({
    systemPrompt: VARIANT_A_PROMPT,
    userText: 'Analyze this meal. Return JSON only.',
    imageBuffer,
    mimeType,
    responseJson: true,
  });
  let parsed: { items?: unknown[] } | undefined;
  let parse_error: string | undefined;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch (e) {
    parse_error = (e as Error).message;
  }
  return {
    variant: 'A',
    latency_ms,
    raw_text: text,
    parsed,
    parse_error,
    item_count: Array.isArray(parsed?.items) ? parsed.items.length : undefined,
  };
}

async function runVariantB(imageBuffer: Buffer, mimeType: string): Promise<VariantResult> {
  const { text, latency_ms } = await callProvider({
    systemPrompt: VARIANT_B_PROMPT,
    userText: 'Analyze this meal. Follow the 3-step process. Return JSON only.',
    imageBuffer,
    mimeType,
    responseJson: true,
  });
  let parsed: { items?: unknown[] } | undefined;
  let parse_error: string | undefined;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch (e) {
    parse_error = (e as Error).message;
  }
  return {
    variant: 'B',
    latency_ms,
    raw_text: text,
    parsed,
    parse_error,
    item_count: Array.isArray(parsed?.items) ? parsed.items.length : undefined,
  };
}

async function runVariantC(imageBuffer: Buffer, mimeType: string): Promise<VariantResult> {
  // Pass 1 — enumerate items in plain text
  const pass1 = await callProvider({
    systemPrompt: VARIANT_C_PASS1_PROMPT,
    userText: 'Analyze this photo. List items only.',
    imageBuffer,
    mimeType,
    responseJson: false,
    maxOutputTokens: 400,
  });

  // Pass 2 — estimate macros (text-only, no image)
  const pass2 = await callProvider({
    systemPrompt: variantCPass2Prompt(pass1.text.trim()),
    userText: 'Return JSON only with macros for the items above.',
    responseJson: true,
    maxOutputTokens: 800,
  });

  let parsed: { items?: unknown[] } | undefined;
  let parse_error: string | undefined;
  try {
    parsed = JSON.parse(extractJson(pass2.text));
  } catch (e) {
    parse_error = (e as Error).message;
  }

  return {
    variant: 'C',
    latency_ms: pass1.latency_ms + pass2.latency_ms,
    raw_text: `--- PASS 1 (items) ---\n${pass1.text}\n\n--- PASS 2 (macros) ---\n${pass2.text}`,
    parsed,
    parse_error,
    item_count: Array.isArray(parsed?.items) ? parsed.items.length : undefined,
  };
}

const RUNNERS: Record<string, (b: Buffer, m: string) => Promise<VariantResult>> = {
  A: runVariantA,
  B: runVariantB,
  C: runVariantC,
};

// ---------------------------------------------------------------
// Photo loading
// ---------------------------------------------------------------
function mimeFromExt(ext: string): string {
  const e = ext.toLowerCase();
  if (e === '.jpg' || e === '.jpeg') return 'image/jpeg';
  if (e === '.png') return 'image/png';
  if (e === '.webp') return 'image/webp';
  if (e === '.heic') return 'image/heic';
  return 'application/octet-stream';
}

async function listPhotos(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  return entries
    .filter((f) => /\.(jpe?g|png|webp|heic)$/i.test(f))
    .sort();
}

// ---------------------------------------------------------------
// Summary writers
// ---------------------------------------------------------------
function fmtItems(parsed: unknown): string {
  const items = (parsed as { items?: Array<{ item_name?: string; estimated_portion?: string; protein_g?: number; calories?: number }> })?.items;
  if (!Array.isArray(items)) return '(no items array)';
  return items
    .map((it) => `  - ${it.item_name ?? '?'} | ${it.estimated_portion ?? '?'} | ${it.protein_g ?? '?'}g P · ${it.calories ?? '?'} kcal`)
    .join('\n');
}

function buildSummaryMd(results: Array<{ photo: string; runs: VariantResult[] }>): string {
  const lines: string[] = [
    '# Multi-item Prompt Evaluation — Summary',
    '',
    `Photos: ${results.length} · Variants: ${VARIANTS.join(', ')} · Provider: ${PROVIDER} · Model: ${GEMINI_MODEL}`,
    '',
    '---',
    '',
    '## Grading rubric (fill in your scores per row, 1-5 each)',
    '',
    '1. **Item count correct** — right number of items?',
    '2. **Item names correct** — did it name what is actually there?',
    '3. **Macros within ±20%** of your expected values',
    '4. **Confidence calibrated** — low-conf items are the ambiguous ones?',
    '5. **No phantom items** — did NOT invent items',
    '',
    'Max per (photo, variant) = 25. Highest total wins.',
    '',
    '---',
    '',
  ];

  for (const { photo, runs } of results) {
    lines.push(`## ${photo}`, '');
    for (const r of runs) {
      lines.push(`### Variant ${r.variant}  (${r.latency_ms}ms, ${r.item_count ?? '?'} items${r.parse_error ? `, PARSE ERROR: ${r.parse_error}` : ''})`, '');
      lines.push('```');
      lines.push(fmtItems(r.parsed));
      lines.push('```');
      lines.push('');
      lines.push('| Item count | Item names | Macros | Confidence | No phantoms | Total |');
      lines.push('|---|---|---|---|---|---|');
      lines.push('|  /5 |  /5 |  /5 |  /5 |  /5 |  /25 |');
      lines.push('');
    }
    lines.push('---', '');
  }

  lines.push('## Variant totals (fill in after grading)', '');
  lines.push('| Variant | Total / ' + (results.length * 25) + ' |');
  lines.push('|---|---|');
  for (const v of VARIANTS) lines.push(`| ${v} |  |`);
  lines.push('');
  lines.push('Winner is the highest total. Ties broken by latency and token cost.', '');

  return lines.join('\n');
}

function buildSummaryCsv(results: Array<{ photo: string; runs: VariantResult[] }>): string {
  const rows: string[] = ['photo,variant,latency_ms,item_count,parse_error'];
  for (const { photo, runs } of results) {
    for (const r of runs) {
      rows.push(
        [
          photo,
          r.variant,
          String(r.latency_ms),
          String(r.item_count ?? ''),
          (r.parse_error ?? '').replace(/[\n,]/g, ' '),
        ].join(','),
      );
    }
  }
  return rows.join('\n');
}

// ---------------------------------------------------------------
// Main
// ---------------------------------------------------------------
async function main() {
  console.log(`Eval setup:`);
  console.log(`  variants:  ${VARIANTS.join(', ')}`);
  console.log(`  provider:  ${PROVIDER}`);
  console.log(`  model:     ${PROVIDER === 'bedrock' ? BEDROCK_MODEL_ID : GEMINI_MODEL}`);
  console.log(`  photos:    ${PHOTOS_DIR}`);
  console.log(`  output:    ${OUTPUT_DIR}`);
  console.log('');

  try {
    await stat(PHOTOS_DIR);
  } catch {
    console.error(`Photos dir not found: ${PHOTOS_DIR}`);
    console.error(`Create it and add 5-15 test photos. See README.md for what to include.`);
    process.exit(1);
  }

  const photos = await listPhotos(PHOTOS_DIR);
  if (photos.length === 0) {
    console.error(`No photos in ${PHOTOS_DIR}. Add some .jpg/.png files first.`);
    process.exit(1);
  }
  console.log(`Found ${photos.length} photo(s): ${photos.join(', ')}\n`);

  await mkdir(OUTPUT_DIR, { recursive: true });

  const results: Array<{ photo: string; runs: VariantResult[] }> = [];

  for (const file of photos) {
    const path = join(PHOTOS_DIR, file);
    const ext = extname(file);
    const stem = basename(file, ext);
    const mime = mimeFromExt(ext);
    const buffer = await readFile(path);
    console.log(`\n📷 ${file} (${(buffer.length / 1024).toFixed(1)} KB, ${mime})`);

    const runs: VariantResult[] = [];
    for (const v of VARIANTS) {
      const runner = RUNNERS[v];
      if (!runner) {
        console.warn(`   unknown variant: ${v}`);
        continue;
      }
      process.stdout.write(`   variant ${v}: `);
      try {
        const r = await runner(buffer, mime);
        runs.push(r);
        console.log(`${r.latency_ms}ms · ${r.item_count ?? '?'} items${r.parse_error ? ' ❌ parse' : ' ✓'}`);
        await writeFile(
          join(OUTPUT_DIR, `${stem}.${v}.json`),
          JSON.stringify(
            {
              photo: file,
              variant: v,
              latency_ms: r.latency_ms,
              item_count: r.item_count,
              parsed: r.parsed,
              parse_error: r.parse_error,
              raw_text: r.raw_text,
            },
            null,
            2,
          ),
        );
      } catch (e) {
        console.log(`ERROR: ${(e as Error).message}`);
        runs.push({
          variant: v,
          latency_ms: 0,
          raw_text: `ERROR: ${(e as Error).message}`,
          parse_error: 'request_failed',
        });
      }
    }
    results.push({ photo: file, runs });
  }

  // Summary
  await writeFile(join(OUTPUT_DIR, 'summary.md'), buildSummaryMd(results));
  await writeFile(join(OUTPUT_DIR, 'summary.csv'), buildSummaryCsv(results));

  console.log('\n✅ Done.');
  console.log(`   ${results.length} photos × ${VARIANTS.length} variants = ${results.length * VARIANTS.length} runs`);
  console.log(`   Open: ${OUTPUT_DIR}/summary.md`);
  console.log(`   Open: ${OUTPUT_DIR}/summary.csv`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
