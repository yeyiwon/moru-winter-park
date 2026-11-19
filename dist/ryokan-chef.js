import * as T from './vendor/three.module.js';
import {makeBuilder,mergeFinish} from './architecture-kit.js';
import {createRyokanMeal} from './ryokan-meal.js';
import {serverNow} from './server-clock.js';
import {activeDiningService,diningSeatPose,diningServiceState,smoothService} from './ryokan-service.js';

// One shared clock drives the chef, plate and guests. No per-guest animation
// timers or additional network traffic are needed, including for late arrivals.
export function buildRyokanChef(parent,m){
 const root=new T.Group();root.name='omakase-kitchen';root.userData.keepGroup=true;root.position.set(12,0,-1.8);parent.add(root);
 const b=makeBuilder(root),white=new T.MeshStandardMaterial({color:'#fff4dd',roughness:.8}),skin=new T.MeshStandardMaterial({color:'#f5d8b9',roughness:.9}),ink=m.navy;
 b.box(7.7,.12,.8,m.lightWood,0,1.02,-1.35);b.box(7.2,.85,.65,m.endgrain,0,.53,-1.35);
 for(const x of [-2.5,-1.8,-1.1]){b.mesh(new T.CylinderGeometry(.21,.18,.44,16),m.darkStone,x,1.3,-1.35);b.ring(.2,.018,m.brass,x,1.53,-1.35);}
 for(const x of [1.5,2.1,2.7])for(let j=0;j<4;j++)b.mesh(new T.CylinderGeometry(.25,.23,.035,16),m.cream,x,1.1+j*.04,-1.35);
 b.box(1.5,.04,.65,m.lightWood,0,1.21,1.4);b.box(.55,.08,.22,m.linen,0,1.27,1.4);b.oval(new T.MeshStandardMaterial({color:'#d79b85',roughness:.65}),0,1.33,1.4,.3,.045,.13);
 mergeFinish(root);
 const rig=new T.Group();rig.name='omakase-chef';rig.userData.keepGroup=true;root.add(rig);const body=makeBuilder(rig);
 body.oval(white,0,1.13,0,.47,.56,.32);body.box(.66,.63,.04,ink,0,.96,.303);body.box(.035,.38,.045,m.linen,0,1.33,.323);
 for(const side of [-1,1])body.oval(skin,side*.38,1.94,.03,.09,.12,.09);
 body.oval(skin,0,1.95,.06,.4,.4,.34);for(const side of [-1,1]){body.oval(ink,side*.135,1.97,.39,.025,.035,.02);body.oval(m.linen,side*.17,1.85,.363,.065,.03,.016);}
 body.tube([[-.07,1.83,.395],[0,1.81,.409],[.07,1.83,.395]],.012,ink);
 body.mesh(new T.CylinderGeometry(.35,.36,.15,24),white,0,2.3,.06);for(const [x,y,z]of [[0,2.56,.04],[-.22,2.49,.02],[.22,2.49,.02],[0,2.48,.23]])body.oval(white,x,y,z,.23,.22,.22);
 mergeFinish(rig);
 const legs=[];for(const side of [-1,1]){const leg=new T.Group();leg.name='chef-leg';leg.userData.keepGroup=true;leg.position.set(side*.2,.6,.03);rig.add(leg);const lb=makeBuilder(leg);lb.oval(ink,0,-.27,0,.13,.28,.14);lb.oval(ink,0,-.47,.09,.16,.1,.23);mergeFinish(leg);legs.push(leg);}
 const arms=[];
 for(const side of [-1,1]){const arm=new T.Group();arm.name='chef-arm';arm.userData.keepGroup=true;arm.position.set(side*.4,1.45,.12);rig.add(arm);const ab=makeBuilder(arm);ab.rod([0,0,0],[side*.12,-.24,.4],.12,white);ab.rod([side*.12,-.24,.4],[side*.03,-.2,1.1],.09,white);ab.oval(skin,side*.03,-.19,1.13,.1,.09,.12);mergeFinish(arm);arms.push(arm);}
 const knife=new T.Group();knife.name='chef-knife';knife.userData.keepGroup=true;arms[1].add(knife);const kb=makeBuilder(knife);kb.box(.32,.12,.024,m.silver,-.1,-.16,1.27);kb.box(.18,.055,.055,m.endgrain,.12,-.1,1.27);mergeFinish(knife);
 const serving=createRyokanMeal();serving.name='chef-serving';serving.userData.keepGroup=true;serving.visible=false;root.add(serving);
 let previousTime=null;
 return{root,update(time,still,player,reservations=null,clockTime=null){
  const near=!player||Math.hypot(player.x-(parent.position.x+12),player.z+1.8)<18;if(!near)return;
  const now=Number.isFinite(clockTime)?clockTime:serverNow(),seats=reservations||globalThis.window?.labRideSeats||[],own=globalThis.window?.labRideReservation;
  const all=own?.kind==='dining'&&!seats.some(s=>s.kind==='dining'&&s.seat===own.seat&&s.startedAt===own.startedAt)?[...seats,own]:seats;
  const active=activeDiningService(all,now),state=active?diningServiceState(active.startedAt,now):null,seat=active?diningSeatPose(active):null;
  const t=still?0:time,dt=previousTime===null?1/30:Math.max(0,Math.min(.1,time-previousTime));previousTime=time;
  const servingPhase=state&&['serving','handoff'].includes(state.stage),targetX=servingPhase?(seat.x-412)*(state.stage==='serving'?state.progress:1):0;
  const before=rig.position.x;rig.position.x+=(targetX-rig.position.x)*(still?1:1-Math.exp(-dt*12));const walking=Math.min(1,Math.abs(rig.position.x-before)/Math.max(.001,dt));
  rig.position.y=still?0:Math.abs(Math.sin(t*7))*walking*.025;rig.rotation.x=state?.stage==='greeting'&&!still?Math.sin(Math.max(0,state.elapsed)/1000*Math.PI)*.055:0;
  legs.forEach((leg,i)=>leg.rotation.x=still?0:Math.sin(t*7+i*Math.PI)*walking*.12);
  const preparing=state?.stage==='preparing';knife.visible=!!preparing;
  arms[1].rotation.x=preparing&&!still?Math.sin(t*4.2)*.065:0;arms[0].rotation.y=0;arms[0].rotation.x=0;
  serving.visible=!!state&&state.elapsed>=2700&&state.elapsed<9000;
  if(serving.visible){
   const handoff=state.stage==='handoff'?state.progress:0;
   serving.scale.setScalar(.7+(.42-.7)*handoff);
   serving.position.set(rig.position.x,1.27+(1.25-1.27)*handoff+Math.sin(handoff*Math.PI)*.08,1.35+(3.2-1.35)*handoff);
   serving.rotation.set(0,Math.PI*handoff,0);
   arms[0].rotation.x=-smoothService(handoff)*.17;arms[1].rotation.x=-smoothService(handoff)*.17;
  }
  root.userData.serviceStage=state?.stage||'idle';root.userData.servingSeat=active?.seat??null;
 }};
}
