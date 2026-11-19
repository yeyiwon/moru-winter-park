import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {releaseServiceWorker,stampReleaseHTML} from '../scripts/production-assets.mjs';
const source=fs.readFileSync('dist/sw.js','utf8'),files={'/index.html':'<head></head>','/app.js':'export const version=46;','/brand/logo.svg':'<svg/>','/lazy-example.js':'export const lazy=true;'};
const worker=releaseServiceWorker(source,files),cacheName=worker.match(/const CACHE='([^']+)'/)[1],html=stampReleaseHTML(files['/index.html'],worker);
async function install({staleJS=false,staleHTML=false}={}){
 const events={},saved=new Map(),deleted=[];
 vm.runInNewContext(worker,{self:{location:{href:'https://winter.test/sw.js',origin:'https://winter.test'},addEventListener:(name,handler)=>events[name]=handler},URL,Request,Response,crypto,caches:{open:async()=>({put:async(req,r)=>saved.set(req.url,await r.text())}),delete:async key=>deleted.push(key)},fetch:async request=>{const p=new URL(request.url).pathname;return new Response(p==='/'||p==='/index.html'?(staleHTML?'<head></head>':html+'<script>/* provider injection */</script>'):p==='/app.js'?(staleJS?'old code':files[p]):files[p]||'asset');}});
 let task;events.install({waitUntil:p=>task=p});return{task,saved,deleted};
}
test('release id follows app code, HTML and branding without including release metadata',()=>{
 for(const name of Object.keys(files))assert.notEqual(releaseServiceWorker(source,{...files,[name]:files[name]+'changed'}).match(/const CACHE='([^']+)'/)[1],cacheName);
 assert.equal(releaseServiceWorker(source,{...files,'/release.json':'revision'}),worker);
 assert.equal(releaseServiceWorker(source,{...files,'/brand/README.md':'authoring notes'}),worker);
});
test('cache accepts injected provider HTML carrying the same release stamp',async()=>{const r=await install();await r.task;assert.equal(r.saved.get('https://winter.test/app.js'),files['/app.js']);assert.equal(r.saved.get('https://winter.test/lazy-example.js'),files['/lazy-example.js']);assert.equal(r.deleted.length,0);});
test('a release swap mid-install discards the partial cache',async()=>{for(const change of [{staleJS:true},{staleHTML:true}]){const r=await install(change);await assert.rejects(r.task,/release changed|Release changed/);assert.deepEqual(r.deleted,[cacheName]);}});
