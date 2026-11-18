import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createLocalDatabase} from '../scripts/local-database.mjs';import {handleAPI} from '../server/api.js';import {digest} from '../server/invitations.js';
import {proxyRequest,backendOrigin} from '../server/vercel-proxy.js';import {parkOrigin,publicRoom} from '../dist/space-links.js';
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
test('only the bound owner issues random hashed invites; public, legacy and invented-room entry are denied',async t=>{
 const f=await fixture(t),g=f.guest();assert.equal((await f.call(g,'join',{name:'손님'})).status,403);assert.equal((await f.call(g,'invite',{admin:true})).status,403);
 for(const body of [null,[],42])assert.equal((await f.call(g,'join',body)).status,400);
 const i=await f.invite();assert.match(i.token,/^[a-f0-9]{64}$/);assert.equal(new URL(i.url).origin,parkOrigin);assert.equal(new URL(i.url).search,'');assert.equal(i.worldId,publicRoom);
 const stored=await f.DB.prepare('SELECT * FROM world_invites WHERE id=?').bind(i.id).first();assert.equal(stored.token_hash,await digest(i.token));assert.ok(!JSON.stringify(stored).includes(i.token));
 const list=await f.call(f.owner,'invite');assert.ok(!JSON.stringify(list.data).includes(i.token));
 const other={...f.owner,headers:{...f.owner.headers,'oai-authenticated-user-id':'different-user'}};assert.equal((await f.call(other,'invite',{})).status,403);
 g.headers={'oai-authenticated-user-id':'only-owner','oai-authenticated-user-email':'owner@example.test'};assert.equal((await f.call(g,'invite',{})).status,403,'proxy strips spoofed identity');
 assert.equal((await f.call(g,'join',{token:i.token,room:'invented-room'})).status,400);
 const secret='f'.repeat(64),id=await digest(secret);await f.DB.prepare("INSERT INTO visitors(id,room,name,color,accessory,x,z,yaw,seen,gesture,gesture_at) VALUES(?,'winter-plaza','이전 게스트','#ffffff','none',0,30,0,?,'',0)").bind(id,Date.now()).run();g.cookie='winter_session='+secret;
 assert.equal((await f.call(g,'access')).data.session,null);assert.equal((await f.call(g,'tree')).status,401);assert.equal((await f.call(g,'join',{})).status,403);
 assert.equal((await f.join(g,i.token)).id,id,'valid invitation upgrades identity without losing ownership');
});
test('different invitations and Sites/Vercel clients share one world, movement, chat, wishes and saved appearance',async t=>{
 const f=await fixture(t),a=f.guest(),b=f.guest(),ia=await f.invite(),ib=await f.invite();assert.notEqual(ia.token,ib.token);
 const host=await f.join(f.owner,undefined,'관리자'),sa=await f.join(a,ia.token,'손님A'),sb=await f.join(b,ib.token,'손님B');assert.equal(host.room,publicRoom);assert.equal(sa.room,sb.room);
 await f.DB.prepare('UPDATE visitors SET seen=?').bind(Date.now()-1000).run();const pose={x:0,y:.95,z:30,yaw:.4,color:'#93a9ce',colorTop:'#eeb7cb',accessory:'cat-ears,tail-cat',fluff:100,roundness:50};
 assert.equal((await f.call(a,'presence',{...pose,x:2})).status,200);assert.equal((await f.call(a,'chat',{message:'같은 겨울'})).status,200);
 const view=(await f.call(b,'presence',pose)).data;assert.equal(view.people.find(p=>p.id===sa.id).x,2);assert.equal(view.people.find(p=>p.id===sa.id).chat,'같은 겨울');assert.ok(view.people.some(p=>p.id===host.id));
 const added=await f.call(a,'tree',{kind:'star',color:'#e5bb6b',height:12,angle:1,message:'함께 보는 소원',visibility:'public'});assert.equal(added.status,200);assert.ok((await f.call(b,'tree')).data.decorations.some(d=>d.id===added.data.id));assert.equal((await f.call(b,'wishes')).data.wishes[0].message,'함께 보는 소원');
 const rejoined=await f.call(a,'join',{});assert.equal(rejoined.data.id,sa.id);assert.equal(rejoined.data.colorTop,'#eeb7cb');assert.equal((await f.call(a,'access')).data.admin,false);
 for(const route of ['admin','operations','fireworks','invite'])assert.equal((await f.call(a,route,{})).status,403,route);
});
test('expiry and revocation reject tokens and linked sessions, release seats, but preserve wishes and appearance',async t=>{
 const f=await fixture(t),a=f.guest(),i=await f.invite(),s=await f.join(a,i.token);
 await f.DB.prepare("UPDATE visitors SET color='#123456' WHERE id=?").bind(s.id).run();await f.call(a,'tree',{kind:'star',color:'#e5bb6b',height:12,angle:1,message:'남는 소원',visibility:'public'});
 await f.DB.prepare("INSERT INTO ride_seats(room,kind,cabin,seat,visitor,started_at,expires_at) VALUES(?,'ferris',0,0,?,?,?)").bind(publicRoom,s.id,Date.now(),Date.now()+20000).run();
 assert.equal((await f.call(f.owner,'invite',{id:i.id},'DELETE')).status,200);assert.equal((await f.call(a,'tree')).status,401);assert.equal((await f.call(a,'access')).data.session,null);assert.equal((await f.call(f.guest(),'join',{token:i.token})).status,403);
 assert.equal((await f.DB.prepare('SELECT COUNT(*) AS n FROM ride_seats').bind().first()).n,0);assert.equal((await f.DB.prepare('SELECT COUNT(*) AS n FROM wishes').bind().first()).n,1);
 const fresh=await f.invite();assert.equal((await f.join(a,fresh.token)).color,'#123456');await f.DB.prepare('UPDATE world_invites SET expires_at=? WHERE id=?').bind(Date.now()-1,fresh.id).run();assert.equal((await f.call(a,'chat',{message:'만료'})).status,401);assert.equal((await f.call(a,'join',{token:fresh.token})).status,403);
});
test('owner kick invalidates the old invitation for that guest; block survives reissue and self-kick is denied',async t=>{
 const f=await fixture(t),owner=await f.join(f.owner),a=f.guest(),i=await f.invite(),s=await f.join(a,i.token);
 assert.equal((await f.call(f.owner,'admin',{action:'kick',id:owner.id})).status,400);
 assert.equal((await f.call(f.owner,'admin',{action:'kick',id:s.id})).status,200);assert.equal((await f.call(a,'presence',{x:0,y:.95,z:30,yaw:0})).status,401);assert.equal((await f.call(a,'join',{token:i.token})).status,403);
 const fresh=await f.invite();await f.join(a,fresh.token);assert.equal((await f.call(f.owner,'admin',{action:'block',id:s.id})).status,200);assert.equal((await f.call(a,'join',{token:fresh.token})).status,403);assert.equal((await f.call(a,'access')).data.blocked,true);
});
test('capacity reserves owner access, never creates overflow rooms and cannot exceed twelve',async t=>{
 const f=await fixture(t),i=await f.invite();const results=await Promise.all(Array.from({length:14},()=>f.call(f.guest(),'join',{token:i.token,name:'손님'})));
 assert.equal(results.filter(r=>r.status===200).length,11);assert.equal(results.filter(r=>r.status===409).length,3);
 await f.join(f.owner,undefined,'관리자');assert.equal((await f.call(f.owner,'admin')).status,200,'owner can enter and moderate a full guest world');assert.equal((await f.DB.prepare('SELECT COUNT(*) AS count FROM visitors').bind().first()).count,12);const rooms=(await f.DB.prepare('SELECT DISTINCT room FROM visitors').bind().all()).results;assert.deepEqual(rooms,[{room:publicRoom}]);
});
test('invitation attempts are bounded and untrusted origins cannot mutate state',async t=>{
 const f=await fixture(t);for(let i=0;i<120;i++)assert.equal((await f.call(f.guest(),'invite-check',{token:'invalid'})).status,403);assert.equal((await f.call(f.guest(),'invite-check',{token:'invalid'})).status,429);
 const r=await handleAPI(new Request(backendOrigin+'/api/invite',{method:'POST',headers:{...f.owner.headers,Origin:'https://evil.test'},body:'{}'}),f.env);assert.equal(r.status,403);
});
