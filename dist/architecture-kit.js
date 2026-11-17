import * as T from './vendor/three.module.js';
import {mergeMeshGeometry} from './mesh-batch.js';
const UP=new T.Vector3(0,1,0);
export function makeBuilder(root){
 const cube=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,12,8);
 const mesh=(geometry,material,x=0,y=0,z=0,parent=root)=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=!material.transparent;m.receiveShadow=true;parent.add(m);return m;};
 const box=(w,h,d,material,x,y,z,parent=root)=>{const m=mesh(cube,material,x,y,z,parent);m.scale.set(w,h,d);return m;};
 const oval=(material,x,y,z,sx,sy,sz,parent=root)=>{const m=mesh(sphere,material,x,y,z,parent);m.scale.set(sx,sy,sz);return m;};
 const rod=(a,b,r,material,parent=root)=>{const from=new T.Vector3(...a),to=new T.Vector3(...b),delta=to.clone().sub(from),m=mesh(new T.CylinderGeometry(r,r,delta.length(),8),material,0,0,0,parent);m.position.copy(from.add(to).multiplyScalar(.5));m.quaternion.setFromUnitVectors(UP,delta.normalize());return m;};
 const tube=(points,r,material,parent=root,segments=32)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),segments,r,6,false),material,0,0,0,parent);
 const ring=(radius,t,material,x,y,z,parent=root)=>{const m=mesh(new T.TorusGeometry(radius,t,7,48),material,x,y,z,parent);m.rotation.x=Math.PI/2;return m;};
 return {mesh,box,oval,rod,tube,ring};
}
export function mergeFinish(root){
 root.updateMatrixWorld(true);const inverse=new T.Matrix4().copy(root.matrixWorld).invert(),batches=new Map();
 root.traverse(o=>{for(let p=o.parent;p&&p!==root;p=p.parent)if(p.userData.keepGroup)return;if(!o.isMesh||o.material.transparent||o.material.isShaderMaterial||o.userData.keep||Array.isArray(o.material))return;if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(o);});
 for(const [material,items]of batches){if(items.length<2)continue;const g=mergeMeshGeometry(items,{relativeTo:inverse});for(const o of items)o.removeFromParent();const m=new T.Mesh(g,material);m.castShadow=true;m.receiveShadow=true;m.name=root.name+'-finish';root.add(m);}
}
export function materials(){
 const standard=(color,roughness=.8,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness,side:['#275c48','#56886b','#3e7768'].includes(color)?T.DoubleSide:T.FrontSide});
 return{cedar:standard('#9d7049'),lightWood:standard('#c29863'),endgrain:standard('#664a36'),cream:standard('#eee5ce'),linen:standard('#e8dcc2',1),tatami:standard('#aba77a',1),tatamiEdge:standard('#56665a'),stone:standard('#8b9290'),darkStone:standard('#3d5655'),brass:standard('#c5ad77',.35,.65),silver:standard('#b7c9ce',.35,.65),navy:standard('#223c4c'),green:standard('#275c48'),sage:standard('#56886b'),leaf:standard('#3e7768'),snow:standard('#dce7e8'),soil:standard('#34483e'),lamp:new T.MeshStandardMaterial({color:'#fff0ca',emissive:'#ffd6a0',emissiveIntensity:.8,roughness:.7}),coolLamp:new T.MeshStandardMaterial({color:'#bfe8df',emissive:'#91cfd7',emissiveIntensity:.65}),glass:new T.MeshPhysicalMaterial({color:'#bedee5',transparent:true,opacity:.11,roughness:.22,metalness:0,depthWrite:false,side:T.DoubleSide}),water:new T.MeshPhysicalMaterial({color:'#789e9a',transparent:true,opacity:.74,roughness:.23,metalness:.12,clearcoat:.8,depthWrite:false})};
}
