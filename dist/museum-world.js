import {buildMuseumForecourt} from './festival-plaza.js';
import {museumFacadeDetails} from './winter-architecture-details.js';
import {ryokanFinish} from './ryokan-finish.js';
import * as T from './vendor/three.module.js';
import {makeBuilder,mergeFinish,materials} from './architecture-kit.js';
import {museumLayout} from './district-layout.js';
const TAU=Math.PI*2;
function stars(b,m,radius,y,count=96){for(let i=0;i<count;i++){const a=i*2.399,r=Math.sqrt((i+.5)/count)*radius;b.oval(i%4?m.coolLamp:m.lamp,Math.cos(a)*r,y+Math.sin(i*1.71)*.06,Math.sin(a)*r,.035,.02,.035);}}
function dome(b,m,radius,base,root,inside=false){
 const material=new T.MeshStandardMaterial({color:inside?'#172c45':'#172943',emissive:inside?'#000000':'#16324c',emissiveIntensity:.14,roughness:inside?.85:.3,metalness:inside?.05:.48,side:T.DoubleSide});
 const roof=b.mesh(new T.SphereGeometry(radius,64,32,0,TAU,0,Math.PI/2),material,0,base,0);roof.name=inside?'planetarium-ceiling':'observatory-solid-dome';if(!inside)roof.scale.y=.66;
 for(let j=0;j<(inside?8:16);j++){const a=j/(inside?8:16)*TAU,rr=radius+(inside?-.08:.09),points=Array.from({length:25},(_,i)=>{const t=i/24*Math.PI/2;return[Math.sin(t)*Math.sin(a)*rr,base+Math.cos(t)*rr*(inside?1:.66),Math.sin(t)*Math.cos(a)*rr];});b.tube(points,inside?.025:.065,m.brass,root,24);}
 if(!inside)for(const theta of [.36,.74,1.16]){const r=Math.sin(theta)*(radius+.10),y=base+Math.cos(theta)*radius*.66;b.ring(r,.055,m.cream,0,y,0);b.ring(r+.025,.017,m.coolLamp,0,y-.045,0);}
 b.ring(radius,.15,m.cream,0,base,0);b.ring(radius-.12,.035,m.lamp,0,base+.16,0);
 if(inside){const positions=[];for(let i=0;i<320;i++){const a=i*2.399,u=(i+.5)/320*.85+.05,r=radius-.18;positions.push(Math.sin(a)*Math.sqrt(1-u*u)*r,base+u*r,Math.cos(a)*Math.sqrt(1-u*u)*r);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));const points=new T.Points(g,new T.PointsMaterial({color:'#d7e7f2',size:.075,sizeAttenuation:true,transparent:true,opacity:.7,depthWrite:false}));points.name='planetarium-stars';root.add(points);// Local constellations follow the inside of the dome; never join unrelated stars across the hall.
 for(let cluster=0;cluster<6;cluster++){const az=cluster*TAU/6,shape=[[-.12,.04],[-.055,-.02],[0,.045],[.07,0],[.11,.09]],r=radius-.24;const points=shape.map(([dx,dy])=>{const theta=.88+dy,a=az+dx;return[Math.sin(theta)*Math.sin(a)*r,base+Math.cos(theta)*r,Math.sin(theta)*Math.cos(a)*r];});b.tube(points,.009,m.brass,root,20);for(const point of points)b.oval(m.coolLamp,...point,.045,.045,.045);} }
}
export function buildMuseumLandmark(parent){
 const root=new T.Group();root.name='starlight-museum-landmark';root.position.set(museumLayout.x,0,museumLayout.z);root.rotation.y=museumLayout.yaw;parent.add(root);const m=materials(),b=makeBuilder(root),stone=new T.MeshStandardMaterial({color:'#c1ccd3',roughness:.75}),blue=new T.MeshStandardMaterial({color:'#284654',roughness:.5,metalness:.35});
 ryokanFinish(stone,'stone');ryokanFinish(m.cream,'stone');const windowGlass=new T.MeshStandardMaterial({color:'#dbc49b',emissive:'#f1c381',emissiveIntensity:.38,roughness:.26,metalness:.12});
 b.mesh(new T.CylinderGeometry(16.3,16.5,.25,80),stone,0,.03,0);b.mesh(new T.CylinderGeometry(15.6,15.9,.3,80),m.cream,0,.22,0);
 for(let i=0;i<28;i++){const a=(i+.5)/28*TAU;if(Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.24)continue;const g=new T.Group();g.position.set(Math.sin(a)*15.5,0,Math.cos(a)*15.5);g.rotation.y=a;root.add(g);b.box(3.35,.9,.65,stone,0,.85,0,g);b.box(3.35,.5,.75,stone,0,5.45,0,g);b.box(.32,4.6,.7,m.cream,-1.55,3,0,g);b.box(2.6,3.65,.06,blue,0,3.1,.07,g);const arch=new T.Shape();arch.moveTo(-1.05,0);arch.lineTo(-1.05,2.1);arch.quadraticCurveTo(0,3.3,1.05,2.1);arch.lineTo(1.05,0);arch.closePath();b.mesh(new T.ShapeGeometry(arch),windowGlass,0,1.5,.15,g);for(const x of [-1.2,0,1.2])b.box(.055,3.7,.09,m.brass,x,3.1,.12,g);b.box(2.7,.045,.1,m.lamp,0,1.35,.18,g);for(const y of [1.7,4.6])b.box(3.2,.1,.85,m.cream,0,y,0,g);}
 for(const side of [-1,1]){b.mesh(new T.LatheGeometry([[.65,0],[.65,.2],[.43,.3],[.35,5.8],[.57,6],[.57,6.2]].map(p=>new T.Vector2(...p)),24),m.cream,side*3.3,.2,16);b.ring(.5,.055,m.brass,side*3.3,5.8,16);}
 b.tube(Array.from({length:33},(_,i)=>{const a=i/32*Math.PI;return[Math.cos(a)*3.3,6.2+Math.sin(a)*3.3,16];}),.24,m.cream,root,40);b.tube(Array.from({length:33},(_,i)=>{const a=i/32*Math.PI;return[Math.cos(a)*3.04,6.2+Math.sin(a)*3.04,16.15];}),.035,m.lamp,root,40);
 b.box(6,.02,4,blue,0,.18,17);for(const x of [-2.7,2.7])b.box(.035,.02,4,m.lamp,x,.2,17);
 dome(b,m,15.7,5.9,root);b.mesh(new T.CylinderGeometry(.75,.9,1.1,24),m.cream,0,16.6,0);b.ring(.9,.06,m.brass,0,16.1,0);b.oval(m.coolLamp,0,17.3,0,.4,.5,.4);b.rod([0,17.3,0],[0,19,0],.055,m.brass);b.ring(.95,.045,m.brass,0,18.2,0).rotation.x=.6;
 // Solid twin doors and a lit transom make the entrance legible from the bridge.
 for(const side of [-1,1]){b.box(2.6,5.5,.16,blue,side*1.35,2.95,15.95);b.box(2.2,3.4,.04,windowGlass,side*1.35,3.6,16.05);for(const dx of [-1,0,1])b.box(.055,3.45,.055,m.brass,side*1.35+dx,3.6,16.1);b.box(.08,.65,.12,m.brass,side*.28,2.8,16.15);b.box(2.2,.04,.06,m.lamp,side*1.35,5.32,16.12);}
 museumFacadeDetails(root,m);buildMuseumForecourt(root,m);stars(b,m,15,.21,100);mergeFinish(root);
 const count=240,geometry=new T.BufferGeometry(),pos=new Float32Array(count*3),phase=new Float32Array(count);for(let i=0;i<count;i++){const a=i/count*TAU;pos[i*3]=Math.sin(a)*15.85;pos[i*3+1]=6.13;pos[i*3+2]=Math.cos(a)*15.85;phase[i]=a;}geometry.setAttribute('position',new T.BufferAttribute(pos,3));geometry.setAttribute('phase',new T.BufferAttribute(phase,1));const time={value:0},sparkle=new T.Points(geometry,new T.ShaderMaterial({uniforms:{time},transparent:true,depthWrite:false,vertexShader:'attribute float phase;uniform float time;varying float v;void main(){v=.45+.55*pow(.5+.5*sin(phase*3.-time*.4),5.);vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(140./-p.z,1.5,4.);}',fragmentShader:'varying float v;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(.8,.92,1.,smoothstep(.5,.1,d)*v);}' }));root.add(sparkle);
 return{root,update(t,still){time.value=still?0:t;},setQuality(q){geometry.setDrawRange(0,q==='low'?120:240);}};
}
export {buildObservatoryInterior as buildMuseumInterior} from './observatory-interior.js';
