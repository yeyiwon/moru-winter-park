import {createGuestName,isNumberedGuest} from './guest-names.js';
import {encodeActivity} from './activity-state.js';
import {closeDialog} from './ui-motion.js';
import {invitationRoom,publicRoom,spaceURL} from './space-links.js';
const $=s=>document.querySelector(s),form=$('#join-form'),status=$('#social-status'),people=$('#social-people'),roomInput=$('#room-code'),nameInput=$('#visitor-name'),passwordInput=$('#room-password'),studio=$('#studio');
let invited=invitationRoom(new URL(location.href).searchParams.get('room')),room=invited||publicRoom,joined=false,admin=false,busy=false,gesture='',failures=0,inviteURL='',pendingInvitation=null;roomInput.value=room;
$('#owner-signin').href='/signin-with-chatgpt?return_to='+encodeURIComponent('/'+(invited?'?room='+invited:''));
try{nameInput.value=localStorage.getItem('winter-visitor-name')||'';}catch{}
if(isNumberedGuest(nameInput.value))nameInput.value=createGuestName();
function setName(name){nameInput.value=name;$('#profile-name').value=name;$('#self-name').textContent=name;try{localStorage.setItem('winter-visitor-name',name);}catch{}}
async function request(path,body){const r=await fetch('/api/'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(8000)});const data=await r.json();if(!r.ok){const e=Error(data.error||'연결을 확인해 주세요.');e.status=r.status;throw e;}return data;}
function showPeople(list){people.replaceChildren();list=list.filter(p=>!window.isVisitorBlocked?.(p.id));for(const person of list){const li=document.createElement('li');li.textContent=person.name+(person.gesture==='wave'?' · 인사':'');const block=document.createElement('button');block.textContent='차단';block.dataset.blockVisitor=person.id;block.setAttribute('aria-label',person.name+' 차단');li.append(block);people.append(li);}window.dispatchEvent(new CustomEvent('lab:visitors',{detail:list}));}
function openInvite(){ $('#open-social').click(); }
function endGate(){document.body.classList.remove('invite-gate');$('.studio-head>span').textContent='설정';}

function updateRoomLinks(){
 const localURL=new URL(spaceURL(room,location.origin));history.replaceState(null,'',localURL.pathname+localURL.search);
 $('#owner-signin').href='/signin-with-chatgpt?return_to='+encodeURIComponent(localURL.pathname+localURL.search);
 $('#social-room').textContent=invited?'초대 공간 · '+room.slice(0,6).toUpperCase():'광장';
 inviteURL=spaceURL(room);$('#invite-url').value=inviteURL;$('#room-share').hidden=false;
 $('#invite-form button[type=submit]').textContent=invited?'새 초대 공간 만들기':'초대 링크 만들기';
}
function entered(data){
 if(window.labGuestId&&window.labGuestId!==data.id){showPeople([]);recentChats.length=0;seenChats.clear();chatLog.replaceChildren();selfBubble.hidden=true;window.labRideSeats=[];if(window.labRideReservation)window.dispatchEvent(new CustomEvent('lab:ride-expired',{detail:window.labRideReservation.kind}));window.labRideReservation=null;}
 room=data.room;invited=invitationRoom(room);roomInput.value=room;joined=true;window.labSocialJoined=true;window.labGuestId=data.id;failures=0;setName(data.name);passwordInput.value='';$('#leave-room').hidden=false;$('#wave').hidden=false;form.hidden=true;$('#profile-form').hidden=false;status.textContent='접속 중 · 1명';chatStatus.textContent='';updateRoomLinks();endGate();window.dispatchEvent(new CustomEvent('lab:room',{detail:room}));
}
let joining=null,joiningRoom='';function join(password,targetRoom=roomInput.value){if(joining)return joiningRoom===targetRoom?joining:joining.then(()=>join(password,targetRoom));joiningRoom=targetRoom;joining=(async()=>{try{await syncing;const data=await request('join',{name:nameInput.value,room:targetRoom,password});entered(data);}finally{joining=null;}})();return joining.then(()=>sync());}
form.addEventListener('submit',async e=>{e.preventDefault();const button=form.querySelector('button');button.disabled=true;status.textContent='입장 중…';try{await join(passwordInput.value);closeDialog(studio);}catch(e){status.textContent=e.message;}finally{button.disabled=false;}});
let syncing=null;
function sync(force=false){if(syncing)return force?syncing.then(()=>sync(true)):syncing;if(!joined||joining||(!force&&document.hidden)||!window.labPlayerState)return Promise.resolve();syncing=performSync().finally(()=>{syncing=null;});return syncing;}
async function performSync(){busy=true;try{const a=window.labAppearance||{},data=await request('presence',{...window.labPlayerState,color:a.fur,accessory:a.accessory,gesture:gesture||encodeActivity(window.labPlayerState)});gesture='';failures=0;window.labServerOffset=data.serverTime-Date.now();window.labRideSeats=data.rideSeats||[];if(window.labRideReservation&&!window.labRideSeats.some(s=>s.id===window.labGuestId))window.dispatchEvent(new CustomEvent('lab:ride-expired',{detail:window.labRideReservation.kind}));showPeople(data.people);status.textContent='접속 중 · '+data.count+'명';}catch(e){failures++;if(e.status===401||e.status===403){joined=false;window.labSocialJoined=false;showPeople([]);form.hidden=false;if(e.status===401&&!invited){joining=null;void join().catch(()=>{});}}status.textContent=e.message;if(failures>2)showPeople([]);}finally{busy=false;}}
$('#leave-room').onclick=async()=>{joined=false;window.labSocialJoined=false;showPeople([]);chatLog.replaceChildren();seenChats.clear();selfBubble.hidden=true;$('#room-share').hidden=true;try{await request('leave',{});}catch{}status.textContent='연결 종료';$('#leave-room').hidden=true;$('#wave').hidden=true;form.hidden=!invited;};
$('#wave').onclick=()=>{if(!joined)return;gesture='wave';window.dispatchEvent(new Event('lab:wave'));sync();};
$('#invite-form').addEventListener('submit',async e=>{
 e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;$('#invite-result').textContent='초대 공간에 연결 중…';$('#room-share').hidden=true;
 try{
  // Do not offer a link until the host has joined its room. A failed join retries
  // the same invitation, rather than silently creating another room.
  pendingInvitation??=await request('invite',{password:$('#invite-password').value});
  await join(undefined,pendingInvitation.room);pendingInvitation=null;$('#invite-password').value='';
  $('#invite-result').textContent='이 공간에 입장했습니다. 링크와 비밀번호를 전달하세요.';
 }catch(e){$('#invite-result').textContent=e.message+' 다시 누르면 연결을 재시도합니다.';}finally{button.disabled=false;}
});
$('#copy-room').onclick=async()=>{try{await navigator.clipboard.writeText(inviteURL);$('#invite-result').textContent='링크를 복사했습니다.';}catch{$('#invite-url').select();$('#invite-result').textContent='선택된 링크를 복사하세요.';}};
setInterval(sync,1000);// Inactive presence expires after 20 seconds; retain the cookie identity across reloads.
const chatForm=$('#chat-form'),chatInput=$('#chat-input'),chatStatus=$('#chat-status'),chatToggle=$('#chat-toggle'),chatLog=$('#chat-log'),selfBubble=$('#self-bubble');
const seenChats=new Set(),blocked=new Set(),recentChats=[];
let chatMotion=null;
function openChat(){chatMotion?.cancel();chatMotion=null;chatForm.hidden=false;chatToggle.setAttribute('aria-expanded','true');window.dispatchEvent(new Event('lab:pause'));document.body.classList.add('chat-typing');renderRecent();chatInput.focus();chatStatus.textContent=joined?'':invited?'초대 탭에서 닉네임과 비밀번호를 입력한 뒤 채팅할 수 있어요.':'연결 중…';}
function closeChat(){document.body.classList.remove('chat-typing');chatToggle.setAttribute('aria-expanded','false');chatInput.blur();if(!chatForm.animate||matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('still')){chatForm.hidden=true;return;}chatMotion?.cancel();const motion=chatForm.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(10px)'}],{duration:160,easing:'ease-in'});chatMotion=motion;motion.finished.then(()=>{if(chatMotion===motion){chatForm.hidden=true;chatMotion=null;}}).catch(()=>{});}
chatToggle.onclick=()=>chatForm.hidden?openChat():closeChat();
window.addEventListener('keydown',e=>{if(e.isComposing||document.body.classList.contains('studio-open')||document.body.classList.contains('quiz-open'))return;if(e.key==='Escape'&&!chatForm.hidden){closeChat();return;}if(e.key==='Enter'&&e.target!==chatInput&&!e.target.closest?.('input,textarea,button,a,summary')){e.preventDefault();openChat();}});
function renderRecent(){
 const now=Date.now();while(recentChats.length&&(recentChats[0].at<now-600000||recentChats.length>50))recentChats.shift();
 chatLog.replaceChildren();for(const item of recentChats){if(chatForm.hidden&&item.at<now-6500)continue;const row=document.createElement('p'),author=document.createElement('b');author.textContent=item.name+' ';row.append(author,document.createTextNode(item.message));row.dataset.expires=String(item.at+6500);if(item.sender&&item.sender!==window.labGuestId){const report=document.createElement('button');report.className='chat-report';report.setAttribute('aria-label',item.name+' 메시지 신고');report.textContent='···';report.onclick=()=>window.dispatchEvent(new CustomEvent('lab:report',{detail:{type:'chat',id:item.sender}}));row.append(report);}chatLog.append(row);}chatLog.scrollTop=chatLog.scrollHeight;
}
function record(name,message,key,sender=''){if(seenChats.has(key))return;seenChats.add(key);if(seenChats.size>300)seenChats.delete(seenChats.values().next().value);recentChats.push({name,message,key,sender,at:Date.now()});renderRecent();}
async function ensureChatSession(){if(joined)return;if(!invited||admin){await join();return;}throw Error('초대 탭에서 닉네임과 비밀번호를 입력해 주세요.');}
chatForm.addEventListener('submit',async e=>{e.preventDefault();if(e.isComposing)return;const message=chatInput.value.trim();if(!message)return;const send=chatForm.querySelector('[type=submit]');send.disabled=true;try{await ensureChatSession();const data=await request('chat',{message});chatInput.value='';chatStatus.textContent='';setName(data.name);record(data.name,data.message,'self:'+data.at);selfBubble.textContent=data.message;selfBubble.dataset.until=String(Date.now()+6500);selfBubble.hidden=false;closeChat();}catch(err){chatStatus.textContent=err.message;}finally{send.disabled=false;}});
window.addEventListener('lab:visitors',e=>{for(const p of e.detail)if(p.chat&&Date.now()-p.chatAt<6500&&!blocked.has(p.id))record(p.name,p.chat,p.id+':'+p.chatAt,p.id);});
window.isVisitorBlocked=id=>blocked.has(id);people.addEventListener('click',e=>{const b=e.target.closest('[data-block-visitor]');if(!b)return;blocked.add(b.dataset.blockVisitor);b.closest('li')?.remove();sync();});
setInterval(()=>{if(!chatForm.hidden)return;for(const row of chatLog.children){const remaining=Number(row.dataset.expires)-Date.now();row.style.opacity=String(Math.max(0,Math.min(1,remaining/700)));if(remaining<=0)row.remove();}},150);
window.joinSharedActivity=ensureChatSession;window.sharedRoom=()=>room;
async function initialize(){try{const access=await request('access');admin=access.admin;$('#admin-invite').hidden=!admin;$('#owner-signin').hidden=admin;form.hidden=admin||!invited;$('#invite-description').textContent=admin?'비밀번호를 정하고 링크를 공유하세요.':invited?'닉네임과 비밀번호를 입력하세요.':'계정 없이 입장할 수 있습니다.';if(access.session&&(!invited||access.session.room===invited)){if(isNumberedGuest(access.session.name)){try{const renamed=await request('name',{name:createGuestName()});access.session.name=renamed.name;}catch{}}entered(access.session);}else if(admin){if(!nameInput.value)nameInput.value='YIWON';await join();}else if(invited){openInvite();}else{if(!nameInput.value)nameInput.value=createGuestName();await join();}window.dispatchEvent(new CustomEvent('lab:access',{detail:{admin}}));window.labLoading?.complete('connection');}catch(e){status.textContent=e.message;window.labLoading?.error('서버에 연결하지 못했습니다. 다시 시도해 주세요.');if(invited)openInvite(true);}}
initialize();

$('#profile-form').addEventListener('submit',async e=>{e.preventDefault();try{const data=await request('name',{name:$('#profile-name').value});setName(data.name);status.textContent='닉네임을 저장했습니다.';}catch(e){status.textContent=e.message;}});

const visualViewport=window.visualViewport;function keyboardLayout(){const bottom=visualViewport?Math.max(0,innerHeight-visualViewport.height-visualViewport.offsetTop):0;document.documentElement.style.setProperty('--keyboard',bottom+'px');}visualViewport?.addEventListener('resize',keyboardLayout);visualViewport?.addEventListener('scroll',keyboardLayout);chatInput.addEventListener('focus',()=>{document.body.classList.add('chat-typing');window.dispatchEvent(new Event('lab:pause'));keyboardLayout();});chatInput.addEventListener('blur',keyboardLayout);window.addEventListener('online',()=>{if(!joined)initialize();else sync();});

window.reserveRide=async kind=>{await ensureChatSession();await releasingRide;await sync(true);const data=await request('ride',{kind});window.labServerOffset=data.serverTime-Date.now();window.labRideReservation=data.reservation;return data.reservation;};
let releasingRide=Promise.resolve();
window.releaseRide=()=>{window.labRideReservation=null;releasingRide=fetch('/api/ride',{method:'DELETE',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(8000)}).catch(()=>{});return releasingRide;};
