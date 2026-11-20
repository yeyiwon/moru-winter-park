import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {createFireworkScore,fireworkPatterns,fireworkConfig} from '../dist/firework-score.js';
import {createWinterFireworks} from '../dist/winter-fireworks.js';
import {encodeActivity,decodeActivity,activityGestures} from '../dist/activity-state.js';
import {sparklerEntrance} from '../dist/park-layout.js';import {canStandAt} from '../dist/movement.js';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {JSDOM} from 'jsdom';
import {createLocalDatabase} from '../scripts/local-database.mjs';
import {fireworksAPI,readFireworkShow} from '../server/fireworks.js';
import {showTrack} from '../dist/show-tracks.js';
import {fireworkRequestState,mergeFireworkShow,installFireworkRequests} from '../dist/fireworks-request.js';
test('seeded show has five distinct patterns, overlaps, depth and a bounded final fade',()=>{
 const score=createFireworkScore(42);assert.deepEqual(score,createFireworkScore(42));assert.notDeepEqual(score,createFireworkScore(43));assert.deepEqual([...new Set(score.map(s=>s.pattern))].sort(),fireworkPatterns.slice(0,6).sort());assert.ok(score.every(s=>s.at+s.flight+s.life<fireworkConfig.duration));assert.ok(new Set(score.map(s=>s.z)).size>10);assert.ok(score.some((s,i)=>i&&s.at-score[i-1].at<1));assert.equal(fireworkConfig.auto,false);
});
test('show uses fixed buffers, late-join clock, lower mobile density and clears the draw at finish',()=>{
 const scene=new T.Scene(),show=createWinterFireworks(scene),state={id:'test',startsAt:1000,seed:42,state:'playing'};show.setShow(state);show.update(31000);assert.equal(show.root.material.uniforms.clock.value,30);assert.equal(show.root.visible,true);const buffer=show.root.geometry.attributes.position.array,full=show.root.geometry.drawRange.count;assert.ok([...buffer].every(Number.isFinite));
 show.setQuality('low');show.update(32000);assert.ok(show.root.geometry.drawRange.count<full);assert.equal(show.root.geometry.attributes.position.array,buffer);show.update(33000,{interior:true});assert.equal(show.root.visible,false);assert.equal(show.root.geometry.drawRange.count,0);show.update(100000);assert.equal(show.active,false);show.setShow({...state,state:'stopped'});show.update(4000);assert.equal(show.root.visible,false);show.dispose();assert.equal(scene.children.length,0);
});
test('sparkler activity synchronizes as an item and the unchanged kiosk entrance is walkable',()=>{
 assert.ok(activityGestures.includes('sparkler-carry'));assert.equal(encodeActivity({heldItem:'sparkler'}),'sparkler-carry');assert.deepEqual(decodeActivity('sparkler-carry'),{heldItem:'sparkler',gesture:''});assert.ok(canStandAt(sparklerEntrance.x,sparklerEntrance.z));
});
test('firework lighting reuses the world light with bounded pulses and respects reduced flashing',()=>{
 const scene=new T.Scene(),light=new T.DirectionalLight('#eef5ff',.8);scene.add(light);
 const show=createWinterFireworks(scene,{light}),first=createFireworkScore(42)[0],now=1000+(first.at+first.flight+.16)*1000;
 show.setShow({id:'light-test',startsAt:1000,seed:42,state:'playing'});
 const listener=new T.Vector3(first.x,first.y+first.height,first.z);
 show.update(now,{listener});assert.ok(light.intensity>.8&&light.intensity<=1.18);assert.equal(scene.children.filter(o=>o.isLight).length,1);
 // The world resets its ambient lighting every frame before the show adds a pulse.
 light.intensity=.8;light.color.set('#eef5ff');const color=light.color.clone();show.update(now+10,{listener,reduceFlash:true});
 assert.equal(light.intensity,.8);assert.ok(light.color.equals(color));show.dispose();assert.equal(scene.children.length,1);
});


test('embers finish in the sky with short tapered tails instead of long vertical rain',()=>{
 const score=createFireworkScore(42);assert.ok(score.every(s=>s.life<=5.6));assert.ok(score.filter(s=>s.pattern!=='willow').every(s=>s.life<=4.2));
 const scene=new T.Scene(),show=createWinterFireworks(scene);show.setShow({id:'tail-test',seed:42,startsAt:0,state:'playing'});
 const {position,velocity,timing,design}=show.root.geometry.attributes;
 let sampled=0;
 for(let age=0;age<74;age+=.5){show.update(age*1000);const count=show.root.geometry.drawRange.count;
  assert.ok(count<=position.count,'fixed pool must contain every live shell');
  for(let i=0;i<count;i+=10){const t=design.getZ(i),willow=design.getX(i)===2,drag=willow?.28:.48;
   const height=position.getY(i)+velocity.getY(i)*(1-Math.exp(-t*drag))/drag-(willow?1:1.6)*t*t;
   assert.ok(height>10,'embers must extinguish before descending into the park');assert.ok(t<=5.601);sampled++;
  }
 }
 assert.ok(sampled>10000);
 show.dispose();
});

async function fireworkFixture(t){
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'winter-fireworks-'));
 const database=createLocalDatabase(path.join(folder,'test.sqlite'));
 t.after(()=>{database.close();fs.rmSync(folder,{recursive:true,force:true});});
 await database.query({schema:'CREATE TABLE world_settings(id TEXT PRIMARY KEY,payload TEXT NOT NULL,updated_at INTEGER NOT NULL); CREATE TABLE invite_attempts(id TEXT PRIMARY KEY,attempts INTEGER NOT NULL,reset_at INTEGER NOT NULL);'});
 const DB={prepare(sql){return {bind(...args){return {run:()=>database.query({sql,args}),all:()=>database.query({sql,args}),first:async()=>(await database.query({sql,args})).results[0]||null};}};}};
 const base=9000000000000;
 async function call(action,{id='guest-a',room='winter-plaza',admin=false,now=base,raw}={}){
  const response=await fireworksAPI(new Request('https://winter.test/api/fireworks',{method:action===undefined&&raw===undefined?'GET':'POST',body:raw??(action===undefined?undefined:JSON.stringify({action}))}),DB,{id,room},admin,now);
  return {status:response.status,headers:response.headers,data:await response.json()};
 }
 return {DB,call,base};
}

test('simultaneous guest requests claim one show and merge into its ten-second server countdown',async t=>{
 const {DB,call,base}=await fireworkFixture(t);
 const results=await Promise.all(Array.from({length:8},(_,i)=>call('request',{id:'guest-'+i})));
 assert.ok(results.every(r=>r.status===200));
 assert.equal(results.filter(r=>r.data.created).length,1);
 assert.equal(results.filter(r=>r.data.merged).length,7);
 assert.equal(new Set(results.map(r=>r.data.show.id)).size,1);
 const first=results[0].data.show;
 assert.equal(first.startsAt,base+10000);assert.equal(first.endsAt,first.startsAt+showTrack(first.musicId).duration*1000);
 assert.equal(first.nextRequestAt,first.endsAt+900000);
 assert.equal((await DB.prepare('SELECT COUNT(*) AS count FROM world_settings').bind().first()).count,1);
 const replay=await call('request',{now:base+1000});
 assert.equal(replay.data.show.id,first.id);assert.equal(replay.data.merged,true);
 const late=await call(undefined,{id:'late-guest',now:first.startsAt+20000});
 assert.equal(late.data.phase,'playing');assert.equal(late.data.show.startsAt,first.startsAt);
 assert.equal(late.data.show.seed,first.seed);assert.equal(late.data.serverTime,first.startsAt+20000);
 assert.deepEqual(late.data.show,await readFireworkShow(DB,first.startsAt+20000));
});

test('a show must finish and complete its cooldown before another guest can schedule a new one',async t=>{
 const {call}=await fireworkFixture(t),first=(await call('request')).data.show;
 const during=await call('request',{id:'guest-b',now:first.startsAt+12000});
 assert.equal(during.status,200);assert.equal(during.data.merged,true);assert.equal(during.data.show.id,first.id);
 const cooling=await call('request',{id:'guest-c',now:first.endsAt});
 assert.equal(cooling.status,429);assert.equal(cooling.data.phase,'cooldown');
 assert.equal(cooling.data.retryAfterMs,900000);assert.equal(cooling.headers.get('Retry-After'),'900');
 assert.equal((await call('request',{id:'guest-d',now:first.nextRequestAt-1})).status,429);
 const next=await call('request',{id:'guest-e',now:first.nextRequestAt});
 assert.equal(next.status,200);assert.equal(next.data.created,true);assert.notEqual(next.data.show.id,first.id);
 assert.equal(next.data.show.startsAt,first.nextRequestAt+10000);
});

test('owner cancellation is idempotent and cannot shorten or repeatedly extend the reserved cooldown',async t=>{
 const {call,base}=await fireworkFixture(t),first=(await call('request')).data.show;
 assert.equal((await call('stop',{now:base+1000})).status,403);
 const stopped=await call('stop',{id:'owner',admin:true,now:base+1000});
 assert.equal(stopped.status,200);assert.equal(stopped.data.show.state,'stopped');
 assert.equal(stopped.data.show.nextRequestAt,first.nextRequestAt);assert.equal(stopped.data.show.revision,2);
 const repeated=await call('stop',{id:'owner',admin:true,now:base+2000});
 assert.equal(repeated.data.show.stoppedAt,base+1000);assert.equal(repeated.data.show.revision,2);
 assert.equal(repeated.data.show.nextRequestAt,first.nextRequestAt);
 assert.equal((await call('request',{id:'guest-b',now:base+2000})).status,429);
 const override=await call('start',{id:'owner',admin:true,now:base+2000});assert.equal(override.status,200);assert.notEqual(override.data.show.id,first.id);
 assert.equal((await call('start',{id:'owner',admin:true,now:base+2001})).status,409);
 assert.equal((await call('request',{id:'guest-b',now:override.data.show.nextRequestAt})).status,200);
});

test('admin start keeps the same atomic cooldown and guests cannot use administrative actions or another room',async t=>{
 const {DB,call}=await fireworkFixture(t);
 for(const action of ['start','stop'])assert.equal((await call(action)).status,403);
 assert.equal((await call('request',{room:'another-room'})).status,403);
 for(const raw of ['null','{','{}'])assert.equal((await call(undefined,{raw})).status,400);
 assert.equal((await call(undefined,{raw:' '.repeat(129)})).status,413);
 assert.equal(await readFireworkShow(DB,9000000000000),null);
 const starts=await Promise.all([call('start',{admin:true}),call('start',{admin:true})]);
 assert.deepEqual(starts.map(r=>r.status).sort(),[200,409]);
});

test('request spam does not exclude other guests or prevent an owner from stopping the show',async t=>{
 const {call}=await fireworkFixture(t);
 for(let i=0;i<6;i++)assert.equal((await call('request')).status,200);
 assert.equal((await call('request')).status,429);
 assert.equal((await call('request',{id:'other-guest'})).status,200);
 const stop=await call('stop',{admin:true});assert.equal(stop.status,200);assert.equal(stop.data.show.state,'stopped');
});

test('legacy show records receive complete lifecycle timestamps without losing their seed or original start',async t=>{
 const {DB,call,base}=await fireworkFixture(t),old={id:'legacy',seed:17,startsAt:base-1000,state:'scheduled'};
 await DB.prepare('INSERT INTO world_settings(id,payload,updated_at) VALUES(?,?,?)').bind('fireworks',JSON.stringify(old),base-4000).run();
 const read=await call();assert.equal(read.data.show.id,'legacy');assert.equal(read.data.show.startsAt,old.startsAt);
 assert.equal(read.data.show.seed,17);assert.equal(read.data.show.state,'playing');
 assert.equal(read.data.show.nextRequestAt,old.startsAt+74000+900000);
 assert.equal((await call('request')).data.show.id,'legacy');
});

test('the client derives phases from server time and rejects stale snapshots after cancellation',()=>{
 const show={id:'clock',seed:42,startsAt:10000,endsAt:84000,nextRequestAt:264000,state:'scheduled',revision:1};
 assert.deepEqual(fireworkRequestState(show,0),{phase:'scheduled',remaining:10});
 assert.equal(fireworkRequestState(show,10000).phase,'playing');
 assert.equal(fireworkRequestState(show,85000).phase,'cooldown');
 assert.equal(fireworkRequestState(show,264000).phase,'idle');
 const stopped={...show,state:'stopped',revision:2};
 assert.equal(mergeFireworkShow(stopped,show),stopped);
 assert.equal(mergeFireworkShow(show,{...show,id:'older',startsAt:1000}),show);
 assert.equal(fireworkRequestState(stopped,2000).phase,'cooldown');
 const scene=new T.Scene(),renderer=createWinterFireworks(scene);
 renderer.setShow(stopped);renderer.setShow(show);renderer.update(20000);assert.equal(renderer.active,false);
 renderer.setShow({...show,id:'newer',startsAt:300000,endsAt:374000});renderer.update(310000);assert.equal(renderer.active,true);
 renderer.dispose();
});

test('guest controls request a show, avoid interrupting editors and never replay a countdown after tab return',async t=>{
 const dom=new JSDOM('<body><section id="pane-light"></section><section id="pane-activities"><div id="studio-public-actions"></div></section></body>',{url:'https://winter.test',pretendToBeVisual:true});
 const w=dom.window,d=w.document;let now=9000000000000,show=null,requests=0;
 w.labSocialJoined=true;
 w.fetch=async(url,options={})=>{
  assert.equal(url,'/api/fireworks');
  if(options.method==='POST'){
   assert.deepEqual(JSON.parse(options.body),{action:'request'});requests++;
   show={id:'shared-show',seed:42,startsAt:now+10000,endsAt:now+84000,nextRequestAt:now+264000,state:'scheduled',revision:1};
  }
  return {ok:true,json:async()=>({show,serverTime:now})};
 };
 const view=installFireworkRequests({win:w,doc:d,now:()=>now});
 t.after(()=>{view.dispose();w.close();});
 const flush=()=>new Promise(resolve=>setImmediate(resolve));await flush();
 assert.equal(view.button.parentElement.id,'studio-public-actions');assert.equal(view.button.closest('section').id,'pane-activities');assert.equal(d.querySelector('#pane-light #firework-request'),null);assert.equal(view.button.disabled,false);
 d.body.classList.add('studio-open');view.button.click();await flush();
 assert.equal(requests,1);assert.equal(view.button.disabled,true);assert.equal(view.notice.hidden,true);
 d.body.classList.remove('studio-open');w.dispatchEvent(new w.Event('lab:close'));
 assert.equal(view.notice.hidden,false);assert.match(view.notice.textContent,/10초/);let watches=0;w.addEventListener('lab:watch-fireworks',()=>watches++);assert.equal(watches,0);assert.equal(view.notice.querySelector('#firework-watch'),null);assert.equal(watches,0,'notice never changes the free camera');
 now=show.startsAt+5000;d.dispatchEvent(new w.Event('visibilitychange'));await flush();
 assert.equal(view.notice.hidden,false);assert.equal(view.notice.querySelector('.firework-notice-countdown').textContent,'');assert.match(view.button.textContent,/진행 중/);
 w.dispatchEvent(new w.CustomEvent('lab:fireworks',{detail:{...show,state:'stopped',revision:2}}));
 w.dispatchEvent(new w.CustomEvent('lab:fireworks',{detail:show}));
 assert.equal(w.labFireworks.state,'stopped');assert.equal(view.notice.hidden,true);
});

test('a failed guest request leaves the control retryable and never announces an unconfirmed show',async t=>{
 const dom=new JSDOM('<body><section id="pane-activities"><div id="studio-public-actions"></div></section></body>',{url:'https://winter.test',pretendToBeVisual:true});
 const w=dom.window,d=w.document;let fail=true,now=9000000000000,requests=0;
 w.labSocialJoined=true;w.fetch=async(url,options={})=>{
  if(options.method!=='POST')return {ok:true,json:async()=>({show:null,serverTime:now})};
  requests++;
  return fail?{ok:false,json:async()=>({error:'잠시 연결이 끊겼어요.'})}:{ok:true,json:async()=>({show:{id:'confirmed',startsAt:now+10000,seed:3,state:'scheduled',revision:1},serverTime:now})};
 };
 const view=installFireworkRequests({win:w,doc:d,now:()=>now});t.after(()=>{view.dispose();w.close();});
 const flush=()=>new Promise(resolve=>setImmediate(resolve));await flush();view.button.click();await flush();
 assert.equal(view.button.disabled,false);assert.equal(view.notice.hidden,true);assert.equal(w.labFireworks,null);
 assert.match(d.querySelector('#firework-request-status').textContent,/연결이 끊겼어요/);
 fail=false;view.button.click();await flush();assert.equal(requests,2);assert.equal(view.button.disabled,true);
 assert.equal(view.notice.hidden,false);assert.equal(w.labFireworks.id,'confirmed');
});

test('fireworks never fall back to weather controls or an action group outside the activities tab',t=>{
 for(const body of ['<section id="pane-light"><div id="studio-public-actions"></div></section>','<section id="pane-activities"></section><div id="studio-public-actions"></div>']){
  const dom=new JSDOM('<body>'+body+'</body>',{url:'https://winter.test'});t.after(()=>dom.window.close());const w=dom.window;w.labSocialJoined=true;let requests=0;w.fetch=async()=>{requests++;return{ok:true,json:async()=>({show:null})};};
  assert.equal(installFireworkRequests({win:w,doc:w.document}),null);assert.equal(w.document.querySelector('#firework-request'),null);assert.equal(w.document.querySelector('#firework-notice'),null);assert.equal(requests,0);
 }
});


test('finale retains all overlapping shells, and peers reconstruct identical lower-density prefixes',()=>{
 const a=createWinterFireworks(new T.Scene()),b=createWinterFireworks(new T.Scene()),state={id:'same-show',seed:91,startsAt:0,state:'playing'};
 a.setShow(state);b.setShow(state);b.setQuality('low');a.update(67050);b.update(67050);
 const score=createFireworkScore(91),live=score.filter(s=>67.05>=s.at&&67.05<s.at+s.flight+6.15).length;
 assert.equal(live,17);assert.equal(a.root.geometry.drawRange.count,live*360*6);assert.equal(b.root.geometry.drawRange.count,live*96*6);
 for(const attribute of ['position','velocity','timing','design','color']){
  const x=a.root.geometry.attributes[attribute],y=b.root.geometry.attributes[attribute];
  for(let shell=0;shell<live;shell++)assert.deepEqual(x.array.slice(shell*2160*x.itemSize,(shell*2160+576)*x.itemSize),y.array.slice(shell*576*y.itemSize,(shell+1)*576*y.itemSize));
 }
 const buffers=Object.values(a.root.geometry.attributes).map(v=>v.array);
 for(let i=1;i<=6;i++){a.setShow({...state,id:'again-'+i,startsAt:i*100000});a.update(i*100000+67050);a.update(i*100000+74000);assert.equal(a.root.geometry.drawRange.count,0);assert.equal(a.castle.uniforms.showPower.value,0);Object.values(a.root.geometry.attributes).forEach((v,j)=>assert.equal(v.array,buffers[j]));}
 a.dispose();b.dispose();
});


test('playing show title is confined to audio settings and clears at stop or end',async t=>{
 const dom=new JSDOM('<body><section id="pane-activities"><div id="studio-public-actions"></div></section><section id="pane-audio" hidden></section></body>',{url:'https://winter.test',pretendToBeVisual:true}),w=dom.window,d=w.document;let now=10000;
 w.labSocialJoined=true;w.fetch=async()=>({ok:true,json:async()=>({show:null})});
 const ui=installFireworkRequests({win:w,doc:d,now:()=>now});t.after(()=>{ui.dispose();w.close();});await new Promise(r=>setImmediate(r));
 const show={id:'settings-song',musicId:'wedding-entrance',startsAt:20000,endsAt:143245,state:'scheduled',revision:1};
 w.dispatchEvent(new w.CustomEvent('lab:fireworks',{detail:show}));const info=d.querySelector('#show-music-status');assert.ok(info.hidden);
 now=30000;ui.refresh();assert.equal(info.hidden,false);assert.equal(info.closest('section').id,'pane-audio');assert.equal(info.closest('section').hidden,true);assert.match(info.textContent,/Wedding Entrance/);assert.doesNotMatch(ui.notice.textContent,/Wedding Entrance/);
 now=150000;ui.refresh();assert.equal(info.hidden,true);
 now=40000;w.dispatchEvent(new w.CustomEvent('lab:fireworks',{detail:{...show,state:'stopped',revision:2}}));assert.equal(info.hidden,true);
});
