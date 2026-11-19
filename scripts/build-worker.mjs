import {buildRevision} from './build-revision.mjs';
import fs from 'node:fs';import path from 'node:path';import {build} from 'esbuild';
import {productionAsset,releaseServiceWorker,stampReleaseHTML} from './production-assets.mjs';
import {createHash} from 'node:crypto';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.txt':'text/plain','.svg':'image/svg+xml','.ico':'image/x-icon','.mp3':'audio/mpeg','.m4a':'audio/mp4','.woff2':'font/woff2','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp'};const assets={};
function visit(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(entry.name==='server'||entry.name==='.openai')continue;const full=path.join(dir,entry.name);if(entry.isDirectory())visit(full);else{const type=types[path.extname(full)];if(type)assets['/'+path.relative('dist',full).split(path.sep).join('/')]={type,binary:['.m4a','.mp3','.woff2','.jpg','.jpeg','.png','.webp','.ico'].includes(path.extname(full)),body:fs.readFileSync(full,['.m4a','.mp3','.woff2','.jpg','.jpeg','.png','.webp','.ico'].includes(path.extname(full))?'base64':'utf8')};}}}
visit('dist');
for(const [name,asset]of Object.entries(assets))if(!asset.binary&&name!=='/sw.js')asset.body=productionAsset(asset.body,path.extname(name));
assets['/sw.js'].body=releaseServiceWorker(assets['/sw.js'].body,Object.fromEntries(Object.entries(assets).filter(([name])=>!(/\.(m4a|mp3)$/.test(name))).map(([name,a])=>[name,a.binary?Buffer.from(a.body,'base64'):a.body])));
assets['/index.html'].body=stampReleaseHTML(assets['/index.html'].body,assets['/sw.js'].body);
for(const [name,asset]of Object.entries(assets)){if(name==='/sw.js')asset.body=productionAsset(asset.body,path.extname(name));asset.etag='"'+createHash('sha256').update(asset.body).digest('hex').slice(0,24)+'"';}fs.mkdirSync('.winter-build',{recursive:true});fs.writeFileSync('.winter-build/assets.js','export default '+JSON.stringify(assets)+';');
await build({entryPoints:['server/worker.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/server/index.js',minify:true,define:{__WINTER_REVISION__:JSON.stringify(buildRevision())}});
fs.mkdirSync('dist/.openai',{recursive:true});fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');fs.cpSync('drizzle','dist/.openai/drizzle',{recursive:true});console.log('Built worker with '+Object.keys(assets).length+' static assets.');
