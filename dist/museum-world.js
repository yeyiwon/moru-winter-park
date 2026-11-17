import * as T from './vendor/three.module.js';
import {makeBuilder,mergeFinish,materials} from './architecture-kit.js';
import {museumLayout,museumGalleries} from './district-layout.js';
const TAU=Math.PI*2;
function stars(b,m,radius,y,count=96){for(let i=0;i<count;i++){const a=i*2.399,r=Math.sqrt((i+.5)/count)*radius;b.oval(i%4?m.coolLamp:m.lamp,Math.cos(a)*r,y+Math.sin(i*1.71)*.06,Math.sin(a)*r,.035,.02,.035);}}
function dome(b,m,radius,base,root,inside=false){
 const material=new T.MeshStandardMaterial({color:inside?'#172c45':'#547b96',emissive:inside?'#000000':'#16324c',emissiveIntensity:.14,roughness:inside?.85:.66,metalness:inside?.05:.2,side:T.DoubleSide});
 const roof=b.mesh(new T.SphereGeometry(radius,64,32,0,TAU,0,Math.PI/2),material,0,base,0);roof.name=inside?'planetarium-ceiling':'observatory-solid-dome';if(!inside)roof.scale.y=.66;
 for(let j=0;j<(inside?8:16);j++){const a=j/(inside?8:16)*TAU,rr=radius+(inside?-.08:.09),points=Array.from({length:25},(_,i)=>{const t=i/24*Math.PI/2;return[Math.sin(t)*Math.sin(a)*rr,base+Math.cos(t)*rr*(inside?1:.66),Math.sin(t)*Math.cos(a)*rr];});b.tube(points,inside?.025:.065,m.brass,root,24);}
 if(!inside)for(const theta of [.36,.74,1.16]){const r=Math.sin(theta)*(radius+.10),y=base+Math.cos(theta)*radius*.66;b.ring(r,.055,m.cream,0,y,0);b.ring(r+.025,.017,m.coolLamp,0,y-.045,0);}
 b.ring(radius,.15,m.cream,0,base,0);b.ring(radius-.12,.035,m.lamp,0,base+.16,0);
 if(inside){const positions=[];for(let i=0;i<320;i++){const a=i*2.399,u=(i+.5)/320*.85+.05,r=radius-.18;positions.push(Math.sin(a)*Math.sqrt(1-u*u)*r,base+u*r,Math.cos(a)*Math.sqrt(1-u*u)*r);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));const points=new T.Points(g,new T.PointsMaterial({color:'#d7e7f2',size:.075,sizeAttenuation:true,transparent:true,opacity:.7,depthWrite:false}));points.name='planetarium-stars';root.add(points);for(let i=0;i<28;i+=4){const p=positions.slice(i*3,(i+4)*3),curve=[];for(let j=0;j<p.length;j+=3)curve.push([p[j],p[j+1],p[j+2]]);b.tube(curve,.014,m.coolLamp,root,16);}}
}
export function buildMuseumLandmark(parent){
 const root=new T.Group();root.name='starlight-museum-landmark';root.position.set(museumLayout.x,0,museumLayout.z);root.rotation.y=museumLayout.yaw;parent.add(root);const m=materials(),b=makeBuilder(root),stone=new T.MeshStandardMaterial({color:'#c1ccd3',roughness:.75}),blue=new T.MeshStandardMaterial({color:'#284654',roughness:.5,metalness:.35});
 b.mesh(new T.CylinderGeometry(16.3,16.5,.25,80),stone,0,.03,0);b.mesh(new T.CylinderGeometry(15.6,15.9,.3,80),m.cream,0,.22,0);
 for(let i=0;i<28;i++){const a=(i+.5)/28*TAU;if(Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.24)continue;const g=new T.Group();g.position.set(Math.sin(a)*15.5,0,Math.cos(a)*15.5);g.rotation.y=a;root.add(g);b.box(3.35,.9,.65,stone,0,.85,0,g);b.box(3.35,.5,.75,stone,0,5.45,0,g);b.box(.32,4.6,.7,m.cream,-1.55,3,0,g);b.box(2.6,3.65,.06,m.linen,0,3.1,.07,g);for(const x of [-1.2,0,1.2])b.box(.055,3.7,.09,m.brass,x,3.1,.12,g);b.box(2.7,.045,.1,m.lamp,0,1.35,.18,g);for(const y of [1.7,4.6])b.box(3.2,.1,.85,m.cream,0,y,0,g);}
 for(const side of [-1,1]){b.mesh(new T.LatheGeometry([[.65,0],[.65,.2],[.43,.3],[.35,5.8],[.57,6],[.57,6.2]].map(p=>new T.Vector2(...p)),24),m.cream,side*3.3,.2,16);b.ring(.5,.055,m.brass,side*3.3,5.8,16);}
 b.tube(Array.from({length:33},(_,i)=>{const a=i/32*Math.PI;return[Math.cos(a)*3.3,6.2+Math.sin(a)*3.3,16];}),.24,m.cream,root,40);b.tube(Array.from({length:33},(_,i)=>{const a=i/32*Math.PI;return[Math.cos(a)*3.04,6.2+Math.sin(a)*3.04,16.15];}),.035,m.lamp,root,40);
 b.box(6,.02,4,blue,0,.18,17);for(const x of [-2.7,2.7])b.box(.035,.02,4,m.lamp,x,.2,17);
 dome(b,m,15.7,5.9,root);b.mesh(new T.CylinderGeometry(.75,.9,1.1,24),m.cream,0,16.6,0);b.ring(.9,.06,m.brass,0,16.1,0);b.oval(m.coolLamp,0,17.3,0,.4,.5,.4);b.rod([0,17.3,0],[0,19,0],.055,m.brass);b.ring(.95,.045,m.brass,0,18.2,0).rotation.x=.6;
 // Solid twin doors and a lit transom make the entrance legible from the bridge.
 for(const side of [-1,1]){b.box(2.6,5.5,.16,blue,side*1.35,2.95,15.95);b.box(2.2,3.4,.04,m.linen,side*1.35,3.6,16.05);for(const dx of [-1,0,1])b.box(.055,3.45,.055,m.brass,side*1.35+dx,3.6,16.1);b.box(.08,.65,.12,m.brass,side*.28,2.8,16.15);b.box(2.2,.04,.06,m.lamp,side*1.35,5.32,16.12);}
 stars(b,m,15,.21,100);mergeFinish(root);
 const count=240,geometry=new T.BufferGeometry(),pos=new Float32Array(count*3),phase=new Float32Array(count);for(let i=0;i<count;i++){const a=i/count*TAU;pos[i*3]=Math.sin(a)*15.85;pos[i*3+1]=6.13;pos[i*3+2]=Math.cos(a)*15.85;phase[i]=a;}geometry.setAttribute('position',new T.BufferAttribute(pos,3));geometry.setAttribute('phase',new T.BufferAttribute(phase,1));const time={value:0},sparkle=new T.Points(geometry,new T.ShaderMaterial({uniforms:{time},transparent:true,depthWrite:false,vertexShader:'attribute float phase;uniform float time;varying float v;void main(){v=.45+.55*pow(.5+.5*sin(phase*3.-time*.4),5.);vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(140./-p.z,1.5,4.);}',fragmentShader:'varying float v;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(.8,.92,1.,smoothstep(.5,.1,d)*v);}' }));root.add(sparkle);
 return{root,update(t,still){time.value=still?0:t;},setQuality(q){geometry.setDrawRange(0,q==='low'?120:240);}};
}
export function buildMuseumInterior(root,m){
 const b=makeBuilder(root),stone=new T.MeshStandardMaterial({color:'#546b7a',roughness:.55}),dark=new T.MeshStandardMaterial({color:'#193345',roughness:.55,metalness:.2});
 const wall=new T.MeshStandardMaterial({color:'#25435b',roughness:.86}),enamel=new T.MeshStandardMaterial({color:'#102e47',emissive:'#17354d',emissiveIntensity:.2,roughness:.45});
 // Recessed celestial panels give the room architectural depth without entering its aisles.
 function panel(x,z,angle,width){
  const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;root.add(g);const pb=makeBuilder(g),r=width/2,h=3.45;
  const shape=new T.Shape();shape.moveTo(-r,.65);shape.lineTo(r,.65);shape.lineTo(r,h);shape.absarc(0,h,r,0,Math.PI,false);shape.closePath();pb.mesh(new T.ShapeGeometry(shape,24),enamel);
  const arch=[[-r,.65,.045],[-r,h,.045],...Array.from({length:25},(_,i)=>{const a=Math.PI-i/24*Math.PI;return[Math.cos(a)*r,h+Math.sin(a)*r,.045];}),[r,.65,.045]];pb.tube(arch,.035,m.brass,g,36);
  pb.box(width+.15,.16,.3,m.cream,0,.55,.05);pb.box(width+.1,.035,.05,m.lamp,0,.72,.06);
  for(const radius of [.45,.8]){const ring=pb.mesh(new T.TorusGeometry(radius,.018,6,40),m.brass,0,2.8,.075);ring.rotation.z=.3;}
  for(let i=0;i<9;i++){const a=i*2.399,rr=.2+(i%4)*.24;pb.oval(i%3?m.coolLamp:m.lamp,Math.cos(a)*rr,2.8+Math.sin(a)*rr,.12,.038,.038,.02);}
  pb.rod([-.65,2.25,.11],[.57,3.4,.11],.009,m.coolLamp);pb.rod([-.5,3.5,.11],[.7,2.4,.11],.009,m.coolLamp);
 }
 b.box(48,.22,44,dark,0,-.04,0);b.mesh(new T.CylinderGeometry(10,10,.03,80),stone,0,.095,0);for(const r of [4.8,8,10,19.5])b.ring(r,.025,m.brass,0,.12,0);stars(b,m,21,.13,160);
 for(const sx of [-1,1])for(const sz of [-1,1]){for(const side of [-1,1]){b.box(15,.008,.055,m.brass,sx*14,.10,sz*11+side*7.5);b.box(.055,.008,15,m.brass,sx*14+side*7.5,.10,sz*11);}for(const x of [-21,-7,7,21]){b.mesh(new T.CylinderGeometry(.26,.38,5.5,12),m.cream,x,2.95,sz*21.4);for(const y of [.28,5.6]){b.mesh(new T.CylinderGeometry(.46,.46,.2,12),m.brass,x,y,sz*21.4);}}}
 // Solid stone perimeter and a recessed west entrance keep the exhibition separate.
 for(const side of [-1,1]){
  b.box(47.6,6,.4,wall,0,3.1,side*21.8);b.box(.4,6,43.2,wall,side*23.8,3.1,0);
  for(const z of [-15,-5,5,15])panel(side*23.52,z,-side*Math.PI/2,3.3);
  for(const x of [-18,-6,6,18])panel(x,side*21.52,side<0?0:Math.PI,3.6);
  for(const y of [.3,1.0,5.65]){b.box(47,.08,.1,m.brass,0,y,side*21.54);b.box(.1,.08,43,m.brass,side*23.54,y,0);}
  b.box(47,.10,.12,m.lamp,0,5.8,side*21.45);b.box(.12,.10,43,m.lamp,side*23.45,5.8,0);
 }
 // The rectangle's corners sit under a continuous ceiling outside the central hemisphere.
 const ceilingShape=new T.Shape([new T.Vector2(-24,-22),new T.Vector2(24,-22),new T.Vector2(24,22),new T.Vector2(-24,22)]),hole=new T.Path();hole.absarc(0,0,21.95,0,TAU,true);ceilingShape.holes.push(hole);const cornerCeiling=b.mesh(new T.ShapeGeometry(ceilingShape,64),new T.MeshStandardMaterial({color:'#243c50',side:T.DoubleSide,roughness:.9}),0,6.02,0);cornerCeiling.rotation.x=-Math.PI/2;
 b.box(.15,4.3,4.6,dark,-23.5,2.25,0);for(const z of [-2.35,2.35])b.box(.2,4.6,.16,m.brass,-23.35,2.4,z);b.box(.18,.12,4.8,m.lamp,-23.3,4.6,0);
 dome(b,m,22,6,root,true);const orrery=new T.Group();orrery.name='museum-central-orrery';orrery.userData.keepGroup=true;orrery.position.y=4;root.add(orrery);b.mesh(new T.CylinderGeometry(3.9,4.1,.5,56),dark,0,.34,0);b.mesh(new T.CylinderGeometry(2.7,3,.25,48),m.brass,0,.7,0);b.rod([0,.8,0],[0,4,0],.25,m.brass);b.oval(m.lamp,0,0,0,.95,.95,.95,orrery);
 const orbits=[];for(let i=0;i<6;i++){const orbit=new T.Group();orbit.userData.keepGroup=true;orbit.rotation.z=(i-2)*.12;orrery.add(orbit);b.ring(1.6+i*.62,.025,m.brass,0,0,0,orbit);const planet=b.oval(i%2?m.coolLamp:m.cream,1.6+i*.62,0,0,.18+i*.055,.18+i*.055,.18+i*.055,orbit);if(i===4)b.ring(.6,.035,m.brass,1.6+i*.62,0,0,orbit).rotation.x=.7;orbits.push({root:orbit,speed:.035+.018*i});}
 const galleries=[];for(const spec of museumGalleries){const g=new T.Group();g.name='museum-gallery-'+spec.id;g.userData.keepGroup=true;g.position.set(spec.x,0,spec.z);root.add(g);const gb=makeBuilder(g),accent=new T.MeshStandardMaterial({color:spec.color,emissive:spec.color,emissiveIntensity:.08,roughness:.4,metalness:.3});gb.mesh(new T.CylinderGeometry(2.1,2.4,.7,40),dark,0,.45,0);gb.ring(2.05,.035,accent,0,.83,0);const exhibit=new T.Group();exhibit.position.y=1.8;g.add(exhibit);exhibit.userData.keepGroup=true;const eb=makeBuilder(exhibit),rings=[];
 if(spec.id==='science'){eb.oval(accent,0,.5,0,1.0,1.0,1.0);for(const tilt of [-.8,0,.8]){const ring=eb.mesh(new T.TorusGeometry(1.45,.045,8,72),m.brass,0,.5,0);ring.rotation.set(Math.PI/2,tilt,.4);}for(let i=0;i<10;i++){const a=i*2.399;eb.oval(m.cream,Math.sin(a)*.9,.5+Math.cos(a)*.75,Math.cos(a)*.6,.18,.16,.1);}}
 if(spec.id==='nature'){eb.rod([0,-.8,0],[0,1.3,0],.045,m.brass);for(let i=0;i<9;i++){const a=i*.6;for(const side of [-1,1]){eb.oval(accent,Math.cos(a)*side*.75,-.5+i*.2,Math.sin(a)*side*.75,.12,.12,.12);eb.rod([Math.cos(a)*.75,-.5+i*.2,Math.sin(a)*.75],[-Math.cos(a)*.75,-.5+i*.2,-Math.sin(a)*.75],.025,m.cream);}if(i)for(const side of [-1,1])eb.rod([Math.cos(a)*side*.75,-.5+i*.2,Math.sin(a)*side*.75],[Math.cos(a-.6)*side*.75,-.7+i*.2,Math.sin(a-.6)*side*.75],.035,accent);}}
 if(spec.id==='history'){const profile=[[.5,-.8],[.7,-.65],[.8,-.2],[.6,.4],[.3,.7],[.3,1],[.5,1.12]].map(p=>new T.Vector2(...p));eb.mesh(new T.LatheGeometry(profile,40),m.cream);for(const y of [-.45,0,.5,1])eb.ring(y<.3?.78:.36,.022,m.brass,0,y,0);for(let i=0;i<12;i++){const a=i/12*TAU;eb.rod([Math.cos(a)*.75,-.4,Math.sin(a)*.75],[Math.cos(a)*.68,.2,Math.sin(a)*.68],.02,accent);}for(const x of [-1.45,1.45])eb.box(.7,.06,1.1,m.brass,x,-.7,0);}
 if(spec.id==='logic')for(let i=0;i<3;i++){const ring=new T.Group();ring.name='puzzle-ring-'+i;ring.userData.keepGroup=true;ring.rotation.z=(i+1)*Math.PI/2;exhibit.add(ring);const r=.55+i*.42;eb.mesh(new T.TorusGeometry(r,.06,8,64),accent,0,.3,0,ring);eb.oval(m.lamp,0,.3+r,0,.1,.1,.1,ring);rings.push(ring);}
 for(const x of [-4.4,4.4]){gb.box(.3,5.5,.3,m.cream,x,2.8,-2.2);gb.box(.06,4.4,.06,accent,x,2.7,-2.4);}gb.box(9.1,.25,.4,m.brass,0,5.55,-2.2);mergeFinish(exhibit);mergeFinish(g);galleries.push({spec,root:g,exhibit,accent,rings,boost:0});}
 const hemisphere=new T.HemisphereLight('#c0dfed','#344553',1.2);root.add(hemisphere);const light=new T.PointLight('#ffe0b4',65,45,2);light.position.set(0,10,0);root.add(light);mergeFinish(root);
 return{root,walls:[],doors:[],uniforms:[],atmosphere:{setQuality(){},update(){},dispose(){}},update(t,still,p){for(const o of orbits)o.root.rotation.y=still?0:t*o.speed;for(const g of galleries){g.accent.emissiveIntensity=.08+Math.max(0,g.boost-t)*.35;if(!still&&(!p||Math.hypot(p.x-root.position.x-g.spec.x,p.z-g.spec.z)<25)){if(g.spec.id!=='logic')g.exhibit.rotation.y=t*(g.spec.id==='nature'?.18:.08);}}},react(id,time){const g=galleries.find(g=>g.spec.id===id);if(g)g.boost=time+3;},puzzle(steps){const g=galleries.find(g=>g.spec.id==='logic');g.rings.forEach((r,i)=>r.rotation.z=steps[i]*Math.PI/2);},setQuality(){}};
}
