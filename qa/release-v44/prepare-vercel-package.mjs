// Read-only source snapshot -> isolated, reproducible Vercel API input.
// No deployment, credential access, source edits, or git writes occur here.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const workspace = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = await fs.realpath(process.argv[2] || '/workspace/scratch/0a4faa9934dc/release-sites/.sites-checkout');
const sourceCommit = process.argv[3];
const priorManifestPath = process.argv[4] || path.join(sourceRoot, 'qa/brand-v46/vercel-source-manifest.json');
if (!/^[a-f0-9]{40}$/.test(sourceCommit || '')) throw Error('Pass the verified 40-character source commit as the second argument');
if (workspace === sourceRoot || workspace.startsWith(sourceRoot + path.sep)) throw Error('Staging must be outside the source checkout');
const baselineCommit = '46dc3223bed447ed0eba80aa1a6b83fd09975769';
const baselineOrigin = `https://raw.githubusercontent.com/yeyiwon/moru-winter-park/${baselineCommit}`;
const priorManifest = JSON.parse(await fs.readFile(priorManifestPath, 'utf8'));
if (priorManifest.baselineCommit !== baselineCommit || priorManifest.baselineOrigin !== baselineOrigin) throw Error('Unexpected saved baseline');
const baseline = new Map(priorManifest.files.filter(file => file.source === 'baseline').map(file => [file.file, file]));
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
const paths = new Set(['.vercelignore', 'package.json', 'package-lock.json', 'vercel.json', 'api/proxy.js', 'server/vercel-proxy.js']);
const bodies = new Map();
function safePath(file) {
  if (!/^[A-Za-z0-9_.@/-]+$/.test(file) || path.isAbsolute(file) || file.split('/').some(part => !part || part === '.' || part === '..')) throw Error(`Unsafe source path: ${file}`);
  if (file !== '.vercelignore' && file.split('/').some(part => part.startsWith('.'))) throw Error(`Unexpected hidden source path: ${file}`);
  return path.join(sourceRoot, file);
}
async function read(file) {
  if (bodies.has(file)) return bodies.get(file);
  const target = safePath(file), stat = await fs.lstat(target);
  if (!stat.isFile() || stat.isSymbolicLink()) throw Error(`Source must be a regular file: ${file}`);
  if (await fs.realpath(target) !== target) throw Error(`Source ancestors must not be symbolic links: ${file}`);
  const body = await fs.readFile(target);
  const committed = execFileSync('git', ['show', `${sourceCommit}:${file}`], { cwd: sourceRoot, maxBuffer: 64 * 1024 * 1024 });
  if (!body.equals(committed)) throw Error(`Working source differs from the verified commit: ${file}`);
  bodies.set(file, body);return body;
}
async function walk(directory) {
  for (const entry of await fs.readdir(path.join(sourceRoot, directory), { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['qa-local', 'server', 'node_modules', 'web-dist'].includes(entry.name)) continue;
    const relative = `${directory}/${entry.name}`;
    if (entry.isSymbolicLink()) throw Error(`Source asset is a symbolic link: ${relative}`);
    if (entry.isDirectory()) await walk(relative);
    else if (entry.isFile()) paths.add(relative);
  }
}
await walk('dist');await walk('api');
const pkg = JSON.parse((await read('package.json')).toString('utf8'));
const build = pkg.scripts?.['build:vercel'];
if (typeof build !== 'string') throw Error('Missing build:vercel script');
for (const match of build.matchAll(/\bnode\s+(scripts\/[A-Za-z0-9_./-]+\.mjs)\b/g)) paths.add(match[1]);
const pending = [...paths].filter(file => /\.(?:mjs|js)$/.test(file));
const visited = new Set();
while (pending.length) {
  const file = pending.shift();if (visited.has(file)) continue;visited.add(file);
  const body = (await read(file)).toString('utf8');
  const imports = [...body.matchAll(/(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"](\.{1,2}\/[^'"]+)['"]/g), ...body.matchAll(/import\s*\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g)];
  for (const match of imports) {
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1].split(/[?#]/,1)[0]));
    safePath(target);if (!paths.has(target)) paths.add(target);
    if (/\.(?:mjs|js)$/.test(target) && !visited.has(target)) pending.push(target);
  }
}
const files = [];
for (const file of [...paths].sort()) {
  const body = await read(file), size = body.length, sha256 = hash(body), saved = baseline.get(file);
  const source = saved && saved.size === size && saved.sha256 === sha256 ? 'baseline' : 'inline';
  files.push({file, size, sha256, source});
}
// Recheck source bytes at the snapshot boundary to detect concurrent edits.
for (const file of files) if (!(await fs.readFile(safePath(file.file))).equals(bodies.get(file.file))) throw Error(`Source changed during packaging: ${file.file}`);
const originalConfig = JSON.parse(bodies.get('vercel.json').toString('utf8'));
if (originalConfig.buildCommand !== 'npm run build:vercel' || originalConfig.outputDirectory !== 'web-dist') throw Error('Review changed Vercel build settings before packaging');
const sourceTreeSha256 = hash(JSON.stringify(files.map(({file, size, sha256}) => ({file, size, sha256}))));
const inputSetSha256 = hash(JSON.stringify(files));
const manifest = {schemaVersion:2, sourceCommit, sourceTreeSha256, inputSetSha256, baselineCommit, baselineOrigin, expectedVercelConfig:originalConfig, files};
const folder = path.join(workspace, 'packages', `${sourceCommit.slice(0,12)}-${sourceTreeSha256.slice(0,12)}`);
await fs.mkdir(path.dirname(folder), {recursive:true});
await fs.mkdir(folder); // Never overwrite a prepared package.
const write = async(file, body) => {await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,body,{flag:'wx'});};
const snapshot = path.join(folder, 'source-snapshot'), payload = path.join(folder, 'deployment-files');
for (const file of files) {
  await write(path.join(snapshot,file.file),bodies.get(file.file));
  if (file.source==='inline' && file.file!=='vercel.json') await write(path.join(payload,file.file),bodies.get(file.file));
}
const packagedConfig = {...originalConfig,buildCommand:`node scripts/restore-release-source.mjs && ${originalConfig.buildCommand}`};
await write(path.join(payload,'vercel.json'),JSON.stringify(packagedConfig,null,2)+'\n');
await write(path.join(payload,'release-source-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const template = await fs.readFile(path.join(workspace,'restore-release-source.template.mjs'),'utf8');
const restore = template.replace('__EXPECTED_INPUT_SET__',inputSetSha256).replace('__EXPECTED_COUNT__',String(files.length)).replace('__BASELINE_COMMIT__',baselineCommit);
await write(path.join(payload,'scripts/restore-release-source.mjs'),restore);
const payloadPaths = [...files.filter(file=>file.source==='inline').map(file=>file.file),'release-source-manifest.json','scripts/restore-release-source.mjs'].sort();
const uploadFiles = [];
for (const file of payloadPaths) uploadFiles.push({file,data:(await fs.readFile(path.join(payload,file))).toString('base64'),encoding:'base64'});
const request = {teamId:'team_PrxOY6C87yIECNDLhgcoMYdz',requestBody:{name:'moru-winter-park',project:'prj_mbioBXlMSNwfJ8MWNaRMi2Lsm8I0',target:'production',files:uploadFiles,meta:{releaseSourceCommit:sourceCommit,releaseSourceTree:sourceTreeSha256}}};
await write(path.join(folder,'create-deployment-request.json'),JSON.stringify(request));
await write(path.join(folder,'release-source-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const outputFiles=[];
async function outputWalk(directory, prefix='') {
  for (const entry of await fs.readdir(directory,{withFileTypes:true})) {
    const file=path.join(directory,entry.name),relative=prefix+entry.name;
    if(entry.isSymbolicLink())throw Error(`Unexpected output link: ${relative}`);
    if(entry.isDirectory())await outputWalk(file,relative+'/');
    else {const body=await fs.readFile(file);outputFiles.push({file:relative,size:body.length,sha256:hash(body)});}
  }
}
await outputWalk(path.join(sourceRoot,'web-dist'));outputFiles.sort((a,b)=>a.file.localeCompare(b.file));
await write(path.join(folder,'expected-web-output.json'),JSON.stringify({sourceCommit,files:outputFiles},null,2)+'\n');
const summary = {sourceRoot,sourceCommit,sourceTreeSha256,package:folder,manifest:path.join(folder,'release-source-manifest.json'),request:path.join(folder,'create-deployment-request.json'),inputCount:files.length,baselineCount:files.filter(file=>file.source==='baseline').length,inlineSourceCount:files.filter(file=>file.source==='inline').length,payloadCount:uploadFiles.length,payloadBytes:Buffer.byteLength(JSON.stringify(request)),expectedOutputCount:outputFiles.length,validation:'pending',deployment:'not invoked'};
await write(path.join(folder,'summary.json'),JSON.stringify(summary,null,2)+'\n');
await fs.writeFile(path.join(workspace,'latest-preparation.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
