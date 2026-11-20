import {paintSwatches} from './color-swatches.js';
import {showOrnamentPreview} from './ornament-preview.js';
import {decorationCatalog,decorationColors} from './decorations.js';
import {makePanel,communityRequest as request} from './panels.js';
import {fireworkRequestState,mergeFireworkShow} from './fireworks-request.js';
import {fireworkConfig} from './firework-score.js';
import {observeServerTime,serverNow} from './server-clock.js';
const wishes=makePanel('wish-panel','소원',`<form id="wish-form"><div class="wish-compose-head"><div class="wish-preview" aria-hidden="true"></div><div><span class="field-caption">트리 장식</span><p data-selected-decoration></p></div></div><input type="hidden" name="kind" value="heart"><details class="wish-decoration-options"><summary>장식 변경</summary><div class="wish-shapes" role="group" aria-label="장식 모양">${Object.entries(decorationCatalog).map(([id,item])=>`<button type="button" data-wish-kind="${id}" aria-label="${item.name}" title="${item.name}"><span class="ornament-choice" aria-hidden="true"></span><span>${item.name}</span></button>`).join('')}</div><div class="wish-color-row"><div class="wish-swatches" role="group" aria-label="장식 색상">${decorationColors.map(color=>`<button type="button" data-wish-color="${color}" style="--swatch:${color}" aria-label="${color}"></button>`).join('')}<label class="wish-custom-color" aria-label="사용자 지정 색상"><input type="color" name="color" value="#e5bb6b" aria-label="사용자 지정 색상"><span>＋</span></label></div></div></details><label class="wish-message"><span>소원 <output data-count>0 / 160</output></span><textarea name="message" maxlength="160" rows="2" required placeholder="소원을 적어 주세요"></textarea></label><p class="fine-print">이 공간의 방문자에게 공개됩니다.</p><button class="panel-primary" type="submit">트리에 달기 <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button><output role="status"></output></form>`);
window.addEventListener('lab:wish-submitted',()=>{wishes.dialog.close();if(wishFeed.dialog.open)loadWishes();});
window.addEventListener('lab:room',()=>wishFeed.close());
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&wishFeed.dialog.open)wishFeed.close();});
const wishFeed=makePanel('wish-feed','소원 목록','<div id="wish-list"></div>',{modal:false});
const form=wishes.dialog.querySelector('form'),list=wishFeed.dialog.querySelector('#wish-list');
wishes.dialog.classList.add('is-composing');
function previewWish(refreshChoices=true){const p=form.querySelector('.wish-preview'),color=form.elements.color.value;showOrnamentPreview(p,form.elements.kind.value,color);form.querySelector('[data-selected-decoration]').textContent=decorationCatalog[form.elements.kind.value]?.name||'';form.querySelectorAll('[data-wish-kind]').forEach(b=>{b.setAttribute('aria-pressed',b.dataset.wishKind===form.elements.kind.value);if(refreshChoices)showOrnamentPreview(b.querySelector('.ornament-choice'),b.dataset.wishKind,color);});form.querySelectorAll('[data-wish-color]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.wishColor.toLowerCase()===color.toLowerCase()));form.querySelector('.wish-custom-color').style.setProperty('--swatch',color);form.querySelector('.wish-custom-color').classList.toggle('selected',!decorationColors.includes(color));paintSwatches(form);}
form.addEventListener('click',e=>{const b=e.target.closest('button');if(b?.dataset.wishKind){form.elements.kind.value=b.dataset.wishKind;previewWish();}if(b?.dataset.wishColor){form.elements.color.value=b.dataset.wishColor;previewWish();}});
form.elements.color.addEventListener('input',()=>previewWish(false));form.elements.color.addEventListener('change',()=>previewWish());form.elements.message.addEventListener('input',()=>form.querySelector('[data-count]').textContent=form.elements.message.value.length+' / 160');previewWish();
window.addEventListener('lab:decoration-choice',e=>{if(decorationCatalog[e.detail.decoration])form.elements.kind.value=e.detail.decoration;if(/^#[0-9a-f]{6}$/i.test(e.detail.color))form.elements.color.value=e.detail.color;previewWish();});
async function loadWishes(selected){list.textContent='불러오는 중…';try{await window.joinSharedActivity();const data=await request('wishes'),items=data.wishes.filter(item=>item.visibility==='public');list.replaceChildren();if(!items.length){list.textContent='아직 소원이 없습니다.';return;}for(const item of items){const card=document.createElement('article');card.className='wish-card';card.dataset.wish=item.id;const who=document.createElement('small'),text=document.createElement('p'),actions=document.createElement('div');who.textContent=item.name+' · '+new Intl.DateTimeFormat('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(item.createdAt))+(item.visibility==='private'?' · 나만 보기':'');const icon=document.createElement('span');icon.className='wish-card-icon';showOrnamentPreview(icon,item.kind,item.color);card.append(icon);const show=document.createElement('button');show.textContent='장식 보기';show.onclick=()=>{window.dispatchEvent(new CustomEvent('lab:highlight-ornament',{detail:item.id}));};actions.append(show);text.textContent=item.message;card.append(who,text,actions);if(item.visibility==='public'){const react=document.createElement('button');react.textContent='♡ '+item.reactions;react.setAttribute('aria-label','소원에 하트');react.setAttribute('aria-pressed',!!item.reacted);react.onclick=async()=>{react.disabled=true;try{await request('wishes',{action:'react',id:item.id});await loadWishes(item.id);}catch(e){react.disabled=false;card.append(document.createTextNode(e.message));}};actions.append(react);}if(!item.mine){const report=document.createElement('button');report.textContent='신고';report.onclick=()=>reportContent({type:'wish',id:item.id});actions.append(report);}list.append(card);}if(selected)list.querySelector(`[data-wish="${CSS.escape(selected)}"]`)?.scrollIntoView({block:'nearest'});}catch(e){list.textContent=e.message;}}
window.openWishList=id=>{wishFeed.open();loadWishes(id);};window.openWishComposer=({kind,color}={})=>{form.querySelector('.wish-decoration-options').open=false;if(decorationCatalog[kind])form.elements.kind.value=kind;if(/^#[0-9a-f]{6}$/i.test(color))form.elements.color.value=color;previewWish();wishes.open();form.elements.message.focus();};
form.onsubmit=async e=>{
 e.preventDefault();const output=form.querySelector('output[role=status]'),button=form.querySelector('[type=submit]');if(button.disabled)return;
 const data={message:form.elements.message.value.trim(),visibility:'public',kind:form.elements.kind.value,color:form.elements.color.value};if(!data.message)return;
 button.disabled=true;output.textContent='';
 try{
  if(!window.submitTreeWish)throw Error('트리를 준비하고 있습니다. 잠시 후 다시 시도해 주세요.');
  await window.submitTreeWish(data);form.elements.message.value='';form.querySelector('[data-count]').textContent='0 / 160';wishes.close();
 }catch(err){output.textContent=err.message;}finally{button.disabled=false;}
};
const reportPanel=makePanel('report-panel','신고',`<form><label>사유<textarea name="reason" maxlength="200" rows="3" required placeholder="신고 사유"></textarea></label><button class="panel-primary">신고 보내기</button><output role="status"></output></form>`);let reportTarget;
function reportContent(target){reportTarget=target;reportPanel.dialog.querySelector('form').reset();reportPanel.dialog.querySelector('output').textContent='';reportPanel.open();}window.addEventListener('lab:report',e=>reportContent(e.detail));reportPanel.dialog.querySelector('form').onsubmit=async e=>{e.preventDefault();const output=reportPanel.dialog.querySelector('output'),button=e.target.querySelector('button');button.disabled=true;try{await request('reports',{...reportTarget,reason:e.target.elements.reason.value});output.textContent='신고를 접수했습니다.';e.target.reset();}catch(err){output.textContent=err.message;}finally{button.disabled=false;}};
// Administration keeps one section open at a time. Operational notices and
// scheduled event editing are intentionally absent; existing server data stays intact.
const adminRoot=document.createElement('section');adminRoot.id='admin-panel';adminRoot.hidden=!window.labAdmin;adminRoot.setAttribute('aria-label','관리');adminRoot.innerHTML=`<div class="panel-scroll">
 <div class="admin-toolbar"><output data-admin-status role="status"></output><button type="button" data-refresh>새로고침</button></div>
 <details class="admin-section" open><summary><span>신고</span><span class="admin-count" data-count-reports></span></summary><div data-reports></div></details>
 <details class="admin-section"><summary><span>접속자 · 채팅</span><span class="admin-count" data-count-people></span></summary><div data-people></div></details>
 <details class="admin-section"><summary><span>트리 장식</span><span class="admin-count" data-decoration-count></span></summary><div class="admin-section-tools"><span>소원 글은 유지됩니다.</span><button type="button" data-clear-decorations disabled>장식 전체 삭제</button></div><p class="fine-print">삭제 전에 복구용 기록을 저장합니다.</p><div data-decorations></div></details>
 <details class="admin-section"><summary><span>퀴즈 관리</span><span class="admin-count" data-count-quizzes></span></summary><p class="fine-print">새 후보의 출처와 정답을 확인한 뒤 출제 중지를 해제하고 저장하세요.</p><p class="admin-generation" data-generation></p><div data-candidates></div><div data-quizzes></div><form data-quiz-form><input name="id" type="hidden"><label>문제<input name="question" maxlength="240" required></label><label>분야<select name="category"><option>과학</option><option>역사</option><option>지리</option><option>동물</option><option>자연</option><option>예술</option><option>일반</option></select></label>${[1,2,3,4].map(n=>`<label>보기 ${n}<input name="option${n}" maxlength="120" required></label>`).join('')}<label>정답<select name="answer">${[0,1,2,3].map(n=>`<option value="${n}">${n+1}번</option>`).join('')}</select></label><label>해설<textarea name="explanation" maxlength="1000" required></textarea></label><label>출처 제목<input name="sourceTitle" required></label><label>출처 링크<input type="url" name="sourceURL" required></label><label class="check-label"><input type="checkbox" name="disabled">출제 중지</label><button class="panel-primary">문제 저장</button></form></details></div>`;
document.querySelector('#pane-social').prepend(adminRoot);
const adminVisible=()=>!!window.labAdmin&&document.querySelector('#studio').open&&!document.querySelector('#pane-social').hidden;
const adminScroll=adminRoot.querySelector('.panel-scroll');
const adminStatus=adminRoot.querySelector('[data-admin-status]');
const operations=document.createElement('details');operations.className='admin-section';operations.innerHTML='<summary><span>서버 운영</span></summary><div data-operations-status></div><form data-world-settings><fieldset><legend>이용 가능한 콘텐츠</legend><label class="check-label"><input type="checkbox" name="museum" checked>별빛 만물관</label><label class="check-label"><input type="checkbox" name="tree" checked>트리 꾸미기</label></fieldset><button class="panel-primary">저장</button></form>';
adminScroll.prepend(operations);
for(const [id,title] of [['blocks','차단 관리'],['audit','관리 기록']]){const section=document.createElement('details');section.className='admin-section';section.innerHTML='<summary><span>'+title+'</span></summary><div data-'+id+'></div>';adminScroll.append(section);}
const logout=document.createElement('button');logout.type='button';logout.className='admin-logout';logout.textContent='관리자 로그아웃';logout.onclick=async()=>{await request('owner-auth',{action:'logout'});location.assign('/');};logout.hidden=location.hostname.endsWith('.chatgpt.site');adminScroll.append(logout);
operations.querySelector('form').onsubmit=async event=>{event.preventDefault();const form=event.target,button=form.querySelector('button');button.disabled=true;try{const settings=await request('operations',{disabled:['museum','tree'].filter(key=>!form.elements[key].checked)});window.dispatchEvent(new CustomEvent('lab:world-settings',{detail:settings}));adminStatus.textContent='운영 설정을 저장했습니다.';}catch(error){adminStatus.textContent=error.message;}finally{button.disabled=false;}};
async function loadOperations(){
 const data=await request('operations'),form=operations.querySelector('form');for(const key of ['museum','tree'])form.elements[key].checked=!data.settings.disabled.includes(key);
 const output=operations.querySelector('[data-operations-status]'),summary=document.createElement('dl');summary.className='operations-metrics';output.replaceChildren(summary);
 const entries=[['서비스',data.service==='healthy'?'정상':data.service==='degraded'?'실시간 연결 확인 필요':'기본 연결'],['실시간 연결',data.realtime?data.realtime.connections+' / '+data.roomCapacity:'UNKNOWN'],['재연결',data.realtime?data.realtime.reconnected+'회 ('+(100*data.realtime.reconnected/Math.max(1,data.realtime.accepted)).toFixed(1)+'%)':'UNKNOWN'],['연결 종료 / 거부',data.realtime?data.realtime.closed+' / '+data.realtime.rejected:'UNKNOWN'],['이동 처리 p95',data.realtime?.handlerP95Ms!=null?data.realtime.handlerP95Ms+' ms':'UNKNOWN'],['이동 처리 평균',data.realtime?.handlerMeanMs!=null?data.realtime.handlerMeanMs.toFixed(2)+' ms':'UNKNOWN'],['클라이언트 보고 왕복 평균 / p95',data.realtime?.clientRTTMeanMs!=null?data.realtime.clientRTTMeanMs.toFixed(0)+' / '+data.realtime.clientRTTP95Ms.toFixed(0)+' ms':'UNKNOWN'],['데이터베이스',data.database==='healthy'?'정상':'확인 필요'],['실시간 서버 버전',data.realtime?.revision?.slice(0,8)||'UNKNOWN'],['통신 규격',data.realtime?.protocol===data.protocol?'일치':'확인 필요'],['최근 1시간 오류',(data.errorTrend||[]).reduce((sum,item)=>sum+item.count,0)+'건'],['상태 조회 응답',data.latencyMs+' ms'],['서버 버전',data.revision],['장식 백업',data.backup?.decorations?.latestAt?new Date(data.backup.decorations.latestAt).toLocaleString('ko-KR'):'없음'],['전체 DB 복구 확인',data.backup?.fullDatabase||'UNKNOWN']];
 for(const [key,value] of entries){const term=document.createElement('dt'),valueNode=document.createElement('dd');term.textContent=key;valueNode.textContent=key==='서버 버전'?String(value).slice(0,8):String(value);if(key==='서버 버전')valueNode.title=String(value);const metric=document.createElement('div');metric.className='operations-metric';metric.append(term,valueNode);summary.append(metric);}
 for(const item of data.counts){const line=document.createElement('p');line.textContent=({outdoors:'야외',ryokan:'료칸',museum:'별빛 만물관'}[item.region]||item.region)+' · '+item.count+'명';output.append(line);}
 for(const item of data.errors){const line=document.createElement('p');line.textContent=new Date(item.createdAt).toLocaleString('ko-KR')+' · '+item.route+' · '+item.code+' · '+item.revision;output.append(line);}
}

const showControls=document.createElement('details');
showControls.className='admin-section';
showControls.innerHTML='<summary><span>불꽃놀이</span><output class="admin-state" data-show-status role="status" aria-live="off">확인 중</output></summary><div class="admin-show-actions"><button type="button" data-show-start disabled>공연 시작</button><button type="button" data-show-stop disabled>종료</button></div><p data-show-error role="alert" hidden></p>';
adminScroll.insertBefore(showControls,adminScroll.querySelector('.admin-section'));
let lastShow=null,showKnown=false,showBusy=false,showTimer=0;
const showCountdown=seconds=>Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
function clearShowTimer(){window.clearTimeout(showTimer);showTimer=0;}
function renderShowStatus(){
 clearShowTimer();
 const now=serverNow(),state=showKnown?fireworkRequestState(lastShow,now):{phase:'unknown',remaining:0},active=['scheduled','playing'].includes(state.phase),output=showControls.querySelector('[data-show-status]');
 const label=state.phase==='scheduled'?'시작 예정':state.phase==='playing'?'진행 중':state.phase==='cooldown'?'다음 신청 '+showCountdown(state.remaining):state.phase==='unknown'?'확인 중':'시작 가능';
 if(output.textContent!==label)output.textContent=label;output.dataset.state=state.phase;
 showControls.querySelector('[data-show-start]').disabled=showBusy||state.phase==='unknown'||active;
 showControls.querySelector('[data-show-stop]').disabled=showBusy||!active;
 if(!adminVisible()||document.hidden||!showKnown||state.phase==='idle')return;
 const endsAt=lastShow.endsAt??lastShow.startsAt+fireworkConfig.duration*1000;
 const boundary=state.phase==='scheduled'?lastShow.startsAt:state.phase==='playing'?endsAt:lastShow.nextRequestAt??endsAt+fireworkConfig.cooldownMs;
 // Align the next local update to the countdown boundary. No network polling
 // is needed, and a sub-second remainder cannot enable a request too early.
 const remaining=Math.max(1,boundary-now),delay=Math.min(1000,Math.max(1,Math.ceil(remaining%1000||1000)));
 showTimer=window.setTimeout(renderShowStatus,delay);
}
function showStatus(show){lastShow=mergeFireworkShow(lastShow,show);showKnown=true;if(adminVisible())renderShowStatus();}
async function requestFireworks(operation){
 const sent=Date.now(),response=await fetch('/api/fireworks',{method:operation?'POST':'GET',headers:operation?{'Content-Type':'application/json'}:undefined,body:operation?JSON.stringify({action:operation}):undefined,signal:AbortSignal.timeout(8000)}),data=await response.json(),received=Date.now();
 if(Number.isFinite(data.serverTime)){observeServerTime(data.serverTime,sent,received);window.labServerOffset=data.serverTime-(sent+received)/2;}
 // Conflict/rate-limit replies also carry the authoritative show. Accept them
 // before restoring controls so another guest's request cannot expose Start.
 if(Object.hasOwn(data,'show')){window.labFireworks=mergeFireworkShow(window.labFireworks,data.show);showStatus(window.labFireworks);window.dispatchEvent(new CustomEvent('lab:fireworks',{detail:window.labFireworks}));}
 if(!response.ok)throw Error(data.error||'연결을 확인해 주세요.');return data;
}
function showError(message=''){
 const output=showControls.querySelector('[data-show-error]');output.textContent=message;output.hidden=!message;
}
window.addEventListener('lab:fireworks',e=>showStatus(e.detail));
document.querySelector('#studio').addEventListener('close',clearShowTimer);
document.addEventListener('visibilitychange',()=>{if(adminVisible())renderShowStatus();else clearShowTimer();});
window.addEventListener('pagehide',clearShowTimer);
window.addEventListener('pageshow',()=>{if(adminVisible())renderShowStatus();});
for(const operation of ['start','stop'])showControls.querySelector('[data-show-'+operation+']').onclick=async()=>{
 if(showBusy||!showKnown)return;const state=fireworkRequestState(lastShow,serverNow());
 if(operation==='start'?['scheduled','playing'].includes(state.phase):!['scheduled','playing'].includes(state.phase)){renderShowStatus();return;}
 showBusy=true;showError();renderShowStatus();
 try{await requestFireworks(operation);}
 catch(error){showError(error.message);}
 finally{showBusy=false;renderShowStatus();}
};
adminScroll.prepend(adminScroll.querySelector('.admin-toolbar'));adminScroll.append(logout);
for(const section of adminScroll.querySelectorAll(':scope > details')){const content=document.createElement('div');content.className='admin-section-body';for(const child of [...section.children])if(child.tagName!=='SUMMARY')content.append(child);section.append(content);}
for(const section of adminScroll.querySelectorAll(':scope > details'))section.addEventListener('toggle',()=>{
 if(!section.open)return;
 for(const other of adminScroll.querySelectorAll(':scope > details[open]'))if(other!==section)other.open=false;
});
window.addEventListener('lab:access',e=>{adminRoot.hidden=!e.detail.admin;if(!e.detail.admin)clearShowTimer();});
async function action(body){
 try{await request('admin',body);if(['clear-decorations','remove-decoration','remove-wish'].includes(body.action))window.dispatchEvent(new Event('lab:tree-changed'));if(body.action.includes('quiz'))window.dispatchEvent(new Event('lab:quiz-updated'));await loadAdmin('저장했습니다.');return true;}
 catch(error){await loadAdmin();adminStatus.textContent=error.message;return false;}
}
function row(container,title,buttons,{detail='',state=''}={}){
 const el=document.createElement('div');el.className='admin-row';
 const content=document.createElement('div');content.className='admin-row-copy';
 const text=document.createElement('p');text.className='admin-row-title';text.textContent=title;content.append(text);
 if(detail){const note=document.createElement('p');note.className='admin-row-detail';note.textContent=detail;content.append(note);}
 if(state){const badge=document.createElement('span');badge.className='admin-row-state';badge.textContent=state;content.append(badge);}
 const actions=document.createElement('div');actions.className='admin-row-actions';
 for(const [name,fn] of buttons){const button=document.createElement('button');button.type='button';button.textContent=name;button.onclick=async()=>{button.disabled=true;try{await fn();}finally{if(button.isConnected)button.disabled=false;}};actions.append(button);}
 el.append(content,actions);container.append(el);
}
function empty(container,message){if(container.children.length)return;const text=document.createElement('p');text.className='admin-empty';text.textContent=message;container.append(text);}
let decorationSnapshot=null,adminLoad=0;
const clearConfirm=document.createElement('div');clearConfirm.className='admin-clear-confirm';clearConfirm.hidden=true;
clearConfirm.innerHTML='<p data-clear-summary></p><p>소원 글은 유지되고, 장식은 복구용 기록을 남긴 뒤 삭제됩니다.</p><button type="button" data-confirm-clear></button><button type="button" data-cancel-clear>취소</button>';
adminRoot.querySelector('[data-decorations]').before(clearConfirm);let pendingClear=null;
function cancelClear(){pendingClear=null;clearConfirm.hidden=true;}
adminRoot.querySelector('[data-clear-decorations]').onclick=()=>{
 if(!decorationSnapshot?.count)return;pendingClear={...decorationSnapshot};
 clearConfirm.querySelector('[data-clear-summary]').textContent=`트리 장식 ${pendingClear.count}개를 모두 삭제할까요?`;
 clearConfirm.querySelector('[data-confirm-clear]').textContent=`장식 ${pendingClear.count}개 삭제`;
 clearConfirm.hidden=false;clearConfirm.scrollIntoView?.({block:'nearest'});
};
clearConfirm.querySelector('[data-cancel-clear]').onclick=cancelClear;
clearConfirm.querySelector('[data-confirm-clear]').onclick=async()=>{
 if(!pendingClear)return;const {count,revision}=pendingClear;cancelClear();
 const button=adminRoot.querySelector('[data-clear-decorations]');button.disabled=true;
 try{await action({action:'clear-decorations',count,revision,confirmation:`장식 ${count}개 삭제`});}finally{button.disabled=!decorationSnapshot?.count;}
};
async function loadAdmin(message=''){
 const load=++adminLoad,refresh=adminRoot.querySelector('[data-refresh]');refresh.disabled=true;adminStatus.textContent='불러오는 중…';
 try{
  const [data,firework,base]=await Promise.all([
   request('admin'),
   requestFireworks().catch(error=>{if(load===adminLoad)showError(error.message);return null;}),
   fetch('/content/daily-trivia.json').then(r=>{if(!r.ok)throw Error();return r.json();}).catch(()=>[]),
  ]);
  if(load!==adminLoad)return;
  if(firework)showError();await loadOperations();
  cancelClear();decorationSnapshot={count:data.decorationCount??data.decorations.length,revision:data.decorationRevision};
  adminRoot.querySelector('[data-decoration-count]').textContent=decorationSnapshot.count+'개';
  adminRoot.querySelector('[data-clear-decorations]').disabled=!decorationSnapshot.count;
  for(const name of ['reports','people','decorations','quizzes','candidates','generation','blocks','audit'])adminRoot.querySelector('[data-'+name+']').replaceChildren();
  const get=name=>adminRoot.querySelector('[data-'+name+']');
  for(const item of data.blocks||[])row(get('blocks'),'방문자 '+item.id.slice(0,4).toUpperCase(),[['차단 해제',()=>action({action:'unblock',id:item.id})]]);
  for(const item of data.audit||[])row(get('audit'),item.action,[],{detail:new Date(item.createdAt).toLocaleString('ko-KR')+' · '+item.target});
  for(const q of data.candidates||[])row(get('candidates'),q.question,[['검토·편집',()=>fillQuiz(q)],['제외',()=>action({action:'reject-candidate',id:q.id})]],{state:'검토 대기'});
  for(const run of (data.generation||[]).slice(0,1))get('generation').textContent=run.day+' · '+({review:'검토 대기 '+run.count+'개',failed:'생성 실패 · 기존 문제 유지',running:'준비 중'}[run.status]||run.status);
  for(const report of data.reports)row(get('reports'),({chat:'채팅',wish:'소원',decoration:'트리 장식'}[report.type]||report.type)+' 신고',[['내용 삭제',()=>action({action:report.type==='chat'?'clear-chat':report.type==='wish'?'remove-wish':'remove-decoration',id:report.targetId})],['처리 완료',()=>action({action:'resolve',id:report.id})]],{detail:report.reason});
  for(const person of data.people){
   const buttons=[['채팅 삭제',()=>action({action:'clear-chat',id:person.id})]];
   if(person.authType!=='owner'&&person.id!==window.labGuestId)buttons.push(['강퇴',()=>action({action:'kick',id:person.id})],['이용 제한',()=>action({action:'block',id:person.id})],['접속 초기화',()=>{
    if(window.confirm(`${person.name} 기기의 닉네임·외형·접속 정보를 초기화할까요?\n해당 기기를 새로고침하면 처음 입장처럼 시작합니다. 소원과 퀴즈 기록은 삭제하지 않습니다.`))return action({action:'reset-visitor',id:person.id,confirmation:'접속 초기화'});
   }]);
   row(get('people'),person.name,buttons,{detail:person.chat||''});
  }
  for(const item of data.decorations)row(get('decorations'),decorationCatalog[item.kind]?.name||item.kind,[['삭제',()=>action({action:'remove-decoration',id:item.id})]],{detail:item.room==='winter-plaza'?'겨울 광장':item.room});
  const quizMap=new Map(base.map(q=>[q.id,q]));for(const q of data.quizzes)quizMap.set(q.id,q);
  for(const q of quizMap.values())row(get('quizzes'),q.question,[['편집',()=>fillQuiz(q)],['삭제',()=>action({action:'remove-quiz',id:q.id})]],{detail:q.category||'',state:q.disabled?'출제 중지':''});
  for(const [name,count] of [['reports',data.reports.length],['people',data.people.length],['quizzes',quizMap.size]])adminRoot.querySelector('[data-count-'+name+']').textContent=count+'개';
  empty(get('reports'),'접수된 신고가 없습니다.');empty(get('people'),'현재 접속자가 없습니다.');empty(get('decorations'),'트리 장식이 없습니다.');empty(get('quizzes'),'등록된 문제가 없습니다.');
  adminStatus.textContent=message;
 }catch(error){if(load===adminLoad)adminStatus.textContent=error.message;}
 finally{if(load===adminLoad)refresh.disabled=false;}
}
function fillQuiz(q){
 const form=adminRoot.querySelector('[data-quiz-form]');
 for(const key of ['id','question','category','answer','explanation'])form.elements[key].value=q[key];
 q.options.forEach((value,i)=>form.elements['option'+(i+1)].value=value);form.elements.sourceTitle.value=q.source.title;form.elements.sourceURL.value=q.source.url;form.elements.disabled.checked=q.disabled;
 form.scrollIntoView({block:'nearest'});form.elements.question.focus({preventScroll:true});
}
window.addEventListener('lab:settings-tab',e=>{if(e.detail!=='social'||!window.labAdmin){clearShowTimer();return;}if(window.labFireworks)showStatus(window.labFireworks);else renderShowStatus();void loadAdmin();});adminRoot.querySelector('[data-refresh]').onclick=()=>loadAdmin();
adminRoot.querySelector('[data-quiz-form]').onsubmit=async e=>{
 e.preventDefault();const form=e.target,button=form.querySelector('[type=submit],.panel-primary'),values=form.elements;button.disabled=true;
 try{await action({action:'save-quiz',id:values.id.value,quiz:{question:values.question.value,category:values.category.value,options:[1,2,3,4].map(n=>values['option'+n].value),answer:Number(values.answer.value),explanation:values.explanation.value,source:{title:values.sourceTitle.value,url:values.sourceURL.value},disabled:values.disabled.checked}});}
 finally{button.disabled=false;}
};

window.addEventListener('lab:room',()=>{if(window.labAdmin&&/^\/admin(?:\/|$)/.test(location.pathname))window.openWinterSettings?.('social');});
