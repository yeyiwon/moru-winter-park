import {createSpaController} from './spa-experience.js';
import {alpineHeight,restSeats,skiRuns,summitFacilities} from './resort-layout.js';
import {createRideController} from './winter-rides.js';

export function createWinterExperience(winter,companion,travel){
 const spa=createSpaController(),rides=createRideController(winter.rides);
 const card=document.querySelector('#place-card'),actions=document.querySelector('#place-actions');
 const hud=document.querySelector('#ride-hud'),label=document.querySelector('#ride-label'),stopButton=document.querySelector('#stop-ride');
 let place=null,rest=null,lastMode='',anchor=null,actionKeys=[],gesture='',gestureTime=0;
 function button(text,fn){
  const b=document.createElement('button'),k=document.createElement('kbd');
  k.textContent=['E','F','G','H'][actionKeys.length]||'';
  b.append(k,document.createTextNode(text));b.setAttribute('aria-label',text);b.onclick=fn;actionKeys.push(fn);actions.append(b);
 }
 function clearGesture(){gesture='';gestureTime=0;}
 function wake(){
  if(gesture){clearGesture();return true;}
  if(!rest&&!['sauna','lie','tea'].includes(spa.kind))return false;
  spa.stop();rest=null;companion.equip();document.body.classList.remove('spa-active');hud.hidden=true;card.hidden=true;window.dispatchEvent(new Event('lab:stand'));return true;
 }
 function cancel(){
  spa.stop();clearGesture();document.body.classList.remove('spa-active');stopButton.textContent='내리기';rides.stop();rest=null;companion.equip();winter.rideChair.visible=false;hud.hidden=true;card.hidden=true;
 }
 function stop(){const destination=rides.mode==='sled'?'sled':spa.active?(spa.kind.includes('bath')?'onsen':'sauna'):rest?'healing':'ski';cancel();travel(destination,false);}
 function start(kind,runId){
  spa.stop();rest=null;clearGesture();
  if(kind!=='sled'){window.dispatchEvent(new Event('lab:equip-winter'));companion.equip(companion.gear);if(!companion.winterReady)return;}
  if(rides.start(kind,runId)){if(kind==='sled')companion.equip('sled');card.hidden=true;hud.hidden=false;lastMode='';stopButton.textContent='내리기';}
 }
 function relax(kind){
  rides.stop();rest=null;clearGesture();if(!spa.start(kind))return;
  companion.equip('none');card.hidden=true;hud.hidden=false;document.body.classList.add('spa-active');stopButton.textContent=kind.includes('bath')?'탕에서 나오기':'일어나기';
 }
 function show(id,activity='bath'){
  place=winter.destinations.find(p=>p.id===id)||summitFacilities.find(p=>p.id===id)||(id==='summit-start'?{id,name:'슬로프 입구',x:-8,z:-333}:null);
  if(!place)return;
  document.querySelector('#place-kind').textContent='';document.querySelector('#place-name').textContent=place.name;
  document.querySelector('#place-description').textContent='';actions.replaceChildren();actionKeys=[];card.dataset.activity=activity;
  if(id==='quiz')button('퀴즈 시작',()=>window.openQuickQuiz?.());
  else if(id==='ski')button('리프트 타기',()=>start('lift'));
  else if(id==='summit-start')for(const run of skiRuns)button(run.name,()=>start('ski',run.id));
  else if(id==='sled')button('썰매 타기',()=>start('sled'));
  else if(id==='onsen')button('탕에 들어가기',()=>relax(activity));
  else if(id==='sauna'){
   button('실내로 들어가기',()=>{travel('sauna',false);window.enterSpaInterior?.();});
   button('벤치에 앉기',()=>relax('sauna'));button('매트에 눕기',()=>relax('lie'));button('차 마시기',()=>relax('tea'));
  }else if(id==='healing')button('쉬기',()=>{rides.stop();companion.equip('none');rest=restSeats.healing;card.hidden=true;hud.hidden=false;stopButton.textContent='일어나기';label.textContent='휴식 중 · 이동하면 일어납니다';});
  else if(id==='tree')button('트리 꾸미기',()=>window.dispatchEvent(new Event('lab:tree-open')));
  else if(id==='restroom')button('문 열기 / 닫기',()=>winter.toggleRestroom?.());
  else if(['odeng','marshmallow','campfire'].includes(id))button({odeng:'어묵 먹기',marshmallow:'마시멜로 먹기',campfire:'몸 녹이기'}[id],()=>{gesture=id==='campfire'?'warm':'snack';gestureTime=id==='campfire'?60:6;card.hidden=true;});
  card.hidden=false;anchor={x:place.x,y:rides.mode==='summit'?alpineHeight(place.x,place.z)+2.5:2.7,z:place.z};
 }
 const touch={};
 for(const b of document.querySelectorAll('[data-ski]')){
  const clear=()=>delete touch[b.dataset.ski];b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture?.(e.pointerId);touch[b.dataset.ski]=true;};b.onpointerup=clear;b.onpointercancel=clear;b.onlostpointercapture=clear;
 }
 window.addEventListener('blur',()=>{for(const k in touch)delete touch[k];});
 window.addEventListener('keydown',e=>{
  if(e.repeat||e.metaKey||e.ctrlKey||document.body.classList.contains('studio-open')||document.body.classList.contains('quiz-open')||e.target.closest?.('input,textarea,select,[contenteditable=true]'))return;
  const n=['KeyE','KeyF','KeyG','KeyH'].indexOf(e.code);if(n>=0&&!card.hidden&&actionKeys[n]){e.preventDefault();actionKeys[n]();}
 });
 document.querySelector('#close-place').onclick=()=>card.hidden=true;stopButton.onclick=stop;
 return{rides,show,wake,cancel,get anchor(){return anchor;},get active(){return!!rides.mode||!!rest||spa.active;},
  proximity(x,z){
   if(gesture||spa.active||rides.mode&&rides.mode!=='summit'||rest){card.hidden=true;return;}
   const points=rides.mode==='summit'?[...summitFacilities.map(p=>({...p,r:4})),{id:'summit-start',x:-8,z:-333,r:7}]:[
    ...winter.destinations.filter(p=>p.id!=='onsen').map(p=>({...p,r:4.2})),{id:'ski',x:-36,z:-185,r:5},{id:'sauna',x:12,z:123,r:9},
    {id:'onsen',activity:'bath',x:-10,z:116,r:4.8},{id:'onsen',activity:'smallbath',x:-19,z:128.5,r:4}
   ];
   const near=points.filter(p=>Math.hypot(x-p.x,z-p.z)<p.r).sort((a,b)=>Math.hypot(x-a.x,z-a.z)-Math.hypot(x-b.x,z-b.z))[0];
   if(!near){card.hidden=true;return;}
   if(card.hidden||place?.id!==near.id||(near.activity&&card.dataset.activity!==near.activity))show(near.id,near.activity);
   anchor={x:near.x,y:(rides.mode==='summit'?alpineHeight(near.x,near.z):0)+2.5,z:near.z};
  },
  update(dt,input){
   const moving=Math.hypot(input?.x||0,input?.z||0)>.15;
   if(moving){if(gesture)clearGesture();else if(wake())return null;}
   if(gesture){gestureTime-=dt;if(gestureTime<=0)clearGesture();}
   const result=spa.active?spa.update(dt,input):rest?{...rest,mode:'rest'}:rides.update(dt,{...input,steer:(input?.steer||0)+(touch.right?1:0)-(touch.left?1:0),push:input?.push||touch.push,brake:input?.brake||touch.brake});
   if(result&&gesture){result.gesture=gesture;result.view=place?.view;}
   if(spa.active&&result)label.textContent=result.label+' · '+Math.floor(result.elapsed)+'초';
   winter.rideChair.visible=rides.mode==='lift';
   if(winter.rideChair.visible&&result){winter.rideChair.position.set(result.x,result.y-.82,result.z);winter.rideChair.rotation.set(0,result.yaw,0);}
   if(rides.mode!==lastMode){
    lastMode=rides.mode;
    if(lastMode==='summit'){card.hidden=true;label.textContent='정상 · WASD 이동';stopButton.textContent='산 아래로';}
    else if(lastMode)label.textContent={lift:'리프트',ski:'스키',sled:'눈썰매'}[lastMode];
   }
   if(result?.mode==='summit')label.textContent=gesture?`${place.name} · 이동하면 멈춥니다`:'정상 · WASD 이동';
   document.querySelector('#ski-controls').hidden=rides.mode!=='ski';
   if(result?.mode==='ski')label.textContent=result.launched?`${skiRuns.find(r=>r.id===result.runId).name} · ${Math.round(result.speed*3.6)} km/h · ${result.raceTime.toFixed(1)}초`:'W / ↑ 출발 · A D 조향 · S 감속';
   if(result?.finished){
    companion.equip();hud.hidden=true;card.hidden=true;
    if(result.raceTime){let best=Infinity;try{const key='lab-ski-best-'+result.runId;best=Math.min(Number(localStorage.getItem(key))||Infinity,result.raceTime);localStorage.setItem(key,String(best));}catch{}label.textContent=`완주 ${result.raceTime.toFixed(1)}초 · 최고 ${best.toFixed(1)}초`;hud.hidden=false;stopButton.textContent='리프트로';}
   }
   return result;
  }
 };
}
