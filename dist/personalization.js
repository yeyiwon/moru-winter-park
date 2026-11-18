import {readPreferences,savePreferences,normalizePreferences,musicStyles,musicPaces,rankMusic} from './experience-preferences.js';
import {winterTracks} from './music-catalog.js';
import {renderExperienceCards} from './experience-cards.js';
const controllers=new Set();let preferences=readPreferences();
export function aiEnabled(){return preferences.ai;}
export function requestPersonalization(kind,values){return requestAI('experience',{kind,...values});}
export async function requestAI(path,values){
 if(!['assist','experience'].includes(path))throw Error('지원하지 않는 AI 요청입니다.');
 if(!aiEnabled())throw Error('설정의 AI 추천 사용을 켜 주세요.');
 await window.joinSharedActivity();if(!aiEnabled())throw Error('AI 추천이 꺼졌습니다.');
 const controller=new AbortController();controllers.add(controller);const timeout=setTimeout(()=>controller.abort(),11000);
 try{
  const r=await fetch('/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...values,consent:true}),signal:controller.signal});
  const data=await r.json();if(!r.ok)throw Error(data.error||'추천을 불러오지 못했습니다.');if(!aiEnabled())throw Error('AI 추천이 꺼졌습니다.');return data;
 }finally{clearTimeout(timeout);controllers.delete(controller);}
}
export function recommendationStatus(result){return result.mode==='ai'?'AI가 선택한 조합 · 설정은 직접 적용됩니다.':'기본 추천 · AI 연결을 사용할 수 없어 등록된 콘텐츠에서 골랐습니다.';}

const details=document.createElement('details');details.id='personalization-settings';details.className='preference-settings';
details.innerHTML='<summary>추천 및 접근성</summary><div class="preference-body"><label class="setting-check"><span>AI 추천 사용</span><input id="ai-personalization" type="checkbox"></label><p class="preference-note">추천을 누를 때 선택한 음악 취향·전시 분야만 OpenAI로 전송됩니다. 소원 장식 추천은 입력한 소원도 전송합니다. 자동으로 행동을 분석하지 않습니다.</p><div class="preference-grid"><label>음악 스타일<select id="preference-style"></select></label><label>분위기<select id="preference-pace"></select></label></div><button id="recommend-music" type="button" class="quiet-action">음악 추천</button><p id="recommendation-status" role="status"></p><div id="music-recommendations" class="experience-cards"></div><label class="setting-check"><span>번쩍임 줄이기</span><input id="reduce-flash" type="checkbox"></label><p class="preference-note">선호도는 이 브라우저에만 저장됩니다. AI 요청 본문을 앱 서버의 데이터베이스에 보관하지 않습니다. OpenAI의 보관 정책은 별도로 적용됩니다.</p><button id="reset-preferences" type="button" class="quiet-action">추천 설정 지우기</button></div>';
document.querySelector('#pane-audio .music-credit').after(details);
const toggle=details.querySelector('#ai-personalization'),style=details.querySelector('#preference-style'),pace=details.querySelector('#preference-pace'),flash=details.querySelector('#reduce-flash'),recommend=details.querySelector('#recommend-music'),status=details.querySelector('#recommendation-status'),cards=details.querySelector('#music-recommendations');
for(const [select,options]of [[style,musicStyles],[pace,musicPaces]])for(const [id,label]of Object.entries(options)){const o=document.createElement('option');o.value=id;o.textContent=label;select.append(o);}
function apply(prefs){preferences=prefs;toggle.checked=prefs.ai;style.value=prefs.style;pace.value=prefs.pace;flash.checked=prefs.reduceFlash;document.body.classList.toggle('reduce-flash',prefs.reduceFlash);recommend.disabled=!prefs.ai;for(const select of [style,pace])select.dispatchEvent(new Event('lab:select-sync'));window.dispatchEvent(new CustomEvent('lab:preferences',{detail:prefs}));}
function changed(){requestId++;for(const controller of controllers)controller.abort();const prefs=normalizePreferences({ai:toggle.checked,style:style.value,pace:pace.value,reduceFlash:flash.checked});const saved=savePreferences(prefs);apply(prefs);if(!prefs.ai)for(const controller of controllers)controller.abort();cards.replaceChildren();status.textContent=saved?'':'이 브라우저에서 설정을 저장할 수 없습니다.';}
for(const input of [toggle,style,pace,flash])input.addEventListener('change',changed);
let requestId=0;
recommend.onclick=async()=>{
 const id=++requestId,prefs=preferences;recommend.disabled=true;status.textContent='선택한 취향으로 추천 중…';cards.replaceChildren();
 try{
  const result=await requestPersonalization('music',{style:prefs.style,pace:prefs.pace});if(id!==requestId||!aiEnabled())return;
  renderExperienceCards(cards,result,{onPlay(id){const select=document.querySelector('#music-select');select.value=id;select.dispatchEvent(new Event('change',{bubbles:true}));window.labSound?.('select');}});status.textContent=recommendationStatus(result);
 }catch(error){if(aiEnabled()&&id===requestId){const fallback={cards:rankMusic(winterTracks,prefs).slice(0,3).map(item=>({component:'RecommendationCard',item}))};renderExperienceCards(cards,fallback,{onPlay(id){const select=document.querySelector('#music-select');select.value=id;select.dispatchEvent(new Event('change',{bubbles:true}));}});status.textContent=error.name==='AbortError'?'연결 시간이 초과되어 기본 추천을 표시합니다.':error.message+' 기본 추천을 표시합니다.';}}
 finally{if(id===requestId)recommend.disabled=!aiEnabled();}
};
details.querySelector('#reset-preferences').onclick=()=>{requestId++;for(const controller of controllers)controller.abort();const prefs=normalizePreferences();savePreferences(prefs);apply(prefs);cards.replaceChildren();status.textContent='추천 설정을 초기화했습니다.';};
window.addEventListener('pagehide',()=>{for(const controller of controllers)controller.abort();});apply(readPreferences());

document.addEventListener('close',e=>{if(['studio','wish-panel','quick-quiz','exhibit-panel'].includes(e.target.id)){for(const controller of controllers)controller.abort();if(e.target.id==='studio'){requestId++;recommend.disabled=!aiEnabled();status.textContent='';}}},true);
