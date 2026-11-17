import {createSnowPaths} from './snow-path.js';
import {createRetreatAtmosphere} from './retreat-atmosphere.js';
import * as T from './vendor/three.module.js';
import {spa as worldSpa,spaPavilion as worldPavilion,spaActivities as worldActivities,spaShift} from './resort-layout.js';

// A bath garden laid out around water, with an open-front pavilion rather than a prop hut.
export function buildSpaResort(api){
 // Keep authored joinery in its original local frame; translate the whole district once.
 const spa={...worldSpa,z:worldSpa.z-spaShift},spaPavilion={...worldPavilion,z:worldPavilion.z-spaShift,sideDoorZ:worldPavilion.sideDoorZ-spaShift};
 const spaActivities=Object.fromEntries(Object.entries(worldActivities).map(([id,p])=>[id,{...p,z:p.z-spaShift,...(p.pool?{pool:{...p.pool,z:p.pool.z-spaShift}}:{})}]));
 const hitMaterial=new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
 const {scene,M}=api,root=new T.Group();root.name='spa-resort';scene.add(root);
 const interactive=[],moving=new Set();
 const snow=M('#e8eeeb',.98,0),stone=M('#858d88',.94,0),stoneLight=M('#b5b8a8',.96,0),stoneDark=M('#5e6863',.94,0),rock=M('#5c6c70',.97,0),rockShade=M('#485b62',.98,0),cedar=M('#b17e52',.92,0),cedarLight=M('#d2aa72',.96,0),cedarDark=M('#70513b',.94,0),slate=M('#3e5358',.86,.04),brass=M('#b59b72',.6,.2),cloth=M('#ece4d0',1,0),green=M('#335b50',1,0),greenLight=M('#4d7262',1,0);
 const water=new T.MeshPhysicalMaterial({color:'#8db6a7',emissive:'#a1793d',emissiveIntensity:.08,roughness:.22,metalness:.08,transparent:true,opacity:.78,clearcoat:.62,depthWrite:false});
 const lamp=new T.MeshStandardMaterial({color:'#ffe4b2',emissive:'#ffc177',emissiveIntensity:.62,roughness:.72});
 let seed=913;const rand=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
 const cube=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,12,8);
 function mesh(geo,mat,x=0,y=0,z=0,parent=root){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=!mat.transparent;m.receiveShadow=true;parent.add(m);return m;}
 function box(w,h,d,mat,x,y,z,parent=root){const m=mesh(cube,mat,x,y,z,parent);m.scale.set(w,h,d);return m;}
 function oval(mat,x,y,z,sx,sy,sz,parent=root){const m=mesh(sphere,mat,x,y,z,parent);m.scale.set(sx,sy,sz);return m;}
 // Weathered, asymmetric basalt replaces the evenly rounded bead-like edging.
 const basalt=new T.IcosahedronGeometry(1,2),bp=basalt.attributes.position;
 for(let i=0;i<bp.count;i++){const x=bp.getX(i),y=bp.getY(i),z=bp.getZ(i),f=1+.07*Math.sin(x*7+y*5-z*3)+.04*Math.sin(z*11-y*7);bp.setXYZ(i,x*f,y*f,z*f);}
 basalt.computeVertexNormals();
 function boulder(mat,x,y,z,sx,sy,sz){const b=mesh(basalt,mat,x,y,z);b.scale.set(sx,sy,sz);return b;}
 function rod(a,b,r,mat,parent=root){const v=new T.Vector3(...a),end=new T.Vector3(...b),d=end.clone().sub(v),m=mesh(new T.CylinderGeometry(r,r,d.length(),6),mat,0,0,0,parent);m.position.copy(v.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
 function curve(points,r,mat){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(24,Math.min(96,points.length)),r,6,false),mat);}
 function target(action,x,y,z,w,h,d){const m=mesh(new T.BoxGeometry(w,h,d),hitMaterial,x,y,z);m.userData={winter:true,action};interactive.push(m);moving.add(m);}
 function outline(cx,cz,rx,rz,n=64,irregular=.025){return Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2,f=1+Math.sin(a*3+.6)*irregular+Math.sin(a*5-.3)*irregular*.5;return new T.Vector2(cx+Math.cos(a)*rx*f,-cz-Math.sin(a)*rz*f);});}
 function shape(points){const s=new T.Shape();s.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))s.lineTo(p.x,p.y);s.closePath();return s;}
 const pools=[{x:-10,z:124,rx:7.4,rz:6.4},{x:-19,z:132,rx:3.7,rz:3}];
 const ground=shape(outline(spa.x,spa.z,spa.r,spa.r,128,.012));
 for(const p of pools)ground.holes.push(new T.Path(outline(p.x,p.z,p.rx,p.rz,64).reverse()));
 const groundGeo=new T.ShapeGeometry(ground,1);groundGeo.rotateX(-Math.PI/2);mesh(groundGeo,snow,0,.09,0);
 const paving=createSnowPaths({root,stone:[M('#b9b4a5',1,0),M('#b0aea1',1,0),M('#c2bdaf',1,0)],snow});
 // Compacted snow branches share one softly blended field through the junction.
 paving([[0,88],[0,96],[-.8,104],[0,110]],3.8);
 paving([[0,108],[-4,111],[-10,114],[-17.8,119],[-18,124]],3.2);
 paving([[-.4,108],[5,111.8],[10,114],[12,117]],3.4);
 paving([[-.8,110],[-1.15,116],[-1.25,121.5],[0,121.5]],2.8);
 function lantern(x,z,h=1.2){
  (root.userData.lampGlow||=[]).push({x,z,y:h+.2,radius:1.7,floor:.17});
  mesh(new T.CylinderGeometry(.25,.32,.18,12),stoneDark,x,.18,z);box(.13,h,.13,cedarDark,x,h/2+.2,z);
  const shade=[new T.Vector2(.16,0),new T.Vector2(.24,.1),new T.Vector2(.245,.34),new T.Vector2(.17,.5)];mesh(new T.LatheGeometry(shade,16),lamp,x,h-.03,z);
  for(let j=0;j<8;j++){const a=j*Math.PI/4;rod([x+Math.cos(a)*.25,h-.04,z+Math.sin(a)*.25],[x+Math.cos(a)*.25,h+.47,z+Math.sin(a)*.25],.018,cedarDark);}
  for(let j=0;j<8;j++){const a=j*Math.PI/4,b=(j+1)*Math.PI/4;for(const flip of [-1,1])rod([x+Math.cos(a)*.25,h+.23-flip*.085,z+Math.sin(a)*.25],[x+Math.cos(b)*.25,h+.23+flip*.085,z+Math.sin(b)*.25],.008,brass);}
  for(const y of [h+.02,h+.23,h+.46]){const ring=mesh(new T.TorusGeometry(.252,.017,5,24),brass,x,y,z);ring.rotation.x=Math.PI/2;}
  const cap=[new T.Vector2(.035,.2),new T.Vector2(.15,.16),new T.Vector2(.25,.06),new T.Vector2(.37,0)];mesh(new T.LatheGeometry(cap,16),cedarDark,x,h+.5,z);mesh(new T.LatheGeometry(cap.map(v=>new T.Vector2(v.x*.94,v.y+.045)),16),snow,x,h+.5,z);oval(brass,x,h+.75,z,.05,.07,.05);
  const foot=mesh(new T.TorusGeometry(.18,.018,6,24),brass,x,.29,z);foot.rotation.x=Math.PI/2;
 }
 for(const [x,z]of [[-2.6,96],[2.6,104],[-8,111],[-19.6,120],[8.6,112],[15.4,115],[-21.8,136],[1,136]])lantern(x,z,.9);
 // Stone terraces surround the water; pool shells stay below the deck.
 for(let poolIndex=0;poolIndex<pools.length;poolIndex++){
  const p=pools[poolIndex],ring=shape(outline(p.x,p.z,p.rx+1.35,p.rz+1.35,80,.045));ring.holes.push(new T.Path(outline(p.x,p.z,p.rx,p.rz,64).reverse()));const g=new T.ShapeGeometry(ring,1);g.rotateX(-Math.PI/2);mesh(g,stoneLight,0,.145,0);
  const basin=shape(outline(p.x,p.z,p.rx*.99,p.rz*.99,64)),bg=new T.ShapeGeometry(basin,1);bg.rotateX(-Math.PI/2);mesh(bg,stoneDark,0,-1.05,0);
  const wg=bg.clone(),surface=mesh(wg,water,0,.025,0);surface.name='recessed-hot-spring';moving.add(surface);
  const wall=[],wallIdx=[];const edge=outline(p.x,p.z,p.rx,p.rz,64);for(let i=0;i<=64;i++){const e=edge[i%64];wall.push(e.x,.15,-e.y,e.x,-1.06,-e.y);if(i<64){const k=i*2;wallIdx.push(k,k+1,k+2,k+2,k+1,k+3);}}const wallGeo=new T.BufferGeometry();wallGeo.setAttribute('position',new T.Float32BufferAttribute(wall,3));wallGeo.setIndex(wallIdx);wallGeo.computeVertexNormals();mesh(wallGeo,stoneDark);
  const stones=poolIndex?30:52;for(let i=0;i<stones;i++){const a=i/stones*Math.PI*2,f=1+Math.sin(a*3+.6)*.025+Math.sin(a*5-.3)*.0125,x=p.x+Math.cos(a)*p.rx*f,z=p.z+Math.sin(a)*p.rz*f,sz=.44+rand()*.28,b=boulder(i%4?stone:rockShade,x,.20,z,sz,.20+rand()*.16,sz*(.65+rand()*.3));b.rotation.y=-a;if(i%3===0){const vein=[];for(const t of [-.62,-.3,0,.3,.62]){const xx=t*sz,zz=Math.sin(t*4)*sz*.065,yy=.25+b.scale.y*Math.sqrt(Math.max(0,1-t*t-(zz/(sz*.8))**2))+.004;vein.push([x+Math.cos(a)*xx-Math.sin(a)*zz,yy,z+Math.sin(a)*xx+Math.cos(a)*zz]);}curve(vein,.0035,stoneLight);}if(i%4===0&&z>p.z+1)oval(snow,x,.46,z,sz*.8,.065,sz*.6);}
 }
 // Two low ledges make the large bath readable from the footpath.
 for(const [x,z,w,d]of [[-17.8,124,1.15,4],[-8,116.3,4,1],[-23.8,132,1,2.7]]){box(w,.22,d,cedarDark,x,.24,z);for(let i=0;i<Math.max(3,Math.round(w/.17));i++)box(.13,.07,d,cedarLight,x-w/2+.1+i*.17,.39,z);}
 // Rinse station and a small stone cascade into the rear soaking pool.
 for(let i=0;i<10;i++){const a=i*2.4,x=-17.7+Math.cos(a)*(1.5+rand()),z=136+Math.sin(a)*1.2,h=.8+rand()*2.1;const b=boulder(i%3?rock:rockShade,x,h*.4,z,1.15+rand()*.5,h,1.05+rand()*.4);b.rotation.y=a;oval(snow,x,h*1.35,z,.85,.14,.7);}
 const fallUniforms={time:{value:0}},fallMat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:fallUniforms,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float time;void main(){float flow=.5+.5*sin(vUv.x*110.-time*4.5);gl_FragColor=vec4(.74,.88,.82,.28+flow*.2);}'});
 for(let i=0;i<3;i++){const curve=new T.CatmullRomCurve3([new T.Vector3(-18.7+i*.18,2.8,135.1),new T.Vector3(-18.7+i*.18,2.1,134.7),new T.Vector3(-18.9+i*.17,.08,134)]);const fall=mesh(new T.TubeGeometry(curve,20,.045,5,false),fallMat);moving.add(fall);}
 for(const [x,z]of [[-3.4,116.8],[-1.8,117.4]]){box(.85,.14,.75,cedarDark,x,.21,z);box(.6,.5,.08,stoneDark,x,.47,z+.3);rod([x,.4,z+.28],[x,.82,z+.28],.035,brass);rod([x,.82,z+.28],[x,.82,z+.04],.035,brass);cedarBucket(x,.28,z-.1,.23);}
 // The 24 × 22 m lounge has two open entrances and a roof confined to its rear eaves.
 box(spaPavilion.w+.4,.3,spaPavilion.d+.4,stoneDark,spaPavilion.x,.14,spaPavilion.z);box(spaPavilion.w,.08,spaPavilion.d,cedar,spaPavilion.x,.3,spaPavilion.z);
 for(let i=0;i<80;i++)box(.017,.012,21.9,cedarDark,.1+i*.3,.347,126);
 function threshold(a,b,width,side){const positions=side?[a[0],a[1],a[2]-width/2,a[0],a[1],a[2]+width/2,b[0],b[1],b[2]-width/2,b[0],b[1],b[2]+width/2]:[a[0]-width/2,a[1],a[2],a[0]+width/2,a[1],a[2],b[0]-width/2,b[1],b[2],b[0]+width/2,b[1],b[2]];const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,0,1,1,1],2));geometry.setIndex(side?[0,1,2,1,3,2]:[0,2,1,1,2,3]);geometry.computeVertexNormals();mesh(geometry,cedarLight);}
 threshold([12,.09,114.2],[12,.34,115],4.4,false);threshold([-.8,.09,121.5],[0,.34,121.5],4.6,true);
 // Front doors are open, with an uninterrupted 4.4 m entry passage.
 for(const [x,w]of [[4.9,9.8],[19.1,9.8]]){box(w,.62,.18,cedar,x,.65,115);for(let i=0;i<Math.floor(w/.38);i++)box(.045,2.7,.08,cedarDark,x-w/2+.15+i*.38,2.3,115);}
 const glass=new T.MeshPhysicalMaterial({color:'#d0d9c6',transparent:true,opacity:.16,roughness:.3,metalness:0,side:T.DoubleSide,depthWrite:false});
 for(const [x,z,d]of [[0,117.1,4.2],[0,130.4,13.2],[24,126,22]]){box(.2,.8,d,cedar,x,.74,z);const gl=box(.025,2.9,d-.12,glass,x,2.6,z);moving.add(gl);for(let zz=z-d/2;zz<=z+d/2+.01;zz+=2)box(.22,4.3,.22,cedarDark,x,2.5,zz);box(.3,.24,d+.1,cedarDark,x,4.65,z);}
 box(.28,4.3,.28,cedarDark,0,2.5,119.2);box(.28,4.3,.28,cedarDark,0,2.5,123.8);box(.3,.24,4.6,cedarDark,0,4.65,121.5);
 box(24,4.25,.22,cedar,12,2.45,137);for(let x=.3;x<24;x+=.3)box(.035,4.1,.04,cedarLight,x,2.45,136.86);
 // Deep high windows in the rear wall keep the enclosed part warm and spacious.
 for(const x of [4,9.3,14.7,20]){box(3.4,1.45,.08,lamp,x,3.3,136.72);for(const side of [-1,0,1])box(.065,1.5,.12,cedarDark,x+side*1.12,3.3,136.64);for(const y of [2.58,3.3,4.02])box(3.5,.065,.12,cedarDark,x,y,136.62);}
 for(const z of [115,129,137]){for(const x of [0,24])box(.28,4.6,.28,cedarDark,x,2.64,z);rod([-.35,4.85,z],[12,6.8,z],.13,cedarDark);rod([12,6.8,z],[24.35,4.85,z],.13,cedarDark);box(24.7,.22,.22,cedarDark,12,4.75,z);rod([8,4.82,z],[12,6.65,z],.085,cedarLight);rod([16,4.82,z],[12,6.65,z],.085,cedarLight);}
 box(.25,.25,22.8,cedarDark,12,6.8,126);
 function roofPanel(side){const w=12.65,d=6.6,m=box(w,.21,d,slate,12+side*6.15,5.82,134.2);m.rotation.z=-side*.158;const cap=box(w,.1,d,snow,12+side*6.15,5.97,134.2);cap.rotation.z=-side*.158;for(let x=.6;x<12.2;x+=.75){const beam=box(.07,.07,d+.1,cedarDark,12+side*x,6.77-x*.16,134.2);beam.rotation.z=-side*.158;}}
 roofPanel(-1);roofPanel(1);
 // Recessed grain and joinery are attached to the existing timber faces, never to the walkways.
 for(const x of [0,24])for(const z of [115,129,137]){
  box(.28,.07,.28,cedarLight,x,.48,z);box(.28,.075,.28,cedarLight,x,4.42,z);
  for(const y of [1.15,3.8])oval(brass,x+(x<12?.145:-.145),y,z,.012,.025,.025);
  for(const offset of [-.055,.035])curve([[x+offset,.58,z-.145],[x+offset+.008,1.5,z-.146],[x+offset-.006,2.8,z-.145],[x+offset+.006,4.3,z-.146]],.0035,cedarLight);
 }
 for(let i=0;i<31;i++){const x=.55+i*.74;for(const side of [-1,1])curve([[x+side*.055,.48,136.884],[x+side*.06,.95,136.882],[x+side*.035,1.5,136.882],[x+side*.055,2.25,136.884]],.0035,cedarDark);if(i%4===1){const knot=mesh(new T.TorusGeometry(.035,.004,5,20),cedarDark,x,1.32,136.879);knot.scale.set(.65,1.55,1);}}
 // Long benches, lower step benches, individual pads and towel stacks.
 for(const [x,z,d]of [[7.5,125,10],[17,127,6]]){box(2.2,.55,d,cedarDark,x,.62,z);for(let i=0;i<11;i++)box(.16,.08,d,cedarLight,x-1+i*.2,.94,z);box(2.3,.22,d,cedar,x+(x<12?1.5:-1.5),.45,z);for(let i=0;i<Math.floor(d/2);i++){const zz=z-d/2+1+i*2;box(1.1,.09,.8,cloth,x,1.025,zz);const towel=box(.7,.08,.5,cloth,x+.1,1.11,zz+.12);towel.rotation.y=.07;}}
 const stove=mesh(new T.CylinderGeometry(1.1,1.2,.8,16),slate,12,.75,130);for(let i=0;i<18;i++){const a=i*2.4,r=Math.sqrt(i/18)*.9;oval(i%2?stone:stoneDark,12+Math.cos(a)*r,1.23+rand()*.18,130+Math.sin(a)*r,.3,.19,.25);}for(let i=0;i<18;i++){const a=i/18*Math.PI*2;box(.055,.9,.055,cedarDark,12+Math.cos(a)*1.42,.85,130+Math.sin(a)*1.42);}for(const y of [.47,1.27]){const rail=mesh(new T.TorusGeometry(1.42,.036,7,64),cedarLight,12,y,130);rail.rotation.x=Math.PI/2;}stove.name='sauna-heater';
 // Tea lounge on the open front side and a little shoe alcove.
 box(3.4,.16,1.5,cedarDark,16.5,.76,120);for(const x of [15.15,17.85])for(const z of [119.5,120.5])box(.13,.6,.13,cedarDark,x,.43,z);
 const tea=M('#9f6738',.3,.1);
 for(const x of [15.4,16.2,17,17.8]){const profile=[[.074,0],[.096,.015],[.112,.17],[.102,.18],[.09,.17],[.076,.035],[0,.035],[0,0]].map(([r,y])=>new T.Vector2(r,y));mesh(new T.LatheGeometry(profile,24),cloth,x,.87,120);const drink=mesh(new T.CircleGeometry(.087,24),tea,x,1.014,120);drink.rotation.x=-Math.PI/2;mesh(new T.CylinderGeometry(.16,.16,.025,20),brass,x,.86,120);const foot=mesh(new T.TorusGeometry(.139,.008,5,24),cedarLight,x,.881,120);foot.rotation.x=Math.PI/2;}
 const teapot=oval(slate,16.6,1.02,120.25,.25,.24,.22);curve([[16.8,1.02,120.25],[16.94,1.09,120.25],[16.99,1.2,120.25],[17.06,1.22,120.25]],.042,slate);mesh(new T.TorusGeometry(.2,.035,8,28),cedarDark,16.4,1.1,120.25).rotation.y=Math.PI/2;oval(slate,16.6,1.25,120.25,.16,.034,.15);oval(brass,16.6,1.292,120.25,.035,.035,.035);const lidRing=mesh(new T.TorusGeometry(.158,.009,5,28),brass,16.6,1.251,120.25);lidRing.rotation.x=Math.PI/2;teapot.name='tea-service';
 box(.58,.024,.38,cedarLight,17.65,.862,120.4);for(const [x,z]of [[17.5,120.35],[17.73,120.46]]){oval(stoneLight,x,.899,z,.087,.025,.065);curve([[x-.04,.916,z],[x,.919,z+.008],[x+.04,.916,z]],.005,tea);}
 for(const x of [15.2,17.6])for(const z of [118.8,121.3]){box(.9,.1,.7,cedarLight,x,.43,z);box(.08,.3,.55,cedarDark,x-.34,.25,z);box(.08,.3,.55,cedarDark,x+.34,.25,z);}
 for(let level=0;level<3;level++){box(2.8,.09,.6,cedarDark,5.2,.55+level*.43,118.5);for(let i=0;i<5;i++)box(.09,.43,.6,cedar,3.8+i*.7,.76+level*.43,118.5);for(let i=0;i<4;i++)for(const side of [-1,1])oval(cedarLight,4.16+i*.7+side*.12,.66+level*.43,118.4,.09,.04,.2);}
 function hangingLantern(x,y,z){
  rod([x,4.65,z],[x,y+.48,z],.016,brass);mesh(new T.LatheGeometry([new T.Vector2(.2,-.32),new T.Vector2(.3,-.24),new T.Vector2(.3,.23),new T.Vector2(.21,.31)],8),lamp,x,y,z);
  for(const level of [-.29,.29]){const rim=mesh(new T.TorusGeometry(.3,.023,6,8),cedarDark,x,y+level,z);rim.rotation.x=Math.PI/2;}
  for(let j=0;j<8;j++){const a=j*Math.PI/4,b=(j+1)*Math.PI/4,ax=x+Math.cos(a)*.3,az=z+Math.sin(a)*.3,bx=x+Math.cos(b)*.3,bz=z+Math.sin(b)*.3;rod([ax,y-.29,az],[ax,y+.29,az],.023,cedarDark);for(const flip of [-1,1])rod([ax,y-flip*.08,az],[bx,y+flip*.08,bz],.008,brass);}
  const cap=[new T.Vector2(.04,.17),new T.Vector2(.13,.14),new T.Vector2(.26,.05),new T.Vector2(.4,0)];mesh(new T.LatheGeometry(cap,24),cedarDark,x,y+.32,z);const crown=mesh(new T.TorusGeometry(.19,.012,6,28),brass,x,y+.415,z);crown.rotation.x=Math.PI/2;
  mesh(new T.CylinderGeometry(.21,.13,.085,8),cedarDark,x,y-.36,z);oval(brass,x,y-.43,z,.034,.05,.034);
 }
 for(const x of [9.2,14.8])hangingLantern(x,3.45,121.4);
 // Snow garden surrounds the destination, leaving all arrival routes and pool edges open.
 const branchPositions=[],branchUvs=[],branchIndices=[];
 for(let i=0;i<=12;i++){const t=i/12,w=Math.pow(Math.sin(t*Math.PI),.7)*.23*(1-t*.5)*(i%2?.82:1);for(const side of [-1,0,1]){branchPositions.push(t,.05*Math.sin(t*Math.PI)-t*t*.1+(side===0?.05:0),w*side);branchUvs.push(t,(side+1)/2);}if(i<12){const n=i*3;branchIndices.push(n,n+1,n+3,n+1,n+4,n+3,n+1,n+2,n+4,n+2,n+5,n+4);}}
 const boughGeo=new T.BufferGeometry();boughGeo.setAttribute('position',new T.Float32BufferAttribute(branchPositions,3));boughGeo.setAttribute('uv',new T.Float32BufferAttribute(branchUvs,2));boughGeo.setIndex(branchIndices);boughGeo.computeVertexNormals();green.side=greenLight.side=T.DoubleSide;
 function pine(x,z,h){mesh(new T.CylinderGeometry(.07,.16,h*.8,8),cedarDark,x,h*.4,z);for(let tier=0;tier<7;tier++){const y=h*(.22+tier*.105),r=h*(.28-tier*.032);for(let j=0;j<7;j++){const a=j*Math.PI*2/7+tier*2.399,reach=r*(.9+.1*Math.sin(j*3+tier));const b=mesh(boughGeo,tier%2?green:greenLight,x,y,z);b.rotation.y=-a;b.scale.set(reach,reach,reach);rod([x,y-.025,z],[x+Math.cos(a)*reach*.85,y-.025-reach*.045,z+Math.sin(a)*reach*.85],.016,cedarDark);const cap=mesh(boughGeo,snow,x,y+.045,z);cap.rotation.y=-a;cap.scale.set(reach*.9,reach*.83,reach*.61);}}}

 for(const [x,z,h]of [[-24,113,5.5],[-26,119,6.3],[-26,126,5.2],[-24,137,6],[-15,141,7],[-7,143,6.5],[1,144,7.2],[9,142,6.6],[17,139,6],[26,132,7],[27,124,6.5],[25,114,6],[-11,100,4.6],[10,99,5.5],[-18,104,5.8],[19,106,5]])pine(x,z,h);
 for(const [x,z,rx,rz]of [[-8,105,2.8,1.9],[8,105,2.5,1.8],[-21,111,2.8,1.5],[23,112,2.2,1.5]]){for(let i=0;i<5;i++){const a=i*2.4,r=Math.sqrt(rand()),b=boulder(rockShade,x+Math.cos(a)*rx*r,.33,z+Math.sin(a)*rz*r,.6+rand()*.7,.45+rand()*.4,.5+rand()*.7);b.rotation.y=a;oval(snow,b.position.x,b.position.y+.4,b.position.z,b.scale.x*.85,.12,b.scale.z*.8);}}

 for(const [cx,cz]of [[-8,105],[8,105],[-21,111],[23,112]]){
  for(let j=0;j<7;j++){const a=j*2.399,r=.42+rand()*.48,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r,h=.24+rand()*.25;
   rod([x,.1,z],[x+Math.cos(a)*.17,h+.18,z+Math.sin(a)*.17],.015,cedarDark);
   for(let k=0;k<3;k++){const branch=mesh(boughGeo,k%2?green:greenLight,x,.16+k*.09,z);branch.rotation.set(.1,a+k*2.4,.08);branch.scale.set(.45-k*.08,.35,.35);}
   oval(snow,x,.22+h*.4,z,.24,.08,.19);
  }
 }
 // Reed-edged tatami tiles occupy the quiet front room, flush with the existing floor.
 const straw=M('#a5a47b',1,0),noren=M('#284f55',.95,0);noren.side=T.DoubleSide;
 for(let row=0;row<3;row++)for(let col=0;col<3;col++){const x=15.1+col*1.45,z=118.5+row*1.9;box(1.4,.018,1.85,straw,x,.35,z);for(const side of [-1,1])box(.045,.021,1.85,cedarDark,x+side*.675,.352,z);for(let k=0;k<12;k++)box(1.28,.003,.012,cedarLight,x,.361,z-.82+k*.145);}
 // A split noren is above head height, leaving the entry genuinely open.
 for(let j=0;j<4;j++){const x=10.5+j;const p=[],uv=[],idx=[];for(let row=0;row<=10;row++)for(let col=0;col<=8;col++){const u=col/8,v=row/10;p.push(x+(u-.5)*.94,4.3-v*1.05,114.84+Math.sin(u*Math.PI*5)*.035+v*v*.035);uv.push(u,v);if(row<10&&col<8){const n=row*9+col;idx.push(n,n+1,n+9,n+1,n+10,n+9);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();mesh(g,noren).name='ryokan-split-noren';for(const dy of [0,.33,.66])curve([[x-.38,4.25-dy,114.802],[x,4.25-dy,114.806],[x+.38,4.25-dy,114.802]],.004,cedarLight);}
 for(const x of [10.5,13.5]){const crest=mesh(new T.TorusGeometry(.18,.014,6,28),cloth,x,3.78,114.785);for(const dx of [-.075,0,.075])curve([[x+dx,3.68,114.77],[x+dx-.018,3.77,114.77],[x+dx+.018,3.86,114.77]],.008,cloth);}
 // Segmented bamboo, narrow leaves and stone lanterns frame the garden's back edge.
 for(const [cx,cz]of [[-24.7,130.5],[-8.5,138.8],[25.6,128.5]])for(let j=0;j<4;j++){const x=cx+Math.sin(j*2.4)*.38,z=cz+Math.cos(j*2.4)*.34,h=2.1+(j%3)*.45;mesh(new T.CylinderGeometry(.045,.065,h,8),green,x,h*.5+.25,z);for(let y=.65;y<h+.15;y+=.42){const node=mesh(new T.TorusGeometry(.058,.009,4,12),cedarLight,x,y,z);node.rotation.x=Math.PI/2;}for(let k=0;k<4;k++){const a=k*2.4+j,y=1.4+k*.23;rod([x,y,z],[x+Math.cos(a)*.55,y+.2,z+Math.sin(a)*.55],.012,green);for(const side of [-1,1]){const leaf=mesh(boughGeo,greenLight,x+Math.cos(a)*.26,y+.14,z+Math.sin(a)*.26);leaf.rotation.set(.15,-a+side*.5,0);leaf.scale.set(.5,.2,.27);}}}
 for(const [x,z]of [[-21.8,138.6],[-4.2,136.8]]){mesh(new T.CylinderGeometry(.31,.42,.14,6),stoneDark,x,.2,z);mesh(new T.CylinderGeometry(.13,.22,.78,6),stoneLight,x,.64,z);box(.62,.12,.62,stoneDark,x,1.05,z);box(.39,.45,.39,lamp,x,1.32,z);for(const dx of [-.23,.23])for(const dz of [-.23,.23])box(.09,.52,.09,stoneDark,x+dx,1.31,z+dz);const roof=mesh(new T.ConeGeometry(.61,.32,4),stoneDark,x,1.74,z);roof.rotation.y=Math.PI/4;const cap=mesh(new T.ConeGeometry(.54,.27,4),snow,x,1.8,z);cap.rotation.y=Math.PI/4;oval(stoneLight,x,1.99,z,.1,.12,.1);}
 // A few local pools of amber light make warmth belong to the rooms and water.
 for(const [x,y,z,power,range] of [[-15,3.2,119,55,20],[8,3.3,124,70,16],[17,3.3,127,65,15]]){const light=new T.PointLight('#ffc484',power,range,2);light.position.set(x,y,z);root.add(light);}
 function paperLamp(x,y,z,r=.48){const shade=oval(lamp,x,y,z,r,r*.78,r);shade.castShadow=false;for(let j=-2;j<=2;j++){const yy=j*r*.24,rr=r*Math.sqrt(Math.max(.1,1-(yy/(r*.78))**2));const hoop=mesh(new T.TorusGeometry(rr,.012,5,24),cedarDark,x,y+yy,z);hoop.rotation.x=Math.PI/2;}rod([x,y+r*.8,z],[x,y+r*1.7,z],.018,brass);}
 for(const [x,z] of [[5,121],[8,127],[16,123],[19,129]])paperLamp(x,3.5,z);
 // Folded linen and padded cedar loungers invite a different posture from the bath.
 const cushion=M('#d8ad88',1,0);
 for(const z of [124.9,127.9]){
  oval(cushion,17,1.12,z,1,.17,1.25);oval(cloth,17,1.28,z+1,.8,.19,.3);
  const piping=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;piping.push([17+Math.cos(a)*.93,1.182,z+Math.sin(a)*1.16]);}curve(piping,.013,cloth);
  for(const offset of [-.42,.42]){const seam=[];for(let i=0;i<=24;i++){const along=-.82+i/24*1.64,y=1.12+.17*Math.sqrt(Math.max(0,1-offset*offset-(along/1.25)**2));seam.push([17+offset,y+.004,z+along]);}curve(seam,.005,cloth);for(const dz of [-.42,.42])oval(cloth,17+offset,1.12+.17*Math.sqrt(1-offset*offset-(dz/1.25)**2)+.005,z+dz,.027,.006,.027);}
  for(const side of [-1,1]){const seam=[];for(let i=0;i<=24;i++){const x=-.6+i*.05,y=1.28+.19*Math.sqrt(Math.max(0,1-(x/.8)**2-(.16/.3)**2));seam.push([17+x,y+.003,z+1+side*.16]);}curve(seam,.006,cedarLight);}
 }
 function linenBasket(x,z){
  const profile=[[.35,0],[.39,.035],[.48,.55],[.445,.55],[.355,.055],[0,.055],[0,0]].map(([r,y])=>new T.Vector2(r,y));mesh(new T.LatheGeometry(profile,28),cedarLight,x,.235,z);
  for(let i=0;i<9;i++){const yy=.27+i*.062,r=.39+i*.01;const hoop=mesh(new T.TorusGeometry(r,.012,5,32),cedarDark,x,yy,z);hoop.rotation.x=Math.PI/2;}
  for(let i=0;i<22;i++){const a=i/22*Math.PI*2,points=[];for(let j=0;j<=10;j++){const t=j/10,r=.39+t*.09,wave=Math.sin(t*Math.PI*9)*.007;points.push([x+Math.cos(a+wave)*r,.27+t*.5,z+Math.sin(a+wave)*r]);}curve(points,.011,cedar);}
  const rim=mesh(new T.TorusGeometry(.462,.026,7,40),cedarDark,x,.785,z);rim.rotation.x=Math.PI/2;
  for(let i=0;i<3;i++){const xx=x-.24+i*.24,roll=mesh(new T.CylinderGeometry(.13,.13,.6,20),cloth,xx,.87,z);roll.rotation.x=Math.PI/2;const spiral=[];for(let j=0;j<=48;j++){const t=j/48,a=t*Math.PI*4,r=.015+t*.092;spiral.push([xx+Math.cos(a)*r,.87+Math.sin(a)*r,z+.303]);}curve(spiral,.004,cedarLight);}
 }
 for(const [x,z] of [[6,120],[19,131],[-16,116]])linenBasket(x,z);
 // The added west lounge leaves a broad aisle between the sofa and the existing sauna benches.
 const lounge=spaActivities.lounge;
 box(1.7,.34,4.8,cedarDark,lounge.x,.53,lounge.z);box(.17,.88,4.75,cedar,lounge.x-.75,1.07,lounge.z);
 for(const dz of [-1.75,-.6,.6,1.75]){oval(cushion,lounge.x+.03,.8,lounge.z+dz,.72,.12,.55);oval(cloth,lounge.x-.59,1.13,lounge.z+dz,.13,.3,.48);}
 for(const side of [-1,1])box(1.7,.42,.16,cedarLight,lounge.x,.92,lounge.z+side*2.31);
 for(const side of [-1,1])curve([[lounge.x-.65,.88,lounge.z+side*2.31],[lounge.x,.96,lounge.z+side*2.31],[lounge.x+.65,.88,lounge.z+side*2.31]],.035,cloth);
 // A shallow raised cedar basin keeps the feet in water while the upper body stays above its rim.
 const footbath=spaActivities.footbath,footRing=shape(outline(footbath.x,footbath.z,2.15,1.75,64,0));footRing.holes.push(new T.Path(outline(footbath.x,footbath.z,1.93,1.53,64,0).reverse()));
 const footWall=new T.ExtrudeGeometry(footRing,{depth:.45,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:2,curveSegments:12});footWall.rotateX(-Math.PI/2);mesh(footWall,cedarLight,0,.34,0);
 const bottom=mesh(new T.CircleGeometry(1,64),stoneLight,footbath.x,.36,footbath.z);bottom.rotation.x=-Math.PI/2;bottom.scale.set(1.92,1.52,1);
 const footWater=mesh(new T.CircleGeometry(1,64),water,footbath.x,.655,footbath.z);footWater.rotation.x=-Math.PI/2;footWater.scale.set(1.91,1.51,1);moving.add(footWater);
 for(let i=0;i<40;i++){const a=i/40*Math.PI*2,x=footbath.x+Math.cos(a)*2.15,z=footbath.z+Math.sin(a)*1.75;rod([x,.39,z],[x,.765,z],.008,cedarDark);}
 for(const y of [.43,.72]){const hoop=mesh(new T.TorusGeometry(1,.007,6,64),brass,footbath.x,y,footbath.z);hoop.rotation.x=-Math.PI/2;hoop.scale.set(2.15,1.75,1);}
 // A little timber landing and broad submerged treads lead into the main bath.
 for(let i=0;i<4;i++)box(2.5,.18,.65,stoneLight,-10,.10-i*.27,117.6+i*.55);
 for(const side of [-1,1])rod([-10+side*1.35,.65,117.3],[-10+side*1.35,-.1,119.5],.045,brass);
 // Low privacy screens frame the garden without closing the approach.
 for(const [cx,cz,n] of [[-22,122,5],[-8,133,8]])for(let i=0;i<n;i++){box(.12,1.9,.13,cedarDark,cx+i*.34,1.05,cz);if(i===0||i===n-1)oval(snow,cx+i*.34,2.04,cz,.14,.07,.15);}
 // Hollow wooden bathing tools, rather than capped cylinders, sit on existing ledges.
 function cedarBucket(x,y,z,r=.3){
  const h=r*1.25,profile=[new T.Vector2(r*.76,0),new T.Vector2(r,.055),new T.Vector2(r,h),new T.Vector2(r*.87,h),new T.Vector2(r*.75,.065),new T.Vector2(0,.065),new T.Vector2(0,0)];mesh(new T.LatheGeometry(profile,20),cedarLight,x,y,z);
  for(let j=0;j<16;j++){const a=j*Math.PI/8;rod([x+Math.cos(a)*r*.82,y+.035,z+Math.sin(a)*r*.82],[x+Math.cos(a)*r*.995,y+h-.015,z+Math.sin(a)*r*.995],.006,cedarDark);}
  for(const yy of [.08,h-.055]){const ring=mesh(new T.TorusGeometry(r*(.82+yy/h*.18),.015,5,28),brass,x,y+yy,z);ring.rotation.x=Math.PI/2;}
  const handle=new T.CatmullRomCurve3([new T.Vector3(x-r*.9,y+h*.78,z),new T.Vector3(x-r*.75,y+h+.28,z),new T.Vector3(x+r*.75,y+h+.28,z),new T.Vector3(x+r*.9,y+h*.78,z)]);mesh(new T.TubeGeometry(handle,20,.018,6,false),cedarDark);
  const waterDisk=mesh(new T.CircleGeometry(r*.82,24),water,x,y+h*.7,z);waterDisk.rotation.x=-Math.PI/2;moving.add(waterDisk);
  const scoopProfile=[new T.Vector2(0,0),new T.Vector2(r*.3,.01),new T.Vector2(r*.47,.075),new T.Vector2(r*.46,.12),new T.Vector2(r*.37,.115),new T.Vector2(r*.24,.045),new T.Vector2(0,.035)];mesh(new T.LatheGeometry(scoopProfile,16),cedarLight,x+r*.15,y+h+.015,z-r*.08);rod([x+r*.15,y+h+.1,z-r*.08],[x+r*.15,y+h+.14,z+r*1.8],.018,cedarDark);
 }
 for(const [x,y,z,r]of [[-7.1,.43,116.25,.3],[-18.1,.43,124.8,.27],[-23.7,.39,132,.28],[14.15,.35,131.3,.33]])cedarBucket(x,y,z,r);
 function foldedTowel(x,y,z,w=.7,d=.48){
  const shape=new T.Shape(),hh=.075;shape.moveTo(-w/2+.035,-hh/2);shape.lineTo(w/2-.035,-hh/2);shape.quadraticCurveTo(w/2,0,w/2-.035,hh/2);shape.lineTo(-w/2+.035,hh/2);shape.quadraticCurveTo(-w/2,0,-w/2+.035,-hh/2);shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSize:.012,bevelThickness:.015,bevelSegments:2,curveSegments:4});geo.translate(0,0,-d/2);
  for(let j=0;j<3;j++){mesh(geo,cloth,x+j*.015,y+j*.075,z);for(const side of [-1,1])box(w*.92,.012,.023,cedarLight,x+j*.015,y+j*.075+.044,z+side*(d/2-.045));}
 }
 for(const [x,y,z]of [[-8.1,.48,116.35],[-17.7,.48,122.9],[5.5,.39,119.8],[19.5,.39,131.5]])foldedTowel(x,y,z);
 // A carved rinse basin and a cedar wash shelf share the garden's materials.
 const basinProfile=[new T.Vector2(.28,0),new T.Vector2(.44,.1),new T.Vector2(.47,.35),new T.Vector2(.38,.36),new T.Vector2(.31,.18),new T.Vector2(0,.14),new T.Vector2(0,0)];oval(stoneDark,-.9,.29,114.4,.6,.2,.52);mesh(new T.LatheGeometry(basinProfile,28),stoneLight,-.9,.44,114.4);const basinWater=mesh(new T.CircleGeometry(.34,28),water,-.9,.68,114.4);basinWater.rotation.x=-Math.PI/2;moving.add(basinWater);const spout=new T.CatmullRomCurve3([new T.Vector3(-.9,.45,114),new T.Vector3(-.9,1.02,114),new T.Vector3(-.9,1.08,114.25),new T.Vector3(-.9,.95,114.28)]);mesh(new T.TubeGeometry(spout,20,.026,7,false),brass);oval(brass,-.68,.88,114,.045,.025,.07);
 function washBottle(x,y,z,r=.055){mesh(new T.CylinderGeometry(r*.75,r,.18,12),stoneLight,x,y+.09,z);mesh(new T.CylinderGeometry(r*.48,r*.6,.055,10),cedarDark,x,y+.2,z);rod([x,y+.25,z],[x+r,y+.25,z],.012,brass);box(r*1.1,.07,.012,cloth,x,y+.1,z+r*.94);}
 for(const [x,z]of [[-3.65,117],[-3.48,117],[-2,117.6],[-1.82,117.6]])washBottle(x,.29,z);
 for(const [x,z]of [[2.1,118.8],[22,118.8],[-3.4,114.7]]){
  mesh(new T.CylinderGeometry(.31,.23,.45,16),stoneLight,x,.37,z);mesh(new T.CylinderGeometry(.27,.27,.018,16),stoneDark,x,.605,z);
  for(let j=0;j<10;j++){const a=j*2.399,h=.4+(j%3)*.15,reach=.25+(j%2)*.12;rod([x,.6,z],[x+Math.cos(a)*reach,.6+h,z+Math.sin(a)*reach],.012,green);for(let k=0;k<3;k++){const u=.4+k*.25,leaf=oval(j%2?green:greenLight,x+Math.cos(a)*reach*u,.6+h*u,z+Math.sin(a)*reach*u,.17,.035,.075);leaf.rotation.set(.25,a,-.25);}}
 }
 target('onsen',-10,.7,124,14.8,1.5,12.8);target('sauna',12,2.2,126,24,4.3,22);target('footbath',footbath.x,.95,footbath.z,4.3,1.5,3.5);target('lounge',lounge.x,1.1,lounge.z,1.8,1.5,4.8);
 // Merge opaque static geometry by material while keeping water and vapour separate.
 root.updateMatrixWorld(true);const groups=new Map();root.traverse(o=>{if(!o.isMesh||o.userData.snowTrail||moving.has(o)||Array.isArray(o.material))return;const key=o.material.uuid;if(!groups.has(key))groups.set(key,{material:o.material,items:[]});groups.get(key).items.push(o);});
 for(const {material,items}of groups.values()){if(items.length<2)continue;const chunks={position:[],normal:[],uv:[]};let count=0;for(const o of items){let g=o.geometry.clone().applyMatrix4(o.matrixWorld);if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}if(!g.attributes.normal)g.computeVertexNormals();const size=g.attributes.position.count;chunks.position.push(g.attributes.position.array);chunks.normal.push(g.attributes.normal.array);chunks.uv.push(g.attributes.uv?.array||new Float32Array(size*2));count+=size;g.dispose();o.removeFromParent();}const g=new T.BufferGeometry();for(const key of Object.keys(chunks)){const size=key==='uv'?2:3,out=new Float32Array(count*size);let at=0;for(const chunk of chunks[key]){out.set(chunk,at);at+=chunk.length;}g.setAttribute(key,new T.BufferAttribute(out,size));}g.computeBoundingSphere();mesh(g,material);}
 // Keep the approach readable: vapour originates inside the rear half of each
 // basin; warm floor light and material detail do not add any new obstacles.
 const atmosphere=createRetreatAtmosphere(root,{name:'spa',
  waters:[...pools.map(p=>({...p,y:.032,rx:p.rx*.97,rz:p.rz*.97,lights:[[-19.6,1.4,120],[-21.8,1.4,136],[1,1.4,136]]})),{x:footbath.x,y:.665,z:footbath.z,rx:1.9,rz:1.5,lights:[[14.8,3.45,121.4],[20,3.3,136.7]]}],
  vapour:[{x:-10,y:.04,z:125.8,rx:5.2,rz:3.3,rise:2.5,size:1.85,count:34,opacity:.145},{x:-19,y:.04,z:132.7,rx:2.55,rz:1.7,rise:1.7,size:1.3,count:18,opacity:.15},{x:footbath.x,y:.67,z:footbath.z+.25,rx:1.35,rz:.9,rise:1.1,size:.7,count:10,opacity:.1},{x:16.6,y:1.35,z:120.25,rx:.15,rz:.15,rise:.65,size:.28,count:6,opacity:.095},{x:12,y:1.5,z:130,rx:.65,rz:.65,rise:1.45,size:.5,count:7,opacity:.055}],
  fireflies:[{x:-23.8,y:.7,z:131,rx:1.6,rz:2,height:1.1,count:9,color:'#e9c783'},{x:-7.5,y:.7,z:139,rx:2.1,rz:1.3,height:1.1,count:9,color:'#e9c783'}],
  lamps:[...[[9.2,121.4],[14.8,121.4],[4,134.8],[9.3,134.8],[14.7,134.8],[20,134.8]].map(([x,z])=>({x,y:.365,z,rx:2.5,rz:2.1})),...[[-2.6,96],[2.6,104],[-8,111],[-19.6,120],[8.6,112],[15.4,115],[-21.8,136],[1,136]].map(([x,z])=>({x,y:.158,z,rx:1.7,rz:1.7}))]
 });
 // Local warmth comes from the actual fixtures; emissive shades alone cannot light cedar.
 for(const [x,y,z,intensity,range]of [[11.5,3.2,122,24,15],[18,3.4,134,18,12],[-18,2.3,132,13,12]]){const light=new T.PointLight('#ffc88a',intensity,range,2);light.position.set(x,y,z);light.name='spa-local-lantern-warmth';root.add(light);}
 root.position.z=spaShift;
 return{root,interactive,atmosphere,setQuality:atmosphere.setQuality,update(time,still,quality){if(!still)fallUniforms.time.value=time;atmosphere.update(time,still,quality);}};
}
