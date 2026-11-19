import {museumGalleries} from './district-layout.js';
import {closeDialog} from './ui-motion.js';
import * as panelSystem from './panels.js';
import {fallbackTrivia} from './trivia-fallback.js';
import {dailyQuestions,galleryQuestions,loadTrivia} from './trivia-loader.js';
import {recordQuizAnswer,saveJournalKnowledge} from './quiz-journal.js';

let catalog=fallbackTrivia,questions=fallbackTrivia;
export const trivia=fallbackTrivia.map(q=>[q.question,q.options,q.answer,q.explanation,'✦',q.source,q.id]);
let ready=loadTrivia().then(items=>{catalog=items;});
window.addEventListener('lab:quiz-updated',()=>{ready=loadTrivia().then(items=>{catalog=items;});});
const dialog=document.createElement('dialog');dialog.id='quick-quiz';dialog.setAttribute('aria-labelledby','quick-question');
dialog.innerHTML='<div class="quiz-header"><span>별빛 만물관</span><div class="quiz-tools"><button class="quiz-journal-link">내 지식집</button><button class="icon-button" aria-label="퀴즈 닫기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg></button></div></div><div class="quiz-scroll"><div class="quiz-orbit" aria-hidden="true"><svg viewBox="0 0 100 50"><ellipse cx="50" cy="25" rx="40" ry="15"/><ellipse cx="50" cy="25" rx="40" ry="15" transform="rotate(-28 50 25)"/><path d="m50 14 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/><circle cx="87" cy="20" r="2"/></svg></div><p class="quiz-kicker">오늘, 하나의 발견</p><h2 id="quick-question"></h2><div class="quiz-options"></div><div class="quiz-result" role="status" hidden></div></div><div class="quiz-footer"><span class="quiz-count"></span><button class="quiz-next" hidden>다음 문제</button></div><div class="quiz-burst" aria-hidden="true"></div>';
document.body.append(dialog);
let order=[],index=0,score=0,answered=false,cleanup,gallery=null,requestedQuestion=null,generation=0;

function fireworks(){const el=dialog.querySelector('.quiz-burst');el.replaceChildren();if(matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('still')||document.body.classList.contains('reduce-flash'))return;const colors=['#e9d8ad','#b9e4f2','#f7e1a4','#d3dcff'];for(let burst=0;burst<3;burst++)for(let i=0;i<24;i++){const p=document.createElement('i'),a=i/24*Math.PI*2,d=70+(i%4)*18;p.style.left=(burst===0?50:burst===1?18:82)+'%';p.style.top=(burst===0?30:48)+'%';p.style.animationDelay=burst*.14+'s';p.style.setProperty('--spark',colors[i%4]);p.style.setProperty('--sx',Math.cos(a)*d+'px');p.style.setProperty('--sy',Math.sin(a)*d+'px');el.append(p);}clearTimeout(cleanup);cleanup=setTimeout(()=>el.replaceChildren(),1900);}
function textElement(tag,text,cls){const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;}
function render(){
 generation++;answered=false;dialog.classList.remove('quiz-correct','quiz-wrong');
 const [question,options]=trivia[order[index]];dialog.querySelector('#quick-question').textContent=question;dialog.querySelector('.quiz-kicker').textContent=questions[order[index]]?.category||'오늘, 하나의 발견';
 const choices=dialog.querySelector('.quiz-options');choices.replaceChildren();
 options.forEach((text,i)=>{const b=document.createElement('button');b.type='button';b.append(textElement('span',String(i+1),'quiz-choice-number'),textElement('span',text,'quiz-choice-text'));b.onclick=()=>answer(i);choices.append(b);});
 dialog.querySelector('.quiz-result').hidden=true;dialog.querySelector('.quiz-next').hidden=true;dialog.querySelector('.quiz-count').textContent=(index+1)+' / '+order.length+' · '+score+' 정답';dialog.querySelector('.quiz-scroll').scrollTop=0;
}
function answer(choice){
 if(answered)return;answered=true;
 const run=generation,question=questions[order[index]],correct=question.answer,ok=choice===correct;if(ok)score++;
 [...dialog.querySelector('.quiz-options').children].forEach((b,i)=>{b.disabled=true;b.classList.toggle('selected',i===choice);b.classList.toggle('correct',i===correct);b.classList.toggle('wrong',i===choice&&!ok);if(i===choice)b.append(textElement('small','내 선택','quiz-choice-state'));else if(i===correct)b.append(textElement('small','정답','quiz-choice-state'));});
 const result=dialog.querySelector('.quiz-result'),title=textElement('strong',ok?'정답!':'새로 알아가도 좋아요','quiz-result-title');
 result.replaceChildren(title,textElement('p',question.explanation,'quiz-explanation'));
 const link=textElement('a',question.source.title,'quiz-source');link.href=question.source.url;link.target='_blank';link.rel='noreferrer';result.append(link);
 const actions=document.createElement('div');actions.className='quiz-knowledge-actions';const save=textElement('button','지식 담기');save.type='button';save.setAttribute('aria-pressed','false');actions.append(save);result.append(actions);
 const savedStatus=textElement('p','내 기록에 보관하는 중…','quiz-save-status');savedStatus.setAttribute('role','status');result.append(savedStatus);
 const saving=recordQuizAnswer(question,choice);
 saving.then(value=>{if(generation!==run)return;savedStatus.textContent=value.message;save.textContent=value.record.saved?'담은 지식':'지식 담기';save.setAttribute('aria-pressed',String(value.record.saved));});
 save.onclick=async()=>{save.disabled=true;try{const first=await saving,next=save.getAttribute('aria-pressed')!=='true',value=await saveJournalKnowledge(first.record,next);if(generation!==run)return;save.textContent=value.record.saved?'담은 지식':'지식 담기';save.setAttribute('aria-pressed',String(value.record.saved));savedStatus.textContent=value.mode==='server'?'내 지식집에 저장했어요.':value.mode==='memory'?'현재 화면에서만 기록을 볼 수 있어요.':value.mode==='changed'?value.message:'이 브라우저에 보관했어요.';}finally{save.disabled=false;}};
 result.hidden=false;dialog.querySelector('.quiz-next').hidden=false;dialog.querySelector('.quiz-next').textContent=index===order.length-1?'한 번 더 발견':'다음 문제';dialog.querySelector('.quiz-count').textContent=(index+1)+' / '+order.length+' · '+score+' 정답';
 window.labSound?.(ok?'correct':'wrong');window.dispatchEvent(new CustomEvent('lab:vfx',{detail:{kind:ok?'correct':'wrong',strength:.8}}));dialog.classList.remove('quiz-correct','quiz-wrong');dialog.classList.add(ok?'quiz-correct':'quiz-wrong');if(ok){fireworks();window.dispatchEvent(new CustomEvent('lab:exhibit-correct',{detail:gallery}));}
}
function reset(){
 const categories=museumGalleries.find(g=>g.id===gallery)?.categories;
 questions=categories?galleryQuestions(catalog,categories):dailyQuestions(catalog);
 const requested=catalog.find(q=>q.id===requestedQuestion&&!q.disabled&&(!categories||categories.includes(q.category)));if(requested)questions=[requested,...questions.filter(q=>q.id!==requested.id)];requestedQuestion=null;
 if(!questions.length)questions=dailyQuestions(fallbackTrivia);
 trivia.splice(0,trivia.length,...questions.map(q=>[q.question,q.options,q.answer,q.explanation,'✦',q.source,q.id]));order=trivia.map((_,i)=>i);index=score=0;render();
}
window.openQuickQuiz=async(options={})=>{
 generation++;const run=generation;requestedQuestion=options.questionId;gallery=museumGalleries.some(g=>g.id===options.gallery)?options.gallery:null;
 panelSystem.preparePanelOpen?.(dialog);const journal=document.getElementById('quiz-journal');if(journal?.open)journal.close();
 dialog.querySelector('.quiz-header>span').textContent=museumGalleries.find(g=>g.id===gallery)?.name||'별빛 만물관';window.dispatchEvent(new CustomEvent('lab:exhibit-focus',{detail:gallery}));if(!dialog.open)dialog.showModal();document.body.classList.add('quiz-open');window.dispatchEvent(new Event('lab:pause'));dialog.querySelector('#quick-question').textContent='별빛 속 질문을 펼치는 중…';dialog.querySelector('.quiz-options').replaceChildren();dialog.querySelector('.quiz-result').hidden=true;dialog.querySelector('.quiz-next').hidden=true;
 await ready;if(!dialog.open||run!==generation)return;reset();window.labSound?.('quiz');
};
dialog.querySelector('.icon-button').onclick=()=>closeDialog(dialog);
dialog.querySelector('.quiz-journal-link').onclick=()=>window.openQuizJournal();
dialog.querySelector('.quiz-next').onclick=()=>{if(++index===order.length)reset();else render();};
dialog.addEventListener('close',()=>{generation++;clearTimeout(cleanup);dialog.querySelector('.quiz-burst').replaceChildren();document.body.classList.toggle('quiz-open',!!document.querySelector('#quick-quiz[open],#quiz-journal[open]'));window.dispatchEvent(new Event('lab:exhibit-close'));window.dispatchEvent(new Event('lab:close'));});
dialog.addEventListener('cancel',e=>{e.preventDefault();closeDialog(dialog);});
let quizGuest=window.labGuestId;
window.addEventListener('lab:room',()=>{if(quizGuest!==window.labGuestId&&dialog.open)dialog.close();quizGuest=window.labGuestId;});
window.addEventListener('lab:session-ended',()=>{if(dialog.open)dialog.close();});
