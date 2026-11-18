import {createPlazaUplights} from './plaza-uplights.js';
import {createStonePaving,pavingColors} from './plaza-paving.js';
import * as T from './vendor/three.module.js';
import {makeBuilder,mergeFinish,materials} from './architecture-kit.js';
// Flush surfaces create a gathering place without adding collision in the promenade.
export function buildFestivalPlaza(parent){
 const root=new T.Group();root.name='wish-tree-festival-court';parent.add(root);const b=makeBuilder(root),m=materials();
 const pavers=createStonePaving(1600),dummy=new T.Object3D();let count=0;
 for(let row=-27;row<=27;row++)for(let col=-27;col<=27;col++){
  const x=col*.8+(row%2)*.4,z=row*.7,r=Math.hypot(x,z),edge=17.8+.36*Math.sin(Math.atan2(z,x)*7.);
  if(r<9.6||r>edge||count>=1600)continue;
  dummy.position.set(x,.105,z);dummy.rotation.set(0,(row+col)%3*.06,0);dummy.updateMatrix();pavers.setMatrixAt(count,dummy.matrix);pavers.setColorAt(count,new T.Color(pavingColors[count%3]));count++;
 }
 pavers.count=count;pavers.name='tree-court-park-stones';root.add(pavers);
 const lights=createPlazaUplights(root,Array.from({length:6},(_,i)=>{const a=i*Math.PI/3+Math.PI/6;return{x:Math.sin(a)*12.8,z:Math.cos(a)*12.8,target:[Math.sin(a)*3.2,18,Math.cos(a)*3.2]};}),{name:'tree-court',strength:.48,beamWidth:1,dustCount:84});
 mergeFinish(root);return{root,...lights};
}

export function buildMuseumForecourt(root,m){
 const b=makeBuilder(root),stone=new T.MeshStandardMaterial({color:'#aebbc6',roughness:.85}),dark=new T.MeshStandardMaterial({color:'#718393',roughness:.88});
 // The threshold remains level with the existing portal; stairs flank the accessible middle.
 const paving=createStonePaving(2000),dummy=new T.Object3D();let count=0;
 for(let row=-31;row<=42;row++)for(let col=-31;col<=31;col++){
  const x=col*.8+(row%2)*.4,z=row*.7,r=Math.hypot(x,z),court=Math.hypot(x,z-22);
  if(!(court<7.2||(r>16.6&&r<21.1&&z<23))||count>=2000)continue;
  dummy.position.set(x,.105,z);dummy.rotation.set(0,(row+col)%3*.06,0);dummy.updateMatrix();paving.setMatrixAt(count,dummy.matrix);paving.setColorAt(count,new T.Color(pavingColors[count%3]));count++;
 }
 paving.count=count;paving.name='museum-court-park-stones';root.add(paving);
 for(const r of [2.5,4.8,6.9])b.ring(r,.025,m.brass,0,.145,22);
 for(let i=0;i<12;i++){const a=i*Math.PI/6,x=Math.sin(a),z=Math.cos(a);b.rod([x*5.1,.15,22+z*5.1],[x*6.65,.15,22+z*6.65],.025,m.brass);b.oval(m.coolLamp,x*4.8,.16,22+z*4.8,.065,.015,.065);}
 for(const side of [-1,1]){for(let i=0;i<3;i++)b.box(2.1,.07+i*.05,1,stone,side*4.7,.08,18.8-i*.65);b.box(2.4,.1,3.9,dark,side*4.7,.17,17.6);}
 const constellation=[[-2,24],[-.8,25.1],[.25,24.1],[1.5,25],[2.1,23.7]];for(let i=0;i<constellation.length;i++){const [x,z]=constellation[i];b.oval(m.lamp,x,.16,z,.055,.012,.055);if(i)b.rod([constellation[i-1][0],.15,constellation[i-1][1]],[x,.15,z],.012,m.brass);}
}
