import * as T from './vendor/three.module.js';
import {makeBuilder,mergeFinish} from './architecture-kit.js';

// A small kitchen stays behind the existing counter, outside the visitor aisle.
export function buildRyokanChef(parent,m){
 const root=new T.Group();root.name='omakase-kitchen';root.userData.keepGroup=true;root.position.set(12,0,-1.8);parent.add(root);
 const b=makeBuilder(root),white=new T.MeshStandardMaterial({color:'#fff4dd',roughness:.8}),skin=new T.MeshStandardMaterial({color:'#f5d8b9',roughness:.9}),ink=m.navy;
 b.box(7.7,.12,.8,m.lightWood,0,1.02,-1.35);b.box(7.2,.85,.65,m.endgrain,0,.53,-1.35);
 for(const x of [-2.5,-1.8,-1.1]){b.mesh(new T.CylinderGeometry(.21,.18,.44,16),m.darkStone,x,1.3,-1.35);b.ring(.2,.018,m.brass,x,1.53,-1.35);}
 for(const x of [1.5,2.1,2.7])for(let j=0;j<4;j++)b.mesh(new T.CylinderGeometry(.25,.23,.035,16),m.cream,x,1.1+j*.04,-1.35);
 b.box(1.5,.04,.65,m.lightWood,0,1.21,1.4);b.box(.55,.08,.22,m.linen,0,1.27,1.4);b.oval(new T.MeshStandardMaterial({color:'#d79b85',roughness:.65}),0,1.33,1.4,.3,.045,.13);
 b.oval(white,0,1.13,0,.47,.56,.32);b.box(.66,.63,.04,ink,0,.96,.303);b.box(.035,.38,.045,m.linen,0,1.33,.323);
 for(const s of [-1,1]){b.oval(ink,s*.2,.33,.03,.13,.28,.14);b.oval(ink,s*.2,.13,.12,.16,.1,.23);b.oval(skin,s*.38,1.94,.03,.09,.12,.09);}
 b.oval(skin,0,1.95,.06,.4,.4,.34);for(const s of [-1,1]){b.oval(ink,s*.135,1.97,.39,.025,.035,.02);b.oval(m.linen,s*.17,1.85,.363,.065,.03,.016);}
 b.tube([[-.07,1.83,.395],[0,1.81,.409],[.07,1.83,.395]],.012,ink);
 b.mesh(new T.CylinderGeometry(.35,.36,.15,24),white,0,2.3,.06);for(const [x,y,z]of [[0,2.56,.04],[-.22,2.49,.02],[.22,2.49,.02],[0,2.48,.23]])b.oval(white,x,y,z,.23,.22,.22);
 mergeFinish(root);
 const arms=[];
 for(const side of [-1,1]){const arm=new T.Group();arm.name='chef-arm';arm.userData.keepGroup=true;arm.position.set(side*.4,1.45,.12);root.add(arm);const ab=makeBuilder(arm);ab.rod([0,0,0],[side*.12,-.24,.4],.12,white);ab.rod([side*.12,-.24,.4],[side*.03,-.2,1.1],.09,white);ab.oval(skin,side*.03,-.19,1.13,.1,.09,.12);if(side===1){ab.box(.32,.12,.024,m.silver,-.1,-.16,1.27);ab.box(.18,.055,.055,m.endgrain,.12,-.1,1.27);}mergeFinish(arm);arms.push(arm);}
 return{root,update(time,still,player){const near=!player||Math.hypot(player.x-(parent.position.x+12),player.z+1.8)<18;if(!near)return;const t=still?0:time,cycle=t%9;arms[1].rotation.x=cycle<5?Math.sin(t*4.2)*.065:Math.sin((cycle-5)*Math.PI/4)*-.14;arms[0].rotation.y=cycle>5?Math.sin((cycle-5)*Math.PI/4)*-.24:Math.sin(t*1.3)*.015;}};
}
