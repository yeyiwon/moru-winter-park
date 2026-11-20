import {bubbleDuration,chatPreviewMs,chatShortcut,createChatViewport} from './chat-policy.js';
import {createRealtimeClient} from './realtime-client.js';
import {bindOwnerLogin,finishOwnerLogin,continueOwnerLogin} from './owner-login.js';
import {mergeFireworkShow} from './fireworks-request.js';
import {sharedSeatPose} from './ride-seats.js';
import {serverNow,observeServerTime} from './server-clock.js';
import {nicknameLimit,nicknameParts,validateNickname} from './nickname.js';
import {presenceDelay,createPresenceCache} from './presence-policy.js';
import {createGuestName,isNumberedGuest} from './guest-names.js';
import {encodeActivity} from './activity-state.js';
import {closeDialog} from './ui-motion.js';
import {publicRoom} from './space-links.js';
const $=s=>document.querySelector(s),form=$('#join-form'),status=$('#social-status'),people=$('#social-people'),nameInput=$('#visitor-name'),studio=$('#studio');
const entryURL=new URL(location.href),rawInvitation=new URLSearchParams(entryURL.hash.slice(1)).get('invite');
const adminEntry=/^\/admin(?:\/|$)/.test(entryURL.pathname);
let room=publicRoom,joined=false,admin=false,busy=false,gesture='',failures=0;
if(rawInvitation||entryURL.searchParams.has('room'))history.replaceState(null,'',entryURL.pathname);
$('#owner-signin').href='/signin-with-chatgpt?return_to=%2Fadmin';
try{nameInput.value=nicknameParts(localStorage.getItem('winter-visitor-name')||'').slice(0,nicknameLimit).join('');}catch{}
if(isNumberedGuest(nameInput.value))nameInput.value=createGuestName();
function setName(name){nameInput.value=name;if(document.querySelector('.wardrobe-profile')?.dataset.editing!=='true')$('#profile-name').value=name;$('#self-name').textContent=name;updateNicknameInputs();try{localStorage.setItem('winter-visitor-name',name);}catch{}}
// Cold WebGL compilation can delay processing the first session response.
// Give only session bootstrap the same bounded window as the loading screen.
async function request(path,body,method){const sent=Date.now();const r=await fetch('/api/'+path,{method:method||(body===undefined?'GET':'POST'),headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(['access','join'].includes(path)?30000:8000)});const data=await r.json();if(r.ok&&Number.isFinite(data.serverTime))observeServerTime(data.serverTime,sent,Date.now());if(!r.ok){const e=Error(data.error||'연결을 확인해 주세요.');e.status=r.status;if(typeof data.code==='string')e.code=data.code;throw e;}return data;}
let peopleSignature='';function showPeople(list){list=list.filter(p=>!window.isVisitorBlocked?.(p.id));window.dispatchEvent(new CustomEvent('lab:visitors',{detail:list}));const next=JSON.stringify(list.map(p=>[p.id,p.name,p.gesture==='wave']));if(next===peopleSignature)return;peopleSignature=next;people.replaceChildren();for(const person of list){const li=document.createElement('li');li.textContent=person.name+(person.gesture==='wave'?' · 인사':'');const block=document.createElement('button');block.textContent='차단';block.dataset.blockVisitor=person.id;block.setAttribute('aria-label',person.name+' 차단');li.append(block);people.append(li);}}
function openConnection(){ window.openWinterSettings?.('social'); }
function endGate(){document.body.classList.remove('invite-gate');if(studio.open)closeDialog(studio);$('.studio-head>span').textContent='설정';}

function gate(message,canJoin=false){
 joined=false;window.labSocialJoined=false;realtime.stop();showPeople([]);document.body.classList.add('invite-gate');
 if(window.labRideReservation)window.dispatchEvent(new CustomEvent('lab:ride-expired',{detail:window.labRideReservation.kind}));
 for(const dialog of document.querySelectorAll('dialog[open]'))if(dialog!==studio)dialog.close();
 openConnection();$('.studio-head>span').textContent='WINTERLIGHT 접속';$('#studio-section-en').textContent='CONNECTION';$('#studio-section-name').textContent='접속';$('#connection-description').textContent=message;form.hidden=!canJoin;
 window.dispatchEvent(new Event('lab:session-ended'));window.dispatchEvent(new Event('lab:pause'));window.labLoading?.complete('connection');
}
function entered(data){presenceCache.reset();nextSync=0;if(data.color)window.dispatchEvent(new CustomEvent('lab:restore-appearance',{detail:{fur:data.color,furTop:data.colorTop||null,accessory:data.accessory,fluff:data.fluff??100,roundness:data.roundness??50}}));
 if(window.labGuestId&&window.labGuestId!==data.id){showPeople([]);recentChats.length=0;seenChats.clear();chatLog.replaceChildren();selfBubble.hidden=true;window.labRideSeats=[];if(window.labRideReservation)window.dispatchEvent(new CustomEvent('lab:ride-expired',{detail:window.labRideReservation.kind}));window.labRideReservation=null;}
 room=publicRoom;joined=true;window.labSocialJoined=true;window.labGuestId=data.id;failures=0;setName(data.name);form.hidden=true;status.textContent='접속 중 · 1명';chatStatus.textContent='';endGate();window.dispatchEvent(new CustomEvent('lab:room',{detail:room}));void realtime.restart();
}
let joining=null;function join(){if(joining)return joining;joining=(async()=>{try{await syncing;const data=await request('join',{name:nameInput.value});entered(data);}finally{joining=null;}})();return joining.then(()=>sync());}
form.addEventListener('submit',async e=>{e.preventDefault();const button=form.querySelector('button');button.disabled=true;status.textContent='입장 중…';try{await join();closeDialog(studio);}catch(e){status.textContent=e.message;}finally{button.disabled=false;}});
let syncing=null,nextSync=0,lastSent=0,lastMoving=false,remoteMoving=false,appearanceSaving=false;const presenceCache=createPresenceCache();
function acceptPresence(data){window.labServerOffset=data.serverTime-Date.now();window.labFireworks=mergeFireworkShow(window.labFireworks,data.fireworks);window.dispatchEvent(new CustomEvent('lab:fireworks',{detail:window.labFireworks}));window.labRideSeats=data.rideSeats||[];if(window.labRideReservation&&!window.labRideSeats.some(s=>s.id===window.labGuestId))window.dispatchEvent(new CustomEvent('lab:ride-expired',{detail:window.labRideReservation.kind}));const list=presenceCache.merge(data.people,data.farBucket);remoteMoving=list.some(p=>!p.distant&&p.speed>.1);showPeople(list);status.textContent='접속 중 · '+data.count+'명';}
function outgoingPose(){
 const p=window.labPlayerState;if(!p)return null;
 const reservation=window.labRideReservation;
 if(reservation&&['lift','ferris'].includes(p.mode)){
  const seatAt=serverNow(),seat=sharedSeatPose(reservation,seatAt);
  if(seat)return{...p,x:seat.x,y:seat.y,z:seat.z,yaw:seat.yaw,seatAt};
 }
 return p;
}
const realtime=createRealtimeClient({request,pose:()=>{if(!window.labPlayerState)return null;const pose={...outgoingPose(),gesture:gesture||encodeActivity(window.labPlayerState)};gesture='';return pose;},onSnapshot:acceptPresence,onChat:acceptChat,onActive:active=>{window.labRealtimeActive=active;},onStatus:message=>{if(message)status.textContent=message;},onCheckpoint:()=>{if(Date.now()-lastSent>600)void sync(true);}});
function sync(force=false){if(releasingRide)return force?releasingRide.then(()=>sync(true)):Promise.resolve();if(syncing)return force?syncing.then(()=>sync(true)):syncing;if(appearanceSaving||!joined||joining||!window.labPlayerState)return Promise.resolve();syncing=performSync().finally(()=>{syncing=null;});return syncing;}
window.saveWinterAppearance=async look=>{
 if(!joined||joining)throw Error('공간에 연결한 뒤 다시 저장해 주세요.');
 if(appearanceSaving)throw Error('외형을 저장하고 있어요.');
 appearanceSaving=true;
 try{await syncing;return await request('appearance',look);}finally{appearanceSaving=false;nextSync=Date.now()+500;}
};
async function performSync(){
 busy=true;lastSent=Date.now();lastMoving=(window.labPlayerState?.speed||0)>.1;
 const sentGuest=window.labGuestId,sentReservation=window.labRideReservation;let recoveredSeat=false;
 try{
  const a=window.labAppearance||{},data=await request('presence',{...outgoingPose(),...presenceCache.request(),color:a.fur,colorTop:a.furTop,accessory:a.accessory,fluff:a.fluff,roundness:a.roundness,gesture:gesture||encodeActivity(window.labPlayerState)});
  gesture='';failures=0;if(!realtime.active)acceptPresence(data);
 }catch(e){
  // A sleeping mobile tab can outlive its chair's lease without losing admission.
  // Match the exact request's reservation object, so an old response cannot evict
  // a fresh claim (even if it reused the same chair) or a newly joined guest.
  if(e.status===409&&e.code==='RIDE_RESERVATION_EXPIRED'&&sentGuest===window.labGuestId&&['dining','ferris','lift','upperlift','ridgelift','gondola'].includes(sentReservation?.kind)&&window.labRideReservation===sentReservation){
   failures=0;recoveredSeat=true;
   window.labRideSeats=(window.labRideSeats||[]).filter(seat=>seat.id!==sentGuest);
   window.dispatchEvent(new CustomEvent('lab:ride-expired',{detail:sentReservation.kind}));
   // wake() owns the normal release and publishes a standing pose. These guards
   // also clear stale state if the world is still loading or its loop is paused.
   if(window.labRideReservation===sentReservation)window.releaseRide();
   if(['dining','lift','ferris'].includes(window.labPlayerState?.mode))window.labPlayerState={...window.labPlayerState,mode:'',speed:0};
  }else{failures++;if(e.status===401||e.status===403){gate(e.message);}if(failures>2)showPeople([]);}
  status.textContent=e.message;
 }finally{
  busy=false;nextSync=recoveredSeat?0:Date.now()+(realtime.active?10000:presenceDelay({hidden:document.hidden,moving:remoteMoving||(window.labPlayerState?.speed||0)>.1,chat:!chatForm.hidden,failures}));
 }
}
window.addEventListener('lab:wave',()=>{if(joined){gesture='wave';sync();}});
const presenceTimer=setInterval(()=>{const now=Date.now(),changed=lastMoving!==((window.labPlayerState?.speed||0)>.1);if(now>=nextSync||(!realtime.active&&!failures&&changed&&now-lastSent>=550))void sync();},250);document.addEventListener('visibilitychange',()=>{nextSync=0;void sync();});// Inactive presence expires after 20 seconds; retain the cookie identity across reloads.
const chatForm=$('#chat-form'),chatInput=$('#chat-input'),chatStatus=$('#chat-status'),chatToggle=$('#chat-toggle'),chatLog=$('#chat-log'),selfBubble=$('#self-bubble');
const seenChats=new Set(),blocked=new Set(),hiddenChats=new Set(),recentChats=[];
let recentTimer=0,fadeTimer=0,composing=false,sendAfterComposition=false,compositionSendTimer=0,chatSending=false,chatSignature='';
const keyboard=createChatViewport({input:chatInput,onRestored(){window.dispatchEvent(new Event('lab:close'));renderRecent();}});
function openChat(){chatForm.hidden=false;chatToggle.setAttribute('aria-expanded','true');window.dispatchEvent(new Event('lab:pause'));keyboard.open();renderRecent();chatInput.focus({preventScroll:true});chatStatus.textContent=joined?'':'공간에 연결한 뒤 채팅할 수 있어요.';}
function closeChat(){chatForm.hidden=true;chatToggle.setAttribute('aria-expanded','false');keyboard.close();chatInput.value='';chatStatus.textContent='';composing=false;sendAfterComposition=false;clearTimeout(compositionSendTimer);renderRecent();}
window.closeWinterChat=()=>{if(!chatForm.hidden)closeChat();};
chatToggle.onclick=()=>chatForm.hidden?openChat():closeChat();
// Dismiss before a world gesture begins, so cancelling a draft does not also travel.
document.addEventListener('pointerdown',event=>{
 if(chatForm.hidden||event.target.closest?.('#chat-form,#chat-toggle,#chat-log'))return;
 closeChat();if(event.target.closest?.('#park-canvas')){event.preventDefault();event.stopPropagation();}
},{capture:true});
// Capture Enter before a previously clicked facility button can activate again.
window.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!chatForm.hidden&&!e.isComposing){e.preventDefault();closeChat();return;}
 if(chatShortcut(e,document)&&e.target!==chatInput){e.preventDefault();e.stopPropagation();openChat();}
},{capture:true});
chatInput.addEventListener('compositionstart',()=>{composing=true;sendAfterComposition=false;});
chatInput.addEventListener('compositionend',()=>{
 composing=false;if(!sendAfterComposition)return;sendAfterComposition=false;
 // Let the IME's final input event commit the last syllable before sending.
 compositionSendTimer=setTimeout(()=>{if(!chatForm.hidden&&!composing)chatForm.requestSubmit();},0);
});
chatInput.addEventListener('keydown',e=>{
 if(e.key!=='Enter')return;
 e.stopPropagation();if(e.repeat||e.shiftKey)return;
 if(composing||e.isComposing){sendAfterComposition=true;return;}
 e.preventDefault();clearTimeout(compositionSendTimer);chatForm.requestSubmit();
});
function renderRecent(){
 clearTimeout(recentTimer);clearTimeout(fadeTimer);chatLog.classList.remove('chat-fading');
 const now=performance.now(),editing=!chatForm.hidden;
 const available=recentChats.filter(item=>!blocked.has(item.sender)&&!hiddenChats.has(item.sender));
 const displayed=editing?available:available.filter(item=>now-item.at<chatPreviewMs);
 if(!displayed.length){
  if(!chatLog.hidden&&!editing){chatLog.classList.add('chat-fading');fadeTimer=setTimeout(()=>{chatLog.hidden=true;},240);}
  else{chatLog.hidden=true;chatLog.replaceChildren();}
  chatSignature='';return;
 }
 const wasHidden=chatLog.hidden,scrollTop=chatLog.scrollTop,atEnd=chatLog.scrollHeight-chatLog.clientHeight-scrollTop<24;
 chatLog.hidden=false;chatLog.dataset.mode=editing?'history':'recent';
 const signature=(editing?'history:':'recent:')+displayed.map(item=>item.key).join('|');
 if(signature!==chatSignature){chatSignature=signature;chatLog.replaceChildren();
  for(const item of displayed){
   const row=document.createElement('p'),author=document.createElement('b');row.dataset.author=item.sender===window.labGuestId?'self':'peer';author.className='chat-author';author.textContent=item.name+' ';row.append(author,document.createTextNode(item.message));
   if(editing&&item.sender&&item.sender!==window.labGuestId){const hide=document.createElement('button');hide.className='chat-hide';hide.textContent='숨김';hide.setAttribute('aria-label',item.name+' 채팅 숨김');hide.onclick=()=>{hiddenChats.add(item.sender);chatSignature='';renderRecent();};row.append(hide);}
   chatLog.append(row);
  }
  chatLog.scrollTop=wasHidden||atEnd||!editing?chatLog.scrollHeight:scrollTop;
 }
 if(!editing)recentTimer=setTimeout(renderRecent,Math.max(1,Math.min(...displayed.map(item=>item.at+chatPreviewMs-now))));
}
function record(name,message,key,sender=''){if(seenChats.has(key))return false;seenChats.add(key);if(seenChats.size>300)seenChats.delete(seenChats.values().next().value);recentChats.push({name,message,key,sender,at:performance.now()});if(recentChats.length>100)recentChats.shift();renderRecent();return true;}
function acceptChat(data){
 if(blocked.has(data.id)||hiddenChats.has(data.id)||!record(data.name,data.message,data.id+':'+data.at,data.id))return;
 if(data.id===window.labGuestId){selfBubble.textContent=data.message;selfBubble.dataset.until=String(performance.now()+bubbleDuration(data.at,serverNow()));selfBubble.style.opacity='1';selfBubble.hidden=false;}
 else window.dispatchEvent(new CustomEvent('lab:chat',{detail:data}));
}
async function ensureChatSession(){if(joined)return;if(joining){await joining;return;}throw Error('공간에 연결한 뒤 이용해 주세요.');}
chatForm.addEventListener('submit',async e=>{e.preventDefault();if(e.isComposing||composing||chatSending)return;const message=chatInput.value.trim();if(!message){closeChat();return;}chatSending=true;const send=chatForm.querySelector('[type=submit]');send.disabled=true;try{await ensureChatSession();const data=await request('chat',{message});chatInput.value='';chatStatus.textContent='';setName(data.name);acceptChat({...data,id:window.labGuestId});closeChat();}catch(err){chatStatus.textContent=err.message;}finally{chatSending=false;send.disabled=false;}});
window.addEventListener('lab:visitors',e=>{for(const p of e.detail)if(p.chat&&serverNow()-p.chatAt<15000&&!blocked.has(p.id)&&!hiddenChats.has(p.id))record(p.name,p.chat,p.id+':'+p.chatAt,p.id);});
window.isVisitorBlocked=id=>blocked.has(id);window.isChatHidden=id=>blocked.has(id)||hiddenChats.has(id);people.addEventListener('click',e=>{const b=e.target.closest('[data-block-visitor]');if(!b)return;blocked.add(b.dataset.blockVisitor);b.closest('li')?.remove();sync();});

window.joinSharedActivity=ensureChatSession;window.sharedRoom=()=>room;
async function initialize(){try{
 await finishOwnerLogin(request);const access=await request('access');if(await continueOwnerLogin(request,access))return;admin=access.admin;window.labAdmin=admin;$('#owner-signin').hidden=admin||!adminEntry;$('#tab-social').hidden=!admin;document.body.classList.toggle('world-owner',admin);
 window.dispatchEvent(new CustomEvent('lab:access',{detail:{admin}}));
 if(access.blocked){gate('이용이 제한되었습니다. 관리자에게 문의해 주세요.');return;}
 if(adminEntry&&!admin){gate(access.signedIn?'이 계정에는 관리 권한이 없습니다. 소유자 계정으로 로그인해 주세요.':'소유자 계정으로 로그인해 주세요.');return;}
 history.replaceState(null,'',location.pathname);
 if(access.session)setName(access.session.name);else nameInput.value=admin?'YIWON':createGuestName();
 await join();window.labLoading?.complete('connection');
}catch(e){status.textContent=e.message;gate(e.message||'연결을 확인한 뒤 다시 입장해 주세요.',e.status!==403);}}
bindOwnerLogin(request);initialize();
// Old shared links still enter the same public world; credentials are never required.
window.addEventListener('hashchange',()=>{
 const value=new URLSearchParams(location.hash.slice(1));if(!value.has('invite'))return;
 history.replaceState(null,'',location.pathname);
});

function updateNicknameInputs(){for(const [id,counter]of [['profile-name','profile-count'],['visitor-name','visitor-count']]){const input=$('#'+id),count=nicknameParts(input.value).length;$('#'+counter).textContent=count+' / '+nicknameLimit;input.setCustomValidity(count>nicknameLimit?'닉네임은 10자 이내로 입력하세요.':'');}const input=$('#profile-name');$('#profile-form [type=submit]').disabled=$('#profile-form').dataset.state==='saving'||!input.value.trim()||input.value.trim()===$('#self-name').textContent||!!input.validationMessage;}
for(const id of ['profile-name','visitor-name']){const input=$('#'+id);const edit=e=>{if(e.isComposing)return;const parts=nicknameParts(input.value);if(parts.length>nicknameLimit)input.value=parts.slice(0,nicknameLimit).join('');if(id==='profile-name'&&$('#profile-form').dataset.state!=='saving'){$('#profile-status').textContent='';$('#profile-form').removeAttribute('data-state');}updateNicknameInputs();};input.addEventListener('input',edit);input.addEventListener('compositionend',edit);}
updateNicknameInputs();
$('#profile-form').addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget,button=form.querySelector('[type=submit]');if(e.isComposing||form.dataset.state==='saving')return;try{const name=validateNickname($('#profile-name').value);form.dataset.state='saving';form.setAttribute('aria-busy','true');button.disabled=true;$('#profile-name').readOnly=true;$('#profile-status').textContent='저장 중…';const data=await request('name',{name});setName(data.name);form.dataset.state='saved';$('#profile-status').textContent='';nextSync=0;void sync();}catch(e){form.dataset.state='error';$('#profile-status').textContent=e.message;}finally{form.removeAttribute('aria-busy');$('#profile-name').readOnly=false;updateNicknameInputs();}});

chatInput.addEventListener('focus',()=>{keyboard.open();window.dispatchEvent(new Event('lab:pause'));});window.addEventListener('online',()=>{if(!joined)initialize();else sync();});

window.exitGondola=async()=>{const data=await request('ride',{kind:'gondola',action:'exit'});window.labRideReservation=data.reservation;return data.reservation;};
window.reserveRide=async (kind,benchId,seat)=>{await ensureChatSession();await releasingRide;await sync(true);const data=await request('ride',{kind,benchId,seat});window.labServerOffset=data.serverTime-Date.now();window.labRideReservation=data.reservation;return data.reservation;};
let releasingRide=null;
window.releaseRide=()=>{
 window.labRideReservation=null;if(releasingRide)return releasingRide;
 // A seated pose already in flight still needs its server reservation. Drain it
 // before releasing the seat; pause new checkpoints until exit has completed.
 const pendingPose=syncing;
 releasingRide=(async()=>{await pendingPose;await fetch('/api/ride',{method:'DELETE',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(8000)}).catch(()=>{});})().finally(()=>{releasingRide=null;nextSync=0;});
 return releasingRide;
};

window.addEventListener('pagehide',event=>{if(!event.persisted){clearInterval(presenceTimer);clearTimeout(recentTimer);clearTimeout(fadeTimer);keyboard.dispose();realtime.dispose();}});

window.changeWinterRegion=async region=>{await window.joinSharedActivity();await sync(true);let data;try{data=await request('region',{region});}catch(e){if(e.status!==409)throw e;await new Promise(r=>setTimeout(r,550));await sync(true);data=await request('region',{region});}nextSync=0;return data;};
