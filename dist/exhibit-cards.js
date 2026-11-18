import {makePanel} from './panels.js';
import {museumGalleries} from './district-layout.js';
import {loadTrivia,galleryQuestions} from './trivia-loader.js';
import {renderExperienceCards} from './experience-cards.js';
import {aiEnabled,requestPersonalization,recommendationStatus} from './personalization.js';

const panel=makePanel('exhibit-panel','전시', '<div class="exhibit-actions"><button type="button" data-other>다른 주제</button><button type="button" data-ai>AI 전시 조합</button></div><p class="preference-note" data-policy>AI는 설정에서 동의한 뒤 직접 요청할 때만 사용합니다.</p><p role="status"></p><div class="experience-cards"></div>');
let gallery=null,items=[],offset=0,requestId=0;
const status=panel.dialog.querySelector('[role=status]'),cards=panel.dialog.querySelector('.experience-cards'),ai=panel.dialog.querySelector('[data-ai]');
function show(result){renderExperienceCards(cards,result,{onQuiz(id){panel.dialog.close();window.openQuickQuiz?.({gallery:gallery.id,questionId:id});}});}
function defaults(){const chosen=Array.from({length:Math.min(2,items.length)},(_,i)=>items[(offset+i)%items.length]);show({cards:chosen.map((item,i)=>({component:i?'QuizCard':'ExplanationPanel',item}))});status.textContent='출처가 확인된 전시 콘텐츠';}
window.openKnowledgeExhibit=async(id)=>{
 gallery=museumGalleries.find(g=>g.id===id);if(!gallery)return;const token=++requestId;offset=0;panel.dialog.querySelector('h2').textContent=gallery.name;cards.replaceChildren();status.textContent='전시를 불러오는 중…';ai.disabled=!aiEnabled();panel.open();document.body.classList.add('quiz-open');window.dispatchEvent(new CustomEvent('lab:exhibit-focus',{detail:id}));
 const catalog=await loadTrivia();if(token!==requestId||!panel.dialog.open)return;items=galleryQuestions(catalog,gallery.categories);defaults();
};
panel.dialog.querySelector('[data-other]').onclick=()=>{if(!items.length)return;requestId++;offset=(offset+2)%items.length;defaults();ai.disabled=!aiEnabled();};
ai.onclick=async()=>{const id=++requestId;ai.disabled=true;status.textContent='전시 조합을 고르는 중…';try{const result=await requestPersonalization('exhibit',{gallery:gallery.id});if(id!==requestId||!panel.dialog.open||!aiEnabled())return;show(result);status.textContent=recommendationStatus(result);}catch(error){if(id===requestId&&panel.dialog.open){defaults();status.textContent='기본 전시를 표시합니다. '+(error.name==='AbortError'?'연결을 확인해 주세요.':error.message);}}finally{if(id===requestId)ai.disabled=!aiEnabled();}};
window.addEventListener('lab:preferences',()=>{requestId++;ai.disabled=!aiEnabled();if(panel.dialog.open&&items.length)defaults();});
panel.dialog.addEventListener('close',()=>{requestId++;document.body.classList.remove('quiz-open');window.dispatchEvent(new Event('lab:exhibit-close'));});
window.addEventListener('lab:room',()=>{if(panel.dialog.open)panel.dialog.close();});
