// Deployment packaging adapter: restore unchanged public source at a pinned
// commit, then verify all approved inputs before running the ordinary build.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

const manifest = JSON.parse(await fs.readFile('release-source-manifest.json', 'utf8'));
if (!/^[a-f0-9]{40}$/.test(manifest.baselineCommit)) throw new Error('Invalid baseline commit');
if (manifest.baselineOrigin !== `https://raw.githubusercontent.com/yeyiwon/moru-winter-park/${manifest.baselineCommit}`) throw new Error('Unexpected source origin');
const digest = data => createHash('sha256').update(data).digest('hex');
const files = manifest.files;
if (files.length !== 228 || new Set(files.map(f => f.file)).size !== files.length) throw new Error('Unexpected source manifest');
for (const file of files) {
  if (!file.file || path.isAbsolute(file.file) || file.file.includes('\\') || file.file.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Unsafe source path');
  if (!['inline', 'baseline'].includes(file.source) || !/^[a-f0-9]{64}$/.test(file.sha256)) throw new Error('Invalid source entry');
}
const baseline = files.filter(f => f.source === 'baseline');
let next = 0;
let restored = 0;
async function restore(file) {
  let error;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`${manifest.baselineOrigin}/${file.file}`, { redirect: 'error', signal: AbortSignal.timeout(25000) });
      if (!response.ok) throw new Error(`Source HTTP ${response.status}: ${file.file}`);
      const body = Buffer.from(await response.arrayBuffer());
      if (body.length !== file.size || digest(body) !== file.sha256) throw new Error(`Source hash mismatch: ${file.file}`);
      await fs.mkdir(path.dirname(file.file), { recursive: true });
      await fs.writeFile(file.file, body);
      restored++;
      if (restored % 40 === 0 || restored === baseline.length) console.log(`Restored ${restored}/${baseline.length} approved source files`);
      return;
    } catch (failure) { error = failure; }
  }
  throw error;
}
await Promise.all(Array.from({ length: 8 }, async () => {
  while (next < baseline.length) {
    const file = baseline[next++];
    await restore(file);
  }
}));
for (const file of files) {
  const body = await fs.readFile(file.file);
  if (file.file === 'vercel.json') {
    const expected = { ...manifest.expectedVercelConfig, buildCommand: 'node scripts/restore-release-source.mjs && npm run build:vercel' };
    const actual = JSON.parse(body.toString('utf8'));
    // Vercel adds the existing project name while preparing the build.
    // Accept only that exact value; every routing/runtime setting stays exact.
    if (Object.hasOwn(actual, 'name')) {
      if (actual.name !== 'moru-winter-park') throw new Error('Unexpected deployment project name');
      delete actual.name;
    }
    if (!isDeepStrictEqual(actual, expected)) {
      const keys = [...new Set([...Object.keys(actual), ...Object.keys(expected)])].filter(key => !isDeepStrictEqual(actual[key], expected[key]));
      const publicKeys = new Set(['$schema', 'framework', 'buildCommand', 'outputDirectory', 'regions', 'rewrites', 'redirects', 'headers', 'crons', 'version']);
      const differences = keys.map(key => publicKeys.has(key) ? { key, actual: actual[key], expected: expected[key] } : { key, unexpectedSetting: true });
      throw new Error(`Deployment settings differ from approved settings: ${JSON.stringify(differences)}`);
    }
  } else if (body.length !== file.size || digest(body) !== file.sha256) {
    throw new Error(`Approved source verification failed: ${file.file}`);
  }
}
console.log(`Verified ${files.length - 1} exact source files and unchanged runtime configuration for ${manifest.sourceCommit}`);
