import test from 'node:test';import assert from 'node:assert/strict';
import {apiFixture} from './helpers/service.mjs';
import {fireworksAPI,readFireworkShow} from '../server/fireworks.js';
import {fireworkConfig} from '../dist/firework-score.js';
import {proxyRequest,backendOrigin} from '../server/vercel-proxy.js';
import {handleAPI} from '../server/api.js';
const showRequest=action=>new Request('https://test/api/fireworks',{method:'POST',body:JSON.stringify({action})});
test('concurrent guest show requests have one winner; cooldown starts at completion; owner bypass never duplicates',async t=>{
 const f=await apiFixture(t),now=Date.now(),requests=await Promise.all(Array.from({length:25},(_,i)=>fireworksAPI(showRequest('request'),f.DB,{id:'guest-'+i,room:'winter-plaza'},false,now)));
 assert.equal(requests.filter(r=>r.status===200).length,25);assert.equal(new Set(await Promise.all(requests.map(async r=>(await r.clone().json()).show.id))).size,1);
 const show=await readFireworkShow(f.DB,now);assert.equal(show.startsAt,now+10000);assert.equal(show.nextRequestAt,show.endsAt+900000);
 assert.equal((await fireworksAPI(showRequest('start'),f.DB,{id:'owner',room:'winter-plaza'},true,now+10)).status,409);
 const finish=show.endsAt;
 assert.equal((await fireworksAPI(showRequest('request'),f.DB,{id:'late',room:'winter-plaza'},false,finish+899999)).status,429);
 assert.equal((await fireworksAPI(showRequest('start'),f.DB,{id:'owner',room:'winter-plaza'},true,finish+1)).status,200);
 const ownerShow=await readFireworkShow(f.DB,finish+1);assert.notEqual(ownerShow.id,show.id);assert.equal(ownerShow.nextRequestAt,ownerShow.endsAt+900000);
 assert.equal((await fireworksAPI(showRequest('stop'),f.DB,{id:'late',room:'winter-plaza'},false,finish+1)).status,403);
 assert.equal((await fireworksAPI(showRequest('request'),f.DB,{id:'after',room:'winter-plaza'},false,ownerShow.nextRequestAt)).status,200);
});
test('owner callback is bound to browser state, single use, expiring, CSRF checked and unavailable to guests',async t=>{
 const f=await apiFixture(t),browser=f.guest();
 const start=await f.call(browser,'owner-auth',{action:'begin'}),state=new URL(start.data.url).searchParams.get('owner_redirect');assert.match(state,/^[a-f0-9]{64}$/);
 assert.equal((await f.call(browser,'owner-auth',{action:'grant',state})).status,403);
 const grant=await f.call(f.owner,'owner-auth',{action:'grant',state}),code=new URLSearchParams(new URL(grant.data.url).hash.slice(1)).get('owner_code');
 const other=f.guest();await f.call(other,'owner-auth',{action:'begin'});assert.equal((await f.call(other,'owner-auth',{action:'exchange',code})).status,403);
 assert.equal((await f.call(browser,'owner-auth',{action:'exchange',code})).status,200);
 assert.equal((await f.call(browser,'owner-auth',{action:'exchange',code})).status,403);
 assert.equal((await f.call(browser,'access')).data.admin,true);assert.equal((await f.call(browser,'join',{name:'소유자'})).status,200);
 assert.equal((await f.call(browser,'operations')).status,200);
 await f.call(browser,'owner-auth',{action:'logout'});assert.equal((await f.call(browser,'access')).data.admin,false);
 const forged=new Request(backendOrigin+'/api/owner-auth',{method:'POST',headers:{Origin:'https://evil.invalid'},body:JSON.stringify({action:'begin'})});assert.equal((await handleAPI(forged,f.env)).status,403);
});
test('callback cookie survives Vercel proxy without forwarding provider identity or arbitrary cookies',async()=>{
 let headers;const state='1'.repeat(64),r=await proxyRequest(new Request('https://moru-winter-park.vercel.app/api/owner-auth',{method:'POST',headers:{Origin:'https://moru-winter-park.vercel.app',Cookie:'winter_login='+state+'; private=no','oai-authenticated-user-id':'forged'},body:'{}'}),async(_,options)=>{headers=options.headers;return Response.json({},{headers:{'Set-Cookie':'winter_session=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0'}});});assert.equal(headers.get('cookie'),'winter_login='+state);assert.equal(headers.has('oai-authenticated-user-id'),false);assert.ok(r.headers.get('set-cookie').startsWith('winter_session=;'));
});
test('unconfigured realtime is explicitly polling; operations remains owner-only and persistent content is retained',async t=>{
 const f=await apiFixture(t),guest=f.guest();await f.call(guest,'join',{});assert.equal((await f.call(guest,'realtime',{})).data.enabled,false);assert.equal((await f.call(guest,'operations')).status,403);await f.call(f.owner,'join',{});const op=await f.call(f.owner,'operations');assert.equal(op.data.transport,'HTTP polling');assert.equal(op.data.realtime,null);assert.equal(op.data.backup.fullDatabase,'UNKNOWN');
 Object.assign(f.env,{REALTIME_URL:'https://realtime.invalid',REALTIME_SECRET:'local-test-secret'.repeat(3),REALTIME_FETCH:async()=>{throw Error('simulated outage');}});
 assert.equal((await f.call(f.guest(),'join',{})).status,503);assert.equal((await f.call(f.owner,'operations')).data.service,'degraded');
});

test('public profile edits are rate limited without losing the last accepted name',async t=>{
 const f=await apiFixture(t),guest=f.guest();await f.call(guest,'join',{});
 for(let i=0;i<30;i++)assert.equal((await f.call(guest,'name',{name:'눈꽃'+i})).status,200);
 assert.equal((await f.call(guest,'name',{name:'too many'})).status,429);assert.equal((await f.call(guest,'access')).data.session.name,'눈꽃29');
});
