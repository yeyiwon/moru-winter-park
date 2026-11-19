import {decorationCatalog,decorationColors,decorationIcon} from './decorations.js';
import {makePanel,communityRequest as request} from './panels.js';
import {fireworkRequestState,mergeFireworkShow} from './fireworks-request.js';
import {fireworkConfig} from './firework-score.js';
import {observeServerTime,serverNow} from './server-clock.js';
const wishes=makePanel('wish-panel','소원',`<form id="wish-form"><div class="wish-compose-head"><div class="wish-preview" aria-hidden="true"></div><div><span class="field-caption">트리 장식</span><p data-selected-decoration></p></div></div><input type="hidden" name="kind" value="heart"><details class="wish-decoration-options"><summary>장식 변경</summary><div class="wish-shapes" role="group" aria-label="장식 모양">${Object.entries(decorationCatalog).map(([id,item])=>`<button type="button" data-wish-kind="${id}" aria-label="${item.name}" title="${item.name}">${decorationIcon(id)}<span>${item.name}</span></button>`).join('')}</div><div class="wish-color-row"><div class="wish-swatches" role="group" aria-label="장식 색상">${decorationColors.map(color=>`<button type="button" data-wish-color="${color}" style="--swatch:${color}" aria-label="${color}"></button>`).join('')}<label class="wish-custom-color" aria-label="사용자 지정 색상"><input type="color" name="color" value="#e5bb6b" aria-label="사용자 지정 색상"><span>＋</span></label></div></div></details><label class="wish-message"><span>소원 <output data-count>0 / 160</output></span><textarea name="message" maxlength="160" rows="2" required placeholder="소원을 적어 주세요"></textarea></label><p class="fine-print">이 공간의 방문자에게 공개됩니다.</p><button class="panel-primary" type="submit">트리에 달기 <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button><output role="status"></output></form>`);
window.addEventListener('lab:wish-submitted',()=>{wishes.dialog.close();if(wishFeed.dialog.open)loadWishes();});
window.addEventListener('lab:room',()=>wishFeed.close());
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&wishFeed.dialog.open)wishFeed.close();});
const wishFeed=makePanel('wish-feed','소원 목록','<div id="wish-list"></div>',{modal:false});
const form=wishes.dialog.querySelector('form'),list=wishFeed.dialog.querySelector('#wish-list');
wishes.dialog.classList.add('is-composing');
function previewWish(){const p=form.querySelector('.wish-preview'),color=form.elements.color.value;p.innerHTML=decorationIcon(form.elements.kind.value);p.style.color=color;form.querySelector('[data-selected-decoration]').textContent=decorationCatalog[form.elements.kind.value]?.name||'';form.querySelectorAll('[data-wish-kind]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.wishKind===form.elements.kind.value));form.querySelectorAll('[data-wish-color]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.wishColor.toLowerCase()===color.toLowerCase()));form.querySelector('.wish-custom-color').style.setProperty('--swatch',color);form.querySelector('.wish-custom-color').classList.toggle('selected',!decorationColors.includes(color));}
form.addEventListener('click',e=>{const b=e.target.closest('button');if(b?.dataset.wishKind){form.elements.kind.value=b.dataset.wishKind;previewWish();}if(b?.dataset.wishColor){form.elements.color.value=b.dataset.wishColor;previewWish();}});
form.elements.color.addEventListener('input',previewWish);form.elements.message.addEventListener('input',()=>form.querySelector('[data-count]').textContent=form.elements.message.value.length+' / 160');previewWish();
window.addEventListener('lab:decoration-choice',e=>{if(decorationCatalog[e.detail.decoration])form.elements.kind.value=e.detail.decoration;if(/^#[0-9a-f]{6}$/i.test(e.detail.color))form.elements.color.value=e.detail.color;previewWish();});
async function loadWishes(selected){list.textContent='불러오는 중…';try{await window.joinSharedActivity();const data=await request('wishes'),items=data.wishes.filter(item=>item.visibility==='public');list.replaceChildren();if(!items.length){list.textContent='아직 소원이 없습니다.';return;}for(const item of items){const card=document.createElement('article');card.className='wish-card';card.dataset.wish=item.id;const who=document.createElement('small'),text=document.createElement('p'),actions=document.createElement('div');who.textContent=item.name+' · '+new Intl.DateTimeFormat('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(item.createdAt))+(item.visibility==='private'?' · 나만 보기':'');const icon=document.createElement('span');icon.className='wish-card-icon';icon.innerHTML=decorationIcon(item.kind);icon.style.color=item.color||'#e5bb6b';card.append(icon);const show=document.createElement('button');show.textContent='장식 보기';show.onclick=()=>{window.dispatchEvent(new CustomEvent('lab:highlight-ornament',{detail:item.id}));};actions.append(show);text.textContent=item.message;card.append(who,text,actions);if(item.visibility==='public'){const react=document.createElement('button');react.textContent='♡ '+item.reactions;react.setAttribute('aria-label','소원에 하트');react.setAttribute('aria-pressed',!!item.reacted);react.onclick=async()=>{react.disabled=true;try{await request('wishes',{action:'react',id:item.id});await loadWishes(item.id);}catch(e){react.disabled=false;card.append(document.createTextNode(e.message));}};actions.append(react);}if(!item.mine){const report=document.createElement('button');report.textContent='신고';report.onclick=()=>reportContent({type:'wish',id:item.id});actions.append(report);}list.append(card);}if(selected)list.querySelector(`[data-wish="${CSS.escape(selected)}"]`)?.scrollIntoView({block:'nearest'});}catch(e){list.textContent=e.message;}}
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
const adminPanel=makePanel('admin-panel','관리',`
 <div class="admin-toolbar"><output data-admin-status role="status"></output><button type="button" data-refresh>새로고침</button></div>
 <details class="admin-section" open><summary><span>신고</span><span class="admin-count" data-count-reports></span></summary><div data-reports></div></details>
 <details class="admin-section"><summary><span>접속자 · 채팅</span><span class="admin-count" data-count-people></span></summary><div data-people></div></details>
 <details class="admin-section"><summary><span>트리 장식</span><span class="admin-count" data-decoration-count></span></summary><div class="admin-section-tools"><span>소원 글은 유지됩니다.</span><button type="button" data-clear-decorations disabled>장식 전체 삭제</button></div><p class="fine-print">삭제 전에 복구용 기록을 저장합니다.</p><div data-decorations></div></details>
 <details class="admin-section"><summary><span>퀴즈 관리</span><span class="admin-count" data-count-quizzes></span></summary><p class="fine-print">새 후보의 출처와 정답을 확인한 뒤 출제 중지를 해제하고 저장하세요.</p><p class="admin-generation" data-generation></p><div data-candidates></div><div data-quizzes></div><form data-quiz-form><input name="id" type="hidden"><label>문제<input name="question" maxlength="240" required></label><label>분야<select name="category"><option>과학</option><option>역사</option><option>지리</option><option>동물</option><option>자연</option><option>예술</option><option>일반</option></select></label>${[1,2,3,4].map(n=>`<label>보기 ${n}<input name="option${n}" maxlength="120" required></label>`).join('')}<label>정답<select name="answer">${[0,1,2,3].map(n=>`<option value="${n}">${n+1}번</option>`).join('')}</select></label><label>해설<textarea name="explanation" maxlength="1000" required></textarea></label><label>출처 제목<input name="sourceTitle" required></label><label>출처 링크<input type="url" name="sourceURL" required></label><label class="check-label"><input type="checkbox" name="disabled">출제 중지</label><button class="panel-primary">문제 저장</button></form></details>`);
const adminScroll=adminPanel.dialog.querySelector('.panel-scroll');
const adminStatus=adminPanel.dialog.querySelector('[data-admin-status]');
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
 showControls.querySelector('[data-show-start]').disabled=showBusy||state.phase!=='idle';
 showControls.querySelector('[data-show-stop]').disabled=showBusy||!active;
 if(!adminPanel.dialog.open||document.hidden||!showKnown||state.phase==='idle')return;
 const endsAt=lastShow.endsAt??lastShow.startsAt+fireworkConfig.duration*1000;
 const boundary=state.phase==='scheduled'?lastShow.startsAt:state.phase==='playing'?endsAt:lastShow.nextRequestAt??endsAt+fireworkConfig.cooldownMs;
 // Align the next local update to the countdown boundary. No network polling
 // is needed, and a sub-second remainder cannot enable a request too early.
 const remaining=Math.max(1,boundary-now),delay=Math.min(1000,Math.max(1,Math.ceil(remaining%1000||1000)));
 showTimer=window.setTimeout(renderShowStatus,delay);
}
function showStatus(show){lastShow=mergeFireworkShow(lastShow,show);showKnown=true;if(adminPanel.dialog.open)renderShowStatus();}
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
adminPanel.dialog.addEventListener('close',()=>{if(!adminPanel.dialog.open)clearShowTimer();});
document.addEventListener('visibilitychange',()=>{if(adminPanel.dialog.open)renderShowStatus();else clearShowTimer();});
window.addEventListener('pagehide',clearShowTimer);
window.addEventListener('pageshow',()=>{if(adminPanel.dialog.open)renderShowStatus();});
for(const operation of ['start','stop'])showControls.querySelector('[data-show-'+operation+']').onclick=async()=>{
 if(showBusy||!showKnown)return;const state=fireworkRequestState(lastShow,serverNow());
 if(operation==='start'?state.phase!=='idle':!['scheduled','playing'].includes(state.phase)){renderShowStatus();return;}
 showBusy=true;showError();renderShowStatus();
 try{await requestFireworks(operation);}
 catch(error){showError(error.message);}
 finally{showBusy=false;renderShowStatus();}
};
const invitationSettings=document.createElement('details');invitationSettings.className='admin-section';invitationSettings.innerHTML='<summary><span>초대 링크 관리</span></summary>';
const invitationForm=document.querySelector('#admin-invite');if(invitationForm)invitationSettings.append(invitationForm);adminScroll.append(invitationSettings);
for(const section of adminScroll.querySelectorAll(':scope > details'))section.addEventListener('toggle',()=>{
 if(!section.open)return;
 for(const other of adminScroll.querySelectorAll(':scope > details[open]'))if(other!==section)other.open=false;
});
const adminButton=document.createElement('button');adminButton.id='open-admin';adminButton.textContent='관리';adminButton.hidden=true;adminButton.className='quiet-action';document.querySelector('#pane-social').prepend(adminButton);
window.addEventListener('lab:access',e=>{adminButton.hidden=!e.detail.admin;if(!e.detail.admin&&adminPanel.dialog.open)adminPanel.close();});
async function action(body){
 try{await request('admin',body);if(body.action.includes('quiz'))window.dispatchEvent(new Event('lab:quiz-updated'));await loadAdmin('저장했습니다.');}
 catch(error){adminStatus.textContent=error.message;}
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
adminPanel.dialog.querySelector('[data-clear-decorations]').onclick=async()=>{
 if(!decorationSnapshot)return;
 const {count,revision}=decorationSnapshot,confirmation=window.prompt(`장식 ${count}개를 삭제합니다. 소원 글은 유지됩니다.\n확인하려면 ‘장식 ${count}개 삭제’를 입력하세요.`);
 if(confirmation!==`장식 ${count}개 삭제`)return;
 const button=adminPanel.dialog.querySelector('[data-clear-decorations]');button.disabled=true;
 try{await action({action:'clear-decorations',count,revision,confirmation});}finally{button.disabled=!decorationSnapshot?.count;}
};
async function loadAdmin(message=''){
 const load=++adminLoad,refresh=adminPanel.dialog.querySelector('[data-refresh]');refresh.disabled=true;adminStatus.textContent='불러오는 중…';
 try{
  const [data,firework,base]=await Promise.all([
   request('admin'),
   requestFireworks().catch(error=>{if(load===adminLoad)showError(error.message);return null;}),
   fetch('/content/daily-trivia.json').then(r=>{if(!r.ok)throw Error();return r.json();}).catch(()=>[]),
   Promise.resolve(window.refreshWinterInvites?.()).catch(error=>{if(load===adminLoad){const output=document.querySelector('#invite-result');if(output)output.textContent=error.message;}}),
  ]);
  if(load!==adminLoad)return;
  if(firework)showError();
  decorationSnapshot={count:data.decorations.length,revision:data.decorationRevision};
  adminPanel.dialog.querySelector('[data-decoration-count]').textContent=data.decorations.length+'개';
  adminPanel.dialog.querySelector('[data-clear-decorations]').disabled=!data.decorations.length;
  for(const name of ['reports','people','decorations','quizzes','candidates','generation'])adminPanel.dialog.querySelector('[data-'+name+']').replaceChildren();
  const get=name=>adminPanel.dialog.querySelector('[data-'+name+']');
  for(const q of data.candidates||[])row(get('candidates'),q.question,[['검토·편집',()=>fillQuiz(q)],['제외',()=>action({action:'reject-candidate',id:q.id})]],{state:'검토 대기'});
  for(const run of (data.generation||[]).slice(0,1))get('generation').textContent=run.day+' · '+({review:'검토 대기 '+run.count+'개',failed:'생성 실패 · 기존 문제 유지',running:'준비 중'}[run.status]||run.status);
  for(const report of data.reports)row(get('reports'),({chat:'채팅',wish:'소원',decoration:'트리 장식'}[report.type]||report.type)+' 신고',[['내용 삭제',()=>action({action:report.type==='chat'?'clear-chat':report.type==='wish'?'remove-wish':'remove-decoration',id:report.targetId})],['처리 완료',()=>action({action:'resolve',id:report.id})]],{detail:report.reason});
  for(const person of data.people)row(get('people'),person.name,[['채팅 삭제',()=>action({action:'clear-chat',id:person.id})],['강퇴',()=>action({action:'kick',id:person.id})],['이용 제한',()=>action({action:'block',id:person.id})]],{detail:person.chat||''});
  for(const item of data.decorations)row(get('decorations'),decorationCatalog[item.kind]?.name||item.kind,[['삭제',()=>action({action:'remove-decoration',id:item.id})]],{detail:item.room==='winter-plaza'?'겨울 광장':item.room});
  const quizMap=new Map(base.map(q=>[q.id,q]));for(const q of data.quizzes)quizMap.set(q.id,q);
  for(const q of quizMap.values())row(get('quizzes'),q.question,[['편집',()=>fillQuiz(q)],['삭제',()=>action({action:'remove-quiz',id:q.id})]],{detail:q.category||'',state:q.disabled?'출제 중지':''});
  for(const [name,count] of [['reports',data.reports.length],['people',data.people.length],['quizzes',quizMap.size]])adminPanel.dialog.querySelector('[data-count-'+name+']').textContent=count+'개';
  empty(get('reports'),'접수된 신고가 없습니다.');empty(get('people'),'현재 접속자가 없습니다.');empty(get('decorations'),'트리 장식이 없습니다.');empty(get('quizzes'),'등록된 문제가 없습니다.');
  adminStatus.textContent=message;
 }catch(error){if(load===adminLoad)adminStatus.textContent=error.message;}
 finally{if(load===adminLoad)refresh.disabled=false;}
}
function fillQuiz(q){
 const form=adminPanel.dialog.querySelector('[data-quiz-form]');
 for(const key of ['id','question','category','answer','explanation'])form.elements[key].value=q[key];
 q.options.forEach((value,i)=>form.elements['option'+(i+1)].value=value);form.elements.sourceTitle.value=q.source.title;form.elements.sourceURL.value=q.source.url;form.elements.disabled.checked=q.disabled;
 form.scrollIntoView({block:'nearest'});form.elements.question.focus({preventScroll:true});
}
adminButton.onclick=()=>{adminPanel.open();if(window.labFireworks)showStatus(window.labFireworks);else renderShowStatus();void loadAdmin();};adminPanel.dialog.querySelector('[data-refresh]').onclick=()=>loadAdmin();
adminPanel.dialog.querySelector('[data-quiz-form]').onsubmit=async e=>{
 e.preventDefault();const form=e.target,button=form.querySelector('[type=submit],.panel-primary'),values=form.elements;button.disabled=true;
 try{await action({action:'save-quiz',id:values.id.value,quiz:{question:values.question.value,category:values.category.value,options:[1,2,3,4].map(n=>values['option'+n].value),answer:Number(values.answer.value),explanation:values.explanation.value,source:{title:values.sourceTitle.value,url:values.sourceURL.value},disabled:values.disabled.checked}});}
 finally{button.disabled=false;}
};
