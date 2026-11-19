import test from 'node:test';
import assert from 'node:assert/strict';
import {assetResponse} from '../server/static-response.js';
import {proxyRequest,backendOrigin} from '../server/vercel-proxy.js';
import {createRenderBudget} from '../dist/render-budget.js';
import {createLabelLayout} from '../dist/world-labels.js';
import {JSDOM} from 'jsdom';
import {createAudioEngine} from '../dist/audio-engine.js';
import {mockAudio} from './audio-context.mjs';
import {createFrameMetrics} from '../dist/frame-metrics.js';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
test('precache supports versioned CSS and modules offline before an online cache hit',async()=>{
 const handlers={},entries=new Map(),origin='https://park.test/',cache={match:async request=>entries.get(request.url)?.clone(),addAll:async paths=>{for(const path of paths)entries.set(new URL(path,origin).href,new Response(path));}};
 const context={URL,Request,Response,Promise,Set,fetch:async()=>{throw Error('offline');},self:{location:{href:origin+'sw.js',origin:new URL(origin).origin},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>{}},caches:{open:async()=>cache,match:async request=>entries.get(request.url)?.clone()}};
 vm.runInNewContext(await readFile(new URL('../dist/sw.js',import.meta.url),'utf8'),context);let pending;handlers.install({waitUntil:p=>pending=p});await pending;
 for(const path of ['style.css?v=winter27','glass.css?v=winter27','navigation-worker.js','park.js?winter30']){handlers.fetch({request:new Request(origin+path),respondWith:p=>pending=p});const response=await pending;assert.equal(response.status,200,path);}
 assert.equal([...entries.keys()].filter(url=>url.includes('?')).length,0);
});
test('unchanged static files return a bodyless 304; changed files and byte ranges still work',async()=>{
 const asset={body:'export default 1;',type:'text/javascript',etag:'"abc123"'};
 for(const tag of ['"abc123"','W/"abc123"','"different", "abc123"','*']){const response=assetResponse(new Request('https://local/app.js',{headers:{'If-None-Match':tag}}),asset);assert.equal(response.status,304);assert.equal(await response.text(),'');assert.equal(response.headers.get('ETag'),asset.etag);}
 assert.equal(assetResponse(new Request('https://local/app.js',{headers:{'If-None-Match':'"different"'}}),asset).status,200);
});
test('the tree revision passes through Vercel without forwarding arbitrary room or identity queries',async()=>{
 let target;await proxyRequest(new Request('https://park.test/api/proxy?route=tree&revision='+ 'a'.repeat(24)+'&room=foreign&admin=true'),async url=>{target=url;return Response.json({unchanged:true});});assert.equal(target,backendOrigin+'/api/tree?revision='+ 'a'.repeat(24));
 await proxyRequest(new Request('https://park.test/api/tree?revision=bad'),async url=>{target=url;return Response.json({});});assert.equal(target,backendOrigin+'/api/tree');
});
test('sustained sub-10 FPS triggers bounded adaptive quality instead of being discarded as a pause',()=>{
 const budget=createRenderBudget({pixelRatio:2});let now=1;for(let i=0;i<150;i++){now+=180;budget.sample(180,now);}assert.ok(budget.settings.pixelRatio<1);assert.equal(budget.settings.shadowSize,512);budget.setMode('high');assert.equal(budget.settings.shadowSize,2048);
});
test('label projection reuses measurements until text or viewport changes',()=>{
 const dom=new JSDOM('<div id="label"><b>A</b><div class="speech-bubble" hidden></div></div>'),label=dom.window.document.querySelector('#label');let reads=0;label.getBoundingClientRect=()=>{reads++;return{left:100,right:140,top:80,bottom:100,width:40,height:20};};const layout=createLabelLayout(label);assert.deepEqual(layout.bounds(200,150),{left:180,right:220,top:130,bottom:150});layout.bounds(210,150);assert.equal(reads,1);label.querySelector('b').textContent='Longer';layout.bounds(210,150);assert.equal(reads,2);layout.dispose();dom.window.close();
});
test('audio media registration is idempotent and disposal stops active loops and event handlers',()=>{
 const dom=new JSDOM('',{url:'https://local.test'}),mock=mockAudio();dom.window.AudioContext=mock.Audio;Object.defineProperty(dom.window.document,'hidden',{value:false});const engine=createAudioEngine(dom.window);engine.unlock();const audio=dom.window.document.createElement('audio');audio.pause=()=>{};const first=engine.registerMedia(audio);assert.equal(engine.registerMedia(audio),first);engine.ski({active:true,speed:20});assert.ok(mock.sources.some(s=>s.loop&&!s.stopped));engine.dispose();engine.dispose();assert.equal(mock.sources.filter(s=>s.loop&&!s.stopped).length,0);assert.equal(engine.unlock(),false);assert.equal(dom.window.labAudio,null);dom.window.close();
});

test('inactive diagnostics never poll GPU status without a pending query',()=>{
 const gl={getExtension:()=>({}),getParameter:()=>assert.fail('unexpected GPU polling')},renderer={getContext:()=>gl,info:{memory:{}},getPixelRatio:()=>1},metrics=createFrameMetrics(renderer);for(let i=0;i<120;i++){metrics.begin();metrics.end(16.7,i*16.7);}metrics.dispose();
});

test('diagnostics collect ten seconds of game frames rather than time spent in paused menus',()=>{
 const renderer={getContext:()=>({getExtension:()=>null}),info:{memory:{},render:{calls:10,triangles:100}},getPixelRatio:()=>1},metrics=createFrameMetrics(renderer);metrics.start();
 for(let i=0;i<499;i++){metrics.begin();assert.equal(metrics.end(20,100000+i*1000),null);}
 metrics.begin();const result=metrics.end(20,999999);assert.equal(result.frames,500);assert.equal(result.fps,50);metrics.dispose();
});
