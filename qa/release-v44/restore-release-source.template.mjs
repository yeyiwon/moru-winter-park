// Generated deployment adapter. This operates only on the file-based package;
// it refuses to overwrite any existing file with different contents.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

const expectedInputSet = '__EXPECTED_INPUT_SET__';
const expectedCount = __EXPECTED_COUNT__;
const baselineCommit = '__BASELINE_COMMIT__';
const baselineOrigin = `https://raw.githubusercontent.com/yeyiwon/moru-winter-park/${baselineCommit}`;
const sourceRoot = await fs.realpath('.');
const digest = data => createHash('sha256').update(data).digest('hex');
const manifest = JSON.parse(await fs.readFile('release-source-manifest.json', 'utf8'));
if (manifest.schemaVersion !== 2 || manifest.baselineCommit !== baselineCommit || manifest.baselineOrigin !== baselineOrigin) throw Error('Unexpected release source origin');
if (!Array.isArray(manifest.files) || manifest.files.length !== expectedCount) throw Error('Unexpected source file count');
const files = manifest.files;
if (new Set(files.map(file => file.file)).size !== files.length) throw Error('Duplicate source path');
function safePath(file) {
  if (typeof file !== 'string' || !/^[A-Za-z0-9_.@/-]+$/.test(file) || path.isAbsolute(file) || file.includes('\\') || file.split('/').some(part => !part || part === '.' || part === '..')) throw Error('Unsafe source path');
  if (file !== '.vercelignore' && file.split('/').some(part => part.startsWith('.'))) throw Error('Unexpected hidden source path');
  if (file.split('/').some(part => ['node_modules', 'web-dist', 'qa', 'qa-local'].includes(part))) throw Error('Unexpected generated source path');
  return path.join(sourceRoot, file);
}
for (const file of files) {
  safePath(file.file);
  if (!['inline', 'baseline'].includes(file.source) || !Number.isSafeInteger(file.size) || file.size < 0 || !/^[a-f0-9]{64}$/.test(file.sha256)) throw Error('Invalid source record');
}
const fingerprint = digest(JSON.stringify(files.map(({file, size, sha256, source}) => ({file, size, sha256, source}))));
if (fingerprint !== expectedInputSet || manifest.inputSetSha256 !== expectedInputSet) throw Error('Source manifest differs from the prepared package');
if (!/^[a-f0-9]{40}$/.test(manifest.sourceCommit)) throw Error('Missing verified source commit');

async function safeExisting(file) {
  const parts = file.split('/');
  let current = sourceRoot;
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part);
    let stat;
    try { stat = await fs.lstat(current); } catch (error) { if (error.code === 'ENOENT') return false; throw error; }
    if (stat.isSymbolicLink()) throw Error(`Source path is a symbolic link: ${file}`);
    if (index < parts.length - 1 ? !stat.isDirectory() : !stat.isFile()) throw Error(`Unexpected source path type: ${file}`);
  }
  return true;
}
function verifyConfig(body) {
  const expected = { ...manifest.expectedVercelConfig, buildCommand: `node scripts/restore-release-source.mjs && ${manifest.expectedVercelConfig.buildCommand}` };
  const actual = JSON.parse(body.toString('utf8'));
  if (Object.hasOwn(actual, 'name')) {
    if (actual.name !== 'moru-winter-park') throw Error('Unexpected deployment project name');
    delete actual.name;
  }
  if (!isDeepStrictEqual(actual, expected)) throw Error('Deployment settings differ from the verified source settings');
}
async function verifyFile(file) {
  const body = await fs.readFile(safePath(file.file));
  if (file.file === 'vercel.json') verifyConfig(body);
  else if (body.length !== file.size || digest(body) !== file.sha256) throw Error(`Approved source verification failed: ${file.file}`);
}

// Verify all provided files before the first write/network request. If this is
// accidentally run in a working tree, differing existing files are not replaced.
const missing = [];
for (const file of files) {
  if (await safeExisting(file.file)) await verifyFile(file);
  else if (file.source === 'baseline') missing.push(file);
  else throw Error(`Missing inline source: ${file.file}`);
}
let next = 0, restored = 0;
async function restore(file) {
  let failure;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`${baselineOrigin}/${file.file}`, { redirect: 'error', signal: AbortSignal.timeout(25000) });
      if (!response.ok) throw Error(`Source HTTP ${response.status}: ${file.file}`);
      const body = Buffer.from(await response.arrayBuffer());
      if (body.length !== file.size || digest(body) !== file.sha256) throw Error(`Source hash mismatch: ${file.file}`);
      const destination = safePath(file.file);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      // Recheck ancestors after mkdir. Never follow a symlink or overwrite a
      // file created by another process after preflight.
      if (await safeExisting(file.file)) {
        await verifyFile(file);
      } else {
        let ancestor = sourceRoot;
        for (const part of file.file.split('/').slice(0, -1)) {
          ancestor = path.join(ancestor, part);
          const stat = await fs.lstat(ancestor);
          if (!stat.isDirectory() || stat.isSymbolicLink()) throw Error(`Unsafe source directory: ${file.file}`);
        }
        await fs.writeFile(destination, body, { flag: 'wx' });
      }
      restored++;
      if (restored % 40 === 0 || restored === missing.length) console.log(`Restored ${restored}/${missing.length} pinned source files`);
      return;
    } catch (error) { failure = error; }
  }
  throw failure;
}
await Promise.all(Array.from({ length: Math.min(8, missing.length) }, async () => {
  while (next < missing.length) await restore(missing[next++]);
}));
for (const file of files) await verifyFile(file);
console.log(`Verified ${files.length - 1} exact source files and unchanged runtime settings for ${manifest.sourceCommit}; fetched ${missing.length} missing baseline files`);
