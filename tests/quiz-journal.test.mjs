import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {createLocalDatabase} from '../scripts/local-database.mjs';
import {seedInvitation} from './helpers/world-invitation.mjs';
import {handleAPI} from '../server/api.js';
import {quizJournalAPI} from '../server/quiz-journal.js';
import {quizRevision,journalRecordId} from '../dist/quiz-journal-data.js';
import questions from '../dist/content/daily-trivia.json' with {type:'json'};

async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'winter-journal-')),database=createLocalDatabase(path.join(dir,'journal.sqlite'));
 await database.query({schema:fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort().map(f=>fs.readFileSync('drizzle/'+f,'utf8')).join('\n')});
 const DB={prepare(sql){return{bind(...args){return{run:()=>database.query({sql,args}),all:()=>database.query({sql,args}),first:async()=>(await database.query({sql,args})).results[0]||null};}};}};
 t.after(()=>{database.close();fs.rmSync(dir,{recursive:true,force:true});});
 return{DB,query:database.query};
}
const req=(body,query='')=>new Request('https://winter.test/api/quiz-journal'+query,{method:body?'POST':'GET',headers:{'content-type':'application/json'},body:body?JSON.stringify(body):undefined});
const answer=(q,choice,id)=>({action:'answer',questionId:q.id,revision:quizRevision(q),choice,attemptId:id});

test('the shared API router keeps knowledge records within the admitted anonymous session',async t=>{
 const {DB}=await fixture(t),env={DB},token=await seedInvitation(DB),q=questions[0];
 async function call(body,cookie='',route='quiz-journal',origin='https://winter.test'){
  const response=await handleAPI(new Request('https://winter.test/api/'+route,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:body===undefined?undefined:JSON.stringify(body)}),env);
  return{status:response.status,data:await response.json(),headers:response.headers};
 }
 async function join(name){const result=await call({name,token},'','join');assert.equal(result.status,200);return{...result.data,cookie:result.headers.get('set-cookie').split(';')[0]};}
 assert.equal((await call()).status,401);
 const a=await join('지식 손님'),b=await join('다른 손님');
 assert.equal((await call(answer(q,q.answer,'router-origin'),a.cookie,'quiz-journal','https://other.test')).status,403);
 const recorded=await call(answer(q,q.answer,'router-attempt'),a.cookie);
 assert.equal(recorded.status,200);assert.equal(recorded.data.record.correct,true);assert.equal(recorded.data.record.snapshot.question,q.question);
 assert.equal((await call(undefined,b.cookie)).data.records.length,0);
 assert.equal((await call({action:'save',recordId:recorded.data.record.recordId,saved:true},b.cookie)).status,404);
 assert.equal((await call({action:'save',recordId:recorded.data.record.recordId,saved:true},a.cookie)).status,200);
 const journal=await call(undefined,a.cookie);assert.equal(journal.data.records.length,1);assert.equal(journal.data.records[0].saved,true);
 await DB.prepare('UPDATE visitors SET seen=?').bind(Date.now()-31*86400000).run();
 assert.equal((await call(undefined,a.cookie)).status,401);
 assert.equal((await call(answer(q,q.answer,'router-expired'),a.cookie)).status,401);
});

test('anonymous journals are private, server graded, retry safe and retain the answered revision',async t=>{
 const {DB,query}=await fixture(t),env={DB},a={id:'guest-a'},b={id:'guest-b'},q=questions[0],wrong=(q.answer+1)%4;
 assert.equal((await quizJournalAPI(req(),env,null)).status,401);
 assert.equal((await quizJournalAPI(req({...answer(q,q.answer,'attempt-original'),visitor:'guest-a'}),env,b)).status,400);
 const first=await(await quizJournalAPI(req(answer(q,wrong,'attempt-original')),env,a,1000)).json();
 assert.equal(first.record.correct,false);assert.equal(first.record.everCorrect,false);assert.equal(first.record.snapshot.explanation,q.explanation);
 await quizJournalAPI(req(answer(q,wrong,'attempt-original')),env,a,2000);
 let journal=await(await quizJournalAPI(req(),env,a)).json();assert.equal(journal.records.length,1);assert.equal(journal.records[0].updatedAt,1000);
 assert.equal((await(await quizJournalAPI(req(undefined,'?visitor=guest-a'),env,b)).json()).records.length,0);
 assert.equal((await quizJournalAPI(req({action:'save',recordId:first.record.recordId,saved:true}),env,b)).status,404);
 await quizJournalAPI(req(answer(q,q.answer,'attempt-second')),env,a,3000);
 await quizJournalAPI(req({action:'save',recordId:first.record.recordId,saved:true}),env,a,4000);
 journal=await(await quizJournalAPI(req(),env,a)).json();assert.equal(journal.records.length,1);assert.equal(journal.records[0].correct,true);assert.equal(journal.records[0].everCorrect,true);assert.equal(journal.records[0].saved,true);
 const updated={...q,explanation:'검증된 해설을 수정한 이후의 버전입니다.'};await query({sql:'INSERT INTO quiz_overrides(id,payload,updated_at) VALUES(?,?,?)',args:[q.id,JSON.stringify(updated),5000]});
 assert.equal((await quizJournalAPI(req(answer(q,q.answer,'attempt-outdated')),env,a,6000)).status,409);
 await quizJournalAPI(req(answer(updated,updated.answer,'attempt-current')),env,a,7000);
 journal=await(await quizJournalAPI(req(),env,a)).json();assert.equal(journal.records.length,2);assert.equal(journal.records.find(r=>r.recordId===journalRecordId(q)).snapshot.explanation,q.explanation);assert.equal(journal.records.find(r=>r.recordId===journalRecordId(updated)).snapshot.explanation,updated.explanation);
 await query({sql:'UPDATE quiz_overrides SET payload=? WHERE id=?',args:[JSON.stringify({...updated,disabled:true}),q.id]});
 assert.equal((await quizJournalAPI(req(answer(updated,updated.answer,'attempt-disabled')),env,a,8000)).status,404);
 assert.equal((await quizJournalAPI(req(undefined,'?cursor=-1'),env,a)).status,400);
});

async function eventually(predicate){for(let i=0;i<60;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,5));}assert.ok(predicate(),'expected async UI state');}
test('a solo answer appears in the knowledge journal; saving, returning and guest isolation work',async t=>{
 const {DB}=await fixture(t),env={DB},root=path.resolve('dist');
 const dom=new JSDOM('<body><button id="open-quiz-journal-menu"></button></body>',{url:'https://winter.test',runScripts:'outside-only'});t.after(()=>dom.window.close());
 const w=dom.window;w.labGuestId='guest-a';w.labSocialJoined=true;w.matchMedia=()=>({matches:false});w.AbortSignal=globalThis.AbortSignal;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 let failed=false;
 w.fetch=async(url,options={})=>{
  if(url==='/content/daily-trivia.json')return{ok:true,json:async()=>questions};
  if(url==='/api/quiz')return{ok:true,json:async()=>({overrides:[]})};
  if(failed)throw Error('offline');
  return quizJournalAPI(new Request('https://winter.test'+url,options),env,{id:w.labGuestId});
 };
 const context=dom.getInternalVMContext(),modules=new Map();
 async function mod(file){if(modules.has(file))return modules.get(file);const m=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file});modules.set(file,m);await m.link(s=>mod(path.resolve(path.dirname(file),s)));return m;}
 await(await mod(path.join(root,'quick-quiz.js'))).evaluate();
 await w.openQuickQuiz({questionId:questions[0].id});
 const dialog=w.document.querySelector('#quick-quiz');dialog.querySelectorAll('.quiz-options button')[questions[0].answer].click();
 await eventually(()=>dialog.querySelector('.quiz-save-status')?.textContent==='내 지식집에 기록했어요.');
 assert.equal(dialog.querySelectorAll('.quiz-options button.selected').length,1);assert.ok(w.document.body.classList.contains('quiz-open'));
 dialog.querySelector('.quiz-knowledge-actions button').click();await eventually(()=>dialog.querySelector('.quiz-knowledge-actions button').getAttribute('aria-pressed')==='true');
 dialog.querySelector('.quiz-journal-link').click();const journal=w.document.querySelector('#quiz-journal');await eventually(()=>journal.querySelector('.journal-card'));
 assert.equal(dialog.open,false);assert.equal(journal.open,true);assert.equal(journal.querySelector('.journal-card strong').textContent,questions[0].question);assert.ok(w.document.body.classList.contains('quiz-open'));
 journal.querySelector('[data-filter=saved]').click();assert.equal(journal.querySelectorAll('.journal-card').length,1);
 journal.querySelector('.journal-card-actions button:last-child').click();await eventually(()=>dialog.open&&dialog.querySelector('.quiz-options button'));
 assert.equal(journal.open,false);assert.ok(w.document.body.classList.contains('quiz-open'));
 w.openQuizJournal();await eventually(()=>journal.querySelector('.journal-card'));
 w.labGuestId='guest-b';w.dispatchEvent(new w.Event('lab:room'));await eventually(()=>journal.querySelector('.journal-empty'));
 assert.equal(journal.querySelectorAll('.journal-card').length,0);
 failed=true;await w.openQuickQuiz({questionId:questions[1].id});dialog.querySelectorAll('.quiz-options button')[questions[1].answer].click();await eventually(()=>dialog.querySelector('.quiz-save-status')?.textContent.includes('이 브라우저에 보관'));
 assert.equal(dialog.querySelector('.quiz-save-status').textContent.includes('내 지식집에 기록했어요'),false);
 dialog.querySelector('.icon-button').click();await new Promise(r=>setTimeout(r,0));assert.equal(w.document.body.classList.contains('quiz-open'),false);
});

async function journalModule(t){
 const dom=new JSDOM('<body></body>',{url:'https://winter.test',runScripts:'outside-only'});t.after(()=>dom.window.close());
 const w=dom.window;w.labGuestId='guest-a';w.AbortSignal=globalThis.AbortSignal;w.matchMedia=()=>({matches:true});
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 const context=dom.getInternalVMContext(),modules=new Map();
 function source(file){if(!modules.has(file))modules.set(file,new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file}));return modules.get(file);}
 const module=source(path.resolve('dist/quiz-journal.js'));await module.link((s,r)=>source(path.resolve(path.dirname(r.identifier),s)));await module.evaluate();return{w,api:module.namespace};
}

test('an offline answer retry cannot save knowledge into a replacement guest session',async t=>{
 const {DB}=await fixture(t),env={DB},q=questions[0],{w,api}=await journalModule(t);
 await quizJournalAPI(req(answer(q,q.answer,'existing-guest-b')),env,{id:'guest-b'});
 let offline=true,release,started;const pending=new Promise(resolve=>release=resolve),ready=new Promise(resolve=>started=resolve),calls=[];
 w.fetch=async(url,options)=>{
  const body=JSON.parse(options.body),id=w.labGuestId;calls.push({action:body.action,id});if(offline)throw Error('offline');
  const response=await quizJournalAPI(req(body),env,{id});
  if(body.action==='answer'&&id==='guest-a'){started();await pending;}
  return response;
 };
 const first=await api.recordQuizAnswer(q,q.answer);assert.equal(first.mode,'local');
 offline=false;const saving=api.saveJournalKnowledge(first.record,true);await ready;
 w.labGuestId='guest-b';w.dispatchEvent(new w.Event('lab:room'));release();
 const result=await saving;assert.equal(result.mode,'changed');assert.equal(calls.some(call=>call.id==='guest-b'),false);
 const other=await(await quizJournalAPI(req(),env,{id:'guest-b'})).json();assert.equal(other.records[0].saved,false);
 assert.equal(w.localStorage.getItem('winter-quiz-journal-v1:guest-b'),null);
});

test('ending and restoring the same guest identity rejects stale answer confirmations and old save callbacks',async t=>{
 const {DB}=await fixture(t),env={DB},q=questions[0],{w,api}=await journalModule(t);
 let release,started;const pending=new Promise(resolve=>release=resolve),ready=new Promise(resolve=>started=resolve);let requests=0;
 w.fetch=async(url,options)=>{requests++;const response=await quizJournalAPI(req(JSON.parse(options.body)),env,{id:'guest-a'});started();await pending;return response;};
 const answering=api.recordQuizAnswer(q,q.answer);await ready;
 w.dispatchEvent(new w.Event('lab:session-ended'));w.dispatchEvent(new w.Event('lab:room'));release();
 const answerResult=await answering;assert.equal(answerResult.mode,'changed');
 const cache=JSON.parse(w.localStorage.getItem('winter-quiz-journal-v1:guest-a'));assert.equal(cache[0].synced,false,'an old confirmation must not replace the restored session cache');
 const saving=await api.saveJournalKnowledge(answerResult.record,true);assert.equal(saving.mode,'changed');assert.equal(requests,1);
 const server=await(await quizJournalAPI(req(),env,{id:'guest-a'})).json();assert.equal(server.records[0].saved,false);
});
