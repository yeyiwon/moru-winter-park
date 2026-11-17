import * as T from './vendor/three.module.js';
import {postOffice,boothPoint} from './retreat-layout.js';

// The wish post office is the only outdoor retreat fixture.
export function buildWinterRetreat(scene){
 const root=new T.Group();root.name='winter-retreat';scene.add(root);const dynamic=[];
 const cache=new Map(),M=(color,roughness=.8,metalness=0)=>{const key=[color,roughness,metalness].join();if(!cache.has(key))cache.set(key,new T.MeshStandardMaterial({color,roughness,metalness}));return cache.get(key);};
 const cedar=M('#9b7359'),cream=M('#e7d4b9'),dark=M('#3b4f55',.8,.12),brass=M('#c7a572',.3,.72),plum=M('#603d46',.65,.12),snow=M('#e3eaf0',1),glass=new T.MeshStandardMaterial({color:'#dfdcc7',emissive:'#ffb66e',emissiveIntensity:.65,roughness:.28,metalness:.12});
 glass.userData.lightingTheme='personal';
 const cube=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,12,8);
 function mesh(g,m,x=0,y=0,z=0,p=root){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=!m.transparent;o.receiveShadow=true;p.add(o);return o;}
 function box(w,h,d,m,x,y,z,p=root){const o=mesh(cube,m,x,y,z,p);o.scale.set(w,h,d);return o;}
 function oval(m,x,y,z,sx,sy,sz,p=root){const o=mesh(sphere,m,x,y,z,p);o.scale.set(sx,sy,sz);return o;}
 function cylinder(r1,r2,h,m,x,y,z,p=root,n=16){return mesh(new T.CylinderGeometry(r1,r2,h,n),m,x,y,z,p);}
 function rod(a,b,r,m,p=root){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av),o=cylinder(r,r,v.length(),m,0,0,0,p,7);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
 function curve(points,r,m,p=root,segments=28){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),segments,r,6,false),m,0,0,0,p);}
 function ring(r,t,m,x,y,z,p=root){const o=mesh(new T.TorusGeometry(r,t,6,36),m,x,y,z,p);o.rotation.x=-Math.PI/2;return o;}
 function group(name,x,z){const g=new T.Group();g.name=name;g.position.set(x,0,z);root.add(g);return g;}
 function lantern(x,z,height=3.2,p=root){
  (p.userData.lampGlow||=[]).push({x,z,y:height-.2,radius:2.4});
  cylinder(.27,.34,.16,dark,x,.15,z,p);cylinder(.07,.13,height-.5,dark,x,height/2-.1,z,p,12);
  for(const y of [.33,height-.55])cylinder(.135,.135,.09,brass,x,y,z,p,12);
  const profile=[[.14,0],[.24,.1],[.26,.39],[.18,.57]].map(([r,y])=>new T.Vector2(r,y));mesh(new T.LatheGeometry(profile,12),glass,x,height-.45,z,p);
  for(let j=0;j<6;j++){const a=j*Math.PI/3;curve(profile.map(v=>[x+Math.cos(a)*(v.x+.016),height-.45+v.y,z+Math.sin(a)*(v.x+.016)]),.015,dark,p,12);}
  cylinder(.06,.34,.22,dark,x,height+.23,z,p,12);cylinder(.04,.27,.13,snow,x,height+.31,z,p,12);oval(brass,x,height+.43,z,.05,.07,.05,p);
  for(const y of [height-.36,height+.06])ring(.24,.018,brass,x,y,z,p);
 }
 function envelope(p,x,y,z,scale=1){
  box(.42*scale,.28*scale,.018*scale,cream,x,y,z,p);
  for(const side of [-1,1])rod([x+side*.205*scale,y+.125*scale,z+.014*scale],[x,y-.015*scale,z+.018*scale],.009*scale,brass,p);
  oval(plum,x,y-.015*scale,z+.03*scale,.033*scale,.033*scale,.009*scale,p);
 }
 function roof(p,w,d,y){
  for(const side of [-1,1]){const width=w*.56,center=side*w*.25,m=box(width,.16,d,dark,center,y+.55,0,p);m.rotation.z=-side*.34;const cap=box(width,.10,d*.98,snow,center,y+.68,0,p);cap.rotation.z=-side*.34;for(let i=1;i<8;i++){const x=side*i*w/16;rod([x,y+1.03-Math.abs(x)*.355,-d/2],[x,y+1.03-Math.abs(x)*.355,d/2],.035,brass,p);}}
  rod([0,y+1.15,-d/2-.12],[0,y+1.15,d/2+.12],.08,dark,p);
  for(const z of [-d/2,d/2]){curve([[-w*.55,y+.05,z],[-w*.35,y+.42,z],[0,y+1.14,z],[w*.35,y+.42,z],[w*.55,y+.05,z]],.055,cream,p);}
 }
 function booth(p,w,d,kind){
  box(w+.28,.18,d+.25,dark,0,.15,0,p);box(w,2.9,d,cedar,0,1.69,0,p);
  // The service window is recessed with a dark interior and a lit rear shelf.
  box(w*.76,1.25,.055,dark,0,1.76,d/2+.035,p);box(w*.68,1.04,.025,glass,0,1.78,d/2+.068,p);
  for(const x of [-w*.4,w*.4])box(.12,1.52,.17,cream,x,1.78,d/2+.09,p);
  for(const y of [1.02,2.5])box(w*.85,.12,.19,cream,0,y,d/2+.09,p);
  box(w*.89,.11,.62,cedar,0,1.06,d/2+.26,p);box(w*.88,.035,.63,brass,0,1.13,d/2+.26,p);
  for(let j=0;j<Math.round(w/.35);j++)box(.018,.82,.025,dark,-w/2+.15+j*.35,.6,d/2+.026,p);
  for(const x of [-w/2+.06,w/2-.06]){box(.13,2.93,d+.06,dark,x,1.7,0,p);for(const y of [.33,2.92])box(.16,.065,d+.1,brass,x,y,0,p);}
  roof(p,w+1,d+1.2,3.03);
  for(const x of [-w*.41,w*.41]){rod([x,2.65,d/2+.1],[x,2.65,d/2+.5],.025,brass,p);lantern(x,d/2+.5,2.2,p);}
  const sign=box(w*.52,.52,.09,plum,0,2.89,d/2+.13,p);for(const y of [2.67,3.11])box(w*.51,.022,.025,brass,0,y,d/2+.19,p);
  if(kind==='post'){
   envelope(p,0,2.9,d/2+.2,1.05);for(const side of [-1,1]){curve([[side*.36,2.88,d/2+.21],[side*.64,3.02,d/2+.21],[side*.9,2.9,d/2+.21]],.013,brass,p);}
   for(const x of [-1.8,-.9,.9,1.8]){box(.68,.06,.23,cedar,x,1.78,d/2+.1,p);for(let j=0;j<3;j++)envelope(p,x+(j-1)*.13,1.86+j*.015,d/2+.16,.45);}
   for(const x of [-1.5,1.45]){box(.5,.03,.36,cream,x,1.16,d/2+.3,p);for(let j=0;j<3;j++)rod([x-.16,1.18,d/2+.22+j*.06],[x+.1,1.18,d/2+.22+j*.06],.004,plum,p);}
   cylinder(.075,.11,.18,plum,.66,1.24,d/2+.3,p);rod([.66,1.31,d/2+.3],[.8,1.65,d/2+.33],.012,brass,p);
   box(.32,.12,.22,brass,-.5,1.22,d/2+.3,p);oval(dark,-.5,1.33,d/2+.3,.09,.055,.07,p);
  }
 }
 const office=group('winter-wish-post-office',postOffice.x,postOffice.z);office.rotation.y=postOffice.yaw;booth(office,postOffice.w,postOffice.d,'post');
 const mailboxPoint=boothPoint(postOffice,postOffice.w/2+.8,1.15),mailbox=group('wish-postbox',mailboxPoint.x,mailboxPoint.z);mailbox.rotation.y=postOffice.yaw;cylinder(.29,.34,.18,dark,0,.18,0,mailbox,20);cylinder(.24,.28,1.24,plum,0,.87,0,mailbox,24);mesh(new T.SphereGeometry(.29,24,12,0,Math.PI*2,0,Math.PI/2),plum,0,1.49,0,mailbox);ring(.28,.02,brass,0,.37,0,mailbox);ring(.29,.02,brass,0,1.49,0,mailbox);box(.33,.07,.035,dark,0,1.39,.28,mailbox);box(.36,.025,.065,brass,0,1.445,.29,mailbox);envelope(mailbox,0,.91,.282,.58);box(.27,.42,.018,plum,0,.59,.28,mailbox);oval(brass,.08,.61,.31,.022,.022,.01,mailbox);
 const officeLight=new T.PointLight('#ffc789',14,9,2);officeLight.userData.lightingTheme='personal';officeLight.position.set(postOffice.entry.x,2.5,postOffice.entry.z);root.add(officeLight);
 // Opaque parts are merged by finish; the entire retreat remains a small draw set.
 const batches=new Map();root.updateMatrixWorld(true);root.traverse(o=>{if(!o.isMesh||o.material.transparent||o.material.isShaderMaterial||dynamic.includes(o)||Array.isArray(o.material))return;const key=o.material.uuid;if(!batches.has(key))batches.set(key,{material:o.material,items:[]});batches.get(key).items.push(o);});
 for(const {material,items}of batches.values()){if(items.length<2)continue;const arrays={position:[],normal:[],uv:[]};let count=0;for(const item of items){let g=item.geometry.clone().applyMatrix4(item.matrixWorld);if(g.index){const source=g;g=g.toNonIndexed();source.dispose();}if(!g.attributes.normal)g.computeVertexNormals();const n=g.attributes.position.count;for(const key of Object.keys(arrays))arrays[key].push(g.attributes[key]?.array||new Float32Array(n*(key==='uv'?2:3)));count+=n;item.removeFromParent();g.dispose();}const g=new T.BufferGeometry();for(const key of Object.keys(arrays)){const width=key==='uv'?2:3,out=new Float32Array(count*width);let offset=0;for(const a of arrays[key]){out.set(a,offset);offset+=a.length;}g.setAttribute(key,new T.BufferAttribute(out,width));}g.computeBoundingSphere();mesh(g,material);}
 return{root,dynamic,update(){}};
}
