import {parkGuideLayout} from './park-guide-layout.js';
import {pickBalloonTone,pickBalloonStyle} from './balloon-design.js';
import {serverNow} from './server-clock.js';
import {diningServiceState,diningStageText} from './ryokan-service.js';
import {diningChefMessage} from './ryokan-meal.js';
import {benches,benchInteractions,benchAccess} from './bench-layout.js';
import {onsenEntrances,canUseOnsen} from './onsen-layout.js';
import {createInteractionExitControl} from './interaction-exit-control.js';
import {activityCameraView} from './activity-camera.js';
import {createInteractionLifecycle} from './interaction-lifecycle.js';
import {carouselCameraView,stallEntrance,balloonCart,sparklerEntrance} from './park-layout.js';
import {treeLayout} from './tree-layout.js';
import {alpineShift} from './resort-layout.js';
import {ferrisDimensions} from './ferris-layout.js';
import {sharedSeatPose,sharedSeatChoices,occupiedSeat,rideClockStart,canExitGondola,gondolaAtStation} from './ride-seats.js';
import {interiorInteractions,interiorActivityPoses,interiorAt,interiorSurfaceHeight} from './interior-layout.js';
import {createSpaController} from './spa-experience.js';
import {gondolaEntry,alpineHeight,restSeats,spaActivities,skiRuns,skiStarts,skiRunAt,skiRunCenter,skiRunHalfWidth,summitFacilities} from './resort-layout.js';
import {createRideController} from './winter-rides.js';

export function createWinterExperience(winter,companion,travel){
 const lifecycle=createInteractionLifecycle();let completedSki=false;const spa=createSpaController(),rides=createRideController(winter.rides);
 const card=document.querySelector('#place-card'),actions=document.querySelector('#place-actions');
 const hud=document.querySelector('#ride-hud'),label=document.querySelector('#ride-label'),stopButton=document.querySelector('#stop-ride');
 const exitControl=createInteractionExitControl({root:hud,button:stopButton,onExit:stop});
 let bubbleHeld=false,sparklerHeld=false,bubbleSoundTime=0;
 const bubbleControl=document.createElement('button');bubbleControl.id='bubble-hold';bubbleControl.type='button';bubbleControl.hidden=true;bubbleControl.setAttribute('aria-label','누르는 동안 비눗방울');bubbleControl.setAttribute('aria-pressed','false');bubbleControl.innerHTML='<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M5 24l6-8"/><circle cx="12" cy="13" r="4"/><circle cx="21" cy="7" r="3"/><circle cx="21" cy="18" r="2"/></svg>';document.querySelector('.touch-actions')?.append(bubbleControl);
 const bubbleIcon=bubbleControl.innerHTML,sparklerIcon='<svg viewBox="0 0 28 28" aria-hidden="true"><path d="m5 24 11-13M18 3v4m7 4h-4m2-7-3 3m-9-3 3 3m9 11-3-3M11 11H7"/><circle cx="18" cy="11" r="2"/></svg>';
 function blow(active){
  const allowed=!!active&&!parkRide&&!spa.active&&!rest&&(!rides.mode||rides.mode==='summit');
  const next=allowed&&heldItem==='bubble-wand';sparklerHeld=allowed&&heldItem==='sparkler';
  bubbleControl.setAttribute('aria-pressed',String(next||sparklerHeld));
  if(next===bubbleHeld)return;bubbleHeld=next;if(next){bubbleSoundTime=0;window.labSound?.('bubble');}
 }
 function syncBubbleControl(){
  bubbleControl.hidden=!['bubble-wand','sparkler'].includes(heldItem)||!!parkRide||spa.active||!!rest||!!rides.mode&&rides.mode!=='summit';
  if(bubbleControl.dataset.item!==heldItem){bubbleControl.dataset.item=heldItem;bubbleControl.innerHTML=heldItem==='sparkler'?sparklerIcon:bubbleIcon;const label=heldItem==='sparkler'?'누르는 동안 스파클러 흔들기':'누르는 동안 비눗방울';bubbleControl.setAttribute('aria-label',label);bubbleControl.title=label+' · E';}
 }
 bubbleControl.onpointerdown=e=>{e.preventDefault();e.stopPropagation();bubbleControl.setPointerCapture?.(e.pointerId);blow(true);};for(const event of ['pointerup','pointercancel','lostpointercapture'])bubbleControl.addEventListener(event,e=>{e.stopPropagation();blow(false);});
 for(const event of ['blur','lab:pause','lab:open','pagehide'])window.addEventListener(event,()=>blow(false));document.addEventListener('visibilitychange',()=>blow(false));window.addEventListener('keyup',e=>{if(e.code==='KeyE')blow(false);});
 let sparklerSoundTime=0;let approach=null,exitPending=false;let reservation=null,boarding=false,boardingEpoch=0;let winterBorrowed=false;let parkRide='',parkSeat=0;let place=null,rest=null,lastMode='',anchor=null,actionKeys=[],gesture='',gestureTime=0,heldItem='',balloonTone=-1,balloonStyle='classic',roast=0,position={x:0,z:0},finishEating=false,seatSignature='';

 const parkActivities=[{id:'plaza-fireworks',name:'불꽃놀이',x:parkGuideLayout.plaza.x,z:parkGuideLayout.plaza.z+2.2,r:2.8},{id:'sparkler',name:'스파클러 부스',...sparklerEntrance,r:3},{id:'popcorn',name:'팝콘 부스',...stallEntrance('popcorn'),r:3},{id:'bubbles',name:'풍선 부스',x:balloonCart.x,z:balloonCart.z+2.6,r:3},{id:'icecream',name:'아이스크림 부스',...stallEntrance('candy'),r:3},{id:'coffee',name:'카페',...stallEntrance('waffle'),r:3},];
 function act(kind,duration=5){blow(false);lifecycle.enter(place||{id:kind,...position});lifecycle.activate();gesture=kind;gestureTime=duration;window.labSound?.(kind);card.hidden=true;}
 function gestureFacing(at=position){if(!['warm','roast'].includes(gesture))return null;const fire=summitFacilities.find(p=>p.id==='campfire').model;return Math.atan2(fire.x-at.x,fire.z-at.z);}
 function eat(){finishEating=true;act('eat',2.8);}
 function clearItem(){blow(false);heldItem='';syncBubbleControl();roast=0;finishEating=false;}
 function take(item){if(item==='balloon'){balloonTone=pickBalloonTone(balloonTone);balloonStyle=pickBalloonStyle();}blow(false);clearGesture();heldItem=item;syncBubbleControl();roast=0;finishEating=false;window.labSound?.('select');lifecycle.dismiss(place);hideActions();}
 window.addEventListener('lab:emote',e=>{if(['heart','joy','sad','surprise','dance'].includes(e.detail)&&!rides.mode&&!parkRide){act(e.detail,e.detail==='dance'?7:3.5);}});
 window.addEventListener('lab:wave',()=>{clearItem();act('wave',3);});
 function button(text,fn){
  const b=document.createElement('button'),k=document.createElement('kbd'),label=document.createElement('span');label.className='action-label';label.textContent=text;
  k.textContent=['E','F','G','H'][actionKeys.length]||'';
  b.append(k,label);b.setAttribute('aria-label',text);const activate=()=>{if(!b.disabled)return fn();};b.onclick=activate;actionKeys.push(activate);actions.append(b);return b;
 }
 function renderSeatChoices(selected,force=false){
  const choices=sharedSeatChoices(selected.kind,selected.id),full=choices.every(c=>occupiedSeat(c,window.labRideSeats||[],window.labGuestId)),signature=full+':'+boarding;
  if(!force&&signature===seatSignature)return;seatSignature=signature;actions.replaceChildren();actionKeys=[];
  const b=button(full?'이용 중':'앉기',()=>sitAt(selected));b.disabled=full||boarding;
 }
 async function sitAt(selected){
  if(boarding)return false;
  cancel();place=selected;const epoch=boardingEpoch;boarding=true;renderSeatChoices(selected,true);
  try{
   const claim=await window.reserveRide(selected.kind,selected.kind==='bench'?selected.id:undefined);
   if(epoch!==boardingEpoch){window.releaseRide?.();return false;}
   const seat=sharedSeatPose(claim,serverNow()),choices=sharedSeatChoices(selected.kind,selected.id);
   if(!seat||!choices.some(c=>c.kind===claim.kind&&c.cabin===claim.cabin&&c.seat===claim.seat)){window.releaseRide?.();throw Error('좌석 정보를 확인하지 못했어요. 다시 눌러 주세요.');}
   reservation=claim;rest={...seat,returnPosition:selected.kind==='bench'?benchAccess(benches.find(b=>b.cabin===claim.cabin)):{x:seat.x,z:selected.z},view:activityCameraView(selected.kind==='dining'?'dining':'rest')};
   lifecycle.enter(selected);lifecycle.activate();companion.equip('none');card.hidden=true;hud.hidden=false;hud.dataset.activity=selected.kind==='dining'?'dining':'';label.textContent=selected.kind==='dining'?diningStageText.waiting:'';window.labSound?.('rest');return true;
  }catch(error){
   if(epoch!==boardingEpoch)return false;
   boarding=false;show(selected.id);document.querySelector('#place-description').textContent=error.message;window.labToast?.(error.message);return false;
  }finally{boarding=false;}
 }
 function clearGesture(){if(gesture){exitControl.hide();lifecycle.finish();hideActions();}gesture='';gestureTime=0;}
 function hideActions(){card.hidden=true;anchor=null;actionKeys=[];actions.replaceChildren();}
 function endUI(){exitControl.hide();lifecycle.finish();hideActions();hud.hidden=true;delete hud.dataset.activity;label.textContent='';document.querySelector('#ski-controls').hidden=true;for(const key in touch)delete touch[key];lastMode='';window.labAudio?.ski({active:false,immediate:true});window.dispatchEvent(new Event('lab:interaction-end'));}
 function wake(){
  if(gesture){clearGesture();finishEating=false;return true;}
  if(!rest&&!['sauna','lie','tea','lounge','footbath'].includes(spa.kind))return false;
  const standPosition=rest?.returnPosition;if(['bench','dining'].includes(reservation?.kind)){window.releaseRide?.();reservation=null;}if(rest?.mode==='tea')window.labSound?.('cup-down');spa.stop();rest=null;companion.equip();document.body.classList.remove('spa-active');endUI();window.dispatchEvent(new CustomEvent('lab:stand',{detail:{position:standPosition}}));return true;
 }
 function returnEquipment(){if(!winterBorrowed)return;winterBorrowed=false;window.dispatchEvent(new Event('lab:return-winter'));companion.equip();}
 function cancel(){approach=null;blow(false);if(onsenEntrances[spa.kind])window.dispatchEvent(new CustomEvent('lab:onsen-end',{detail:{restore:false}}));boardingEpoch++;if(reservation){window.releaseRide?.();reservation=null;}returnEquipment();parkRide='';
  spa.stop();clearGesture();document.body.classList.remove('spa-active');stopButton.textContent='내리기';rides.stop();rest=null;companion.equip();winter.rideChair.visible=false;endUI();
 }
 window.addEventListener('lab:ride-expired',e=>{if(!reservation)return;if(['bench','dining'].includes(reservation.kind)){wake();return;}const destination=e.detail==='ferris'?'ferris':'ski';cancel();travel(destination,false);});
 async function stop(){
  if(approach){cancel();return;}
  if(rides.mode==='lift'&&rides.routeKind==='gondola'){
   if(exitPending||!reservation||!canExitGondola(reservation,serverNow()))return;
   exitPending=true;try{reservation=await window.exitGondola();}catch(error){window.labToast?.(error.message);}finally{exitPending=false;}return;
  }if(gesture){clearGesture();endUI();return;}if(parkRide){const destination=parkRide;cancel();travel(destination,false);return;}
  if(['ski','summit'].includes(rides.mode)){cancel();companion.equip();window.dispatchEvent(new Event('lab:stand'));return;}
  if(rest||['sauna','lie','tea','lounge','footbath'].includes(spa.kind)){wake();return;}
  if(onsenEntrances[spa.kind]){spa.exit();return;}const destination=spa.active?'onsen':'ski';cancel();travel(destination,false);
 }
 async function start(kind,gear,atEntry=false){
  if(boarding)return;
  if(kind==='gondola'&&!atEntry){approach={...position,y:alpineHeight(position.x,position.z)+.86,yaw:0,waiting:false};hideActions();hud.hidden=false;stopButton.disabled=false;stopButton.textContent='탑승 취소';return;}const epoch=boardingEpoch;
  if(['lift','upperlift','ridgelift','gondola'].includes(kind)&&window.reserveRide){boarding=true;try{const claim=await window.reserveRide(kind);if(epoch!==boardingEpoch){window.releaseRide?.();return;}reservation=claim;if(kind==='gondola')approach=null;}catch(error){if(kind==='gondola'&&error.code==='station_closed'&&approach){approach.waiting=true;return;}approach=null;window.labToast?.(error.message);document.querySelector('#place-description').textContent=error.message;return;}finally{boarding=false;}}
  spa.stop();rest=null;clearGesture();clearItem();
  {winterBorrowed=true;window.dispatchEvent(new CustomEvent('lab:equip-winter',{detail:{gear}}));companion.equip(gear||companion.gear);if(!companion.winterReady){cancel();return;}}
  // Proximity is sampled at 10 Hz; equipment changes must use the current feet position.
  const ridePosition=kind==='ski'?(companion.group?.position||position):position;
  if(rides.start(kind,ridePosition,gear||companion.gear)){lifecycle.enter(place);lifecycle.activate();if(['lift','upperlift','ridgelift','gondola'].includes(kind))completedSki=false;window.labSound?.('lift');card.hidden=true;hud.hidden=false;lastMode='';stopButton.textContent=kind==='ski'?'스키 벗기':['lift','upperlift','ridgelift','gondola'].includes(kind)?'탑승 취소':'내리기';}
 }
 function relax(kind){
  const from=companion.group?.position||window.labPlayerState||position;
  if(onsenEntrances[kind]&&!canUseOnsen(kind,from)){window.labToast?.('계단 앞에서 이용해 주세요.');return;}rides.stop();rest=null;clearGesture();clearItem();if(!spa.start(kind,onsenEntrances[kind]?from:undefined))return;lifecycle.enter(place);if(spa.state==='Active')lifecycle.activate();if(onsenEntrances[kind])window.dispatchEvent(new Event('lab:onsen-start'));
  companion.equip('none');card.hidden=true;hud.hidden=false;window.labSound?.(kind.includes('bath')?'bath':kind==='tea'?'tea':'rest');document.body.classList.add('spa-active');stopButton.textContent=kind==='footbath'?'일어나기':kind.includes('bath')?'탕에서 나오기':'일어나기';
 }
 function syncNpcFireworkRequest(){
  if(place?.id!=='plaza-fireworks')return;const state=window.winterFireworkRequestState,b=actions.querySelector('button');if(!b)return;
  b.disabled=!state||state.disabled;b.querySelector('.action-label').textContent=state?.label||'불꽃놀이 신청';
  document.querySelector('#place-description').textContent=parkGuideLayout.plaza.message+(state?.status?' '+state.status:'');
 }
 window.addEventListener('lab:firework-request-state',syncNpcFireworkRequest);
 function show(id,activity='bath'){
  place=benchInteractions.find(p=>p.id===id)||interiorInteractions.find(p=>p.id===id)||winter.destinations.find(p=>p.id===id)||summitFacilities.find(p=>p.id===id)||skiStarts.find(p=>'slope-'+p.id===id)||parkActivities.find(p=>p.id===id)||(id==='hand-item'?{id,name:{coffee:'커피',cocoa:'코코아',odeng:'어묵',marshmallow:'마시멜로',icecream:'아이스크림'}[heldItem]||'',...position}:null)||(id==='resume-ski'?{id,name:skiRunAt(position.x,position.z).name,...position}:null);
  if(!place||place.kind==='photo'||place.interactive===false)return;
  if(id.startsWith('slope-'))place={...place,id};
  if(id==='onsen'&&onsenEntrances[activity])place={...place,...onsenEntrances[activity].access,r:2.9};
  if(id==='tree')place={...place,x:treeLayout.x,z:treeLayout.z,r:26};
  document.querySelector('#place-kind').textContent='';document.querySelector('#place-name').textContent=place.name;
  document.querySelector('#place-description').textContent='';actions.replaceChildren();actionKeys=[];card.dataset.activity=activity;
  card.classList.toggle('guide-card',id==='plaza-fireworks'||place.kind==='dining');card.classList.toggle('seat-picker',['bench','dining'].includes(place.kind));seatSignature='';
  if(place.kind==='dining')document.querySelector('#place-description').textContent='어서 오세요! 앉으시면 오늘의 초밥을 준비해 드릴게요.';
  if(['carousel','ferris'].includes(id))button('탑승',async()=>{if(boarding)return;cancel();const epoch=boardingEpoch;boarding=true;try{if(id==='ferris'&&window.reserveRide){const claim=await window.reserveRide('ferris');if(epoch!==boardingEpoch){window.releaseRide?.();return;}reservation=claim;}parkRide=id;lifecycle.enter(place);lifecycle.activate();parkSeat=parseInt((window.labGuestId||'00').slice(0,2),16)||0;companion.equip('none');hud.hidden=false;label.textContent=place.name;stopButton.textContent='내리기';card.hidden=true;window.labSound?.('ride');}catch(error){document.querySelector('#place-description').textContent=error.message;}finally{boarding=false;}});
  else if(['bench','dining'].includes(place.kind))renderSeatChoices(place,true);
  else if(place.kind==='exit')button('나가기',()=>window.exitInterior?.());
  else if(place.kind==='quiz-station')button('퀴즈 풀기',()=>{if(Math.hypot(position.x-place.x,position.z-place.z)<=place.r)window.openQuickQuiz?.();});
  else if(place.room)button(place.name,()=>{cancel();lifecycle.enter(place);lifecycle.activate();const mode=['aquarium','view'].includes(place.kind)?'view':place.kind==='dining'?'dining':place.kind==='tea'?'tea':place.kind==='footbath'?'bath':place.kind==='sauna'?'sauna':'rest';rest={...interiorActivityPoses[id],returnPosition:{x:place.x,z:place.z},mode,view:interiorActivityPoses[id].view||activityCameraView(place.kind==='footbath'?'rest':place.kind,{yaw:interiorActivityPoses[id].yaw,mobile:window.innerWidth<650})||{distance:8,pitch:.34,yaw:.25,lookHeight:-.5}};companion.equip('none');card.hidden=true;hud.hidden=false;stopButton.textContent='일어나기';label.textContent='';window.labSound?.(place.kind==='footbath'?'footbath':mode==='tea'?'tea-pour':mode==='dining'?'dining':'rest');});
  else if(id==='ski-gear'){button('스노보드',()=>{window.dispatchEvent(new CustomEvent('lab:equip-winter',{detail:{gear:'board'}}));companion.equip('board');card.hidden=true;});button('스키',()=>{window.dispatchEvent(new Event('lab:equip-winter'));companion.equip('ski');card.hidden=true;});button('장비 해제',()=>{window.dispatchEvent(new Event('lab:unequip-winter'));companion.equip('none');card.hidden=true;});}
  else if(id==='plaza-fireworks'){button('불꽃놀이 신청',()=>window.requestWinterFireworks?.());syncNpcFireworkRequest();}
  else if(id==='post-office')button('소원 쓰기',()=>window.openWishComposer?.());
  else if(id==='hand-item')button(['coffee','cocoa'].includes(heldItem)?'마시기':'먹기',()=>['coffee','cocoa'].includes(heldItem)?act('drink',2.8):eat());
  else if(id==='quiz')button('입장',()=>window.enterInterior?.('museum'));
  else if(id==='gondola')button('곤돌라 타기',()=>start('gondola'));
  else if(id==='ridgelift')button('정상 연결 리프트',()=>start('ridgelift'));
  else if(id==='upperlift')button('포레스트 리프트',()=>start('upperlift'));
  else if(id==='ski')button('리프트 타기',()=>start('lift'));
  else if(id.startsWith('slope-')||id==='resume-ski'){button('스키',()=>start('ski','ski'));button('스노보드',()=>start('ski','board'));}
  else if(id==='footbath')button('족욕하기',()=>relax('footbath'));
  else if(id==='lounge')button('앉기',()=>relax('lounge'));
  else if(id==='onsen')button('온천 이용하기',()=>relax(activity));
  else if(id==='sauna')button('입장',()=>window.enterInterior?.('ryokan'));
  else if(id==='tree')button('트리 꾸미기',()=>window.dispatchEvent(new Event('lab:tree-open')));
  else if(id==='odeng')button('어묵',()=>take('odeng'));
  else if(id==='marshmallow')button('마시멜로',()=>take('marshmallow'));
  else if(id==='campfire'){
   if(heldItem==='marshmallow'){button(roast>=1?'마시멜로 먹기':'마시멜로 굽기',()=>{if(roast>=1)eat();else act('roast',60);});}
   else button('몸 녹이기',()=>act('warm',60));
  }else if(id==='bubbles'){button('풍선 받기',()=>take('balloon'));button('비눗방울',()=>take('bubble-wand'));}
  else if(id==='sparkler')button('스파클러',()=>take('sparkler'));
  else if(id==='popcorn')button('팝콘',()=>take('popcorn'));
  else if(id==='candyfloss')button('솜사탕',()=>take('candyfloss'));
  else if(id==='icecream')button('아이스크림',()=>take('icecream'));
  else if(id==='coffee'){button('커피',()=>take('coffee'));}
  document.querySelector('#place-name').hidden=actions.children.length===1&&actions.firstChild.querySelector('.action-label')?.textContent===place.name;
  card.hidden=false;anchor={x:place.x,y:place.z< -65?alpineHeight(place.x,place.z)+2.5:2.7,z:place.z};
 }
 function useHeldItem(){if(parkRide||gesture||spa.active||rides.mode&&rides.mode!=='summit')return false;if(['coffee','cocoa'].includes(heldItem)){act('drink',2.8);return true;}if(['odeng','icecream','candyfloss','popcorn'].includes(heldItem)||heldItem==='marshmallow'&&roast>=1){eat();return true;}return false;}
 const touch={},skiPointers=new Map();
 function resetSkiTouch(){skiPointers.clear();pushRequested=jumpRequested=false;for(const k in touch)delete touch[k];document.querySelectorAll('[data-ski].active').forEach(b=>b.classList.remove('active'));}
 for(const b of document.querySelectorAll('[data-ski]')){
  const activate=()=>{if(rides.mode!=='ski')return;if(b.dataset.ski==='push'){pushRequested=true;return;}if(b.dataset.ski==='jump'){jumpRequested=true;window.labSound?.('jump');return;}touch[b.dataset.ski]=true;};
  b.onpointerdown=e=>{e.preventDefault();e.stopPropagation();if(skiPointers.has(b))return;skiPointers.set(b,e.pointerId);b.setPointerCapture?.(e.pointerId);b.classList.add('active');activate();};
  const clear=e=>{if(e.pointerId!==skiPointers.get(b))return;skiPointers.delete(b);delete touch[b.dataset.ski];b.classList.remove('active');};b.onpointerup=clear;b.onpointercancel=clear;b.onlostpointercapture=clear;
  b.onclick=e=>{if(e.detail===0){activate();setTimeout(()=>{delete touch[b.dataset.ski];},120);}};
 }
 for(const event of ['blur','lab:pause','pagehide','orientationchange'])window.addEventListener(event,resetSkiTouch);
 document.addEventListener('visibilitychange',resetSkiTouch);
 window.addEventListener('keydown',e=>{
  if(e.repeat||e.metaKey||e.ctrlKey||document.body.classList.contains('studio-open')||document.body.classList.contains('quiz-open')||e.target.closest?.('input,textarea,select,[contenteditable=true]'))return;
  if(e.code==='KeyE'&&card.hidden&&['bubble-wand','sparkler'].includes(heldItem)){e.preventDefault();blow(true);return;}
  if(e.code==='KeyE'&&card.hidden&&useHeldItem()){e.preventDefault();return;}
  const n=['KeyE','KeyF','KeyG','KeyH'].indexOf(e.code);if(n>=0&&!card.hidden&&actionKeys[n]){e.preventDefault();actionKeys[n]();}
 });
 document.querySelector('#close-place').onclick=()=>{lifecycle.dismiss(place);hideActions();};window.addEventListener('lab:room',()=>{cancel();lifecycle.reset();completedSki=false;});window.addEventListener('lab:wish-submitted',()=>{lifecycle.dismiss(place);hideActions();});
 let jumpRequested=false,pushRequested=false;window.addEventListener('lab:ski-jump',()=>{jumpRequested=true;});
 return{rides,lifecycle,show,wake,cancel,useHeldItem,selectSeat(id){const selected=benchInteractions.find(p=>p.id===id)||interiorInteractions.find(p=>p.id===id);if(!selected||!['bench','dining'].includes(selected.kind))return Promise.resolve(false);if(reservation?.kind===selected.kind&&selected.id===place?.id)return Promise.resolve(true);if(rest)wake();show(id);return sitAt(selected);},get anchor(){return anchor;},get active(){return !!approach||!!parkRide||!!rides.mode||!!rest||spa.active;},get focusGesture(){return gesture;},get facing(){return gestureFacing();},get gesture(){return gesture||(sparklerHeld?'wave':bubbleHeld?'bubble':'');},get heldItem(){return heldItem;},get balloonTone(){return balloonTone;},get balloonStyle(){return balloonStyle;},get roast(){return roast;},
  proximity(x,z){
   position={x,z};lifecycle.update(x,z);
   if(approach||boarding||parkRide||gesture||spa.active||rides.mode&&rides.mode!=='summit'||rest||window.treeDecorationActive?.()){card.hidden=true;return;}
   const nearbyRun=skiRunAt(x,z),resume= !completedSki&&z>=nearbyRun.startZ-7&&z<=nearbyRun.finish&&Math.abs(x-skiRunCenter(z,nearbyRun.id))<skiRunHalfWidth(z,nearbyRun.id)?[{id:'resume-ski',x,z,r:2}]:[];
   const inside=interiorAt(x,z);const points=inside?[...interiorInteractions.filter(p=>!['interior-rest','interior-tea','interior-sauna'].includes(p.id)),...benchInteractions].filter(p=>p.room===inside.id).map(p=>({...p,r:p.r??2.8})):rides.mode==='summit'?[...resume,...benchInteractions.filter(p=>!p.room),...summitFacilities.map(p=>({...p,r:p.r??4})),...skiStarts.map(p=>({...p,id:'slope-'+p.id}))]:[
    ...summitFacilities.map(p=>({...p,r:p.r??4})),...skiStarts.map(p=>({...p,id:'slope-'+p.id})),
    ...resume,...parkActivities,...benchInteractions.filter(p=>!p.room),...winter.destinations.filter(p=>!p.mapOnly&&p.id!=='onsen'&&p.kind!=='photo').map(p=>p.id==='tree'?{...p,x:treeLayout.x,z:treeLayout.z,r:26}:{...p,r:p.id==='ski'?6.5:4.2}),
    ...Object.entries(onsenEntrances).map(([activity,b])=>({id:'onsen',activity,...b.access,r:2.9}))
   ];
   const candidates=points.filter(p=>p.interactive!==false&&lifecycle.allow(p,x,z));
   const distanceTo=p=>Math.hypot(x-p.x,z-p.z);
   const eligible=candidates.filter(p=>distanceTo(p)<p.r).sort((a,b)=>distanceTo(a)-distanceTo(b));
   const current=candidates.find(p=>p.id===place?.id&&p.activity===(card.dataset.activity||undefined));
   // Keep a prompt at its boundary; a nearby seat always outranks the broad tree zone.
   const currentArea=current||candidates.find(p=>p.id===place?.id&&!p.activity);
   const next=eligible[0];
   const keep=currentArea&&distanceTo(currentArea)<currentArea.r+(currentArea.kind==='quiz-station'?0:.65)&&(!next||next.id===currentArea.id||currentArea.id!=='tree'&&distanceTo(next)+.85>=distanceTo(currentArea));
   const near=keep?currentArea:next;
   if(!near){card.hidden=true;return;}
   if(card.hidden||place?.id!==near.id||(near.activity&&card.dataset.activity!==near.activity))show(near.id,near.activity);
   if(['bench','dining'].includes(place?.kind)&&!card.hidden)renderSeatChoices(place);
   const distance=Math.hypot(x-treeLayout.x,z-treeLayout.z),treeAnchor=near.id==='tree'&&distance>1?{x:x+(treeLayout.x-x)*2.7/distance,z:z+(treeLayout.z-z)*2.7/distance}:near;
   anchor={x:treeAnchor.x,y:(inside?interiorSurfaceHeight(near.x,near.z):near.z< -150?alpineHeight(near.x,near.z):0)+2.5,z:treeAnchor.z};
  },
  update(dt,input){
   if(approach){
    const dx=gondolaEntry.x-approach.x,dz=gondolaEntry.z-approach.z,d=Math.hypot(dx,dz),move=Math.min(d,Math.min(.1,dt)*6);
    if(d>.001){approach.x+=dx/d*move;approach.z+=dz/d*move;approach.yaw=Math.atan2(dx,dz);approach.y=alpineHeight(approach.x,approach.z)+.86;}
    const station=gondolaAtStation(serverNow());label.textContent=d>.05?'승강장으로 이동 중':station.open?'곤돌라 탑승 중':`곤돌라 대기 · ${Math.ceil(station.wait/1000)}초`;
    exitControl.show('lift');stopButton.textContent='탑승 취소';
    if(d<=.05&&!boarding&&station.open)start('gondola',undefined,true);
    return {...approach,mode:'summit',walking:move>0};
   }
   if(heldItem==='sparkler'&&!parkRide&&!spa.active&&!rides.mode){sparklerSoundTime+=dt;if(sparklerSoundTime>1.4){sparklerSoundTime=0;window.labAudio?.effect('sparkler');}}
   syncBubbleControl();if(bubbleControl.hidden)blow(false);if(bubbleHeld){bubbleSoundTime+=dt;if(bubbleSoundTime>1.7){bubbleSoundTime=0;window.labSound?.('bubble');}}
   if(parkRide){exitControl.show(parkRide);const seat=reservation?sharedSeatPose(reservation,serverNow()):winter.parkRides.seat(parkRide,parkSeat);card.hidden=true;document.querySelector('#ski-controls').hidden=true;const outer=parkRide==='carousel'?Math.atan2(seat.x-16,seat.z-3.8):ferrisDimensions.yaw+Math.PI/2;return{...seat,mode:parkRide,view:parkRide==='carousel'?carouselCameraView(seat,window.innerWidth<650):{distance:parkRide==='ferris'?(window.innerWidth<650?14:8.6):8,focus:parkRide==='ferris'?{x:seat.x+Math.sin(ferrisDimensions.yaw)*ferrisDimensions.seatDepth*ferrisDimensions.scale*(reservation?.seat===1?-1:1),z:seat.z+Math.cos(ferrisDimensions.yaw)*ferrisDimensions.seatDepth*ferrisDimensions.scale*(reservation?.seat===1?-1:1)}:null,fov:parkRide==='ferris'?50:undefined,pitch:parkRide==='ferris'?.12:.15,yaw:outer,lookHeight:-.55}};}
   const moving=Math.hypot(input?.x||0,input?.z||0)>.15;
   if(moving){if(gesture){clearGesture();finishEating=false;}else if(wake())return null;}
   if(gesture){
    gestureTime-=dt;
    if(gesture==='roast'){
     if(Math.hypot(position.x-summitFacilities.find(p=>p.id==='campfire').model.x,position.z-summitFacilities.find(p=>p.id==='campfire').model.z)>3.8){clearGesture();}
     else{roast=Math.min(1,roast+dt/6);if(roast>=1){clearGesture();window.labSound?.('correct');}}
    }
    if(gestureTime<=0){if(finishEating)clearItem();clearGesture();}
   }
   if(reservation&&rides.mode==='lift')rides.syncElapsed(Math.max(0,(serverNow()-rideClockStart(reservation))/1000));
   if(jumpRequested||pushRequested){input={...input,jump:input?.jump||jumpRequested,push:input?.push||pushRequested};jumpRequested=pushRequested=false;}
   const result=spa.active?spa.update(dt,input):rest?{...rest,mode:rest.mode||'rest'}:rides.update(reservation&&rides.mode==='lift'?0:dt,{...input,steer:(input?.steer||0)+(touch.right?1:0)-(touch.left?1:0),push:input?.push||touch.push,brake:input?.brake||touch.brake,jump:input?.jump||touch.jump});
   if(result?.mode==='dining'){
    const stage=diningServiceState(reservation?.startedAt,serverNow()).stage;
    if(rest.serviceStage!==stage){if(stage==='handoff')window.labSound?.('cup-down');rest.serviceStage=stage;label.textContent=diningChefMessage(stage,reservation?.startedAt);}
   }
   if(result&&gesture){result.gesture=gesture;result.view=place?.view;const facing=gestureFacing(result);if(facing!==null)result.yaw=facing;}
   if(spa.active&&result){label.textContent='';if(spa.state==='Active'&&lifecycle.state==='Entering')lifecycle.activate();}
   if(result?.finished&&result.exitPosition){window.dispatchEvent(new CustomEvent('lab:onsen-end',{detail:{restore:true}}));cancel();return {...result,mode:'',view:undefined};}
   winter.rideChair.visible=rides.mode==='lift'&&rides.routeKind!=='gondola';
   if(rides.mode==='lift'&&rides.routeKind==='gondola'&&result){const pose=reservation&&sharedSeatPose(reservation,serverNow());if(pose)Object.assign(result,pose);if(pose?.transitionDone){rides.disembark(pose);result.mode='summit';result.walking=false;}result.view={distance:12,pitch:.2,fov:55,lookHeight:.3};stopButton.textContent=result.arrived?'내리기':'탑승 취소';}
   if(winter.rideChair.visible&&result){winter.rideChair.position.set(result.x,result.y-.82,result.z);winter.rideChair.rotation.set(0,result.yaw,0);if(reservation){const offset=(reservation.seat===1?1:-1)*.95;result.x+=Math.cos(result.yaw)*offset;result.z-=Math.sin(result.yaw)*offset;}result.view={distance:window.innerWidth<650?28:24,pitch:.25,fov:50,lookHeight:-.35,focus:{x:winter.rideChair.position.x,z:winter.rideChair.position.z}};}
   if(reservation&&rides.mode==='summit'){window.releaseRide?.();reservation=null;window.labSound?.('lift-exit');endUI();}
   if(rides.mode!==lastMode){
    lastMode=rides.mode;
    if(lastMode==='summit'){card.hidden=true;hud.hidden=true;delete hud.dataset.activity;label.textContent='';}
    else if(lastMode)label.textContent={lift:'리프트',ski:'스키'}[lastMode];
   }
   if(result?.mode==='summit')label.textContent=gesture==='roast'?'마시멜로 굽는 중':heldItem==='marshmallow'?(roast>=1?'마시멜로 · 구워짐':'마시멜로 · 모닥불에서 굽기'):'';
   document.querySelector('#ski-controls').hidden=rides.mode!=='ski';
   document.querySelector('[data-ski=push]').hidden=!!result?.launched;
   if(result?.mode==='ski')document.body.dataset.skiEquipment=result.equipment;
   if(result?.mode==='ski'){const text=(result.equipment==='board'?'스노보드':'스키')+' · '+skiRuns.find(r=>r.id===result.runId).name+' · '+Math.round(result.speed*3.6)+' km/h';if(label.textContent!==text)label.textContent=text;stopButton.textContent='주행 종료';}
   if(result?.finished){
    if(result.raceTime){try{const key='lab-ski-best-'+result.runId;localStorage.setItem(key,String(Math.min(Number(localStorage.getItem(key))||Infinity,result.raceTime)));}catch{}completedSki=true;}
    const final={...result,mode:'',speed:0,lean:0,tilt:0,brake:false,launched:false};cancel();return final;
   }
   if(result?.mode&&result.mode!=='summit')exitControl.show(place?.kind==='aquarium'||place?.kind==='view'?'aquarium':place?.kind==='footbath'?'footbath':result.mode);else if(['warm','roast'].includes(gesture))exitControl.show(gesture);
   if(rides.mode==='lift'&&rides.routeKind==='gondola'){stopButton.textContent='내리기';stopButton.disabled=exitPending||!reservation||!canExitGondola(reservation,serverNow());label.textContent=result?.transition==='boarding'?'자리로 이동 중':result?.transition==='exiting'?'승강장으로 내리는 중':result?.arrived?(result.station==='base'?'하단 베이스 · 문이 열렸어요':'구름정상 · 문이 열렸어요'):'구름정상 곤돌라';}
   return result;
  }
 };
}
