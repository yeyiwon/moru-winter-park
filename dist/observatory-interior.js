import * as T from './vendor/three.module.js';
import {makeBuilder,mergeFinish} from './architecture-kit.js';
import {ryokanFinish} from './ryokan-finish.js';
import {buildObservatoryGuide} from './observatory-guide.js';
import {observatoryLayout as layout} from './observatory-layout.js';
import {buildObservatorySky} from './observatory-sky.js';
const TAU=Math.PI*2;
function palette(){const mat=(color,roughness=.65,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});return {stone:mat('#293a4a',.54),floor:mat('#405365',.36,.15),navy:mat('#182938',.65,.18),black:mat('#0d1720',.62,.25),silver:mat('#b7c5d2',.3,.65),brushed:mat('#728897',.46,.5),champagne:mat('#b6a98b',.36,.55),light:new T.MeshStandardMaterial({color:'#b6d4e4',emissive:'#a2c8df',emissiveIntensity:.65}),warm:new T.MeshStandardMaterial({color:'#eedcc1',emissive:'#e0bc8e',emissiveIntensity:.5}),optic:new T.MeshStandardMaterial({color:'#8ca7b9',metalness:.9,roughness:.13,emissive:'#44657d',emissiveIntensity:.08,side:T.DoubleSide})};}
function telescope(parent,m){
 const root=new T.Group();root.name='observatory-reflector';root.userData.keepGroup=true;root.userData.fixtureRadius=layout.telescope.r;parent.add(root);const b=makeBuilder(root);
 b.mesh(new T.CylinderGeometry(3.5,3.5,.18,64),m.stone,0,.18,0);b.ring(3.42,.025,m.warm,0,.17,0);
 b.mesh(new T.LatheGeometry([[2.25,0],[2.25,.18],[1.8,.3],[1.6,1],[1.6,1.3],[1.8,1.4]].map(p=>new T.Vector2(...p)),48),m.navy,0,.28,0);
 for(const y of [.5,1.55])b.ring(1.83,.065,m.brushed,0,y,0);
 // The fork and side bearings carry an altitude axis; the base is the azimuth drive.
 for(const sign of [-1,1]){b.box(.5,2.9,1.15,m.silver,sign*1.9,2.75,0);b.box(.68,.3,1.4,m.brushed,sign*1.9,1.45,0);const bearing=b.mesh(new T.CylinderGeometry(.63,.63,.32,32),m.navy,sign*1.9,4.2,0);bearing.rotation.z=Math.PI/2;const cap=b.mesh(new T.CylinderGeometry(.44,.44,.35,24),m.brushed,sign*1.96,4.2,0);cap.rotation.z=Math.PI/2;for(let i=0;i<10;i++){const a=i/10*TAU;b.oval(m.silver,sign*2.16,4.2+Math.sin(a)*.47,Math.cos(a)*.47,.035,.035,.035);}}
 const tube=new T.Group();tube.name='reflector-optical-assembly';tube.position.y=4.2;tube.rotation.set(.25,0,.38);root.add(tube);const t=makeBuilder(tube);
 t.mesh(new T.CylinderGeometry(1.44,1.44,1.15,48,1,true),m.navy,0,-.9,0);for(const y of [-1.48,-.38,2.9,3.18])t.ring(1.46,.085,m.brushed,0,y,0);
 // Concave annular primary and a suspended secondary retain a real optical path.
 const profile=Array.from({length:20},(_,i)=>{const r=.16+i/19*1.2;return new T.Vector2(r,r*r*.085);});const primary=t.mesh(new T.LatheGeometry(profile,64),m.optic,0,-1.35,0);primary.name='reflector-primary-mirror';
 for(let i=0;i<8;i++){const a=i/8*TAU,next=a+TAU/8;t.rod([Math.cos(a)*1.4,-.4,Math.sin(a)*1.4],[Math.cos(next)*1.4,2.94,Math.sin(next)*1.4],.045,m.silver);t.rod([Math.cos(next)*1.4,-.4,Math.sin(next)*1.4],[Math.cos(a)*1.4,2.94,Math.sin(a)*1.4],.045,m.silver);}
 for(let i=0;i<4;i++){const a=i/4*TAU;t.rod([Math.cos(a)*1.4,3.08,Math.sin(a)*1.4],[0,2.94,0],.025,m.black);}
 t.mesh(new T.CylinderGeometry(.28,.32,.25,24),m.black,0,2.92,0);t.mesh(new T.CylinderGeometry(.27,.27,.025,32),m.optic,0,2.78,0);
 t.mesh(new T.CylinderGeometry(.43,.43,.8,24),m.black,0,-1.85,0);t.ring(.44,.035,m.champagne,0,-1.9,0);t.box(.7,.4,.6,m.navy,0,-2.25,0);
 for(const x of [-.25,0,.25])t.oval(m.light,x,-2.12,.31,.018,.018,.018);
 b.box(.55,1,.45,m.navy,1.15,1.95,1.2);for(let i=0;i<7;i++)b.box(.4,.025,.035,m.black,1.15,1.68+i*.08,1.44);
 b.tube([[1.45,1.65,.9],[1.5,2.2,.9],[1.7,3.1,.65],[1.65,4.1,.2]],.035,m.black);
 mergeFinish(root);return root;
}
function consoleTable(parent,m){
 const root=new T.Group();root.name='observatory-quiz-console';root.position.set(layout.console.x,0,layout.console.z);root.userData.keepGroup=true;root.userData.interactionId='observatory-quiz';parent.add(root);const b=makeBuilder(root);
 for(const x of [-1.05,1.05])b.box(.14,1.1,.55,m.brushed,x,.66,0);
 const top=b.box(2.9,.13,1.15,m.navy,0,1.25,0);top.rotation.x=.14;
 const screen=b.box(1.8,.025,.68,m.black,-.25,1.34,.01);screen.rotation.x=.14;
 // A restrained etched sky plot identifies the single learning station without a billboard.
 for(const [x,z]of [[-.9,-.1],[-.65,.08],[-.37,-.08],[-.1,.1],[.12,-.03]])b.oval(m.light,x,1.36-z*.14,z,.023,.008,.023);
 for(const x of [.85,1.08]){b.mesh(new T.CylinderGeometry(.065,.065,.04,12),m.silver,x,1.39,.18);b.oval(m.warm,x,1.36,-.15,.018,.01,.018);}
 mergeFinish(root);
}
export function buildObservatoryInterior(root){
 const m=palette(),b=makeBuilder(root),R=layout.radius,base=layout.domeBase;
 for(const material of [m.stone,m.floor])ryokanFinish(material,'stone');
 const stoneFinish=m.floor.onBeforeCompile;m.floor.onBeforeCompile=shader=>{stoneFinish(shader);shader.fragmentShader=shader.fragmentShader.replace('.76+stone*.4','.94+stone*.09');};m.floor.customProgramCacheKey=()=> 'observatory-polished-stone-v54';
 b.box(48,.22,44,m.stone,0,-.04,0);b.mesh(new T.CylinderGeometry(20.4,20.4,.025,96),m.floor,0,.0825,0);
 for(const r of [19.8,20.4])b.ring(r,.025,m.brushed,0,.105,0);b.ring(20.65,.03,m.warm,0,.15,0);
 // Stone joints follow the floor, rather than becoming a second celestial diagram.
 for(let i=0;i<24;i++){const a=i/24*TAU;b.rod([Math.sin(a)*10,.107,Math.cos(a)*10],[Math.sin(a)*20.35,.107,Math.cos(a)*20.35],.008,m.stone);}
 for(const side of [-1,1]){b.box(.4,6,44,m.navy,side*23.8,3,0);b.box(48,6,.4,m.navy,0,3,side*21.8);for(const y of [.3,5.7]){b.box(.12,.1,43.4,m.brushed,side*23.52,y,0);b.box(47.3,.1,.12,m.brushed,0,y,side*21.52);}}
 for(const side of [-1,1])for(const offset of [-17,-8,8,17]){
  b.box(.08,3.6,6.8,m.black,side*23.53,2.6,offset);b.box(6.8,3.6,.08,m.black,offset,2.6,side*21.53);
  b.box(.12,.04,6.6,m.warm,side*23.44,.82,offset);b.box(6.6,.04,.12,m.warm,offset,.82,side*21.44);
  for(const edge of [-3.4,3.4]){b.box(.15,3.8,.08,m.brushed,side*23.44,2.6,offset+edge);b.box(.08,3.8,.15,m.brushed,offset+edge,2.6,side*21.44);}
 }
 for(const {index:i,angle:a,x,z} of layout.piers){
  const pier=b.box(.32,5.6,.52,m.brushed,x,2.85,z);pier.rotation.y=a;
  const foot=b.box(.65,.24,.85,m.stone,x,.2,z);foot.rotation.y=a;
  if(i%2===0){const wash=b.box(.04,2.6,.03,m.light,x-Math.sin(a)*.28,2.2,z-Math.cos(a)*.28);wash.rotation.y=a;}
 }
 // Retracted panels sit below the sky rim; the entire upper hemisphere stays
 // open. An opaque interior shutter used to hide one direction of the stars.
 const shellMaterial=m.navy.clone();shellMaterial.side=T.DoubleSide;
 for(let i=0;i<3;i++){const panel=b.mesh(new T.CylinderGeometry(R-.1+i*.06,R-.1+i*.06,.24,64,1,true),shellMaterial,0,base-.6+i*.2,0);panel.name='observatory-parked-shutter';}
 for(const r of [21.8,22.08])b.ring(r,.10,m.brushed,0,base,0);
 b.ring(21.65,.035,m.light,0,base-.08,0);
 for(let j=0;j<8;j++){const a=j/8*TAU,points=Array.from({length:33},(_,i)=>{const t=.24+i/32*(Math.PI/2-.24);return[Math.sin(a)*Math.sin(t)*R,base+Math.cos(t)*R,Math.cos(a)*Math.sin(t)*R];});b.tube(points,.11,m.brushed,root,32);}
 b.ring(Math.sin(.24)*R,.14,m.brushed,0,base+Math.cos(.24)*R,0);
 const ceilingShape=new T.Shape([new T.Vector2(-24,-22),new T.Vector2(24,-22),new T.Vector2(24,22),new T.Vector2(-24,22)]),hole=new T.Path();hole.absarc(0,0,21.97,0,TAU,true);ceilingShape.holes.push(hole);const corners=b.mesh(new T.ShapeGeometry(ceilingShape,64),shellMaterial,0,base,0);corners.rotation.x=-Math.PI/2;
 // The recessed double door, sill and warm frame read as a real exit, while
 // retaining the existing server-validated doorway and outdoor return point.
 b.box(.18,4.7,4.8,m.black,-23.52,2.42,0);
 for(const z of [-1.05,1.05]){b.box(.18,4.25,2.02,m.brushed,-23.3,2.25,z);b.box(.04,3.4,1.52,m.navy,-23.18,2.35,z);b.box(.08,.56,.05,m.champagne,-23.05,1.95,Math.sign(z)*.2);}
 for(const z of [-2.25,2.25]){b.box(.5,4.8,.2,m.silver,-23.15,2.45,z);b.box(.04,4.4,.035,m.warm,-22.88,2.45,z);}
 b.box(.5,.2,4.7,m.silver,-23.15,4.8,0);b.box(.035,.035,4.35,m.warm,-22.88,4.67,0);b.box(1.4,.04,4.7,m.brushed,-22.8,.1,0);
 for(const z of [-1.6,1.6])b.box(6,.018,.025,m.warm,-19,.107,z);
 if(globalThis.document){const canvas=document.createElement('canvas');canvas.width=384;canvas.height=96;const ctx=canvas.getContext('2d');if(ctx){ctx.fillStyle='#152735';ctx.fillRect(0,0,384,96);ctx.fillStyle='#e7dfc9';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='500 46px sans-serif';ctx.fillText('나가기',192,48);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const sign=b.mesh(new T.PlaneGeometry(1.9,.48),new T.MeshBasicMaterial({map:texture}),-22.86,4.35,0);sign.rotation.y=Math.PI/2;sign.name='observatory-exit-sign';}}
 telescope(root,m);consoleTable(root,m);
 root.add(new T.HemisphereLight('#bbd0ea','#253547',1.25));const key=new T.PointLight('#c2d7ed',95,45,2);key.position.set(-5,11,7);root.add(key);
 mergeFinish(root);root.traverse(o=>{if(o.isMesh)o.castShadow=false;});
 const sky=buildObservatorySky(root),guide=buildObservatoryGuide(root);guide.root.traverse(o=>{if(o.isMesh)o.castShadow=false;});let disposed=false;
 return {root,walls:[],doors:[],uniforms:[],sky,atmosphere:{update(){},setQuality(){},dispose(){}},
  update(t,still,player){if(disposed||!Number.isFinite(t))return false;guide.update(t,still,player);return sky.update(t,still);},setQuality(q){sky.setQuality(q);guide.setQuality(q);},setView:(camera,ratio)=>sky.setCamera(camera,ratio),
  react(){return false;},puzzle(){return false;},dispose(){disposed=true;guide.dispose();sky.dispose();}
 };
}
