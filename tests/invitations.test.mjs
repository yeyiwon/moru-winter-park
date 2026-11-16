import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';import {handleAPI} from '../server/api.js';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'winter-invite-')),db=path.join(tmp,'test.sqlite');
const py="import sqlite3,json,sys\np=json.load(sys.stdin)\nc=sqlite3.connect(p['db']);c.row_factory=sqlite3.Row\nif 'schema' in p:c.executescript(p['schema']);c.commit();print('{}')\nelse:\n r=c.execute(p['sql'],p['args']);rows=[dict(x) for x in r.fetchall()];n=c.total_changes;c.commit();print(json.dumps({'results':rows,'meta':{'changes':n}}))";
function query(p){const r=spawnSync('python3',['-c',py],{input:JSON.stringify({db,...p}),encoding:'utf8'});if(r.status)throw Error(r.stderr);return JSON.parse(r.stdout);}
query({schema:fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort().map(f=>fs.readFileSync('drizzle/'+f,'utf8')).join('\n')});
const env={OWNER_EMAIL:'owner@example.test',DB:{prepare(sql){return{bind(...args){return{async run(){return query({sql,args});},async all(){return query({sql,args});},async first(){return query({sql,args}).results[0]||null;}};}};}}};
const owner={'oai-authenticated-user-id':'site-owner','oai-authenticated-user-email':'owner@example.test'};
async function req(route,body,headers={}){const request=new Request('https://winter.test/api/'+route,{method:body===undefined?'GET':'POST',headers:{Origin:'https://winter.test','content-type':'application/json',...headers},body:body===undefined?undefined:JSON.stringify(body)});return handleAPI(request,env);}
test('only the bound owner creates password-protected invitations, with no client-supplied role bypass',async()=>{
 assert.equal((await req('invite',{password:'test-pass',admin:true})).status,403);
 assert.equal((await req('access',undefined,owner)).status,200);
 assert.equal((await req('invite',{password:'test-pass'},{...owner,'oai-authenticated-user-id':'another-id'})).status,403);
 const created=await req('invite',{password:'test-pass'},owner);assert.equal(created.status,200);const {room}=await created.json();
 const stored=query({sql:'SELECT * FROM invite_rooms WHERE id=?',args:[room]}).results[0];assert.notEqual(stored.password_hash,'test-pass');assert.equal(stored.password_hash.length,64);
 assert.equal((await req('join',{room,name:'게스트',password:'wrong'})).status,403);
 assert.equal((await req('join',{room:'invented-room',name:'게스트',password:'test-pass'})).status,403);
 const joined=await req('join',{room,name:'게스트',password:'test-pass'});assert.equal(joined.status,200);assert.match(joined.headers.get('set-cookie'),/HttpOnly; SameSite=Lax; Secure/);const cookie=joined.headers.get('set-cookie').split(';')[0];
 assert.equal((await req('tree')).status,401);assert.equal((await req('tree?room=another-room',undefined,{cookie})).status,200);
 for(const kind of ['ball','star','bell','bow','moon','icicle']){const added=await req('tree',{kind,color:'#d7b5f0',angle:.5,height:12},{cookie});assert.equal(added.status,200,kind);query({sql:'UPDATE tree_decorations SET created_at=0',args:[]});}
 assert.equal((await req('tree',{kind:'unknown',color:'#d7b5f0',angle:0,height:12},{cookie})).status,400);
 const decorated=await (await req('tree',undefined,{cookie})).json();assert.equal(decorated.decorations.length,6);
 const deletion=await handleAPI(new Request('https://winter.test/api/tree',{method:'DELETE',headers:{Origin:'https://winter.test',cookie,'content-type':'application/json'},body:JSON.stringify({id:decorated.decorations[0].id})}),env);assert.equal(deletion.status,200);assert.equal((await (await req('tree',undefined,{cookie})).json()).decorations.length,5);
 const named=await req('name',{name:'새 닉네임'},{cookie});assert.deepEqual(await named.json(),{name:'새 닉네임'});
 assert.equal((await req('invite',{password:'test-pass'},{cookie})).status,403);
 for(let i=0;i<5;i++)await req('join',{room,name:'게스트',password:'wrong'});
 assert.equal((await req('join',{room,name:'게스트',password:'test-pass'})).status,429);
 fs.rmSync(tmp,{recursive:true,force:true});
});
