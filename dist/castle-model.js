import * as T from './vendor/three.module.js';
import {castleLayout,castleTowers} from './castle-layout.js';
import {createCastleAtmosphere} from './castle-atmosphere.js';

const C={stone:'#e5e3d9',shadow:'#bbc9cd',snow:'#f0f4f1',gold:'#cdb781',silver:'#c7d9de',roof:'#28485d',roofRidge:'#416077',warm:'#ffdda3',ice:'#b9dfeb'};
const V=(...a)=>new T.Vector3(...a);
function rod(a,b,r=.04,segments=6){const d=V(...b).sub(V(...a)),g=new T.CylinderGeometry(r,r,d.length(),segments);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(V(0,1,0),d.normalize()));return g.translate(...V(...a).add(V(...b)).multiplyScalar(.5).toArray());}
function pathTube(points,r=.035,steps=24){return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>V(...p))),steps,r,5,false);}
function ring(radius,r=.04){return new T.TorusGeometry(radius,r,5,32).rotateX(Math.PI/2);}
function archShape(w,h){const p=new T.Shape();p.moveTo(-w/2,0);p.lineTo(-w/2,h*.62);p.bezierCurveTo(-w/2,h*.82,-w*.2,h,0,h);p.bezierCurveTo(w*.2,h,w/2,h*.82,w/2,h*.62);p.lineTo(w/2,0);p.closePath();return p;}

export function buildCastle(){
 const root=new T.Group();root.name='winter-palace';root.position.set(castleLayout.x,0,castleLayout.z);root.userData={keepGroup:true,dynamic:true,landmark:'castle'};
 const time={value:0},batches=new Map(),transform=new T.Object3D();
 const materials={
  stone:new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.82,metalness:.02}),
  metal:new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.32,metalness:.68}),
  roof:new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.42,metalness:.3}),
  light:new T.ShaderMaterial({vertexColors:true,toneMapped:false,uniforms:{time},vertexShader:`varying vec3 vColor;varying vec3 vP;void main(){vColor=color;vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float time;varying vec3 vColor;varying vec3 vP;void main(){float glow=.86+.08*sin(vP.y*.25+vP.x*.14-time*.19);gl_FragColor=vec4(vColor*glow,1.);}`}),
 };
 function add(g,color='stone',finish='stone',position=[0,0,0],rotation=[0,0,0]){transform.position.set(...position);transform.rotation.set(...rotation);transform.updateMatrix();g.applyMatrix4(transform.matrix);if(!batches.has(finish))batches.set(finish,[]);batches.get(finish).push({g,color:new T.Color(C[color]||color)});}
 const box=(w,h,d,color,x,y,z,finish='stone')=>add(new T.BoxGeometry(w,h,d),color,finish,[x,y,z]);
 function window(x,y,z,w,h,yaw=0){
  const shape=archShape(w,h),outline=shape.getPoints(8).map(p=>V(p.x,p.y,.07));
  const rotation=new T.Matrix4().makeRotationY(yaw),translation=new T.Matrix4().makeTranslation(x,y,z),matrix=translation.multiply(rotation);
  add(new T.ShapeGeometry(shape,8).applyMatrix4(matrix),'warm','light');
  add(new T.TubeGeometry(new T.CatmullRomCurve3(outline,true),24,.055,5,true).applyMatrix4(matrix),'gold','metal');
  for(const [a,b]of [[[0,.12,.08],[0,h*.91,.08]],[[-w*.42,h*.43,.08],[w*.42,h*.43,.08]]])add(rod(a,b,.025).applyMatrix4(matrix),'gold','metal');
  add(new T.BoxGeometry(w+.3,.13,.27).translate(0,-.07,.04).applyMatrix4(matrix),'snow');
 }
 function parapet(x,z,width,y){
  box(width,.2,.7,'snow',x,y,z);box(width,.055,.77,'gold',x,y-.18,z,'metal');
  for(let i=0;i<=Math.floor(width/.9);i++){const px=x-width/2+i*width/Math.floor(width/.9);box(.36,.68,.55,'stone',px,y+.4,z);box(.47,.1,.68,'snow',px,y+.78,z);}
 }
 function roofRidge(x,z,r,y,h){
  const profile=Array.from({length:19},(_,i)=>{const u=i/18;return new T.Vector2(.035+r*1.35*(1-u)**1.42,h*u);});
  add(new T.LatheGeometry(profile,28),'roof','roof',[x,y,z]);
  // Windward snow follows the roof profile instead of a white cone floating above it.
  add(new T.LatheGeometry(profile.map(p=>new T.Vector2(p.x+.04,p.y+.055)),20,.15,Math.PI*.83),'snow','stone',[x,y,z]);
  add(ring(r*1.36,.07),'gold','metal',[x,y,z]);add(ring(r*1.38,.045),'ice','light',[x,y-.08,z]);
  for(let k=1;k<5;k++){const u=k/5;add(ring(.035+r*1.35*(1-u)**1.42,.032),'roofRidge','roof',[x,y+h*u,z]);}
  for(let j=0;j<8;j++){const a=j*Math.PI/4;const p=profile.map(v=>[x+Math.cos(a)*(v.x+.025),y+v.y,z+Math.sin(a)*(v.x+.025)]);add(pathTube(p,.025,18),'gold','metal');}
 }
 function tower(t){
  const {x,z,r,base,height:h,roof:rh}=t;
  add(new T.CylinderGeometry(r,r*1.055,h,24),'stone','stone',[x,base+h/2,z]);
  for(const y of [base+.3,base+h*.38,base+h*.72,base+h-.2]){add(new T.CylinderGeometry(r*1.085,r*1.085,.24,24),'snow','stone',[x,y,z]);add(ring(r*1.09,.033),'gold','metal',[x,y-.14,z]);}
  for(let j=0;j<8;j++){const a=j*Math.PI/4;box(.13,h*.88,.14,'shadow',x+Math.sin(a)*(r+.025),base+h*.49,z+Math.cos(a)*(r+.025));}
  const start=base+(h>10?2.2:1.25),step=h>10?4.2:2.6;
  for(let y=start;y<base+h-1.8;y+=step)for(let j=0;j<4;j++){const a=j*Math.PI/2;window(x+Math.sin(a)*(r+.045),y,z+Math.cos(a)*(r+.045),r*.52,Math.min(2.4,r*1.6),a);}
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
   box(.42,12.2,.5,'shadow',x,6.1,1.4);box(.7,.75,.78,'stone',x,.45,1.5);box(.62,.2,.68,'snow',x,12.2,1.5);
  }
  for(const x of [side*6.2,side*9.8])for(const y of [2.0,6.5,9.6])window(x,y,1.24,.95,2.15);
  for(const z of [-2.1,-5.5,-8.3])for(const y of [2,6.5,9.6])window(side*11.62,y,z,.8,2.1,side*Math.PI/2);
  parapet(side*8.05,1.35,7.1,12.8);parapet(side*8.05,-9.75,7.1,12.8);
  const gable=new T.Shape();gable.moveTo(-3.5,0);gable.lineTo(0,4.0);gable.lineTo(3.5,0);gable.closePath();
  add(new T.ExtrudeGeometry(gable,{depth:7.8,bevelEnabled:false}),'roof','roof',[side*8.05,12.9,-8.2]);
  add(pathTube([[side*8.05-3.5,13.02,-.36],[side*8.05,17.02,-.36],[side*8.05+3.5,13.02,-.36]],.075,16),'snow');
 }
 box(8.8,9.2,7.3,'stone',0,18.65,-4.7);box(9.2,.3,7.7,'snow',0,14,-4.7);box(9.2,.25,7.7,'gold',0,23.3,-4.7,'metal');
 for(const x of [-3,-1.5,0,1.5,3])window(x,16.0,-.99,.88,4.2);
 for(const side of [-1,1])for(const z of [-3.1,-5.6,-7.9])window(side*4.43,16,z,.9,3.9,side*Math.PI/2);
 parapet(0,-.82,8.8,23.65);
 for(const t of castleTowers)tower(t);
 // Separate front/back archivolts keep the northbound portal legible from both directions.
 for(const z of [.10,-9.15])for(const offset of [0,.24]){
  const points=[[-4.55-offset,.15,z],[-4.55-offset,7.2,z],[-3.55-offset,9.95,z],[0,11.6+offset,z],[3.55+offset,9.95,z],[4.55+offset,7.2,z],[4.55+offset,.15,z]];
  add(pathTube(points,offset?.045:.095,54),offset?'ice':'gold',offset?'light':'metal');
 }
 // A restrained six-fold ice crest, with no copied insignia.
 for(let i=0;i<6;i++){const a=i*Math.PI/3,x=Math.cos(a),y=Math.sin(a);add(rod([0,13.0,.22],[x*.8,13+y*.8,.22],.045),'ice','light');for(const s of [-1,1])add(rod([x*.5,13+y*.5,.22],[x*.63-s*y*.2,13+y*.63+s*x*.2,.22],.03),'gold','metal');}

 for(const [kind,parts]of batches){
  const count=parts.reduce((n,{g})=>n+(g.index?.count||g.attributes.position.count),0),position=new Float32Array(count*3),normal=new Float32Array(count*3),uv=new Float32Array(count*2),color=new Float32Array(count*3);let offset=0;
  for(const {g,color:c}of parts){const p=g.index?g.toNonIndexed():g,n=p.attributes.position.count;position.set(p.attributes.position.array,offset*3);normal.set(p.attributes.normal.array,offset*3);uv.set(p.attributes.uv.array,offset*2);for(let i=0;i<n;i++)color.set(c.toArray(),(offset+i)*3);offset+=n;if(p!==g)p.dispose();g.dispose();}
  const geometry=new T.BufferGeometry();for(const [name,values,size]of [['position',position,3],['normal',normal,3],['uv',uv,2],['color',color,3]])geometry.setAttribute(name,new T.BufferAttribute(values,size));geometry.computeBoundingSphere();geometry.computeBoundingBox();const object=new T.Mesh(geometry,materials[kind]);object.name='winter-palace-'+kind;object.castShadow=kind!=='light';object.receiveShadow=kind!=='light';root.add(object);
 }
 const atmosphere=createCastleAtmosphere(root,castleTowers);
 function update(t,still=false,{quality,player}={}){if(!still&&Number.isFinite(t))time.value=t;atmosphere.update(t,still,{quality,player});}
 return{root,dimensions:castleLayout,atmosphere,update,setQuality:atmosphere.setQuality,dispose(){atmosphere.dispose();root.traverse(o=>{if(o.isMesh)o.geometry.dispose();});Object.values(materials).forEach(m=>m.dispose());root.removeFromParent();}};
}
