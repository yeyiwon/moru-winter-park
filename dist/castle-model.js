import {mergePaintedGeometry} from './mesh-batch.js';
import * as T from './vendor/three.module.js';
import {castleLayout,castleTowers} from './castle-layout.js';
import {createCastleAtmosphere} from './castle-atmosphere.js';

const C={stone:'#eee4cf',shadow:'#b7c9d6',snow:'#f5f6f1',gold:'#dfbd78',silver:'#d4e5ef',roof:'#183c65',roofRidge:'#5a88aa',warm:'#ffdaa0',ice:'#b7edff'};
const V=(...a)=>new T.Vector3(...a);
function rod(a,b,r=.04,segments=6){const d=V(...b).sub(V(...a)),g=new T.CylinderGeometry(r,r,d.length(),segments);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(V(0,1,0),d.normalize()));return g.translate(...V(...a).add(V(...b)).multiplyScalar(.5).toArray());}
function pathTube(points,r=.035,steps=24){return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>V(...p))),steps,r,5,false);}
function ring(radius,r=.04){return new T.TorusGeometry(radius,r,5,32).rotateX(Math.PI/2);}
function archShape(w,h){const p=new T.Shape();p.moveTo(-w/2,0);p.lineTo(-w/2,h*.62);p.bezierCurveTo(-w/2,h*.82,-w*.2,h,0,h);p.bezierCurveTo(w*.2,h,w/2,h*.82,w/2,h*.62);p.lineTo(w/2,0);p.closePath();return p;}

export function buildCastle(){
 const root=new T.Group();root.name='winter-palace';root.position.set(castleLayout.x,0,castleLayout.z);root.userData={keepGroup:true,dynamic:true,landmark:'castle'};
 const time={value:0},batches=new Map(),transform=new T.Object3D();
 const materials={
  stone:new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.72,metalness:.025}),
  metal:new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.32,metalness:.68}),
  roof:new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.34,metalness:.35}),
  light:new T.ShaderMaterial({vertexColors:true,toneMapped:false,uniforms:{time},vertexShader:`varying vec3 vColor;varying vec3 vP;void main(){vColor=color;vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float time;varying vec3 vColor;varying vec3 vP;void main(){float glow=1.55+.28*pow(.5+.5*sin(vP.y*.25+vP.x*.14-time*.19),4.);gl_FragColor=vec4(vColor*glow,1.);}`}),
 };
 function add(g,color='stone',finish='stone',position=[0,0,0],rotation=[0,0,0]){transform.position.set(...position);transform.rotation.set(...rotation);transform.updateMatrix();g.applyMatrix4(transform.matrix);if(!batches.has(finish))batches.set(finish,[]);batches.get(finish).push({g,color:new T.Color(C[color]||color)});}
 const box=(w,h,d,color,x,y,z,finish='stone')=>add(new T.BoxGeometry(w,h,d),color,finish,[x,y,z]);
 function window(x,y,z,w,h,yaw=0){
  const shape=archShape(w,h),outline=shape.getPoints(9).map(p=>V(p.x,p.y,.09));
  const matrix=new T.Matrix4().makeTranslation(x,y,z).multiply(new T.Matrix4().makeRotationY(yaw));
  // A deep stone reveal and slender leaded panes keep lit openings architectural at close range.
  const surround=archShape(w+.22,h+.18),opening=new T.Path(shape.getPoints(9));surround.holes.push(opening);
  add(new T.ExtrudeGeometry(surround,{depth:.16,steps:1,curveSegments:9,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:1}).applyMatrix4(matrix),'snow');
  add(new T.ShapeGeometry(shape,9).translate(0,0,.025).applyMatrix4(matrix),'warm','light');
  add(new T.TubeGeometry(new T.CatmullRomCurve3(outline,true),28,.036,5,true).applyMatrix4(matrix),'gold','metal');
  for(const [a,b]of [[[0,.08,.08],[0,h*.93,.08]],[[-w*.43,h*.43,.08],[w*.43,h*.43,.08]],[[-w*.32,h*.7,.08],[w*.32,h*.7,.08]]])add(rod(a,b,.021).applyMatrix4(matrix),'gold','metal');
  for(const side of [-1,1])add(rod([side*w*.23,.13,.08],[side*w*.23,h*.73,.08],.012).applyMatrix4(matrix),'silver','metal');
  add(new T.BoxGeometry(w+.38,.15,.38).translate(0,-.07,.09).applyMatrix4(matrix),'snow');
  add(new T.BoxGeometry(w+.42,.035,.41).translate(0,-.16,.10).applyMatrix4(matrix),'gold','metal');
 }
 function balcony(x,y,z,w,yaw=0){
  const matrix=new T.Matrix4().makeTranslation(x,y,z).multiply(new T.Matrix4().makeRotationY(yaw));
  add(new T.BoxGeometry(w+.42,.14,.63).translate(0,-.14,.19).applyMatrix4(matrix),'snow');
  add(rod([-w*.56,.42,.47],[w*.56,.42,.47],.033).applyMatrix4(matrix),'gold','metal');
  for(let i=0;i<6;i++){const px=-w*.52+w*1.04*i/5;add(rod([px,-.07,.47],[px,.4,.47],.021).applyMatrix4(matrix),'gold','metal');}
  for(const side of [-1,1]){
   add(rod([side*w*.56,.42,.47],[side*w*.56,.42,-.03],.028).applyMatrix4(matrix),'gold','metal');
   add(new T.BoxGeometry(.16,.45,.32).translate(side*w*.34,-.39,.01).applyMatrix4(matrix),'stone');
  }
 }
 function dormer(x,y,z,w,h,yaw=0){
  const matrix=new T.Matrix4().makeTranslation(x,y,z).multiply(new T.Matrix4().makeRotationY(yaw)),gable=new T.Shape();
  gable.moveTo(-w*.62,0);gable.lineTo(-w*.62,h*.62);gable.lineTo(0,h*1.16);gable.lineTo(w*.62,h*.62);gable.lineTo(w*.62,0);gable.closePath();
  add(new T.ExtrudeGeometry(gable,{depth:.45,bevelEnabled:false}).applyMatrix4(matrix),'stone');
  for(const side of [-1,1])add(rod([side*w*.7,h*.62,.49],[0,h*1.23,.49],.075).applyMatrix4(matrix),'snow');
  for(const side of [-1,1])add(rod([side*w*.67,h*.59,.54],[0,h*1.2,.54],.025).applyMatrix4(matrix),'gold','metal');
  const pos=V(0,h*.10,.48).applyMatrix4(matrix);window(pos.x,pos.y,pos.z,w*.62,h*.73,yaw);
  add(new T.OctahedronGeometry(.11).scale(.65,1.6,.65).translate(0,h*1.3,.48).applyMatrix4(matrix),'ice','light');
 }
 function parapet(x,z,width,y){
  box(width,.2,.7,'snow',x,y,z);box(width,.055,.77,'gold',x,y-.18,z,'metal');
  for(let i=0;i<=Math.floor(width/.9);i++){const px=x-width/2+i*width/Math.floor(width/.9);box(.36,.68,.55,'stone',px,y+.4,z);box(.47,.1,.68,'snow',px,y+.78,z);add(new T.SphereGeometry(.075,8,6),'gold','metal',[px,y+.9,z]);}
 }
 function roofRidge(x,z,r,y,h){
  const profile=Array.from({length:19},(_,i)=>{const u=i/18;return new T.Vector2(.035+r*1.35*(1-u)**1.42,h*u);});
  add(new T.LatheGeometry(profile,28),'roof','roof',[x,y,z]);
  // Windward snow follows the roof profile instead of a white cone floating above it.
  add(new T.LatheGeometry(profile.map(p=>new T.Vector2(p.x+.04,p.y+.055)),20,.15,Math.PI*.83),'snow','stone',[x,y,z]);
  add(ring(r*1.36,.07),'gold','metal',[x,y,z]);add(ring(r*1.38,.045),'ice','light',[x,y-.08,z]);
  for(let k=1;k<5;k++){const u=k/5;add(ring(.035+r*1.35*(1-u)**1.42,.032),'roofRidge','roof',[x,y+h*u,z]);}
  for(let j=0;j<8;j++){const a=j*Math.PI/4;const p=profile.map(v=>[x+Math.cos(a)*(v.x+.025),y+v.y,z+Math.sin(a)*(v.x+.025)]);add(pathTube(p,.025,18),'gold','metal');}
  // Fine snow cornices and hanging crystals read as a lit roof edge, not a large glow shell.
  for(let j=0;j<24;j++){const a=j*Math.PI/12,rx=Math.sin(a)*r*1.38,rz=Math.cos(a)*r*1.38;
   add(new T.SphereGeometry(.035,6,4),'warm','light',[x+rx,y-.13,z+rz]);
   if(j%3===0)add(new T.ConeGeometry(.045,.22+(j%2)*.1,5),'ice','light',[x+rx,y-.28,z+rz],[Math.PI,0,0]);
  }
  if(r>1.4)for(let j=0;j<4;j++){const a=j*Math.PI/2;dormer(x+Math.sin(a)*r*.98,y+h*.11,z+Math.cos(a)*r*.98,r*.5,h*.23,a);}

 }
 function tower(t){
  const {x,z,r,base,height:h,roof:rh}=t;
  add(new T.CylinderGeometry(r,r*1.055,h,24),'stone','stone',[x,base+h/2,z]);
  for(const y of [base+.3,base+h*.38,base+h*.72,base+h-.2]){add(new T.CylinderGeometry(r*1.085,r*1.085,.24,24),'snow','stone',[x,y,z]);add(ring(r*1.09,.033),'gold','metal',[x,y-.14,z]);}
  for(let j=0;j<8;j++){const a=j*Math.PI/4;box(.13,h*.88,.14,'shadow',x+Math.sin(a)*(r+.025),base+h*.49,z+Math.cos(a)*(r+.025));}
  const start=base+(h>10?2.2:1.25),step=h>10?4.2:2.6;
  for(let y=start;y<base+h-1.8;y+=step)for(let j=0;j<4;j++){const a=j*Math.PI/2;window(x+Math.sin(a)*(r+.045),y,z+Math.cos(a)*(r+.045),r*.52,Math.min(2.4,r*1.6),a);}
  for(let j=0;j<16;j++){const a=j*Math.PI/8,px=x+Math.sin(a)*r*1.04,pz=z+Math.cos(a)*r*1.04;
   add(new T.BoxGeometry(.12,.38,.18),'stone','stone',[px,base+h-.47,pz],[0,a,0]);
   add(new T.SphereGeometry(.035,6,4),'warm','light',[x+Math.sin(a)*r*1.1,base+h-.13,z+Math.cos(a)*r*1.1]);
  }
  if(r>1.5&&h>10)for(let j=0;j<4;j++){const a=j*Math.PI/2;balcony(x+Math.sin(a)*(r+.07),start+step,z+Math.cos(a)*(r+.07),r*.6,a);}
  roofRidge(x,z,r,base+h,rh);
  add(rod([x,base+h+rh-.05,z],[x,base+h+rh+.85,z],.04),'gold','metal');
 }
 // The elevated keep bridges a full 8.5m-wide arcade. Nothing solid closes its floor.
 const portal=new T.Shape();portal.moveTo(-4.5,7.3);portal.bezierCurveTo(-4.5,9.5,-2.4,11.5,0,11.5);portal.bezierCurveTo(2.4,11.5,4.5,9.5,4.5,7.3);portal.lineTo(4.5,14);portal.lineTo(-4.5,14);portal.closePath();
 add(new T.ExtrudeGeometry(portal,{depth:9,curveSegments:16,bevelEnabled:false}),'stone','stone',[0,0,-9]);
 for(const side of [-1,1]){
  box(7.1,12.5,10.8,'stone',side*8.05,6.25,-4.2);
  for(const y of [.35,5.6,9.1,12.45]){box(7.35,.22,11,'snow',side*8.05,y,-4.2);box(7.4,.055,11.05,'gold',side*8.05,y-.16,-4.2,'metal');}
  // Facade pilasters and layered buttress feet make the large wings read as architecture.
  for(const x of [side*4.68,side*8.05,side*11.42]){
   box(.42,12.2,.5,'shadow',x,6.1,1.4);box(.7,.75,.78,'stone',x,.45,1.5);box(.62,.2,.68,'snow',x,12.2,1.5);for(const y of [1.5,3.8,6.1,8.4,10.7])box(.48,.19,.56,'snow',x,y,1.42);
  }
  for(const x of [side*6.2,side*9.8]){window(x,2.1,1.24,1.15,3.7);window(x,7.1,1.24,.92,2.55);balcony(x,7.1,1.42,1.35);
   // Sapphire heraldic crests replace the repeated top storey of identical windows.
   const crest=new T.Shape();crest.moveTo(-.45,0);crest.lineTo(-.45,-.8);crest.quadraticCurveTo(-.32,-1.18,0,-1.4);crest.quadraticCurveTo(.32,-1.18,.45,-.8);crest.lineTo(.45,0);crest.closePath();
   add(new T.ExtrudeGeometry(crest,{depth:.09,bevelEnabled:true,bevelSize:.04,bevelThickness:.03,bevelSegments:2}),'roof','roof',[x,11.9,1.53]);
   add(pathTube([[-.45,0,0],[-.45,-.8,0],[0,-1.4,0],[.45,-.8,0],[.45,0,0],[-.45,0,0]],.027,24).translate(x,11.9,1.66),'gold','metal');
   for(let k=0;k<6;k++){const a=k*Math.PI/3;add(rod([x,11.25,1.69],[x+Math.cos(a)*.27,11.25+Math.sin(a)*.27,1.69],.021),'ice','light');}
  }
  // Broken stone courses and pilaster capitals break up the blank box-shaped wing facades.
  for(let row=0;row<21;row++){const y=.65+row*.56;for(let col=0;col<5;col++){const x=side*8.05-3.2+col*1.45+(row%2)*.32;if(Math.abs(x-side*8.05)>3.3)continue;box(.78,.022,.014,'shadow',x,y,1.213);}}

  for(const z of [-2.1,-5.5,-8.3])for(const y of [2,6.5,9.6])window(side*11.62,y,z,.8,2.1,side*Math.PI/2);
  parapet(side*8.05,1.35,7.1,12.8);parapet(side*8.05,-9.75,7.1,12.8);
  const gable=new T.Shape();gable.moveTo(-3.5,0);gable.lineTo(0,4.0);gable.lineTo(3.5,0);gable.closePath();
  add(new T.ExtrudeGeometry(gable,{depth:7.8,bevelEnabled:false}),'roof','roof',[side*8.05,12.9,-8.2]);
  add(pathTube([[side*8.05-3.5,13.02,-.36],[side*8.05,17.02,-.36],[side*8.05+3.5,13.02,-.36]],.075,16),'snow');
  for(const z of [-2.0,-5.8])dormer(side*(8.05+2.55),13.55,z,1.1,1.75,side*Math.PI/2);
  window(side*8.05,13.45,-.34,1.12,2.16);balcony(side*8.05,13.43,-.20,1.24);
  add(pathTube([[side*8.05-3.2,13.12,-.25],[side*8.05,16.85,-.25],[side*8.05+3.2,13.12,-.25]],.024,20),'gold','metal');
  for(let i=0;i<16;i++){const u=i/15,px=side*8.05-3.5+7*u,py=13.05+4*(1-Math.abs(u*2-1));add(new T.SphereGeometry(.044,6,4),'warm','light',[px,py,-.29]);}

 }
 box(8.8,9.2,7.3,'stone',0,18.65,-4.7);box(9.2,.3,7.7,'snow',0,14,-4.7);box(9.2,.25,7.7,'gold',0,23.3,-4.7,'metal');
 for(const x of [-2.8,0,2.8])window(x,15.8,-.99,x===0?1.55:1.15,x===0?5.8:4.6);
 for(const side of [-1,1])for(const z of [-3.1,-5.6,-7.9])window(side*4.43,16,z,.9,3.9,side*Math.PI/2);
 parapet(0,-.82,8.8,23.65);
 for(const x of [-2.8,0,2.8])balcony(x,15.8,-.87,x===0?1.8:1.35);
 for(const x of [-4.23,4.23]){box(.27,8.7,.3,'shadow',x,18.7,-.9);for(const y of [14.5,17.5,20.5,22.8])box(.36,.16,.39,'snow',x,y,-.9);}

 for(const t of castleTowers)tower(t);
 // Separate front/back archivolts keep the northbound portal legible from both directions.
 for(const z of [.10,-9.15])for(const offset of [0,.24]){
  const points=[[-4.55-offset,.15,z],[-4.55-offset,7.2,z],[-3.55-offset,9.95,z],[0,11.6+offset,z],[3.55+offset,9.95,z],[4.55+offset,7.2,z],[4.55+offset,.15,z]];
  add(pathTube(points,offset?.045:.095,54),offset?'ice':'gold',offset?'light':'metal');
 }
 // An open rose-window crest and fan tracery sit above the arch, never across its clearance.
 add(new T.TorusGeometry(.94,.055,6,48),'gold','metal',[0,13,.24]);
 for(let j=0;j<12;j++){const a=j*Math.PI/6;add(new T.TorusGeometry(.21,.018,4,18),'silver','metal',[Math.cos(a)*.65,13+Math.sin(a)*.65,.25]);add(new T.SphereGeometry(.05,6,4),'warm','light',[Math.cos(a)*.94,13+Math.sin(a)*.94,.27]);}
 // A six-fold ice crest, with no copied insignia.
 for(let i=0;i<6;i++){const a=i*Math.PI/3,x=Math.cos(a),y=Math.sin(a);add(rod([0,13.0,.22],[x*.8,13+y*.8,.22],.045),'ice','light');for(const s of [-1,1])add(rod([x*.5,13+y*.5,.22],[x*.63-s*y*.2,13+y*.63+s*x*.2,.22],.03),'gold','metal');}

 // A luminous stained-glass rose and a pointed crown break up the broad central keep.
 for(let j=0;j<12;j++){const a=j*Math.PI/6;add(new T.CircleGeometry(.89,8,a+.035,Math.PI/6-.07),j%3===0?'#eed6a4':j%2?'#8ec7dd':'#b6d8e5','light',[0,13,.205]);}
 for(const side of [-1,1]){
  const crown=[[side*4.25,23.75,-.48],[side*2.2,25.1,-.48],[0,27.4,-.48]];
  add(pathTube(crown,.105,24),'snow');add(pathTube(crown.map(([x,y,z])=>[x,y+.08,z+.12]),.032,24),'gold','metal');
  add(pathTube(crown.map(([x,y,z])=>[x,y+.12,z+.13]),.014,24),'ice','light');
  // Flying stone brackets connect the smaller spires to the keep, above all walking space.
  add(pathTube([[side*3.2,27.4,-4],[side*4.8,24.7,-4.7],[side*7.2,23.2,-6.5]],.16,24),'snow');
  add(pathTube([[side*3.2,27.57,-4],[side*4.8,24.87,-4.7],[side*7.2,23.37,-6.5]],.035,24),'gold','metal');
  for(let k=0;k<5;k++){const x=side*(.65+k*.62),y=27.4-Math.abs(x)*.87;
   add(pathTube([[x,y,-.3],[x+side*.18,y+.35,-.3],[x+side*.11,y+.54,-.3]],.035,12),'gold','metal');
   add(new T.OctahedronGeometry(.09).scale(.6,1.6,.6),'ice','light',[x+side*.11,y+.58,-.3]);
  }
 }
 add(new T.OctahedronGeometry(.22).scale(.6,1.8,.6),'ice','light',[0,27.72,-.38]);

 // Draped crystal lights follow the architecture; the open arcade remains clear.
 for(const side of [-1,1])for(const y of [5.7,9.25,12.7]){
  const points=Array.from({length:25},(_,i)=>{const u=i/24;return[side*(4.8+6.7*u),y-Math.sin(u*Math.PI)*.58,1.84];});
  add(pathTube(points,.018,24),'gold','metal');
  for(let i=0;i<points.length;i+=2){const p=points[i];add(new T.SphereGeometry(.052,7,5),i%4?'warm':'ice','light',p);}
  for(const u of [.25,.5,.75]){const x=side*(4.8+6.7*u),h=y-Math.sin(u*Math.PI)*.58;add(rod([x,h,1.84],[x,h-.32,1.84],.012),'silver','metal');add(new T.OctahedronGeometry(.11).scale(.5,1.7,.5),'ice','light',[x,h-.47,1.84]);}
 }
 for(const t of castleTowers){
  const base=t.base+t.height;
  for(let j=0;j<6;j++){const a=j*Math.PI/3,points=[];for(let i=0;i<21;i++){const u=i/20,r=.05+t.r*1.36*(1-u)**1.42;points.push([t.x+Math.sin(a)*r,base+t.roof*u,t.z+Math.cos(a)*r]);}
   add(pathTube(points,.018,20),'ice','light');
  }
  for(let j=0;j<8;j++){const a=j*Math.PI/4,r=t.r*1.12;add(new T.OctahedronGeometry(.10).scale(.6,1.8,.6),'warm','light',[t.x+Math.sin(a)*r,base-.42,t.z+Math.cos(a)*r]);}
 }
 // Open scrollwork and fine leaf motifs make the central balcony read as gilded metal.
 for(const x of [-3.8,-2.4,-1.1,1.1,2.4,3.8]){
  for(const side of [-1,1])add(pathTube([[x,23.8,-.36],[x+side*.42,24.18,-.36],[x+side*.39,24.62,-.36],[x+side*.12,24.7,-.36],[x+side*.09,24.43,-.36]],.027,14),'gold','metal');
  add(new T.OctahedronGeometry(.105).scale(.7,1.6,.7),'ice','light',[x,24.78,-.36]);
 }

 for(const [kind,parts]of batches){
  const geometry=mergePaintedGeometry(parts.map(p=>({geometry:p.g,color:p.color})));for(const part of parts)part.g.dispose();const object=new T.Mesh(geometry,materials[kind]);object.name='winter-palace-'+kind;object.castShadow=kind!=='light';object.receiveShadow=kind!=='light';root.add(object);
 }
 const atmosphere=createCastleAtmosphere(root,castleTowers);
 function update(t,still=false,{quality,player}={}){if(!still&&Number.isFinite(t))time.value=t;atmosphere.update(t,still,{quality,player});}
 return{root,dimensions:castleLayout,atmosphere,update,setQuality:atmosphere.setQuality,dispose(){atmosphere.dispose();root.traverse(o=>{if(o.isMesh)o.geometry.dispose();});Object.values(materials).forEach(m=>m.dispose());root.removeFromParent();}};
}
