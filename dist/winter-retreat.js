import * as T from './vendor/three.module.js';
import {postOffice,rinkBounds,rinkEntry,skateRental,rinkLamps} from './retreat-layout.js';

// Two authored destinations; their real interactions and terrain live in the controllers.
export function buildWinterRetreat(scene){
 const root=new T.Group();root.name='winter-retreat';scene.add(root);const dynamic=[];
 const cache=new Map(),M=(color,roughness=.8,metalness=0)=>{const key=[color,roughness,metalness].join();if(!cache.has(key))cache.set(key,new T.MeshStandardMaterial({color,roughness,metalness}));return cache.get(key);};
 const cedar=M('#9b7359'),cream=M('#e7d4b9'),dark=M('#3b4f55',.8,.12),brass=M('#c7a572',.3,.72),plum=M('#96536e',.8,.08),snow=M('#e3eaf0',1),blade=M('#bacbd0',.22,.72),glass=new T.MeshStandardMaterial({color:'#dfdcc7',emissive:'#ffb66e',emissiveIntensity:.65,roughness:.28,metalness:.12});
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
  }else{
   // A proper ice skate silhouette labels the rental booth without fake controls.
   const sk=new T.Group();sk.position.set(0,2.88,d/2+.23);p.add(sk);skate(sk,.62);
   for(const x of [-1.05,-.35,.35,1.05]){const pair=new T.Group();pair.position.set(x,1.58,d/2+.11);pair.scale.setScalar(.64);p.add(pair);skate(pair,.8);}
  }
 }
 function skate(parent,scale=1){
  const p=new T.Group();p.scale.setScalar(scale);parent.add(p);
  const shoe=new T.Shape();shoe.moveTo(-.32,-.15);shoe.quadraticCurveTo(-.42,-.1,-.35,.05);shoe.lineTo(-.25,.06);shoe.lineTo(-.23,.38);shoe.quadraticCurveTo(-.06,.43,.08,.35);shoe.lineTo(.12,.03);shoe.quadraticCurveTo(.32,.03,.37,-.09);shoe.quadraticCurveTo(.39,-.16,.26,-.17);shoe.closePath();const g=new T.ExtrudeGeometry(shoe,{depth:.11,bevelEnabled:true,bevelSize:.02,bevelThickness:.015,bevelSegments:2,curveSegments:7});g.translate(0,0,-.055);mesh(g,cream,0,0,0,p);
  for(const x of [-.22,.2])rod([x,-.16,0],[x,-.28,0],.025,blade,p);curve([[-.38,-.28,0],[-.25,-.31,0],[.25,-.31,0],[.38,-.26,0]],.023,blade,p);
  for(let j=0;j<4;j++){const y=.08+j*.065;rod([-.09,y,.082],[.04,y+.03,.082],.009,brass,p);rod([.04,y,.082],[-.09,y+.03,.082],.009,brass,p);}
 }
 const office=group('winter-wish-post-office',postOffice.x,postOffice.z);booth(office,postOffice.w,postOffice.d,'post');
 const mailbox=group('wish-postbox',97.8,53.15);cylinder(.29,.34,.18,dark,0,.18,0,mailbox,20);cylinder(.24,.28,1.24,plum,0,.87,0,mailbox,24);mesh(new T.SphereGeometry(.29,24,12,0,Math.PI*2,0,Math.PI/2),plum,0,1.49,0,mailbox);ring(.28,.02,brass,0,.37,0,mailbox);ring(.29,.02,brass,0,1.49,0,mailbox);box(.33,.07,.035,dark,0,1.39,.28,mailbox);box(.36,.025,.065,brass,0,1.445,.29,mailbox);envelope(mailbox,0,.91,.282,.58);box(.27,.42,.018,plum,0,.59,.28,mailbox);oval(brass,.08,.61,.31,.022,.022,.01,mailbox);
 const rental=group('winter-skate-rental',skateRental.x,skateRental.z);booth(rental,skateRental.w,skateRental.d,'skate');
 const r=rinkBounds,rink=group('winter-outdoor-rink',r.x,r.z);
 const frost=new T.MeshPhysicalMaterial({color:'#91b7c5',roughness:.24,metalness:.12,clearcoat:.65,clearcoatRoughness:.22});const ice=mesh(new T.CircleGeometry(1,96),frost,0,r.iceY,0,rink);ice.rotation.x=-Math.PI/2;ice.scale.set(r.rx,r.rz,1);ice.name='skating-ice';
 // Shallow resurfacing rings and hairline fractures are in the ice, never obstacles.
 const icePattern=new T.Mesh(new T.CircleGeometry(1,96),new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float time;void main(){vec2 p=(vUv-.5)*2.;float ring=sin(length(p*vec2(1.,1.05))*110.+sin(atan(p.y,p.x)*3.)*.2);float fine=pow(max(0.,ring),22.);float sheen=pow(max(0.,1.-length((p-vec2(-.32,.16))*vec2(.75,1.5))),3.);gl_FragColor=vec4(.79,.93,1.,fine*.045+sheen*.08);}'}));icePattern.name='ice-surface-detail';icePattern.rotation.x=-Math.PI/2;icePattern.position.y=r.iceY+.003;icePattern.scale.set(r.rx,r.rz,1);rink.add(icePattern);dynamic.push(icePattern);
 const gateAngle=Math.asin(r.gateHalfWidth/r.fenceRz),fenceSteps=64,low=gateAngle,high=Math.PI*2-gateAngle;
 for(let j=0;j<=fenceSteps;j++){const a=low+(high-low)*j/fenceSteps,x=Math.cos(a)*r.fenceRx,z=Math.sin(a)*r.fenceRz;box(.085,.93,.085,dark,x,.58,z,rink);oval(brass,x,1.09,z,.075,.05,.075,rink);if(j%4===0){cylinder(.15,.18,.11,cream,x,.17,z,rink,12);cylinder(.12,.14,.09,brass,x,.98,z,rink,12);}if(j<fenceSteps){const b=low+(high-low)*(j+1)/fenceSteps,xx=Math.cos(b)*r.fenceRx,zz=Math.sin(b)*r.fenceRz;for(const y of [.36,.96])rod([x,y,z],[xx,y,zz],.028,dark,rink);const mid=(a+b)/2;curve([[x,.54,z],[Math.cos(mid)*r.fenceRx,.71,Math.sin(mid)*r.fenceRz],[xx,.54,zz]],.017,brass,rink,8);}}
 // White snowbanks remain outside the perimeter; the east access is completely clear.
 const snowPoints=[];for(let j=0;j<=100;j++){const a=low+(high-low)*j/100;snowPoints.push([Math.cos(a)*(r.fenceRx+.33),.15,Math.sin(a)*(r.fenceRz+.33)]);}curve(snowPoints,.13,snow,rink,100);
 for(const side of [-1,1]){const x=Math.cos(gateAngle)*r.fenceRx,z=side*r.gateHalfWidth;cylinder(.14,.21,1.25,dark,x,.75,z,rink,12);oval(brass,x,1.44,z,.13,.08,.13,rink);}
 for(const lamp of rinkLamps)lantern(lamp.x,lamp.z,3.25);
 for(const z of [79.7,108.3]){const b=group('rink-cedar-bench',-58,z);b.rotation.y=z<94?0:Math.PI;for(let j=0;j<5;j++)box(4.6,.07,.14,cedar,0,.57,-.31+j*.15,b);for(const x of [-1.9,1.9]){curve([[x,.1,.3],[x,.62,.3],[x,.9,-.36],[x,1.25,-.4]],.045,dark,b);rod([x,.1,-.3],[x,.6,-.3],.045,dark,b);}for(const y of [.9,1.17])box(4.6,.1,.09,cedar,0,y,-.4,b);box(4.55,.035,.11,snow,0,1.235,-.4,b);}
 for(const x of [-68,-48]){const light=new T.PointLight('#ffd7a3',22,17,2);light.position.set(x,3.4,94);root.add(light);}
 const officeLight=new T.PointLight('#ffc789',14,9,2);officeLight.position.set(94,2.5,55);root.add(officeLight);
 // Opaque parts are merged by finish; the entire retreat remains a small draw set.
 const batches=new Map();root.updateMatrixWorld(true);root.traverse(o=>{if(!o.isMesh||o.material.transparent||o.material.isShaderMaterial||dynamic.includes(o)||Array.isArray(o.material))return;const key=o.material.uuid;if(!batches.has(key))batches.set(key,{material:o.material,items:[]});batches.get(key).items.push(o);});
 for(const {material,items}of batches.values()){if(items.length<2)continue;const arrays={position:[],normal:[],uv:[]};let count=0;for(const item of items){let g=item.geometry.clone().applyMatrix4(item.matrixWorld);if(g.index){const source=g;g=g.toNonIndexed();source.dispose();}if(!g.attributes.normal)g.computeVertexNormals();const n=g.attributes.position.count;for(const key of Object.keys(arrays))arrays[key].push(g.attributes[key]?.array||new Float32Array(n*(key==='uv'?2:3)));count+=n;item.removeFromParent();g.dispose();}const g=new T.BufferGeometry();for(const key of Object.keys(arrays)){const width=key==='uv'?2:3,out=new Float32Array(count*width);let offset=0;for(const a of arrays[key]){out.set(a,offset);offset+=a.length;}g.setAttribute(key,new T.BufferAttribute(out,width));}g.computeBoundingSphere();mesh(g,material);}
 return{root,dynamic,entry:rinkEntry,update(time,still){icePattern.material.uniforms.time.value=still?0:time;}};
}
