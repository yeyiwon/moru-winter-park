import {bubbleDuration} from './chat-policy.js';
import {nearestCameraSurface} from './camera-raycast.js';
import {serverNow} from './server-clock.js';
import {createLabelLayout,nearbyLabel} from './world-labels.js';
import {sharedSeatPose} from './ride-seats.js';
import {interiorAt} from './interior-layout.js';
import {decodeActivity} from './activity-state.js';
import {createActivityReactions} from './activity-reactions.js';
import * as T from './vendor/three.module.js';
import {createCompanion} from './companion.js';
import {createRemoteMotion} from './remote-motion.js';
import {projectedCharacterHeight} from './render-budget.js';
export function createVisitors(scene,{rideChair=null,occluders=()=>[]}={}){
 const remoteChairs=new Map(),labelRay=new T.Raycaster(),labelTarget=new T.Vector3();
 function obscured(camera,position,nameHeight){
  labelTarget.copy(position);labelTarget.y+=nameHeight;const length=camera.position.distanceTo(labelTarget);
  labelRay.set(camera.position,labelTarget.sub(camera.position).normalize());labelRay.near=.1;labelRay.far=Math.max(.1,length-.4);
  for(const object of occluders()){
   let visible=true;for(let parent=object;parent;parent=parent.parent)if(!parent.visible){visible=false;break;}
   if(!visible||!object.geometry)continue;
   const materials=Array.isArray(object.material)?object.material:[object.material];
   if(materials.every(m=>!m||m.isShaderMaterial||m.transparent&&m.opacity<.65))continue;
   if(nearestCameraSurface(object,labelRay))return true;
  }
  return false;
 }

 function updateChairs(){const active=new Set();for(const reservation of window.labRideSeats||[]){if(!['lift','upperlift','ridgelift'].includes(reservation.kind))continue;const key=reservation.kind+':'+reservation.cabin,own=window.labRideReservation;if(own&&own.kind===reservation.kind&&own.cabin===reservation.cabin)continue;active.add(key);let chair=remoteChairs.get(key);if(!chair&&rideChair){chair=rideChair.clone(true);chair.name='shared-lift-chair-'+key;scene.add(chair);remoteChairs.set(key,chair);}if(chair){const p=sharedSeatPose(reservation,serverNow()),offset=reservation.seat===1?.95:-.95;chair.position.set(p.x-Math.cos(p.yaw)*offset,p.y-.82,p.z+Math.sin(p.yaw)*offset);chair.rotation.set(0,p.yaw,0);chair.visible=!window.labInterior&&!p.finished;}}for(const [key,chair]of remoteChairs)if(!active.has(key)){chair.removeFromParent();remoteChairs.delete(key);}}
 const peers=new Map(),container=document.querySelector('#visitor-labels'),screen=new T.Vector3(),frustum=new T.Frustum(),projection=new T.Matrix4(),bounds=new T.Sphere(new T.Vector3(),3.5);
 function remove(id,p){scene.remove(p.pet.group);p.reactions.dispose?.();p.bounds.dispose();p.label.remove();p.pet.dispose();peers.delete(id);}
 const onVisitors=e=>{const ids=new Set(e.detail.map(p=>p.id));for(const [id,p]of peers)if(!ids.has(id))remove(id,p);for(const state of e.detail){let peer=peers.get(state.id);if(!peer){const pet=createCompanion({detail:'remote'}),label=document.createElement('span');label.className='visitor-label';const name=document.createElement('b'),bubble=document.createElement('div');name.textContent=state.name;bubble.className='speech-bubble';label.append(name,bubble);container.append(label);pet.group.position.set(state.x,state.y??.95,state.z);scene.add(pet.group);peer={pet,label,state,motion:createRemoteMotion(),sample:{},phase:0,fx:{id:state.id},bounds:createLabelLayout(label),animationElapsed:0,labelVisible:false,labelAlpha:0,labelCheck:0,occluded:false,bubbleUntil:0,chatAt:null,reactions:createActivityReactions(scene)};peers.set(state.id,peer);}peer.motion.setDelay(window.labRealtimeActive?180:1100);peer.motion.push(state,serverNow());peer.state=state;if(peer.label.querySelector('b').textContent!==state.name)peer.label.querySelector('b').textContent=state.name;const bubble=peer.label.querySelector('.speech-bubble');if(bubble.textContent!==(state.chat||''))bubble.textContent=state.chat||'';if(state.chat&&state.chatAt!==peer.chatAt){peer.chatAt=state.chatAt;peer.bubbleUntil=performance.now()+bubbleDuration(state.chatAt,serverNow());}bubble.hidden=!state.chat||performance.now()>=peer.bubbleUntil;const appearance=[state.color,state.colorTop,state.accessory,state.fluff,state.roundness].join('|');if(peer.appearance!==appearance){peer.appearance=appearance;peer.pet.customize({fur:state.color,furTop:state.colorTop,accessory:state.accessory,fluff:state.fluff??100,roundness:state.roundness??50});}peer.pet.equip(['ski','lift','summit'].includes(state.mode)?(state.accessory?.split(',').includes('board')?'board':'ski'):state.mode==='skate'?'skates':peer.pet.gear);}};window.addEventListener('lab:visitors',onVisitors);
 const ownLabel=document.querySelector('#self-label'),ownLayout=ownLabel?createLabelLayout(ownLabel):null;

 return{dispose(){window.removeEventListener('lab:visitors',onVisitors);for(const [id,p]of peers)remove(id,p);for(const chair of remoteChairs.values())chair.removeFromParent();remoteChairs.clear();ownLayout?.dispose();},effectStates(){return [...peers.values()].filter(p=>p.pet.group.visible).map(p=>p.fx);},update(dt,time,camera,ownBounds=null){let labelChecks=2;const localNow=performance.now();updateChairs();frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));const occupied=ownBounds?[ownBounds]:[];for(const p of peers.values()){const assigned=window.labRideSeats?.find(s=>s.id===p.state.id),synced=assigned?sharedSeatPose(assigned,serverNow()):null,s=synced?{...p.state,...synced}:p.motion.sample(serverNow(),p.sample)||p.state,g=p.pet.group;bounds.center.set(s.x,(s.y??.95)+.6,s.z);const visible=((s.region&&s.region!=='outdoors'?s.region:interiorAt(s.x,s.z)?.id)||null)===(window.labInterior||null)&&frustum.intersectsSphere(bounds)&&!window.isVisitorBlocked?.(s.id);g.visible=visible;if(!visible){g.position.set(s.x,s.y??.95,s.z);p.label.hidden=true;p.labelVisible=false;p.labelAlpha=0;if(p.onScreen!==false)p.reactions.suspend();p.onScreen=false;continue;}p.onScreen=true;const pixels=projectedCharacterHeight(camera,bounds.center,innerHeight);p.pet.setViewDetail(pixels);const oldX=g.position.x,oldZ=g.position.z,d=Math.hypot(oldX-s.x,oldZ-s.z),blend=1-Math.exp(-dt*5);
  g.position.set(s.x,s.y??.95,s.z);
  const traveled=Math.hypot(g.position.x-oldX,g.position.z-oldZ),speed=d>12?0:Math.min(56,traveled/Math.max(dt,.001));p.phase+=d>12?0:traveled*5.4;
  Object.assign(p.fx,{x:g.position.x,y:g.position.y,z:g.position.z,yaw:g.rotation.y,mode:s.mode,accessory:s.accessory,emote:s.gesture,speed});
  const turn=Math.atan2(Math.sin(s.yaw-g.rotation.y),Math.cos(s.yaw-g.rotation.y));g.rotation.y+=turn*blend;p.animationElapsed+=dt;if(p.animationElapsed>=(pixels<30?1/15:pixels<65?1/30:0)){p.pet.pose({room:(s.region&&s.region!=='outdoors'?s.region:interiorAt(s.x,s.z)?.id),mode:s.walking?'':s.mode,lean:s.lean||0,tilt:s.tilt||0,brake:s.brake||false,diningStartedAt:assigned?.startedAt,diningNow:serverNow(),...decodeActivity(s.gesture||''),walking:speed>.08&&(!s.mode||s.mode==='summit'||s.walking),speed,phase:p.phase,time});p.reactions.update({...decodeActivity(s.gesture||''),mode:s.mode,x:g.position.x,y:g.position.y,z:g.position.z,yaw:g.rotation.y,time,dt:p.animationElapsed,still:document.body.classList.contains('still')});p.animationElapsed=0;}screen.copy(g.position);screen.y+=p.pet.nameHeight;screen.project(camera);const onScreen=Math.abs(screen.z)<=1&&Math.abs(screen.x)<=1.05&&Math.abs(screen.y)<=1.05;
  p.labelVisible=onScreen&&nearbyLabel({player:window.labPlayerState,camera:camera.position,subject:g.position,pixels,visible:p.labelVisible});
  if(p.labelVisible&&localNow>=p.labelCheck&&labelChecks>0){p.occluded=obscured(camera,g.position,p.pet.nameHeight);p.labelCheck=localNow+180;labelChecks--;}
  const desired=p.labelVisible&&!p.occluded?1:0;p.labelAlpha+=(desired-p.labelAlpha)*(1-Math.exp(-dt*14));
  p.label.hidden=p.labelAlpha<.025;p.label.style.opacity=String(p.labelAlpha.toFixed(3));
  const bubble=p.label.querySelector('.speech-bubble'),remaining=p.bubbleUntil-localNow;bubble.hidden=!s.chat||remaining<=0||window.isChatHidden?.(s.id);bubble.style.opacity=String(Math.max(0,Math.min(1,remaining/700)));
  if(p.label.hidden)continue;
  const fitted=p.bounds.fit((screen.x*.5+.5)*innerWidth,(-screen.y*.5+.5)*innerHeight-6,innerWidth,innerHeight),x=fitted.x;let y=fitted.y;p.label.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`;if(!p.label.hidden){let rect=p.bounds.bounds(x,y);for(const avoid of occupied){if(rect.right>avoid.left-5&&rect.left<avoid.right+5&&rect.bottom>avoid.top-5&&rect.top<avoid.bottom+5){const dy=rect.bottom-avoid.top+7;y-=dy;rect.top-=dy;rect.bottom-=dy;}}const safe=p.bounds.fit(x,y,innerWidth,innerHeight);p.label.style.transform=`translate(${safe.x}px,${safe.y}px) translate(-50%,-100%)`;occupied.push(safe.bounds);}
 }}};
}
