import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createLocalDatabase} from '../scripts/local-database.mjs';
import {generateQuizCandidates,validateQuizCandidate,quizGenerationAPI} from '../server/quiz-generation.js';
import {proxyRequest} from '../server/vercel-proxy.js';
async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'quiz-candidates-')),db=createLocalDatabase(path.join(dir,'db.sqlite'));t.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});
 await db.query({schema:fs.readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort().map(n=>fs.readFileSync('drizzle/'+n,'utf8')).join('\n')});
 return{OPENAI_API_KEY:'test-only',OPENAI_MODEL:'test-only',DB:{prepare(sql){return{bind(...args){return{run:()=>db.query({sql,args}),all:()=>db.query({sql,args}),first:async()=>(await db.query({sql,args})).results[0]};}}}}};
}
const candidate={question:'표면 온도가 가장 높은 것은?',options:['금성','지구','화성','수성'],answer:0,explanation:'검토용 해설',difficulty:1};
test('daily quiz generation shares one request, validates references and never publishes unreviewed output',async t=>{
 const env=await fixture(t);let calls=0;
 const provider=async(_url,options)=>{calls++;const body=JSON.parse(options.body),source=JSON.parse(body.input)[0];assert.equal(body.store,false);assert.equal(body.max_output_tokens,2200);return Response.json({output:[{content:[{type:'output_text',text:JSON.stringify({candidates:[{...candidate,sourceId:source.id},{...candidate,sourceId:source.id}]})}]}],usage:{input_tokens:400,output_tokens:200}});};
 const now=Date.UTC(2026,10,19,1);const runs=await Promise.all([generateQuizCandidates(env,now,provider),generateQuizCandidates(env,now,provider)]);assert.equal(calls,1);assert.equal(runs.filter(r=>r.skipped).length,1);
 const rows=(await env.DB.prepare('SELECT * FROM quiz_candidates').bind().all()).results;assert.equal(rows.length,1);assert.equal(rows[0].status,'review');assert.equal(JSON.parse(rows[0].payload).disabled,true);
 assert.equal((await env.DB.prepare('SELECT COUNT(*) AS n FROM quiz_overrides').bind().first()).n,0);
 const run=await env.DB.prepare('SELECT * FROM quiz_generation_runs').bind().first();assert.equal(run.count,1);assert.equal(JSON.parse(run.usage).outputTokens,200);
});
test('invalid or failed model output is rejected and cannot create a retry loop',async t=>{
 const env=await fixture(t);let calls=0;const bad=async()=>{calls++;return Response.json({output:[{content:[{type:'output_text',text:'not json'}]}]});};
 const now=Date.UTC(2026,10,20,1);assert.equal((await generateQuizCandidates(env,now,bad)).status,503);assert.equal((await generateQuizCandidates(env,now,bad)).skipped,true);assert.equal(calls,1);
 assert.equal((await env.DB.prepare('SELECT status FROM quiz_generation_runs').bind().first()).status,'failed');
 assert.throws(()=>validateQuizCandidate({...candidate,sourceId:'invented'}));assert.throws(()=>validateQuizCandidate({...candidate,sourceId:'valid',options:['a',' A ','c','d']},[{id:'valid'}]));
});
test('scheduled generation rejects guests, forged roles and untrusted proxy credentials',async()=>{
 const request=()=>new Request('https://winter.test/api/quiz-refresh',{headers:{'x-admin':'true'}});
 assert.equal((await quizGenerationAPI(request(),{CRON_SECRET:'scheduled-only'})).status,403);
 let upstream=0;assert.equal((await proxyRequest(request(),async()=>{upstream++;},{cronSecret:'scheduled-only'})).status,403);assert.equal(upstream,0);
 const r=await proxyRequest(new Request('https://winter.test/api/quiz-refresh',{headers:{Authorization:'Bearer scheduled-only'}}),async(_url,o)=>{assert.equal(o.headers.get('Authorization'),'Bearer scheduled-only');assert.equal(o.headers.get('oai-authenticated-user-id'),null);return Response.json({ok:true});},{cronSecret:'scheduled-only'});assert.equal(r.status,200);
});
