import {createCompanion} from './companion.js';
import {serverNow} from './server-clock.js';
import {observatoryLayout} from './observatory-layout.js';

// A single remote-detail companion keeps the same silhouette and grooming as
// visitors. Idle timing is shared; only its gaze responds to the local visitor.
export function buildObservatoryGuide(parent,{now=serverNow}={}){
 const character=createCompanion({detail:'remote'}),root=character.group,p=observatoryLayout.guide;
 root.name='observatory-guide';root.userData.keepGroup=true;root.position.set(p.x,.99,p.z);root.rotation.y=Math.PI/2;root.scale.setScalar(1.1);
 character.customize({fur:'#dce8ed',accessory:'bear-ears,silver-glasses,eyes-gentle',fluff:80,roundness:55});character.setViewDetail(120);parent.add(root);
 root.traverse(o=>{if(!o.material)return;const materials=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{if(!m.transparent)return m;if(m.userData.shared){m=m.clone();m.userData.shared=false;}m.depthWrite=false;return m;});o.material=Array.isArray(o.material)?materials:materials[0];});
 let last=-Infinity,greetingUntil=0,disposed=false;const greet=()=>{greetingUntil=now()+1500;};globalThis.window?.addEventListener('lab:observatory-greeting',greet);
 return {root,setQuality(q){character.setViewDetail(q==='low'?70:q==='medium'?120:170);},update(_time,still,player){
  if(disposed||!parent.visible)return;const ms=now();if(ms-last<33)return;const dt=Math.min(.1,Math.max(0,(ms-last)/1000));last=ms;
  const t=(ms%86400000)/1000,cycle=t%31,dx=player?player.x-parent.position.x-p.x:10,dz=player?player.z-parent.position.z-p.z:0,near=!!player&&Math.hypot(dx,dz)<7;
  const yaw=near?Math.atan2(dx,dz):Math.PI/2+(still?0:Math.sin(t*.17)*.11),difference=Math.atan2(Math.sin(yaw-root.rotation.y),Math.cos(yaw-root.rotation.y));root.rotation.y+=difference*(still?1:1-Math.exp(-dt*3));
  character.pose({time:t,still,look:near?Math.sin(difference)*.02:0,room:'museum',gesture:!still&&(cycle>6&&cycle<7.6||ms<greetingUntil)?'wave':''});
  root.position.y=.99+(still?0:Math.sin(t*.9)*.008);
 },dispose(){if(disposed)return;disposed=true;globalThis.window?.removeEventListener('lab:observatory-greeting',greet);root.removeFromParent();character.dispose();}};
}
