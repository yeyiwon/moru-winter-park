import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createLocalDatabase} from '../../scripts/local-database.mjs';
import {handleAPI} from '../../server/api.js';
export async function apiFixture(t,{realtime=false}={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'winter-v45-')),database=createLocalDatabase(path.join(dir,'test.sqlite'));
 if(t)t.after(()=>{database.close();fs.rmSync(dir,{recursive:true,force:true});});
 await database.query({schema:fs.readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort().map(n=>fs.readFileSync('drizzle/'+n,'utf8')).join('\n')});
 const stats={queries:0,writes:0,poseWrites:0};
 const DB={prepare(sql){return{bind(...args){async function query(){stats.queries++;if(/^(INSERT|UPDATE|DELETE)/.test(sql))stats.writes++;if(/^UPDATE visitors SET x=/.test(sql))stats.poseWrites++;return database.query({sql,args});}return{run:query,all:query,first:async()=>(await query()).results[0]||null};}};}};
 const env={DB,OWNER_EMAIL:'qa-owner@example.invalid'},owner={headers:{'oai-authenticated-user-id':'test-owner','oai-authenticated-user-email':env.OWNER_EMAIL}},guest=()=>({headers:{}});
 async function call(client,route,body,method){const cookies=Object.entries(client.cookies||{}).map(([key,value])=>key+'='+value).join('; '),response=await handleAPI(new Request('http://127.0.0.1/api/'+route,{method:method||(body===undefined?'GET':'POST'),headers:{Origin:'http://127.0.0.1',...client.headers,Cookie:cookies},body:body===undefined?undefined:JSON.stringify(body)}),env);const cookie=response.headers.get('set-cookie');if(cookie){const [key,value]=cookie.split(';')[0].split('=');(client.cookies??={})[key]=value;}return{status:response.status,data:await response.json(),headers:response.headers};}
 return{dir,database,stats,DB,env,owner,guest,call,close(){database.close();fs.rmSync(dir,{recursive:true,force:true});}};
}
