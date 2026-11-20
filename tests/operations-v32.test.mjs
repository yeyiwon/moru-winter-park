import {seedInvitation} from './helpers/world-invitation.mjs';
import {interiorDoors} from '../dist/district-layout.js';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createLocalDatabase} from '../scripts/local-database.mjs';import {handleAPI} from '../server/api.js';import {maintainSessions} from '../server/operations.js';
async function fixture(t){
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'winter-ops-')),database=createLocalDatabase(path.join(folder,'test.sqlite'));t.after(()=>{database.close();fs.rmSync(folder,{recursive:true,force:true});});
 await database.query({schema:fs.readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort().map(n=>fs.readFileSync('drizzle/'+n,'utf8')).join('\n')});
 const DB={prepare(sql){return{bind(...args){return{run:()=>database.query({sql,args}),all:()=>database.query({sql,args}),first:async()=>(await database.query({sql,args})).results[0]||null};}};}};
 const owner={'oai-authenticated-user-id':'test-owner','oai-authenticated-user-email':'test@example.test'},env={DB,OWNER_EMAIL:'test@example.test'};
 async function call(route,body,cookie='',admin=false){return handleAPI(new Request('https://winter.test/api/'+route,{method:body===undefined?'GET':'POST',headers:{Origin:'https://winter.test','Content-Type':'application/json',cookie,...(admin?owner:{})},body:body===undefined?undefined:JSON.stringify(body)}),env);}
 const invitation=await seedInvitation(DB);
 async function join(name){const response=await call('join',{token:invitation,room:'winter-plaza',name});assert.equal(response.status,200);return{...await response.json(),cookie:response.headers.get('Set-Cookie').split(';')[0]};}
 return{DB,call,join,query:database.query};
}
test('server authorizes actual entrances, synchronizes regions and clears rides on exit',async t=>{
 const {DB,call,join}=await fixture(t),a=await join('첫 모루'),b=await join('둘째 모루');
 assert.equal((await call('region',{region:'museum'},a.cookie)).status,409);
 await DB.prepare('UPDATE visitors SET x=?,z=?,seen=? WHERE id=?').bind(interiorDoors.museum.x,interiorDoors.museum.z,Date.now()-1000,a.id).run();
 let response=await call('region',{region:'museum'},a.cookie);assert.equal(response.status,200);const entry=await response.json();assert.equal(entry.region,'museum');assert.equal((await DB.prepare('SELECT region FROM visitors WHERE id=?').bind(a.id).first()).region,'museum');
 response=await call('presence',{x:0,y:.95,z:30,yaw:0},b.cookie);assert.equal(response.status,200);assert.equal((await response.json()).people.find(p=>p.id===a.id).region,'museum');
 response=await call('region',{region:'outdoors'},a.cookie);assert.equal(response.status,200);assert.deepEqual((await response.json()).position,{x:interiorDoors.museum.x,z:interiorDoors.museum.z});assert.equal((await call('region',{region:'outdoors'},a.cookie)).status,409);
});
test('only server-authenticated owner changes notices/content flags; blocked content rejects entry',async t=>{
 const {DB,call,join}=await fixture(t),guest=await join('모루');assert.equal((await call('operations',undefined,guest.cookie)).status,403);
 assert.equal((await call('operations',{notice:'공지',disabled:['museum']},guest.cookie)).status,403);
 assert.equal((await call('operations',{notice:'공지',disabled:['unknown']},guest.cookie,true)).status,400);
 assert.equal((await call('operations',{notice:'오늘의 공지',disabled:['museum']},guest.cookie,true)).status,200);
 const state=await(await call('world-state',undefined,guest.cookie)).json();assert.equal(state.notice,'오늘의 공지');assert.deepEqual(state.disabled,['museum']);
 await DB.prepare('UPDATE visitors SET x=?,z=? WHERE id=?').bind(interiorDoors.museum.x,interiorDoors.museum.z,guest.id).run();assert.equal((await call('region',{region:'museum'},guest.cookie)).status,409);
 const health=await(await call('health')).json();assert.equal(health.multiplayer,true);
});
test('session retention expires stale identity and transient messages without deleting wishes',async t=>{
 const {DB,call,join}=await fixture(t),old=await join('오래된 모루'),fresh=await join('새 모루'),now=Date.now();
 await DB.prepare('UPDATE visitors SET seen=? WHERE id=?').bind(now-2592000001,old.id).run();assert.equal((await(await call('access',undefined,old.cookie)).json()).session,null);assert.equal((await call('name',{name:'만료'},old.cookie)).status,401);
 await DB.prepare("UPDATE visitors SET chat='임시',chat_at=? WHERE id=?").bind(now-600001,fresh.id).run();
 await DB.prepare('INSERT INTO wishes(id,room,author,author_name,message,visibility,created_at) VALUES(?,?,?,?,?,?,?)').bind('keep','winter-plaza',old.id,'게스트','남겨 둔 소원','private',now-2592000001).run();
 await maintainSessions(DB,now);assert.equal(await DB.prepare('SELECT id FROM visitors WHERE id=?').bind(old.id).first(),null);assert.equal((await DB.prepare('SELECT chat FROM visitors WHERE id=?').bind(fresh.id).first()).chat,'');assert.ok(await DB.prepare('SELECT id FROM wishes WHERE id=?').bind('keep').first());
});

test('appearance is bounded, persisted and sent to another guest',async t=>{
 const {DB,call,join}=await fixture(t),a=await join('검정 모루'),b=await join('친구');
 await DB.prepare('UPDATE visitors SET seen=? WHERE id=?').bind(Date.now()-1000,a.id).run();
 assert.equal((await call('presence',{x:0,y:.95,z:24,yaw:0,color:'#17191e',accessory:'eyes-goofy',fluff:70,roundness:36},a.cookie)).status,200);
 const other=await(await call('presence',{x:0,y:.95,z:30,yaw:0},b.cookie)).json(),peer=other.people.find(p=>p.id===a.id);assert.equal(peer.color,'#17191e');assert.equal(peer.fluff,70);assert.equal(peer.roundness,36);
 const restored=await(await call('access',undefined,a.cookie)).json();assert.equal(restored.session.accessory,'eyes-goofy');assert.equal(restored.session.fluff,70);
});


test('owner can start one synchronized firework score; late visitors receive its original clock',async t=>{
 const {DB,call,join}=await fixture(t),a=await join('공연 모루'),b=await join('관객');
 assert.equal((await call('fireworks',{action:'stop'},a.cookie)).status,403);
 const starts=await Promise.all([call('fireworks',{action:'start'},a.cookie,true),call('fireworks',{action:'start'},a.cookie,true)]);assert.deepEqual(starts.map(r=>r.status).sort(),[200,409]);
 const first=await starts.find(r=>r.status===200).json();assert.equal(first.show.state,'playing');assert.equal(first.show.startsAt,first.serverTime);assert.ok(Number.isInteger(first.show.seed));
 const second=await(await call('fireworks',undefined,b.cookie)).json();assert.equal(second.show.id,first.show.id);assert.equal(second.show.startsAt,first.show.startsAt);assert.equal(second.show.seed,first.show.seed);
 const presence=await(await call('presence',{x:0,y:.95,z:30,yaw:0},b.cookie)).json();assert.equal(presence.fireworks.id,first.show.id);
 assert.equal((await call('fireworks',{action:'stop'},b.cookie)).status,403);assert.equal((await call('fireworks',{action:'stop'},a.cookie,true)).status,200);assert.equal((await(await call('fireworks',undefined,b.cookie)).json()).show.state,'stopped');
 assert.equal((await call('fireworks',{action:'start'},a.cookie,true)).status,200);
});
