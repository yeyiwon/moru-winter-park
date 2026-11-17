import {mergeMeshGeometry} from './mesh-batch.js';
import * as T from './vendor/three.module.js';
// The same small serving is used on the counter and in the guest's hands.
let template=null;
export function createRyokanMeal(){
 if(template)return template.clone(true);
 const root=new T.Group();root.name='omakase-serving';
 const porcelain=new T.MeshStandardMaterial({color:'#e8e9d9',roughness:.3,metalness:.08}),rice=new T.MeshStandardMaterial({color:'#f3eddb',roughness:.82}),salmon=new T.MeshStandardMaterial({color:'#d89277',roughness:.38}),grain=new T.MeshStandardMaterial({color:'#f1c7a4',roughness:.48}),nori=new T.MeshStandardMaterial({color:'#334c40',roughness:.7}),wood=new T.MeshStandardMaterial({color:'#876444',roughness:.6});
 const mesh=(g,m,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);root.add(o);return o;};
 const profile=[[0,0],[.38,0],[.48,.035],[.5,.07],[.49,.09],[.44,.07],[.36,.035],[0,.035]].map(p=>new T.Vector2(...p));mesh(new T.LatheGeometry(profile,32),porcelain).scale.set(1.4,1,.85);
 for(const [x,z,turn]of [[-.25,-.04,-.1],[.22,.04,.12]]){
  const bed=mesh(new T.CapsuleGeometry(.1,.19,6,12),rice,x,.14,z);bed.rotation.set(Math.PI/2,0,Math.PI/2+turn);
  for(let i=0;i<16;i++){const a=i*2.399,r=.075*Math.sqrt(i/16);const g=mesh(new T.CapsuleGeometry(.012,.026,3,5),rice,x+Math.sin(a)*.18,.17+Math.cos(a)*.035,z+r);g.rotation.z=a;}
  const cut=new T.SphereGeometry(1,20,12);cut.scale(.23,.048,.115);const top=mesh(cut,salmon,x,.247,z);top.rotation.y=turn;
  for(let j=-2;j<=2;j++){const curve=new T.CatmullRomCurve3([new T.Vector3(x+j*.06-.035,.271,z-.09),new T.Vector3(x+j*.06,.294,z),new T.Vector3(x+j*.06+.035,.271,z+.09)]);mesh(new T.TubeGeometry(curve,10,.004,4,false),grain);}
 }
 const leaf=mesh(new T.SphereGeometry(1,12,8).scale(.12,.016,.07),nori,.41,.09,-.17);leaf.rotation.y=.6;
 for(const z of [.33,.39]){const stick=mesh(new T.CylinderGeometry(.009,.016,.95,8),wood,0,.115,z);stick.rotation.z=Math.PI/2;}
 const batches=new Map();root.updateMatrixWorld(true);for(const o of root.children){if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(o);}for(const [material,items]of batches){const geometry=mergeMeshGeometry(items);for(const o of items){o.removeFromParent();o.geometry.dispose();}geometry.userData.shared=true;material.userData.shared=true;root.add(new T.Mesh(geometry,material));}template=root;return root.clone(true);
}
