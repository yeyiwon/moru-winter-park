import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createLocalDatabase} from '../scripts/local-database.mjs';import {handleAPI} from '../server/api.js';import {digest} from '../server/invitations.js';
import {proxyRequest,backendOrigin} from '../server/vercel-proxy.js';import {parkOrigin,publicRoom} from '../dist/space-links.js';
import {validateAppearance} from '../dist/wardrobe.js';
async function fixture(t){
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'single-world-')),database=createLocalDatabase(path.join(folder,'test.sqlite'));t.after(()=>{database.close();fs.rmSync(folder,{recursive:true,force:true});});
 await database.query({schema:fs.readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort().map(n=>fs.readFileSync('drizzle/'+n,'utf8')).join('\n')});
 const DB={prepare(sql){return{bind(...args){return{run:()=>database.query({sql,args}),all:()=>database.query({sql,args}),first:async()=>(await database.query({sql,args})).results[0]||null};}};}};
 const env={DB,OWNER_EMAIL:'owner@example.test'},owner={origin:backendOrigin,headers:{'oai-authenticated-user-id':'only-owner','oai-authenticated-user-email':'owner@example.test'}},guest=()=>({origin:parkOrigin,headers:{}});
 async function call(client,route,body,method){const req=new Request(client.origin+'/api/'+route,{method:method||(body===undefined?'GET':'POST'),headers:{Origin:client.origin,'Content-Type':'application/json',...client.headers,...(client.cookie?{Cookie:client.cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});const response=client.origin===parkOrigin?await proxyRequest(req,(url,options)=>handleAPI(new Request(url,options),env)):await handleAPI(req,env);if(response.headers.get('set-cookie'))client.cookie=response.headers.get('set-cookie').split(';')[0];return{status:response.status,data:await response.json(),headers:response.headers};}
 async function invite(days=7){const r=await call(owner,'invite',{days});assert.equal(r.status,200);return{...r.data,token:new URLSearchParams(new URL(r.data.url).hash.slice(1)).get('invite')};}
 async function join(client,token,name='게스트'){const r=await call(client,'join',{token,name});assert.equal(r.status,200,JSON.stringify(r.data));return r.data;}
 return{DB,env,owner,guest,call,invite,join};
}
test('first entry needs no choices; owner can reset one test device without touching other identities or wishes',async t=>{
 const f=await fixture(t),a=f.guest(),b=f.guest();
 const first=await f.call(a,'join',{}),other=await f.call(b,'join',{}),owner=await f.call(f.owner,'join',{});
 assert.equal(first.status,200);assert.match(first.data.name,/^[가-힣]+$/);
 const look={fur:first.data.color,furTop:first.data.colorTop,accessory:first.data.accessory,fluff:first.data.fluff,roundness:first.data.roundness};assert.deepEqual(validateAppearance(look),look);
 await f.call(a,'appearance',{fur:'#123456',furTop:null,accessory:'crown',fluff:95,roundness:60});await f.call(a,'name',{name:'테스트기기'});
 const returning=(await f.call(a,'join',{})).data;assert.equal(returning.name,'테스트기기');assert.equal(returning.color,'#123456');assert.equal(returning.accessory,'crown');
 const wish=await f.call(a,'tree',{kind:'star',color:'#e5bb6b',height:12,angle:1,message:'남겨 둘 소원',visibility:'public'});assert.equal(wish.status,200);
 const body={action:'reset-visitor',id:first.data.id,confirmation:'접속 초기화'};
 assert.equal((await f.call(b,'admin',body)).status,403);assert.equal((await f.call(f.owner,'admin',{...body,confirmation:''})).status,400);
 assert.equal((await f.call(f.owner,'admin',{...body,id:owner.data.id})).status,400);
 assert.equal((await f.call(f.owner,'admin',body)).status,200);assert.equal((await f.call(a,'access')).data.session,null);
 const fresh=await f.call(a,'join',{});assert.equal(fresh.status,200);assert.notEqual(fresh.data.id,first.data.id);assert.notEqual(fresh.data.name,'테스트기기');assert.notEqual(fresh.data.color,'#123456');
 assert.equal((await f.call(b,'access')).data.session.id,other.data.id);
 assert.ok((await f.call(b,'wishes')).data.wishes.some(item=>item.id===wish.data.id));
 assert.equal((await f.DB.prepare('SELECT action FROM moderation_audit WHERE target=?').bind(first.data.id).first()).action,'reset-visitor');
});
test('public admission upgrades old identities while only the bound owner manages legacy links',async t=>{
 const f=await fixture(t),g=f.guest();assert.equal((await f.call(g,'join',{name:'손님'})).status,200);assert.equal((await f.call(g,'invite',{admin:true})).status,403);
 for(const body of [null,[],42])assert.equal((await f.call(g,'join',body)).status,400);
 const i=await f.invite();assert.match(i.token,/^[a-f0-9]{64}$/);assert.equal(new URL(i.url).origin,parkOrigin);assert.equal(new URL(i.url).search,'');assert.equal(i.worldId,publicRoom);
 const stored=await f.DB.prepare('SELECT * FROM world_invites WHERE id=?').bind(i.id).first();assert.equal(stored.token_hash,await digest(i.token));assert.ok(!JSON.stringify(stored).includes(i.token));
 const list=await f.call(f.owner,'invite');assert.ok(!JSON.stringify(list.data).includes(i.token));
 const other={...f.owner,headers:{...f.owner.headers,'oai-authenticated-user-id':'different-user'}};assert.equal((await f.call(other,'invite',{})).status,403);
 g.headers={'oai-authenticated-user-id':'only-owner','oai-authenticated-user-email':'owner@example.test'};assert.equal((await f.call(g,'invite',{})).status,403,'proxy strips spoofed identity');
 assert.equal((await f.call(g,'join',{token:i.token,room:'invented-room'})).status,400);
 const secret='f'.repeat(64),id=await digest(secret);await f.DB.prepare("INSERT INTO visitors(id,room,name,color,accessory,x,z,yaw,seen,gesture,gesture_at) VALUES(?,'winter-plaza','이전 게스트','#ffffff','none',0,30,0,?,'',0)").bind(id,Date.now()).run();g.cookie='winter_session='+secret;
 assert.equal((await f.call(g,'access')).data.session,null);assert.equal((await f.call(g,'tree')).status,401);assert.equal((await f.call(g,'join',{})).status,200);
 assert.equal((await f.join(g,i.token)).id,id,'public admission preserves identity and ownership');
});
test('different invitations and Sites/Vercel clients share one world, movement, chat, wishes and saved appearance',async t=>{
 const f=await fixture(t),a=f.guest(),b=f.guest(),ia=await f.invite(),ib=await f.invite();assert.notEqual(ia.token,ib.token);
 const host=await f.join(f.owner,undefined,'관리자'),sa=await f.join(a,ia.token,'손님A'),sb=await f.join(b,ib.token,'손님B');assert.equal(host.room,publicRoom);assert.equal(sa.room,sb.room);
 await f.DB.prepare('UPDATE visitors SET seen=?').bind(Date.now()-1000).run();const pose={x:0,y:.95,z:30,yaw:.4,color:'#93a9ce',colorTop:'#eeb7cb',accessory:'cat-ears,tail-cat',fluff:100,roundness:50};
 assert.equal((await f.call(a,'presence',{...pose,x:2})).status,200);assert.equal((await f.call(a,'chat',{message:'같은 겨울'})).status,200);
 const view=(await f.call(b,'presence',pose)).data;assert.equal(view.people.find(p=>p.id===sa.id).x,2);assert.equal(view.people.find(p=>p.id===sa.id).chat,'같은 겨울');assert.ok(view.people.some(p=>p.id===host.id));
 const added=await f.call(a,'tree',{kind:'star',color:'#e5bb6b',height:12,angle:1,message:'함께 보는 소원',visibility:'public'});assert.equal(added.status,200);assert.ok((await f.call(b,'tree')).data.decorations.some(d=>d.id===added.data.id));assert.equal((await f.call(b,'wishes')).data.wishes[0].message,'함께 보는 소원');
 const rejoined=await f.call(a,'join',{});assert.equal(rejoined.data.id,sa.id);assert.equal(rejoined.data.colorTop,'#eeb7cb');assert.equal((await f.call(a,'access')).data.admin,false);
 for(const route of ['admin','operations','invite'])assert.equal((await f.call(a,route,{})).status,403,route);
});
test('public admission is independent of retired links and preserves wishes and appearance',async t=>{
 const f=await fixture(t),a=f.guest(),i=await f.invite(),s=await f.join(a,i.token);
 await f.DB.prepare("UPDATE visitors SET color='#123456' WHERE id=?").bind(s.id).run();await f.call(a,'tree',{kind:'star',color:'#e5bb6b',height:12,angle:1,message:'남는 소원',visibility:'public'});
 await f.call(f.owner,'invite',{id:i.id},'DELETE');assert.equal((await f.call(a,'tree')).status,200);assert.equal((await f.call(a,'access')).data.session.id,s.id);assert.equal((await f.call(f.guest(),'join',{token:i.token})).status,403,'explicit invalid legacy token is not accepted');
 const again=await f.join(a);assert.equal(again.color,'#123456');assert.equal(again.id,s.id);assert.equal((await f.call(a,'access')).data.inviteRequired,false);assert.equal((await f.call(a,'wishes')).data.wishes[0].message,'남는 소원');
});
test('owner kick invalidates the old invitation for that guest; block survives reissue and self-kick is denied',async t=>{
 const f=await fixture(t),owner=await f.join(f.owner),a=f.guest(),i=await f.invite(),s=await f.join(a,i.token);
 assert.equal((await f.call(f.owner,'admin',{action:'kick',id:owner.id})).status,400);
 assert.equal((await f.call(f.owner,'admin',{action:'kick',id:s.id})).status,200);assert.equal((await f.call(a,'presence',{x:0,y:.95,z:30,yaw:0})).status,401);assert.equal((await f.call(a,'join',{token:i.token})).status,403);
 const fresh=await f.invite();await f.join(a,fresh.token);assert.equal((await f.call(f.owner,'admin',{action:'block',id:s.id})).status,200);assert.equal((await f.call(a,'join',{token:fresh.token})).status,403);assert.equal((await f.call(a,'access')).data.blocked,true);
});
test('capacity reserves owner access, never creates overflow rooms and cannot exceed twelve',async t=>{
 const f=await fixture(t),i=await f.invite();const results=await Promise.all(Array.from({length:14},()=>f.call(f.guest(),'join',{name:'손님'})));
 assert.equal(results.filter(r=>r.status===200).length,11);assert.equal(results.filter(r=>r.status===409).length,3);
 await f.join(f.owner,undefined,'관리자');assert.equal((await f.call(f.owner,'admin')).status,200,'owner can enter and moderate a full guest world');assert.equal((await f.DB.prepare('SELECT COUNT(*) AS count FROM visitors').bind().first()).count,12);const rooms=(await f.DB.prepare('SELECT DISTINCT room FROM visitors').bind().all()).results;assert.deepEqual(rooms,[{room:publicRoom}]);
});
test('invitation attempts are bounded and untrusted origins cannot mutate state',async t=>{
 const f=await fixture(t);for(let i=0;i<120;i++)assert.equal((await f.call(f.guest(),'invite-check',{token:'invalid'})).status,403);assert.equal((await f.call(f.guest(),'invite-check',{token:'invalid'})).status,429);
 const r=await handleAPI(new Request(backendOrigin+'/api/invite',{method:'POST',headers:{...f.owner.headers,Origin:'https://evil.test'},body:'{}'}),f.env);assert.equal(r.status,403);
});

test('decoration cleanup requires the owner and a current confirmed snapshot; wishes and backups survive',async t=>{
 const f=await fixture(t),g=f.guest(),i=await f.invite();await f.join(f.owner);await f.join(g,i.token);
 const created=await f.call(g,'tree',{kind:'star',color:'#e5bb6b',height:12,angle:1,message:'보존할 소원',visibility:'public'});assert.equal(created.status,200);
 let snapshot=(await f.call(f.owner,'admin')).data;const command={action:'clear-decorations',count:snapshot.decorations.length,revision:snapshot.decorationRevision,confirmation:'장식 1개 삭제'};
 assert.equal((await f.call(g,'admin',command)).status,403);
 assert.equal((await f.call(f.owner,'admin',{...command,revision:'stale'})).status,409);
 assert.equal((await f.call(f.owner,'admin',{...command,confirmation:'yes'})).status,409);
 const cleared=await f.call(f.owner,'admin',command);assert.equal(cleared.status,200);assert.equal(cleared.data.removed,1);
 assert.equal((await f.call(g,'tree')).data.decorations.length,0);assert.equal((await f.call(g,'wishes')).data.wishes[0].message,'보존할 소원');
 const backup=await f.DB.prepare('SELECT payload,actor FROM decoration_backups WHERE id=?').bind(cleared.data.backupId).first();assert.equal(JSON.parse(backup.payload)[0].id,created.data.id);assert.ok(backup.actor);
 assert.equal((await f.call(f.owner,'admin',command)).status,409,'replay cannot clear a different set');
});
test('server pose time and speed remain authoritative when chat updates the heartbeat',async t=>{
 const f=await fixture(t),a=f.guest(),b=f.guest(),i=await f.invite();const sa=await f.join(a,i.token);await f.join(b,i.token);
 await f.DB.prepare('UPDATE visitors SET pose_at=? WHERE id=?').bind(Date.now()-1000,sa.id).run();
 await f.call(a,'chat',{message:'걷는 중'});
 const start=Date.now();assert.equal((await f.call(a,'presence',{x:2,y:.95,z:30,yaw:0,speed:999,updatedAt:1})).status,200);
 const view=(await f.call(b,'presence',{x:0,y:.95,z:30,yaw:0})).data.people.find(p=>p.id===sa.id);assert.equal(view.x,2);assert.equal(view.speed,8);assert.ok(view.updatedAt>=start);
 await f.DB.prepare('UPDATE visitors SET pose_at=? WHERE id=?').bind(Date.now()-1000,sa.id).run();await f.call(a,'presence',{x:2,y:.95,z:30,yaw:0,speed:0});
 assert.equal((await f.call(b,'presence',{x:0,y:.95,z:30,yaw:0})).data.people.find(p=>p.id===sa.id).speed,0);
});

test('owner departure leaves public guest movement, chat and persistence available; unchanged polls do not rewrite pose',async t=>{
 const f=await fixture(t),a=f.guest(),b=f.guest();await f.join(f.owner);const sa=await f.join(a);await f.join(b);await f.call(f.owner,'leave',{});
 const pose={x:1,y:.95,z:30,yaw:0,speed:0,mode:'',color:'#f4eee5',accessory:'none',fluff:100,roundness:50};await f.call(a,'presence',pose);
 const first=await f.DB.prepare('SELECT pose_at,seen FROM visitors WHERE id=?').bind(sa.id).first();
 await f.DB.prepare('UPDATE visitors SET pose_at=? WHERE id=?').bind(first.pose_at-1000,sa.id).run();
 await f.call(a,'presence',pose);const unchanged=await f.DB.prepare('SELECT pose_at,seen FROM visitors WHERE id=?').bind(sa.id).first();assert.equal(unchanged.pose_at,first.pose_at-1000);assert.equal(unchanged.seen,first.seen);
 await f.call(a,'chat',{message:'관리자 없이도 함께'});const people=(await f.call(b,'presence',{...pose,x:0})).data.people;assert.equal(people.length,1);assert.equal(people[0].chat,'관리자 없이도 함께');assert.equal(people[0].x,1);
});
