import {canStartObservatoryQuiz} from './observatory-layout.js';
import {closeDialog} from './ui-motion.js';
import * as panelSystem from './panels.js';
import {quizSnapshot,quizRevision,journalRecordId,mergeJournalRecords} from './quiz-journal-data.js';

const CACHE='winter-quiz-journal-v1:';
let records=[],owner='',filter='all',nextCursor=null,loading=false,loadSerial=0,cacheAvailable=true,sessionEpoch=0;
const currentOwner=()=>String(window.labGuestId||'local');
function readCache(){owner=currentOwner();try{records=mergeJournalRecords(JSON.parse(window.localStorage.getItem(CACHE+owner)||'[]')).map(row=>({...row,sessionKey:owner,sessionEpoch}));}catch{records=[];}return records;}
function writeCache(){try{window.localStorage.setItem(CACHE+owner,JSON.stringify(records.slice(0,200)));cacheAvailable=true;return true;}catch{cacheAvailable=false;return false;}}
function upsert(value){if(owner!==currentOwner())readCache();records=mergeJournalRecords([...records,value]);writeCache();return value;}
function confirmed(value,guest,attempt,epoch){
 if(!accountStill(guest,epoch))return value;
 const previous=records.find(row=>row.recordId===value.recordId);
 if(attempt&&previous?.attemptId&&previous.attemptId!==attempt)return previous;
 const next={...value,sessionKey:guest,sessionEpoch:epoch};records=mergeJournalRecords([...records.filter(row=>row.recordId!==value.recordId),next]);writeCache();return next;
}
async function request(body,cursor=null){
 const response=await (window.fetch||fetch)('/api/quiz-journal'+(cursor?'?cursor='+encodeURIComponent(cursor):''),{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(8000)});
 const data=await response.json();if(!response.ok)throw Object.assign(Error(data.error||'기록을 연결하지 못했어요.'),{status:response.status});return data;
}
function attemptId(){return globalThis.crypto?.randomUUID?.()||('attempt_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2));}
function accountStill(id,epoch){return id===currentOwner()&&epoch===sessionEpoch;}
const changedSession=record=>({record,mode:'changed',message:'접속이 바뀌어 이전 게스트의 기록은 수정하지 않았어요.'});

export async function recordQuizAnswer(question,choice){
 if(owner!==currentOwner())readCache();
 const snapshot=quizSnapshot(question),key=journalRecordId(question),old=records.find(r=>r.recordId===key),id=attemptId(),at=Date.now(),guest=owner,epoch=sessionEpoch;
 let value={recordId:key,questionId:question.id,revision:quizRevision(question),snapshot,choice,correct:choice===question.answer,everCorrect:choice===question.answer||!!old?.everCorrect,saved:!!old?.saved,firstAt:old?.firstAt||at,updatedAt:at,attemptId:id,synced:false,sessionKey:guest,sessionEpoch:epoch};
 upsert(value);
 if(guest==='local')return{record:value,mode:cacheAvailable?'local':'memory',message:cacheAvailable?'이 브라우저에 기록했어요.':'저장 공간을 사용할 수 없어 현재 화면에서만 기록을 볼 수 있어요.'};
 try{
  const data=await request({action:'answer',questionId:question.id,revision:value.revision,choice,attemptId:id});
  if(!accountStill(guest,epoch))return changedSession(value);
  value=confirmed({...data.record,attemptId:id},guest,id,epoch);
  return{record:value,mode:'server',message:'내 지식집에 기록했어요.'};
 }catch(error){if(!accountStill(guest,epoch))return changedSession(value);return{record:value,mode:cacheAvailable?'local':'memory',message:cacheAvailable?'이 브라우저에 보관했어요. 공간 연결 후 다시 저장할 수 있어요.':'저장하지 못했어요. 현재 화면에서만 기록을 볼 수 있어요.',error:error.message};}
}

export async function saveJournalKnowledge(value,saved){
 if(owner!==currentOwner())readCache();const guest=owner,epoch=sessionEpoch;
 if(value.sessionKey&&value.sessionKey!==guest||value.sessionEpoch!==undefined&&value.sessionEpoch!==epoch)return changedSession(value);
 let item=records.find(r=>r.recordId===value.recordId)||value;
 item=upsert({...item,saved:!!saved,sessionKey:guest,sessionEpoch:epoch});
 if(guest==='local')return{record:item,mode:cacheAvailable?'local':'memory'};
 try{
  if(!item.synced){
   await request({action:'answer',questionId:item.snapshot.id,revision:item.revision,choice:item.choice,attemptId:item.attemptId||attemptId()});
   // A retry is a separate write. Never continue it with a replacement guest's
   // cookie, even when the answered question is also present in that journal.
   if(!accountStill(guest,epoch))return changedSession(item);
  }
  const data=await request({action:'save',recordId:item.recordId,saved:!!saved});
  if(!accountStill(guest,epoch))return changedSession(item);
  return{record:confirmed(data.record,guest,item.attemptId,epoch),mode:'server'};
 }catch(error){if(!accountStill(guest,epoch))return changedSession(item);upsert({...item,synced:false});return{record:item,mode:cacheAvailable?'local':'memory',message:error.message};}
}

const journal=document.createElement('dialog');journal.id='quiz-journal';journal.setAttribute('aria-labelledby','quiz-journal-title');
journal.innerHTML='<div class="journal-header"><div><span class="journal-eyebrow">별빛 만물관</span><h2 id="quiz-journal-title">내 지식집</h2></div><button class="icon-button journal-close" aria-label="지식집 닫기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg></button></div><p class="journal-intro">발견한 지식을 한 장씩 모아두세요.</p><div class="journal-tabs" role="tablist" aria-label="지식 기록 종류"><button role="tab" data-filter="all" aria-selected="true">푼 문제</button><button role="tab" data-filter="correct" aria-selected="false" tabindex="-1">맞힌 문제</button><button role="tab" data-filter="saved" aria-selected="false" tabindex="-1">담은 지식</button></div><div class="journal-content" role="tabpanel" tabindex="0"><div class="journal-list"></div><button class="journal-more" hidden>기록 더 보기</button></div><div class="journal-footer"><p class="journal-status" role="status"></p><p class="journal-scope">나만 볼 수 있어요. 브라우저 데이터 삭제 또는 기기 변경 시 기록 연결이 이어지지 않을 수 있어요.</p><button class="journal-start">퀴즈 풀기</button></div>';
document.body.append(journal);
const list=journal.querySelector('.journal-list'),status=journal.querySelector('.journal-status'),more=journal.querySelector('.journal-more');

function node(tag,text,cls){const element=document.createElement(tag);element.textContent=text;if(cls)element.className=cls;return element;}
function sourceLink(source){const link=node('a',source.title,'journal-source');link.href=source.url;link.target='_blank';link.rel='noreferrer';return link;}
function render(){
 list.replaceChildren();
 const available=canStartObservatoryQuiz(window.labPlayerState),start=journal.querySelector('.journal-start');start.disabled=!available;start.textContent=available?'퀴즈 풀기':'중앙 관측 테이블에서 시작';
 const shown=records.filter(r=>filter==='all'||(filter==='correct'?r.everCorrect:r.saved));
 if(!shown.length){const empty=node('div',filter==='saved'?'다시 보고 싶은 해설에서 “지식 담기”를 눌러보세요.':filter==='correct'?'맞힌 문제는 여기에 모여요. 틀린 문제의 해설도 언제든 다시 볼 수 있어요.':'첫 퀴즈를 풀면 질문과 해설이 여기에 남아요.','journal-empty');list.append(empty);}
 for(const entry of shown){
  const q=entry.snapshot,card=document.createElement('details');card.className='journal-card';
  const summary=document.createElement('summary'),meta=node('span',q.category,'journal-category'),heading=node('strong',q.question),badge=node('span',entry.everCorrect?'맞힘':'다시 보기','journal-result '+(entry.everCorrect?'is-correct':''));
  summary.append(meta,heading,badge);card.append(summary);
  const content=node('div','','journal-card-content'),choice=node('p','내 선택 · '+q.options[entry.choice],'journal-choice');
  content.append(choice,node('p','정답 · '+q.options[q.answer],'journal-answer'),node('p',q.explanation,'journal-explanation'),sourceLink(q.source));
  const row=node('div','','journal-card-actions'),save=node('button',entry.saved?'담은 지식':'지식 담기');save.type='button';save.setAttribute('aria-pressed',String(!!entry.saved));
  save.onclick=async()=>{save.disabled=true;try{const result=await saveJournalKnowledge(entry,!entry.saved);save.textContent=result.record.saved?'담은 지식':'지식 담기';save.setAttribute('aria-pressed',String(!!result.record.saved));entry.saved=result.record.saved;status.textContent=result.mode==='server'?'지식집에 저장했어요.':result.mode==='memory'?'현재 화면에서만 기록을 볼 수 있어요.':result.mode==='changed'?result.message:'이 브라우저에 보관했어요.';if(filter==='saved'&&!entry.saved)render();}finally{save.disabled=false;}};
  const retry=node('button','다시 풀기');retry.type='button';retry.disabled=!available;retry.onclick=()=>window.openQuickQuiz?.({questionId:q.id});
  row.append(save,retry);content.append(row,node('small',new Date(entry.updatedAt).toLocaleDateString('ko-KR')+(entry.synced?'':' · 이 브라우저에 보관 중'),'journal-date'));card.append(content);list.append(card);
 }
 more.hidden=!nextCursor;more.disabled=loading;
}
async function load(append=false){
 const serial=++loadSerial,guest=currentOwner(),epoch=sessionEpoch;loading=true;status.textContent='기록을 불러오는 중…';more.disabled=true;
 if(!append){readCache();nextCursor=null;render();}
 try{
  if(guest==='local')throw Error('local');
  const data=await request(null,append?nextCursor:null);
  if(serial!==loadSerial||!accountStill(guest,epoch))return;
  records=mergeJournalRecords([...records,...data.records.map(row=>({...row,sessionKey:guest,sessionEpoch:epoch}))]);nextCursor=data.nextCursor;writeCache();
  status.textContent=records.length?'지금까지 '+records.length+'개의 발견을 모았어요.':'아직 기록이 없어요.';
 }catch{if(serial===loadSerial)status.textContent=records.length?'연결 전까지 이 브라우저의 기록을 보여드려요.':'퀴즈를 풀고 내 지식집을 채워보세요.';}
 finally{if(serial===loadSerial){loading=false;render();}}
}

window.openQuizJournal=()=>{
 panelSystem.preparePanelOpen?.(journal);
 const quiz=document.getElementById('quick-quiz');if(quiz?.open)quiz.close();
 if(!journal.open)journal.showModal();document.body.classList.add('quiz-open');window.dispatchEvent(new Event('lab:pause'));filter='all';setFilter(filter);void load();
};
function setFilter(value){filter=value;for(const b of journal.querySelectorAll('[data-filter]')){const selected=b.dataset.filter===filter;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;}render();}
for(const button of journal.querySelectorAll('[data-filter]'))button.onclick=()=>setFilter(button.dataset.filter);
journal.querySelector('.journal-tabs').onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const buttons=[...journal.querySelectorAll('[data-filter]')],i=buttons.indexOf(document.activeElement);const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;setFilter(buttons[next].dataset.filter);buttons[next].focus();};
journal.querySelector('.journal-close').onclick=()=>closeDialog(journal);
journal.querySelector('.journal-start').onclick=()=>window.openQuickQuiz?.();
more.onclick=()=>{if(!loading&&nextCursor)void load(true);};
journal.addEventListener('cancel',e=>{e.preventDefault();closeDialog(journal);});
journal.addEventListener('close',()=>{loadSerial++;document.body.classList.toggle('quiz-open',!!document.querySelector('#quick-quiz[open],#quiz-journal[open]'));window.dispatchEvent(new Event('lab:close'));});
window.addEventListener('lab:room',()=>{sessionEpoch++;loadSerial++;readCache();if(journal.open)void load();});
window.addEventListener('lab:session-ended',()=>{sessionEpoch++;loadSerial++;if(journal.open)journal.close();records=[];owner='';});
document.getElementById('open-quiz-journal-menu')?.addEventListener('click',()=>window.openQuizJournal());
readCache();
