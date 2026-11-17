import {carouselCameraView} from './park-layout.js';
import {alpineShift} from './resort-layout.js';
import {ferrisDimensions} from './ferris-layout.js';
import {sharedSeatPose} from './ride-seats.js';
import {interiorInteractions,interiorActivityPoses,interiorAt,interiorSurfaceHeight} from './interior-layout.js';
import {createSkatingController} from './skating.js';
import {createSpaController} from './spa-experience.js';
import {spaShift,alpineHeight,restSeats,skiRuns,skiStarts,skiRunAt,skiRunCenter,skiRunHalfWidth,summitFacilities} from './resort-layout.js';
import {createRideController} from './winter-rides.js';

export function createWinterExperience(winter,companion,travel){
 const skating=createSkatingController();const spa=createSpaController(),rides=createRideController(winter.rides);
 const card=document.querySelector('#place-card'),actions=document.querySelector('#place-actions');
 const hud=document.querySelector('#ride-hud'),label=document.querySelector('#ride-label'),stopButton=document.querySelector('#stop-ride');
 let reservation=null,boarding=false,boardingEpoch=0;let winterBorrowed=false;let parkRide='',parkSeat=0;let place=null,rest=null,lastMode='',anchor=null,actionKeys=[],gesture='',gestureTime=0,heldItem='',roast=0,position={x:0,z:0},finishEating=false;
 const parkActivities=[{id:'snowman',name:'눈사람',x:-6.5,z:5.4,r:3},{id:'bubbles',name:'풍선 부스',x:8,z:19.6,r:3},{id:'icecream',name:'아이스크림',x:-12.7,z:25.3,r:3},{id:'coffee',name:'카페',x:-7,z:27.5,r:3},];
 function act(kind,duration=5){gesture=kind;gestureTime=duration;window.labSound?.(kind);card.hidden=true;}
 function eat(){finishEating=true;act('eat',2.8);}
 function clearItem(){heldItem='';roast=0;finishEating=false;}
 function take(item){clearGesture();heldItem=item;roast=0;finishEating=false;window.labSound?.('select');card.hidden=true;}
 window.addEventListener('lab:emote',e=>{if(['heart','joy','sad','surprise','dance'].includes(e.detail)&&!rides.mode&&!parkRide&&!skating.active){act(e.detail,e.detail==='dance'?7:3.5);}});
 window.addEventListener('lab:wave',()=>{clearItem();act('wave',3);});
 function button(text,fn){
  const b=document.createElement('button'),k=document.createElement('kbd');
  k.textContent=['E','F','G','H'][actionKeys.length]||'';
  b.append(k,document.createTextNode(text));b.setAttribute('aria-label',text);b.onclick=fn;actionKeys.push(fn);actions.append(b);
 }
 function clearGesture(){gesture='';gestureTime=0;}
 function wake(){
  if(gesture){clearGesture();finishEating=false;return true;}
  if(!rest&&!['sauna','lie','tea','lounge','footbath'].includes(spa.kind))return false;
  const standPosition=rest?.returnPosition;spa.stop();rest=null;companion.equip();document.body.classList.remove('spa-active');hud.hidden=true;card.hidden=true;window.dispatchEvent(new CustomEvent('lab:stand',{detail:{position:standPosition}}));return true;
 }
 function returnEquipment(){if(!winterBorrowed)return;winterBorrowed=false;window.dispatchEvent(new Event('lab:return-winter'));companion.equip();}
 function cancel(){boardingEpoch++;if(reservation){window.releaseRide?.();reservation=null;}returnEquipment();skating.stop();parkRide='';
  spa.stop();clearGesture();document.body.classList.remove('spa-active');stopButton.textContent='내리기';rides.stop();rest=null;companion.equip();winter.rideChair.visible=false;hud.hidden=true;card.hidden=true;
 }
 window.addEventListener('lab:ride-expired',e=>{if(!reservation)return;const destination=e.detail==='ferris'?'ferris':'ski';cancel();travel(destination,false);});
 function stop(){if(skating.active){cancel();travel('skating',false);return;}if(parkRide){const destination=parkRide;cancel();travel(destination,false);return;}
  if(['ski','summit'].includes(rides.mode)){cancel();companion.equip();window.dispatchEvent(new Event('lab:stand'));return;}
  if(rest||['sauna','lie','tea','lounge','footbath'].includes(spa.kind)){wake();return;}
  const destination=rides.mode==='sled'?'sled':spa.active?'onsen':'ski';cancel();travel(destination,false);
 }
 async function start(kind){
  if(boarding)return;const epoch=boardingEpoch;
  if(['lift','upperlift'].includes(kind)&&window.reserveRide){boarding=true;try{const claim=await window.reserveRide(kind);if(epoch!==boardingEpoch){window.releaseRide?.();return;}reservation=claim;}catch(error){document.querySelector('#place-description').textContent=error.message;return;}finally{boarding=false;}}
  spa.stop();rest=null;clearGesture();clearItem();
  if(kind!=='sled'){winterBorrowed=true;window.dispatchEvent(new Event('lab:equip-winter'));companion.equip(companion.gear);if(!companion.winterReady)return;}
  if(rides.start(kind,position)){if(kind==='sled')companion.equip('sled');card.hidden=true;hud.hidden=false;lastMode='';stopButton.textContent=kind==='ski'?'스키 벗기':['lift','upperlift'].includes(kind)?'탑승 취소':'내리기';}
 }
 function relax(kind){
  rides.stop();rest=null;clearGesture();clearItem();if(!spa.start(kind))return;
  companion.equip('none');card.hidden=true;hud.hidden=false;window.labSound?.(kind.includes('bath')?'bath':kind==='tea'?'tea':'rest');document.body.classList.add('spa-active');stopButton.textContent=kind==='footbath'?'일어나기':kind.includes('bath')?'탕에서 나오기':'일어나기';
 }
 function show(id,activity='bath'){
  place=interiorInteractions.find(p=>p.id===id)||winter.destinations.find(p=>p.id===id)||summitFacilities.find(p=>p.id===id)||skiStarts.find(p=>'slope-'+p.id===id)||parkActivities.find(p=>p.id===id)||(id==='hand-item'?{id,name:{coffee:'커피',cocoa:'코코아',odeng:'어묵',marshmallow:'마시멜로',icecream:'아이스크림'}[heldItem]||'',...position}:null)||(id==='resume-ski'?{id,name:skiRunAt(position.x,position.z).name,...position}:null);
  if(!place||place.kind==='photo')return;
  if(id.startsWith('slope-'))place={...place,id};
  document.querySelector('#place-kind').textContent='';document.querySelector('#place-name').textContent=place.name;
  document.querySelector('#place-description').textContent='';actions.replaceChildren();actionKeys=[];card.dataset.activity=activity;
  if(['carousel','ferris'].includes(id))button('탑승',async()=>{if(boarding)return;cancel();const epoch=boardingEpoch;boarding=true;try{if(id==='ferris'&&window.reserveRide){const claim=await window.reserveRide('ferris');if(epoch!==boardingEpoch){window.releaseRide?.();return;}reservation=claim;}parkRide=id;parkSeat=parseInt((window.labGuestId||'00').slice(0,2),16)||0;companion.equip('none');hud.hidden=false;label.textContent=place.name;stopButton.textContent='내리기';card.hidden=true;window.labSound?.('ride');}catch(error){document.querySelector('#place-description').textContent=error.message;}finally{boarding=false;}});
  else if(place.kind==='exit')button('나가기',()=>window.exitInterior?.());
  else if(place.room)button(place.name,()=>{cancel();const mode=place.kind==='tea'?'tea':place.kind==='footbath'?'bath':place.kind==='sauna'?'sauna':'lie';rest={...interiorActivityPoses[id],returnPosition:{x:place.x,z:place.z},mode,view:{distance:7,pitch:.34,yaw:.25,lookHeight:-.5}};companion.equip('none');card.hidden=true;hud.hidden=false;stopButton.textContent='일어나기';label.textContent='';window.labSound?.(mode==='bath'?'bath':'rest');});
  else if(id==='ski-gear'){button('스키',()=>{window.dispatchEvent(new Event('lab:equip-winter'));companion.equip('ski');card.hidden=true;});button('장비 해제',()=>{window.dispatchEvent(new Event('lab:unequip-winter'));companion.equip('none');card.hidden=true;});}
  else if(id==='snowman')button('인사',()=>{window.dispatchEvent(new Event('lab:snowman'));card.hidden=true;});
  else if(id==='post-office')button('소원',()=>window.openWishComposer?.());
  else if(id==='skating')button('스케이트',()=>{cancel();skating.start();companion.equip('skates');hud.hidden=false;label.textContent='스케이트';stopButton.textContent='벗기';card.hidden=true;window.labSound?.('ride');});
  else if(id==='hand-item')button(['coffee','cocoa'].includes(heldItem)?'마시기':'먹기',()=>['coffee','cocoa'].includes(heldItem)?act('drink',2.8):eat());
  else if(id==='quiz')button('퀴즈 시작',()=>window.openQuickQuiz?.());
  else if(id==='upperlift')button('상부 리프트 타기',()=>start('upperlift'));
  else if(id==='ski')button('리프트 타기',()=>start('lift'));
  else if(id.startsWith('slope-')||id==='resume-ski')button('스키 타기',()=>start('ski'));
  else if(id==='sled')button('썰매 타기',()=>start('sled'));
  else if(id==='footbath')button('족욕하기',()=>relax('footbath'));
  else if(id==='lounge')button('앉기',()=>relax('lounge'));
  else if(id==='onsen')button('탕에 들어가기',()=>relax(activity));
  else if(id==='sauna')button('입장',()=>window.enterInterior?.('ryokan'));
  else if(id==='healing')button('쉬기',()=>{rides.stop();companion.equip('none');rest=restSeats.healing;card.hidden=true;hud.hidden=false;stopButton.textContent='일어나기';label.textContent='';window.labSound?.('rest');});
  else if(id==='tree')button('트리 꾸미기',()=>window.dispatchEvent(new Event('lab:tree-open')));
  else if(id==='odeng')button('어묵',()=>take('odeng'));
  else if(id==='marshmallow')button('마시멜로',()=>take('marshmallow'));
  else if(id==='campfire'){
   if(heldItem==='marshmallow'){button(roast>=1?'마시멜로 먹기':'마시멜로 굽기',()=>{if(roast>=1)eat();else act('roast',60);});}
   else button('몸 녹이기',()=>act('warm',60));
  }else if(id==='bubbles'){button('풍선',()=>take('balloon'));button('비눗방울',()=>{take('bubble-wand');act('bubble',3);});}
  else if(id==='icecream')button('아이스크림',()=>take('icecream'));
  else if(id==='coffee'){button('커피',()=>take('coffee'));}
  card.hidden=false;anchor={x:place.x,y:rides.mode==='summit'?alpineHeight(place.x,place.z)+2.5:2.7,z:place.z};
 }
 function useHeldItem(){if(skating.active||parkRide||gesture||spa.active||rides.mode&&rides.mode!=='summit')return false;if(['coffee','cocoa'].includes(heldItem)){act('drink',2.8);return true;}if(['odeng','icecream'].includes(heldItem)||heldItem==='marshmallow'&&roast>=1){eat();return true;}return false;}
 const touch={};
 for(const b of document.querySelectorAll('[data-ski]')){
  const clear=()=>delete touch[b.dataset.ski];b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture?.(e.pointerId);touch[b.dataset.ski]=true;};b.onpointerup=clear;b.onpointercancel=clear;b.onlostpointercapture=clear;
 }
 window.addEventListener('blur',()=>{for(const k in touch)delete touch[k];});
 window.addEventListener('keydown',e=>{
  if(e.repeat||e.metaKey||e.ctrlKey||document.body.classList.contains('studio-open')||document.body.classList.contains('quiz-open')||e.target.closest?.('input,textarea,select,[contenteditable=true]'))return;
  if(e.code==='KeyE'&&card.hidden&&useHeldItem()){e.preventDefault();return;}
  const n=['KeyE','KeyF','KeyG','KeyH'].indexOf(e.code);if(n>=0&&!card.hidden&&actionKeys[n]){e.preventDefault();actionKeys[n]();}
 });
 document.querySelector('#close-place').onclick=()=>card.hidden=true;stopButton.onclick=stop;
 return{rides,show,wake,cancel,useHeldItem,get anchor(){return anchor;},get active(){return skating.active||!!parkRide||!!rides.mode||!!rest||spa.active;},get focusGesture(){return gesture;},get gesture(){return gesture||(heldItem==='bubble-wand'?'bubble':'');},get heldItem(){return heldItem;},get roast(){return roast;},
  proximity(x,z){
   position={x,z};
   if(skating.active||parkRide||gesture||spa.active||rides.mode&&rides.mode!=='summit'||rest){card.hidden=true;return;}
   const nearbyRun=skiRunAt(x,z);
   const inside=interiorAt(x,z);const points=inside?interiorInteractions.filter(p=>p.room===inside.id).map(p=>({...p,r:2.8})):rides.mode==='summit'?[...summitFacilities.map(p=>({...p,r:p.r??4})),...skiStarts.map(p=>({...p,id:'slope-'+p.id}))]:[
    ...summitFacilities.map(p=>({...p,r:p.r??4})),...skiStarts.map(p=>({...p,id:'slope-'+p.id})),
    ...(z>=nearbyRun.startZ-7&&z<=nearbyRun.finish&&Math.abs(x-skiRunCenter(z,nearbyRun.id))<skiRunHalfWidth(z,nearbyRun.id)?[{id:'resume-ski',x,z,r:2}]:[]),...parkActivities,...winter.destinations.filter(p=>p.id!=='onsen'&&p.kind!=='photo').map(p=>({...p,r:4.2})),{id:'ski',x:-36,z:-185+alpineShift,r:5},
    {id:'onsen',activity:'bath',x:-10,z:116+spaShift,r:4.8},{id:'onsen',activity:'smallbath',x:-19,z:128.5+spaShift,r:4}
   ];
   const near=points.filter(p=>Math.hypot(x-p.x,z-p.z)<p.r).sort((a,b)=>Math.hypot(x-a.x,z-a.z)-Math.hypot(x-b.x,z-b.z))[0];
   if(!near){card.hidden=true;return;}
   if(card.hidden||place?.id!==near.id||(near.activity&&card.dataset.activity!==near.activity))show(near.id,near.activity);
   anchor={x:near.x,y:(inside?interiorSurfaceHeight(near.x,near.z):near.z< -150?alpineHeight(near.x,near.z):0)+2.5,z:near.z};
  },
  update(dt,input){
   if(skating.active){card.hidden=true;const result=skating.update(dt,input);if(result.finished){companion.equip('none');hud.hidden=true;}return result;}
   if(parkRide){const seat=reservation?sharedSeatPose(reservation,Date.now()+(window.labServerOffset||0)):winter.parkRides.seat(parkRide,parkSeat);card.hidden=true;document.querySelector('#ski-controls').hidden=true;const outer=parkRide==='carousel'?Math.atan2(seat.x-16,seat.z-3.8):ferrisDimensions.yaw+Math.PI/2;return{...seat,mode:parkRide,view:parkRide==='carousel'?carouselCameraView(seat,window.innerWidth<650):{distance:parkRide==='ferris'?(window.innerWidth<650?14:8.6):8,focus:parkRide==='ferris'?{x:seat.x+Math.sin(ferrisDimensions.yaw)*ferrisDimensions.seatDepth*ferrisDimensions.scale*(reservation?.seat===1?-1:1),z:seat.z+Math.cos(ferrisDimensions.yaw)*ferrisDimensions.seatDepth*ferrisDimensions.scale*(reservation?.seat===1?-1:1)}:null,fov:parkRide==='ferris'?50:undefined,pitch:parkRide==='ferris'?.12:.15,yaw:outer,lookHeight:-.55}};}
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
   if(reservation&&rides.mode==='lift')rides.syncElapsed(Math.max(0,(Date.now()+(window.labServerOffset||0)-reservation.startedAt)/1000));
   const result=spa.active?spa.update(dt,input):rest?{...rest,mode:rest.mode||'rest'}:rides.update(reservation&&rides.mode==='lift'?0:dt,{...input,steer:(input?.steer||0)+(touch.right?1:0)-(touch.left?1:0),push:input?.push||touch.push,brake:input?.brake||touch.brake});
   if(result&&gesture){result.gesture=gesture;result.view=place?.view;if(['warm','roast'].includes(gesture))result.yaw=Math.atan2(summitFacilities.find(p=>p.id==='campfire').model.x-result.x,summitFacilities.find(p=>p.id==='campfire').model.z-result.z);}
   if(spa.active&&result)label.textContent='';
   winter.rideChair.visible=rides.mode==='lift';
   if(winter.rideChair.visible&&result){winter.rideChair.position.set(result.x,result.y-.82,result.z);winter.rideChair.rotation.set(0,result.yaw,0);if(reservation){const p=sharedSeatPose(reservation,Date.now()+(window.labServerOffset||0));result.x=p.x;result.z=p.z;}result.view={distance:9,pitch:.18,yaw:result.yaw+.75,lookHeight:-.3};}
   if(reservation&&rides.mode==='summit'){window.releaseRide?.();reservation=null;}
   if(rides.mode!==lastMode){
    lastMode=rides.mode;
    if(lastMode==='summit'){card.hidden=true;label.textContent='정상 · WASD 이동';stopButton.textContent='스키 벗기';}
    else if(lastMode)label.textContent={lift:'리프트',ski:'스키',sled:'눈썰매'}[lastMode];
   }
   if(result?.mode==='summit')label.textContent=gesture==='roast'?'마시멜로 굽는 중':heldItem==='marshmallow'?(roast>=1?'마시멜로 · 구워짐':'마시멜로 · 모닥불에서 굽기'):'';
   document.querySelector('#ski-controls').hidden=rides.mode!=='ski';
   if(result?.mode==='ski')label.textContent=result.launched?`${skiRuns.find(r=>r.id===result.runId).name} · ${Math.round(result.speed*3.6)} km/h · ${result.raceTime.toFixed(1)}초`:'W / ↑ 출발 · A D 조향 · S 감속';
   if(result?.finished){
    returnEquipment();companion.equip();hud.hidden=true;card.hidden=true;
    if(result.raceTime){let best=Infinity;try{const key='lab-ski-best-'+result.runId;best=Math.min(Number(localStorage.getItem(key))||Infinity,result.raceTime);localStorage.setItem(key,String(best));}catch{}label.textContent=`완주 ${result.raceTime.toFixed(1)}초 · 최고 ${best.toFixed(1)}초`;hud.hidden=false;stopButton.textContent='리프트로';}
   }
   return result;
  }
 };
}
