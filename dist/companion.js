import {createFurGradient} from './fur-gradient.js';
import {createGooglyGlasses} from './googly-glasses.js';
import {createCharacterTail} from './character-tail.js';
import {getEarGeometries} from './character-ears.js';
import {createHeldBalloon} from './held-balloon.js';
import {createHandSparkler} from './hand-sparkler.js';
import {createRyokanMeal} from './ryokan-meal.js';
import {diningServiceState} from './ryokan-service.js';
import {createYukata} from './winter-costumes.js';
import {disposeOwnedScene} from './scene-resources.js';
import {selectedItems,normalizeWardrobe} from './wardrobe.js';
import {createStyleAccessories,extraAccessoryIDs} from './character-accessories.js';
import * as THREE from './vendor/three.module.js';
import {createPopcornGeometry} from './held-popcorn.js';
import {createClayEye} from './clay-eyes.js';
// Short, dense down follows the body; face trimming blends radially around each eye.
export function createCompanion({detail='full'}={}){
 const group=new THREE.Group(),shape=new THREE.Group();group.add(shape);const yukata=createYukata();yukata.visible=false;shape.add(yukata);
 const velvet=new THREE.MeshPhysicalMaterial({color:'#f4eee5',emissive:'#f4eee5',emissiveIntensity:.16,roughness:1,metalness:0,sheen:1,sheenColor:'#fff9f1',sheenRoughness:.85});
 const geo=new THREE.SphereGeometry(1,48,40),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const y=p.getY(i),width=.74*(1-.045*y);p.setXYZ(i,p.getX(i)*width,y*.74,p.getZ(i)*width*.91);}geo.computeVertexNormals();
 const body=new THREE.Mesh(geo,velvet);body.name='plush-body';body.castShadow=true;shape.add(body);
 let seed=5921;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
 const positions=[],indices=[],segments=4,sides=3;
 for(let j=0;j<=segments;j++)for(let k=0;k<sides;k++){
  const t=j/segments,a=k/sides*Math.PI*2,r=.00125*(1-t)+.00008;
  positions.push(Math.cos(a)*r+.009*t*t,t*.069,Math.sin(a)*r+.008*t*t);
  if(j<segments){const v=j*sides+k,w=j*sides+(k+1)%sides;indices.push(v,w,v+sides,w,w+sides,v+sides);}
 }
 const fibreGeometry=new THREE.BufferGeometry();fibreGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));fibreGeometry.setIndex(indices);fibreGeometry.computeVertexNormals();
 // Fur and body share the same night-light response; unlit fibres made the body look hollow.
 const fibreMaterial=new THREE.MeshStandardMaterial({color:'#f4eee5',emissive:'#f4eee5',emissiveIntensity:.16,roughness:1,side:THREE.DoubleSide});
 const count=detail==='remote'?1800:(globalThis.innerWidth??1024)<650?16000:26000,fur=new THREE.InstancedMesh(fibreGeometry,fibreMaterial,count);fur.name='plush-fur';fur.frustumCulled=false;shape.add(fur);
 const fibres=[],dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0);
 for(let i=0;i<count;i++){
  const y=random()*2-1,a=random()*Math.PI*2,r=Math.sqrt(1-y*y),v=new THREE.Vector3(r*Math.cos(a),y,r*Math.sin(a)),width=.74*(1-.045*y);
  fibres.push({position:new THREE.Vector3(v.x*width,y*.74,v.z*width*.91),normal:new THREE.Vector3(v.x/width,y/.74,v.z/(width*.91)).normalize(),length:.8+random()*.35,twist:random()*Math.PI*2});
  // Wrapped baked light keeps subpixel fibres soft instead of dark, glittering triangles.
  fur.setColorAt(i,new THREE.Color().setScalar(.91+.07*Math.max(0,y*.65+v.z*.3)+random()*.015));
 }
 const lowerVelvet=velvet.clone(),lowerFibres=fibreMaterial.clone(),dye=createFurGradient([velvet,fibreMaterial]);
 const tail=createCharacterTail(shape,{velvet:lowerVelvet,fibreMaterial:lowerFibres,fibreGeometry,remote:detail==='remote'});
 let lastFluff=-1;
 function setViewDetail(pixels=Infinity){
  // At walking-camera distance most fibres are subpixel. Preserve full grooming
  // in close-ups and the wardrobe, and use the same uniformly distributed fur.
  const density=THREE.MathUtils.clamp((Math.max(0,pixels)/220)**1.25,detail==='remote'?.28:.06,1);
  fur.count=Math.min(count,Math.max(1,Math.round(count*density)));tail.setViewDetail(pixels);
 }
 function groom(fluff){if(lastFluff===fluff)return;lastFluff=fluff;tail.groom(fluff);
  for(let i=0;i<count;i++){const f=fibres[i],eyeDistance=Math.min(Math.hypot((f.position.x-.205)/.13,(f.position.y-.075)/.15),Math.hypot((f.position.x+.205)/.13,(f.position.y-.075)/.15)),faceBlend=f.position.z>.45?1-Math.exp(-eyeDistance*eyeDistance*1.5):1;
   dummy.position.copy(f.position);dummy.quaternion.setFromUnitVectors(up,f.normal);dummy.rotateY(f.twist);
   // A continuous radial falloff avoids a rectangular shaved patch around the eyes.
   const underside=THREE.MathUtils.smoothstep(f.position.y,-.74,-.52);
   const length=(.18+.82*faceBlend)*(.35+.65*underside)*f.length*(.65+fluff/100*.35);
   dummy.scale.set(1,length,1);dummy.updateMatrix();fur.setMatrixAt(i,dummy.matrix);
  }fur.instanceMatrix.needsUpdate=true;
 }
 const orbGeometry=new THREE.SphereGeometry(1,28,20);
 const orb=(mat,x,y,z,sx,sy,sz,parent=shape)=>{const m=new THREE.Mesh(orbGeometry,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;parent.add(m);return m;};
 const eyeMat=new THREE.MeshPhysicalMaterial({color:'#0d1422',roughness:.17,metalness:0,clearcoat:.6}),eyeWhite=new THREE.MeshBasicMaterial({color:'#fffaf3'});const eyes=[],feet=[];
 for(const s of [-1,1]){const eye=orb(eyeMat,s*.205,.075,.663,.068,.094,.046);eyes.push(eye);orb(eyeWhite,-.25,.32,.94,.16,.12,.1,eye);feet.push(orb(lowerVelvet,s*.27,-.74,.14,.18,.12,.25));}
 const sclera=new THREE.MeshPhysicalMaterial({color:'#fff8ed',roughness:.68,clearcoat:.08});
 const roundEye=eyes[0].geometry,flatEye=new THREE.CapsuleGeometry(.014,.135,5,12);flatEye.rotateZ(Math.PI/2);
 const closedEye=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-.081,.016,0),new THREE.Vector3(0,-.012,.006),new THREE.Vector3(.081,.016,0)]),16,.013,8,false);
 const contentEye=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-.073,-.006,0),new THREE.Vector3(0,.023,.005),new THREE.Vector3(.073,-.006,0)]),16,.012,8,false);
 flatEye.scale(1.12,1.12,1);closedEye.scale(1.12,1.12,1);contentEye.scale(1.12,1.12,1);
 const dazedEye=roundEye.clone();for(let i=0;i<dazedEye.attributes.position.count;i++){const a=dazedEye.attributes.position;a.setY(i,Math.min(a.getY(i),.48));}dazedEye.computeVertexNormals();
 const starEye=createClayEye('star'),heartEye=createClayEye('heart'),starEyeMaterial=new THREE.MeshPhysicalMaterial({color:'#f2c563',roughness:.65,metalness:0,clearcoat:.06}),heartEyeMaterial=new THREE.MeshPhysicalMaterial({color:'#e8889d',roughness:.65,metalness:0,clearcoat:.06});
 let eyeProfiles=[],selectedEyeStyle='',activeEyeReaction='';
 function styleEyes(style='',reaction=''){
  activeEyeReaction=reaction;
  eyeProfiles=eyes.map((eye,i)=>{
   const side=i?1:-1,content=reaction==='content'||style==='eyes-happy'||(style==='eyes-playful'&&i===0),symbol=style==='eyes-star'||style==='eyes-heart',closed=content||symbol||style==='eyes-flat'||style==='eyes-sleepy',serious=style==='eyes-serious'&&!content,goofy=(style==='eyes-goofy'||serious)&&!content;
   eye.name=i?'right-eye':'left-eye';eye.geometry=serious?dazedEye:content?contentEye:style==='eyes-star'?starEye:style==='eyes-heart'?heartEye:style==='eyes-flat'?flatEye:closed?closedEye:roundEye;eye.material=style==='eyes-heart'&&!content?heartEyeMaterial:style==='eyes-star'&&!content?starEyeMaterial:goofy?sclera:eyeMat;
   const scale=closed?[1,1,1]:serious?[.13,.145,.045]:goofy?[.111,.12,.035]:style==='eyes-round'?[.096,.096,.05]:style==='eyes-oval'?[.067,.1,.05]:style==='eyes-sparkle'?[.105,.125,.052]:style==='eyes-gentle'?[.079,.079,.05]:style==='eyes-droopy'?[.079,.1,.05]:[.083,.111,.05];
   eye.scale.set(...scale);eye.rotation.z=['eyes-sleepy','eyes-droopy'].includes(style)&&!content?side*.17:0;eye.position.y=goofy?.085:.075;eye.position.z=symbol&&!content?.738:closed?.716:goofy?.704:.675;eye.rotation.y=side*.22;
   const pupil=eye.children[0];pupil.visible=!closed;pupil.material=goofy?eyeMat:eyeWhite;pupil.position.set(goofy?0:-.25,serious?-.14:goofy?-.08:.32,.96);pupil.scale.set(goofy?.69:style==='eyes-sparkle'?.27:.16,goofy?.64:style==='eyes-sparkle'?.24:.12,goofy?.2:.1);
   return {scale,closed,spacing:goofy?.196:.217};
  });
 }
 function updateEyeOcclusion(){
  const symbol=['eyes-heart','eyes-star'].includes(selectedEyeStyle),covered=googly.root.visible||goggles.visible||glasses.visible||ovalGlasses.visible||catEyeGlasses.visible;
  // Open decorative frames fit above even the thick clay symbols.
  for(const id of ['heart-glasses','star-glasses'])styleAccessories[id].position.z=symbol?.075:0;silverGlasses.position.z=symbol?.075:0;
  for(const eye of eyes)eye.visible=!covered;
 }
 // Ears use the same soft fur color and an inset matte cup.
 const earVelvet=new THREE.MeshPhysicalMaterial({color:'#f4eee5',roughness:1,metalness:0,sheen:.7,sheenColor:'#52535c',sheenRoughness:.82}),earInner=new THREE.MeshPhysicalMaterial({color:'#d99fa9',roughness:1,metalness:0,sheen:.5,sheenColor:'#696972',sheenRoughness:1});
 const earShapes=getEarGeometries(),headband=new THREE.Mesh(earShapes['bunny-ears'],[earVelvet,earInner]);headband.name='plush-ear-headband';headband.castShadow=true;headband.visible=false;shape.add(headband);
 // A small curved smile and rounded blush sit above the fur, without rectangular face decals.
 function facialGeometry(mouth){
  const parts=[mouth];for(const side of [-1,1])parts.push(new THREE.SphereGeometry(1,20,12).scale(.061,.022,.008).translate(side*.31,-.048,.661));
  const geometry=new THREE.BufferGeometry(),arrays={position:[],normal:[],uv:[]};let vertices=0,smileCount=0;
  parts.forEach((part,index)=>{const source=part.toNonIndexed();for(const name in arrays)arrays[name].push(...source.attributes[name].array);vertices+=source.attributes.position.count;if(!index)smileCount=vertices;source.dispose();part.dispose();});
  for(const [name,values]of Object.entries(arrays))geometry.setAttribute(name,new THREE.Float32BufferAttribute(values,name==='uv'?2:3));geometry.addGroup(0,smileCount,0);geometry.addGroup(smileCount,vertices-smileCount,1);return geometry;
 }
 const smileCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.041,-.115,.723),new THREE.Vector3(0,-.13,.727),new THREE.Vector3(.041,-.115,.723)]),reactionGeometry=facialGeometry(new THREE.TubeGeometry(smileCurve,16,.0075,8,false)),pursedGeometry=facialGeometry(new THREE.TorusGeometry(.018,.006,8,24).translate(0,-.115,.73));
 const reactions=new THREE.Mesh(reactionGeometry,[eyeMat,new THREE.MeshStandardMaterial({color:'#d9a2aa',roughness:1,transparent:true,opacity:.5,depthWrite:false})]);reactions.name='content-cheeks-smile';reactions.visible=false;shape.add(reactions);
 const styleAccessories=createStyleAccessories({detail}),{glasses,ovalGlasses,catEyeGlasses,silverGlasses,crown,brooch,ribbon,scarf,beret}=styleAccessories;const extras=extraAccessoryIDs.map(id=>[styleAccessories[id],id]);
 shape.add(...Object.values(styleAccessories));
 const googly=createGooglyGlasses(shape);
 const eyewear=[[glasses,'sunglasses'],[ovalGlasses,'oval-sunglasses'],[catEyeGlasses,'cat-eye-sunglasses'],[silverGlasses,'silver-glasses']];
 const frameMat=new THREE.MeshStandardMaterial({color:'#17151f',roughness:.3,metalness:.15});
 const goggles=new THREE.Group();goggles.name='ski-goggles';shape.add(goggles);
 // One curved panoramic lens, a shallow nose relief and a wide textile strap.
 const strap=new THREE.Mesh(new THREE.CylinderGeometry(.745,.745,.135,48,1,true),frameMat);strap.scale.z=.91;strap.position.y=.1;goggles.add(strap);
 const goggleFrame=new THREE.MeshStandardMaterial({color:'#ece5d8',roughness:.86}),goggleLens=new THREE.MeshPhysicalMaterial({color:'#ffffff',vertexColors:true,roughness:.12,metalness:.55,clearcoat:1,clearcoatRoughness:.1});
 const lensOutline=new THREE.Shape();lensOutline.moveTo(-.53,.13);lensOutline.quadraticCurveTo(-.53,.29,-.33,.30);lensOutline.quadraticCurveTo(0,.34,.33,.30);lensOutline.quadraticCurveTo(.53,.29,.53,.13);lensOutline.quadraticCurveTo(.53,-.08,.32,-.105);lensOutline.lineTo(.13,-.115);lensOutline.quadraticCurveTo(.075,-.115,.055,-.055);lensOutline.quadraticCurveTo(0,.015,-.055,-.055);lensOutline.quadraticCurveTo(-.075,-.115,-.13,-.115);lensOutline.lineTo(-.32,-.105);lensOutline.quadraticCurveTo(-.53,-.08,-.53,.13);lensOutline.closePath();
 const lensDepth=(x,y)=>.79-.13*(x/.55)**2-.035*((y-.1)/.24)**2;
 function curveLens(geometry,scale,depth){const p=geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i)*scale,y=(p.getY(i)-.1)*scale+.1;p.setXYZ(i,x,y,p.getZ(i)+lensDepth(x,y)+depth);}geometry.computeVertexNormals();return geometry;}
 const gasket=new THREE.Mesh(curveLens(new THREE.ExtrudeGeometry(lensOutline,{depth:.018,bevelEnabled:true,bevelSize:.023,bevelThickness:.012,bevelSegments:2,curveSegments:16}),1,-.045),goggleFrame);goggles.add(gasket);
 // Interior subdivisions retain the lens's spherical bulge across the broad, uninterrupted face.
 function lensSurface(){const source=new THREE.ShapeGeometry(lensOutline,24),vertices=[];const p=source.attributes.position,idx=source.index.array;
  function split(a,b,c,n){if(!n){vertices.push(...a,...b,...c);return;}const ab=a.map((v,i)=>(v+b[i])/2),bc=b.map((v,i)=>(v+c[i])/2),ca=c.map((v,i)=>(v+a[i])/2);split(a,ab,ca,n-1);split(ab,b,bc,n-1);split(ca,bc,c,n-1);split(ab,bc,ca,n-1);}
  for(let i=0;i<idx.length;i+=3)split([p.getX(idx[i]),p.getY(idx[i]),0],[p.getX(idx[i+1]),p.getY(idx[i+1]),0],[p.getX(idx[i+2]),p.getY(idx[i+2]),0],2);source.dispose();const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));return geometry;
 }
 const lensGeometry=curveLens(lensSurface(),.955,0),lensColors=[];
 for(let i=0;i<lensGeometry.attributes.position.count;i++){const y=lensGeometry.attributes.position.getY(i),c=new THREE.Color('#c79d79').lerp(new THREE.Color('#527e94'),THREE.MathUtils.smoothstep(y,-.12,.28));lensColors.push(c.r,c.g,c.b);const x=lensGeometry.attributes.position.getX(i),n=new THREE.Vector3(.26*x/(.55*.55),.07*(y-.1)/(.24*.24),1).normalize();lensGeometry.attributes.normal.setXYZ(i,n.x,n.y,n.z);}lensGeometry.setAttribute('color',new THREE.Float32BufferAttribute(lensColors,3));const panoramicLens=new THREE.Mesh(lensGeometry,goggleLens);panoramicLens.name='panoramic-goggle-lens';goggles.add(panoramicLens);
 const reflectionCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.36,.21,lensDepth(-.36,.21)+.008),new THREE.Vector3(-.19,.25,lensDepth(-.19,.25)+.008),new THREE.Vector3(.02,.26,lensDepth(.02,.26)+.008)]);goggles.add(new THREE.Mesh(new THREE.TubeGeometry(reflectionCurve,16,.008,4,false),new THREE.MeshBasicMaterial({color:'#e8f5f0',transparent:true,opacity:.55})));
 // A rounded matte shell follows the existing head silhouette rather than changing the pet.
 const helmet=new THREE.Group();helmet.name='ski-helmet';shape.add(helmet);
 const shellMat=new THREE.MeshStandardMaterial({color:'#e8e3d8',roughness:.92}),paddingMat=new THREE.MeshStandardMaterial({color:'#343b42',roughness:1});
 const shell=new THREE.Mesh(new THREE.SphereGeometry(1,40,24,0,Math.PI*2,0,1.5),shellMat);shell.position.y=.23;shell.scale.set(.79,.72,.70);shell.castShadow=true;helmet.add(shell);
 orb(shellMat,0,.36,.64,.5,.045,.14,helmet);
 const pads=new THREE.InstancedMesh(new THREE.SphereGeometry(1,16,12),paddingMat,2);helmet.add(pads);
 for(let i=0;i<2;i++){dummy.position.set((i?1:-1)*.72,.22,-.05);dummy.rotation.set(0,0,0);dummy.scale.set(.12,.25,.24);dummy.updateMatrix();pads.setMatrixAt(i,dummy.matrix);}
 const vents=new THREE.InstancedMesh(new THREE.BoxGeometry(.042,.009,.13),paddingMat,12);helmet.add(vents);let ventIndex=0;
 for(const x of [-.36,-.18,.18,.36])for(const z of [-.22,.08,.36]){const y=.23+.72*Math.sqrt(1-(x/.79)**2-(z/.70)**2);dummy.position.set(x,y+.007,z);dummy.quaternion.setFromUnitVectors(up,new THREE.Vector3(x/(.79*.79),(y-.23)/(.72*.72),z/(.70*.70)).normalize());dummy.scale.set(1,1,1);dummy.updateMatrix();vents.setMatrixAt(ventIndex++,dummy.matrix);}
 function mergeAccessory(parts){const arrays={position:[],normal:[],uv:[]},geometry=new THREE.BufferGeometry();for(const part of parts){const g=part.index?part.toNonIndexed():part;for(const name in arrays)arrays[name].push(...g.attributes[name].array);if(g!==part)g.dispose();part.dispose();}for(const [name,values]of Object.entries(arrays))geometry.setAttribute(name,new THREE.Float32BufferAttribute(values,name==='uv'?2:3));return geometry;}
 const muffCurve=new THREE.CatmullRomCurve3(Array.from({length:33},(_,i)=>{const a=i/32*Math.PI;return new THREE.Vector3(Math.cos(a)*.76,.18+Math.sin(a)*.66,-.05);})),earmuffs=new THREE.Mesh(mergeAccessory([new THREE.TubeGeometry(muffCurve,32,.035,8,false),...[-1,1].map(side=>new THREE.SphereGeometry(1,24,16).scale(.14,.21,.18).translate(side*.73,.18,-.05))]),earVelvet);earmuffs.name='winter-earmuffs';shape.add(earmuffs);earmuffs.visible=false;
 const santa=new THREE.Group();santa.name='santa-hat';santa.position.set(0,.62,0);shape.add(santa);
 const red=new THREE.MeshStandardMaterial({color:'#a5444b',roughness:.95}),white=new THREE.MeshStandardMaterial({color:'#f7f2e9',roughness:1});
 const hp=[],hi=[],rings=14,slices=32;
 for(let j=0;j<=rings;j++){const t=j/rings,cx=.36*t*t,cy=.58*t-.17*t*t*t,rad=.44*Math.pow(1-t,.8)+.004;for(let k=0;k<=slices;k++){const a=k/slices*Math.PI*2;hp.push(cx+Math.cos(a)*rad,cy,Math.sin(a)*rad*.83);if(j<rings&&k<slices){const n=j*(slices+1)+k;hi.push(n,n+slices+1,n+1,n+1,n+slices+1,n+slices+2);}}}
 const hg=new THREE.BufferGeometry();hg.setAttribute('position',new THREE.Float32BufferAttribute(hp,3));hg.setIndex(hi);hg.computeVertexNormals();santa.add(new THREE.Mesh(hg,red));
 const brim=new THREE.Mesh(new THREE.TorusGeometry(.44,.065,8,32),white);brim.rotation.x=Math.PI/2;brim.scale.y=.83;santa.add(brim);orb(white,.38,.41,0,.105,.11,.105,santa);
 const skiMat=new THREE.MeshPhysicalMaterial({color:'#171923',roughness:.34,metalness:.18,clearcoat:.65,clearcoatRoughness:.24});
 const boots=[];for(const foot of feet){const boot=orb(skiMat,0,.13,-.06,1.1,1.18,1.04,foot);boot.visible=false;boots.push(boot);}
 const skateParts=[];for(const foot of feet){const skate=new THREE.Group();foot.add(skate);const boot=orb(skiMat,0,.14,-.03,1.05,1.2,1.1,skate);const blade=new THREE.Mesh(new THREE.BoxGeometry(.14,.2,1.9),new THREE.MeshStandardMaterial({color:'#d9e2e6',metalness:.85,roughness:.22}));blade.position.set(0,-.78,.1);skate.add(blade);skate.visible=false;skateParts.push(skate);}
 const skis=new THREE.Group();skis.name='ski-equipment';shape.add(skis);
 const skiParts=[new THREE.BoxGeometry(.16,.045,1.65).translate(0,-.87,.12),new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0,-.87,.92),new THREE.Vector3(0,-.85,1.02),new THREE.Vector3(0,-.77,1.13)]),8,.07,5,false)],skiGeometry=new THREE.BufferGeometry();
 for(const name of ['position','normal','uv']){const values=[];for(const part of skiParts){const geometry=part.toNonIndexed();values.push(...geometry.attributes[name].array);geometry.dispose();}skiGeometry.setAttribute(name,new THREE.Float32BufferAttribute(values,name==='uv'?2:3));}skiParts.forEach(part=>part.dispose());
 const skiBlades=[];for(const side of [-1,1]){const ski=new THREE.Mesh(skiGeometry,skiMat);ski.position.x=side*.27;skis.add(ski);skiBlades.push(ski);}
 const board=new THREE.Group();board.name='snowboard-equipment';shape.add(board);
 const deck=new THREE.Mesh(new THREE.CapsuleGeometry(.34,1.35,4,12),skiMat);deck.rotation.set(Math.PI/2,0,Math.PI/2);deck.scale.z=.12;deck.position.set(0,-.86,.12);board.add(deck);
 for(const side of [-1,1]){const binding=new THREE.Mesh(new THREE.BoxGeometry(.23,.1,.34),frameMat);binding.position.set(side*.27,-.79,.12);board.add(binding);}
 const bathTowel=new THREE.Group();bathTowel.name='bath-towel';shape.add(bathTowel);
 const towelMat=new THREE.MeshStandardMaterial({color:'#f0e3cd',roughness:1}),towelSeam=new THREE.MeshStandardMaterial({color:'#c5b8a3',roughness:1}),towelParts=[];
 const foldedBand=new THREE.CapsuleGeometry(.12,.6,6,20);foldedBand.rotateZ(Math.PI/2);foldedBand.scale(1,.55,2);foldedBand.translate(0,.72,.025);towelParts.push({geometry:foldedBand,material:0});
 for(const side of [-1,1]){
  const profile=[[0,-.14],[.13,-.14],[.18,-.1],[.187,0],[.18,.1],[.155,.135],[0,.135]].map(([x,y])=>new THREE.Vector2(x,y)),roll=new THREE.LatheGeometry(profile,32);roll.rotateX(Math.PI/2);roll.translate(side*.48,.785,.035);towelParts.push({geometry:roll,material:0});
  const spiral=[];for(let i=0;i<=80;i++){const t=i/80,a=t*Math.PI*4.7,r=.018+t*.145;spiral.push(new THREE.Vector3(side*.48+Math.cos(a)*r,.785+Math.sin(a)*r,.174));}towelParts.push({geometry:new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiral),80,.006,5,false),material:1});
 }
 const fold=[new THREE.Vector3(-.32,.7,.265),new THREE.Vector3(0,.699,.27),new THREE.Vector3(.32,.7,.265)];towelParts.push({geometry:new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fold),20,.005,5,false),material:1});
 const towelGeometry=new THREE.BufferGeometry(),towelArrays={position:[],normal:[],uv:[]};let towelVertices=0;
 for(const material of [0,1]){const start=towelVertices;for(const part of towelParts){if(part.material!==material)continue;const source=part.geometry.toNonIndexed();for(const name in towelArrays)towelArrays[name].push(...source.attributes[name].array);towelVertices+=source.attributes.position.count;source.dispose();part.geometry.dispose();}towelGeometry.addGroup(start,towelVertices-start,material);}
 for(const [name,values]of Object.entries(towelArrays))towelGeometry.setAttribute(name,new THREE.Float32BufferAttribute(values,name==='uv'?2:3));const rolledTowel=new THREE.Mesh(towelGeometry,[towelMat,towelSeam]);rolledTowel.name='rolled-sheep-towel';bathTowel.add(rolledTowel);
 const bubbleWand=new THREE.Group();bubbleWand.name='bubble-wand';shape.add(bubbleWand);const wandHandle=new THREE.CylinderGeometry(.017,.022,.26,12).translate(0,-.085,0),wandLoop=new THREE.TorusGeometry(.071,.012,8,32).translate(0,.12,0),wandGeometry=new THREE.BufferGeometry(),wandArrays={position:[],normal:[],uv:[]};for(const part of [wandHandle,wandLoop]){const source=part.toNonIndexed();for(const name in wandArrays)wandArrays[name].push(...source.attributes[name].array);source.dispose();part.dispose();}for(const [name,values]of Object.entries(wandArrays))wandGeometry.setAttribute(name,new THREE.Float32BufferAttribute(values,name==='uv'?2:3));bubbleWand.add(new THREE.Mesh(wandGeometry,new THREE.MeshStandardMaterial({color:'#c7b5d9',metalness:.25,roughness:.4})));bubbleWand.visible=false;
 const sparkler=createHandSparkler(shape,{low:detail!=='full'});
 let meal=null;
 const teaCup=new THREE.Group();teaCup.name='tea-cup';shape.add(teaCup);const cupProfile=[[0,-.095],[.115,-.095],[.132,-.075],[.145,.075],[.14,.095],[.123,.095],[.116,-.066],[0,-.066]].map(([x,y])=>new THREE.Vector2(x,y)),cupShell=new THREE.LatheGeometry(cupProfile,32),cupHandle=new THREE.TorusGeometry(.08,.022,8,24).translate(.15,0,0),cupGeometry=new THREE.BufferGeometry();for(const name of ['position','normal','uv']){const values=[];for(const part of [cupShell,cupHandle]){const source=part.toNonIndexed();values.push(...source.attributes[name].array);source.dispose();}cupGeometry.setAttribute(name,new THREE.Float32BufferAttribute(values,name==='uv'?2:3));}cupShell.dispose();cupHandle.dispose();const cupMaterial=new THREE.MeshStandardMaterial({color:'#f0e3cd',roughness:.38}),cup=new THREE.Mesh(cupGeometry,cupMaterial);teaCup.add(cup);const tea=new THREE.Mesh(new THREE.CircleGeometry(.115,16),new THREE.MeshBasicMaterial({color:'#976e42'}));tea.rotation.x=-Math.PI/2;tea.position.y=.069;teaCup.add(tea);bathTowel.visible=teaCup.visible=false;
 const skewerWood=new THREE.MeshStandardMaterial({color:'#b38b60',roughness:.9}),skewerFood=new THREE.MeshStandardMaterial({color:'#fff7e9',roughness:.78});
 function skewerGeometry(kind){
  if(kind==='popcorn')return createPopcornGeometry();
  let stick=new THREE.CylinderGeometry(.009,.011,.55,10).translate(0,-.05,0);let food;
  if(kind==='odeng'){const ribbon=new THREE.Shape();for(let i=0;i<=48;i++){const t=i/48,x=.072*Math.sin(t*Math.PI*4)-.059,y=.05+t*.29;i?ribbon.lineTo(x,y):ribbon.moveTo(x,y);}for(let i=48;i>=0;i--){const t=i/48;ribbon.lineTo(.072*Math.sin(t*Math.PI*4)+.059,.05+t*.29);}ribbon.closePath();food=new THREE.ExtrudeGeometry(ribbon,{depth:.055,bevelEnabled:true,bevelSize:.009,bevelThickness:.009,bevelSegments:3,curveSegments:12});food.translate(0,0,-.028);}
  else if(kind==='icecream'){stick.dispose();stick=new THREE.CylinderGeometry(.1,0,.29,20).translate(0,-.07,0);food=mergeAccessory([new THREE.SphereGeometry(.135,24,16).translate(0,.15,0),new THREE.TorusGeometry(.09,.025,8,24).rotateX(Math.PI/2).translate(0,.075,0)]);}
  else if(kind==='candyfloss'){food=new THREE.SphereGeometry(1,24,18).scale(.22,.32,.20).translate(0,.29,0);const p=food.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=1+.035*Math.sin(x*85+y*64+z*41);p.setXYZ(i,x*n,.29+(y-.29)*n,z*n);}food.computeVertexNormals();}
  else if(kind==='balloon'){stick.dispose();stick=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0,-.17,0),new THREE.Vector3(.03,.4,0),new THREE.Vector3(-.045,1.08,0)]),24,.005,5,false);food=mergeAccessory([new THREE.SphereGeometry(1,28,20).scale(.25,.31,.25).translate(-.045,1.38,0),new THREE.ConeGeometry(.035,.07,8).translate(-.045,1.05,0)]);}
  else{const profile=[[0,-.11],[.083,-.11],[.108,-.096],[.115,-.068],[.115,.068],[.108,.096],[.083,.11],[0,.11]].map(([x,y])=>new THREE.Vector2(x,y));food=new THREE.LatheGeometry(profile,28);food.translate(0,.23,0);}
  const geometry=new THREE.BufferGeometry(),arrays={position:[],normal:[],uv:[]};let offset=0;[stick,food].forEach((part,material)=>{const source=part.index?part.toNonIndexed():part;for(const name in arrays)arrays[name].push(...source.attributes[name].array);geometry.addGroup(offset,source.attributes.position.count,material);offset+=source.attributes.position.count;if(source!==part)source.dispose();part.dispose();});for(const [name,values]of Object.entries(arrays))geometry.setAttribute(name,new THREE.Float32BufferAttribute(values,name==='uv'?2:3));return geometry;
 }
 const skewerShapes={odeng:skewerGeometry('odeng'),marshmallow:skewerGeometry('marshmallow'),balloon:skewerGeometry('balloon'),icecream:skewerGeometry('icecream'),candyfloss:skewerGeometry('candyfloss'),popcorn:skewerGeometry('popcorn')},heldSkewer=new THREE.Group();heldSkewer.name='held-skewer';shape.add(heldSkewer);const skewerMesh=new THREE.Mesh(skewerShapes.marshmallow,[skewerWood,skewerFood]);skewerMesh.castShadow=true;heldSkewer.add(skewerMesh);heldSkewer.visible=false;
 const heldBalloon=createHeldBalloon(heldSkewer);
 const toastWhite=new THREE.Color('#fff7e9'),toastTan=new THREE.Color('#d8a06a'),toastBrown=new THREE.Color('#8e4c28');let currentHeldItem='',lastRoast=-1,lastGesture='',gestureStartedAt=0;
 const arms=new THREE.InstancedMesh(new THREE.CapsuleGeometry(.105,.22,5,12),velvet,2);arms.name='plush-arms';arms.frustumCulled=false;arms.castShadow=true;arms.instanceMatrix.setUsage(THREE.DynamicDrawUsage);shape.add(arms);
 const armStart=new THREE.Vector3(),armEnd=new THREE.Vector3(),armDirection=new THREE.Vector3(),inverseShape=new THREE.Matrix4(),stanceMatrix=new THREE.Matrix4(),partMatrix=new THREE.Matrix4(),partPosition=new THREE.Vector3(),partRotation=new THREE.Quaternion(),partScale=new THREE.Vector3(.18,.12,.25),yAxis=new THREE.Vector3(0,1,0);
 function armPose(index,hand,shoulderY=-.12){const side=index?1:-1;armStart.set(side*.59,shoulderY,.08);armEnd.set(...hand);armDirection.copy(armEnd).sub(armStart);const length=armDirection.length();dummy.position.copy(armStart).add(armEnd).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,armDirection.normalize());dummy.scale.set(1,length/.43,1);dummy.updateMatrix();arms.setMatrixAt(index,dummy.matrix);if(yukata.visible)yukata.poseSleeve(index,armStart,armEnd);}
 function stancePose(object,target){object.matrixAutoUpdate=false;object.matrix.copy(inverseShape).multiply(target);object.matrix.decompose(object.position,object.quaternion,object.scale);object.matrixWorldNeedsUpdate=true;}
 let appearanceItems=[],relaxing=false;
 let wardrobeGear='none',equipped='none';function equip(kind=wardrobeGear){equipped=kind;skateParts.forEach(s=>s.visible=kind==='skates');skis.visible=kind==='ski';board.visible=kind==='board';boots.forEach(b=>b.visible=kind==='ski'||kind==='board');}equip();
 let roundness=0,nameHeight=.9;
 function customize(o){
  const items=selectedItems(normalizeWardrobe(o.accessory));appearanceItems=items;tail.select(items);googly.root.visible=items.includes('googly-glasses');wardrobeGear=items.includes('board')?'board':items.includes('ski')?'ski':'none';equip();
  velvet.color.set(o.fur||'#f4eee5');fibreMaterial.color.copy(velvet.color);
  // Keep the grazing highlight dyed like the fibres, without a white rim or a
  // brightness threshold that abruptly changes navy, silver and pastel looks.
  velvet.sheen=.45;velvet.sheenColor.copy(velvet.color);velvet.emissive.copy(velvet.color);fibreMaterial.emissive.copy(velvet.color);groom(o.fluff??100);
  dye.update(o.fur||'#f4eee5',o.furTop);tail.color(o.fur||'#f4eee5');lowerVelvet.color.copy(velvet.color);lowerVelvet.emissive.copy(velvet.emissive);lowerVelvet.sheen=.45;lowerVelvet.sheenColor.copy(velvet.color);lowerFibres.color.copy(fibreMaterial.color);lowerFibres.emissive.copy(fibreMaterial.emissive);
  earVelvet.color.set(o.furTop||o.fur||'#f4eee5');earVelvet.sheenColor.copy(earVelvet.color);earInner.color.set(items.includes('ear-tone-cream')?'#e7c5a7':items.includes('ear-tone-lilac')?'#c1a3ce':'#d99fa9');
  for(const [mesh,id] of [...eyewear,...extras,[goggles,'goggles'],[crown,'crown'],[beret,'beret'],[scarf,'soft-scarf'],[earmuffs,'earmuffs'],[brooch,'star'],[ribbon,'ribbon'],[santa,'santa'],[helmet,'helmet']])mesh.visible=items.includes(id);
  roundness=((o.roundness??50)-50)/500;shape.scale.set(1+roundness,1-roundness*.5,1);
  const ears=items.find(item=>earShapes[item]),hat=items.some(id=>['santa','beret','beanie','fur-hat','winter-cap'].includes(id));
  headband.visible=!!ears&&!items.includes('helmet');headband.userData.kind=ears||'';if(ears)headband.geometry=earShapes[ears];
  headband.scale.set(.9,1,1);headband.position.y=0;
  // Ornaments rest on the hat instead of intersecting its crown.
  crown.position.y=hat?.28:0;brooch.position.y=hat?.67:.48;ribbon.position.y=hat?.7:.5;styleAccessories['winter-flower'].position.y=hat?.68:.48;
  selectedEyeStyle=items.find(item=>item.startsWith('eyes-'))||'';styleEyes(selectedEyeStyle);updateEyeOcclusion();
  let headTop=.8;for(const mesh of [headband,crown,beret,...extras.map(([m])=>m)])if(mesh.visible){if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();headTop=Math.max(headTop,mesh.geometry.boundingBox.max.y*mesh.scale.y+mesh.position.y);}
  if(santa.visible)headTop=Math.max(headTop,1.15);if(helmet.visible)headTop=Math.max(headTop,.97);if(earmuffs.visible)headTop=Math.max(headTop,.94);
  const headScale=1-roundness*.5;nameHeight=headTop*headScale+.86*(headScale-1)+.1;
 }
 function pose({phase=0,walking=false,time=0,landing=0,still=false,look=0,mode='',lean=0,tilt=0,speed=0,brake=false,gesture='',heldItem,balloonTone=0,balloonStyle='classic',roast=0,room='',diningStartedAt=null,diningNow=null}={}){
  landing=Number.isFinite(landing)?THREE.MathUtils.clamp(landing,0,1):0;
  yukata.visible=room==='ryokan';heldItem=heldItem??(['ski','lift','bath','sauna','lie','tea'].includes(mode)?'':appearanceItems.find(v=>['coffee','cocoa','odeng','marshmallow','bubble-wand','balloon','icecream'].includes(v))||'');
  group.rotation.order='YXZ';const spa=['bath','sauna','lie','tea','dining'].includes(mode),snack=gesture==='snack'&&mode!=='ski'&&mode!=='lift',warming=gesture==='warm'&&mode!=='ski'&&mode!=='lift',bubbling=gesture==='bubble'&&!spa&&mode!=='ski'&&mode!=='lift',waving=gesture==='wave'&&!spa&&mode!=='ski'&&mode!=='lift';if(spa!==relaxing){relaxing=spa;equip(spa?'none':wardrobeGear);}tail.pose({time,phase,walking,still,spa,yaw:group.rotation.y});googly.root.visible=!spa&&appearanceItems.includes('googly-glasses');googly.update({time,yaw:group.rotation.y,walking,phase,still});bathTowel.visible=spa;teaCup.visible=mode==='tea'||snack||['coffee','cocoa'].includes(heldItem);cupMaterial.color.set(heldItem==='coffee'?'#b7b0cd':heldItem==='cocoa'?'#ac857b':'#f0e3cd');tea.material.color.set(heldItem==='coffee'?'#4f3028':heldItem==='cocoa'?'#6c3b2a':'#976e42');santa.visible=!spa&&appearanceItems.includes('santa');helmet.visible=!spa&&appearanceItems.includes('helmet');headband.visible=!spa&&!!headband.userData.kind&&!appearanceItems.includes('helmet');for(const [mesh,id] of extras)mesh.visible=!spa&&appearanceItems.includes(id);beret.visible=!spa&&appearanceItems.includes('beret');scarf.visible=!spa&&appearanceItems.includes('soft-scarf');earmuffs.visible=!spa&&appearanceItems.includes('earmuffs');goggles.visible=!spa&&appearanceItems.includes('goggles');for(const [mesh,item] of eyewear)mesh.visible=!spa&&appearanceItems.includes(item);crown.visible=!spa&&appearanceItems.includes('crown');group.rotation.x=mode==='lie'?-Math.PI/2:mode==='ski'?tilt:0;
  if(gesture!==lastGesture){lastGesture=gesture;gestureStartedAt=time;}const gestureTime=Math.max(0,time-gestureStartedAt),carrying=!!skewerShapes[heldItem]&&mode!=='ski'&&mode!=='lift';heldSkewer.visible=carrying;
  if(carrying){if(currentHeldItem!==heldItem){currentHeldItem=heldItem;skewerMesh.geometry=skewerShapes[heldItem];lastRoast=-1;}const cooked=THREE.MathUtils.clamp(roast,0,1);if(cooked!==lastRoast){lastRoast=cooked;skewerWood.color.set(heldItem==='popcorn'?'#8b3445':heldItem==='balloon'?'#e1d7c8':'#b38b60');skewerFood.roughness=heldItem==='balloon'?.28:.78;if(heldItem==='popcorn')skewerFood.color.set('#fff0cc');else if(heldItem==='balloon')skewerFood.color.set('#d9a0ce');else if(heldItem==='candyfloss')skewerFood.color.set('#efc4d5');else if(heldItem==='icecream')skewerFood.color.set('#f1d8c5');else if(heldItem==='odeng')skewerFood.color.set('#dcb079');else skewerFood.color.copy(cooked<.5?toastWhite:toastTan).lerp(cooked<.5?toastTan:toastBrown,cooked<.5?cooked*2:(cooked-.5)*2);}}
  let sipProgress=0,blowProgress=0,eatProgress=0;bubbleWand.visible=(bubbling||heldItem==='bubble-wand')&&!spa&&mode!=='ski'&&mode!=='lift'&&!carrying;if(carrying)teaCup.visible=false;
  // Locomotion communicates input even when decorative sway is reduced.
  const swing=walking?Math.sin(phase):0;
  group.rotation.z=mode==='ski'?lean*.2:still?0:-swing*.065;
  const bounce=still?0:walking?Math.sin(phase*2)*.035:Math.sin(time*2.2)*.009;
  shape.position.set(0,0,0);shape.rotation.set(0,0,0);teaCup.rotation.set(0,0,0);
  shape.scale.set(1+roundness+landing*.11-bounce*.5,1-roundness*.5-landing*.16+bounce,1+landing*.08);
  feet.forEach((f,i)=>{const ph=phase+i*Math.PI;f.matrixAutoUpdate=true;f.position.set((i?1:-1)*.27,-.74+(walking?Math.max(0,Math.cos(ph))*.11:0),.14+(walking?Math.sin(ph)*.2:0));f.rotation.set(0,0,0);f.scale.set(.18,.12,.25);});
  for(const equipment of [skis,board]){equipment.matrixAutoUpdate=true;equipment.position.set(0,0,0);equipment.rotation.set(0,0,0);equipment.scale.set(1,1,1);}skiBlades.forEach((blade,i)=>{blade.position.x=(i?1:-1)*.27;blade.rotation.set(0,0,0);});
  for(let i=0;i<2;i++){const side=i?1:-1;armPose(i,[side*.68,-.38,.14-swing*side*.1]);}
  // Keep the supporting sole on the ground as the body rolls, changes shape or lands.
  const sin=Math.sin(group.rotation.z),cos=Math.cos(group.rotation.z);
  const lowest=Math.min(...feet.map(f=>f.position.x*shape.scale.x*sin+f.position.y*shape.scale.y*cos-Math.hypot(f.scale.x*shape.scale.x*sin,f.scale.y*shape.scale.y*cos)));
  shape.position.y=(-.86-lowest)/cos;
  if(['lift','carousel','ferris'].includes(mode)){
   group.rotation.z=0;shape.position.y=0;shape.rotation.x=-.06;
   feet.forEach(f=>{f.position.y=-.5;f.position.z=.65;});
   skis.position.set(0,.3,.52);board.position.set(0,.3,.52);
   for(let i=0;i<2;i++)armPose(i,[(i?1:-1)*.5,-.38,.52]);
  }
  if(mode==='rest'){shape.position.y=still?0:Math.sin(time*1.2)*.008;shape.rotation.x=-.025;feet.forEach(f=>{f.position.y=-.52;f.position.z=.58;});for(let i=0;i<2;i++)armPose(i,[(i?1:-1)*.49,-.36,.43]);}
  if(mode==='carousel'){shape.rotation.x=.035;for(let i=0;i<2;i++){const side=i?1:-1;feet[i].position.set(side*.56,-.81,.16);armPose(i,[side*.43,-.32,.55]);}}
  if(mode==='skate'){group.rotation.z=-lean*.1;shape.rotation.x=brake?-.09:.06+Math.min(speed/15,.12);for(let i=0;i<2;i++){const side=i?1:-1,sweep=still?0:Math.sin(time*3+i*Math.PI)*Math.min(speed/8,1);feet[i].position.x=side*(.27+Math.max(0,sweep)*.22);feet[i].position.z=.1+sweep*.2;feet[i].rotation.y=brake?-side*.45:side*Math.max(0,sweep)*.25;armPose(i,[side*(.65+Math.abs(sweep)*.12),-.18,.3]);}}
  if(mode==='ski'){
   const pace=THREE.MathUtils.clamp(speed/22,0,1),carve=THREE.MathUtils.clamp(lean,-1,1),crouch=.035+pace*.085+Math.abs(carve)*.035+(brake?.035:0),edge=carve*.065;
   shape.scale.y-=crouch;shape.scale.x+=crouch*.2;shape.position.set(0,-crouch*.7,.03+pace*.055);shape.rotation.set(.045+pace*.12-(brake?.09:0),0,carve*.08);
   // Boots and blades counter the torso crouch: their contact plane keeps following the slope.
   shape.updateMatrix();inverseShape.copy(shape.matrix).invert();stanceMatrix.makeRotationZ(-group.rotation.z+edge);stancePose(skis,stanceMatrix);stancePose(board,stanceMatrix);
   for(let i=0;i<2;i++){const side=i?1:-1,spread=.27+(brake?.045:0),toe=brake?-side*.18:0;skiBlades[i].position.x=side*spread;skiBlades[i].rotation.y=toe;partPosition.set(side*spread,-.74,.14);partRotation.setFromAxisAngle(yAxis,toe);partMatrix.compose(partPosition,partRotation,partScale);partMatrix.premultiply(stanceMatrix);stancePose(feet[i],partMatrix);armPose(i,[side*(.71+Math.abs(carve)*.07),-.3-(side*carve>0?.045:0),.38+pace*.1+(brake?.07:0)]);}
  }
  if(spa){
   const breath=still?0:Math.sin(time*1.25),swim=mode==='bath'?THREE.MathUtils.clamp(speed/2,0,1):0,stroke=still?0:Math.sin(time*(1.35+swim*1.6));
   shape.position.y=mode==='bath'?breath*(.018+swim*.01):breath*.008;shape.rotation.x=mode==='bath'?swim*.055:mode==='sauna'?-.045:0;shape.rotation.z=mode==='bath'?stroke*.012:0;
   feet.forEach((f,i)=>{f.position.y=-.52;f.position.z=.58+(mode==='bath'?(i?1:-1)*stroke*swim*.07:0);});
   for(let i=0;i<2;i++){const side=i?1:-1;if(mode==='bath')armPose(i,[side*(.78+stroke*side*swim*.07),.025+breath*.008,.3+stroke*side*(.018+swim*.1)],-.025);else if(mode==='lie')armPose(i,[side*.63,-.38,.23]);else armPose(i,[side*.43,-.39+breath*.009,.48]);}
  }
  const dining=mode==='dining'?diningServiceState(diningStartedAt,diningNow):null;
  if(dining?.holding&&!meal){meal=createRyokanMeal();meal.scale.setScalar(.42);shape.add(meal);}
  if(meal){meal.visible=!!dining?.holding;for(const part of meal.children)if(part.userData.food)part.visible=!dining?.finished;}
  if(dining?.stage==='handoff'){const reach=dining.progress;armPose(0,[-.43+.15*reach,-.39+.09*reach,.48+.25*reach]);armPose(1,[.43-.21*reach,-.39+.09*reach,.48+.32*reach]);}
  if(dining?.holding){const bite=still||dining.finished?0:Math.pow(.5+.5*Math.sin((dining.elapsed-9000)/1000*.8-Math.PI/2),5);eatProgress=bite;meal.position.set(0,-.32+bite*.07,.7);meal.rotation.set(0,0,still?0:Math.sin(time*.8)*.015);armPose(0,[-.28,-.3,.73]);armPose(1,[.22,-.3+bite*.14,.8]);}

  if(mode==='tea'||snack){const sip=still?0:Math.pow(.5+.5*Math.sin(time*.72),6);sipProgress=sip;teaCup.position.set(0,-.36+sip*.145,.88-sip*.04);teaCup.rotation.x=sip*.24;shape.rotation.x+=sip*.025;for(let i=0;i<2;i++)armPose(i,[(i?1:-1)*.14,-.36+sip*.145,.87-sip*.04]);}
  if(['coffee','cocoa'].includes(heldItem)&&mode!=='tea'){const sip=gesture==='drink'?(still?.9:THREE.MathUtils.smoothstep(gestureTime,0,.6)*(1-THREE.MathUtils.smoothstep(gestureTime,2.1,2.8))):0;sipProgress=sip;teaCup.position.set(.46*(1-sip),-.4+sip*.185,.52+sip*.32);teaCup.rotation.x=sip*.24;armPose(1,[teaCup.position.x+.13,teaCup.position.y,teaCup.position.z]);}
  if(warming){const hover=still?0:Math.sin(time*1.35)*.02;shape.rotation.x+=.055;for(let i=0;i<2;i++)armPose(i,[(i?1:-1)*.28,-.08+hover,.77],-.08);}
  if(heldItem==='bubble-wand'&&!bubbling){bubbleWand.position.set(.48,-.43,.51);bubbleWand.rotation.set(.25,0,-.15);armPose(1,[.49,-.49,.50]);}
  if(bubbling&&!carrying){blowProgress=still?.75:THREE.MathUtils.smoothstep(gestureTime,0,.25)*(.92+.08*Math.sin(gestureTime*3));bubbleWand.position.set(.14,-.27+blowProgress*.06,.76);bubbleWand.rotation.set(0,-.12,0);armPose(1,[.16,-.31+blowProgress*.05,.75]);shape.rotation.x+=blowProgress*.025;}
  if(['heart','joy','sad','surprise','dance'].includes(gesture)){const beat=still?0:Math.sin(time*5);if(gesture==='dance'){group.rotation.z=beat*.12;armPose(0,[-.8,.1+beat*.22,.25]);armPose(1,[.8,.1-beat*.22,.25]);}else if(gesture==='heart'){armPose(0,[-.2,.05,.82]);armPose(1,[.2,.05,.82]);}else if(gesture==='joy'||gesture==='surprise'){armPose(0,[-.65,.4+beat*.05,.25]);armPose(1,[.65,.4-beat*.05,.25]);}else group.rotation.x=.13;}
  if(waving){const wave=still?0:Math.sin(time*5.7);armPose(1,[.7+wave*.06,.3+(still?0:Math.sin(time*2.4)*.035),.25]);}
  if(carrying){heldSkewer.rotation.set(0,0,-.09);heldSkewer.position.set(.35,-.38,.47);if(gesture==='eat'){eatProgress=still?.8:THREE.MathUtils.smoothstep(gestureTime,0,.7)*(1-THREE.MathUtils.smoothstep(gestureTime,2.4,3.1));heldSkewer.position.set(.35*(1-eatProgress),-.38+eatProgress*(heldItem==='icecream'?.12:.04),.47+eatProgress*.26);heldSkewer.rotation.z=-.09*(1-eatProgress);}else if(gesture==='roast'){heldSkewer.position.set(.2,-.14,.72);heldSkewer.rotation.set(Math.PI/2-.18,0,0);shape.rotation.x+=.055;}partPosition.set(0,-.17,0).applyEuler(heldSkewer.rotation).add(heldSkewer.position);armPose(1,[partPosition.x,partPosition.y,partPosition.z]);if(gesture==='roast')armPose(0,[partPosition.x-.12,partPosition.y-.015,partPosition.z-.02]);}
  skewerMesh.visible=heldItem!=='balloon';heldBalloon.update({time,position:group.position,yaw:group.rotation.y,active:carrying&&heldItem==='balloon',still,tone:balloonTone,style:balloonStyle});
  sparkler.update(time,heldItem==='sparkler'&&!['ski','lift','bath','footbath','sauna','lie','dining'].includes(mode),still||globalThis.document?.body?.classList.contains('reduce-flash'));if(sparkler.root.visible){sparkler.root.position.set(.76,-.14,.54);sparkler.root.rotation.set(-.1,0,-.35);armPose(1,[.71,-.29,.56]);}
  if(carrying&&heldItem==='popcorn'){heldSkewer.position.set(.35,-.38,.59);heldSkewer.rotation.set(0,0,-.04);armPose(1,[.47,-.46,.59]);if(gesture==='eat'){const nibble=still?.7:Math.sin(Math.min(1,gestureTime/2.8)*Math.PI*3)**2;armPose(0,[.25*(1-nibble),-.21,.63+nibble*.24]);}}
  if((snack||warming||bubbling||waving||carrying)&&!walking&&!spa&&mode!=='rest'&&mode!=='ski'&&mode!=='lift'){shape.updateMatrix();inverseShape.copy(shape.matrix).invert();stanceMatrix.identity();stancePose(skis,stanceMatrix);stancePose(board,stanceMatrix);for(let i=0;i<2;i++){partPosition.set((i?1:-1)*.27,-.74,.14);partRotation.identity();partMatrix.compose(partPosition,partRotation,partScale);stancePose(feet[i],partMatrix);}}
  arms.instanceMatrix.needsUpdate=true;
  const reaction=(mode==='bath'&&(still||time%9>1.1))||['heart','joy','dance'].includes(gesture)||warming||waving||sipProgress>.6||eatProgress>.7?'content':'';if(activeEyeReaction!==reaction)styleEyes(selectedEyeStyle,reaction);reactions.visible=spa||snack||warming||bubbling||waving||eatProgress>.2||gesture==='roast';reactions.geometry=bubbling&&!carrying&&blowProgress>.3?pursedGeometry:reactionGeometry;
  const interval=mode==='ski'?4.2:spa?7.8:5.7,cycle=time%interval,blinkGate=cycle>interval-.2?Math.max(.06,Math.abs(cycle-(interval-.1))*10):1;
  const blink=mode==='lie'?.12:still?1:blinkGate*(mode==='ski'?.86:spa?.72+Math.sin(time*.6)*.035:1);
  // Opaque lenses cover every expression, including protruding clay symbols.
  // Keep the chosen style so taking goggles off restores it immediately.
  updateEyeOcclusion();
  eyes.forEach((e,i)=>{const profile=eyeProfiles[i];e.scale.y=profile.scale[1]*(profile.closed?1:blink);e.position.x=(i?1:-1)*profile.spacing+Math.max(-.025,Math.min(.025,look));});
 }
 let disposed=false;
 function dispose(){
  if(disposed)return;disposed=true;
  // Earlier expressions/ear styles may still have GPU buffers although their
  // geometry is no longer attached to a mesh. Release the complete owned cache.
  const cached=new Set([roundEye,dazedEye,flatEye,closedEye,contentEye,starEye,heartEye,reactionGeometry,pursedGeometry,...Object.values(skewerShapes)]),paint=new Set([eyeMat,eyeWhite,sclera,heartEyeMaterial,starEyeMaterial]);
  group.traverse(o=>{cached.delete(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])paint.delete(m);});
  tail.dispose();disposeOwnedScene(group);for(const geometry of cached)geometry.dispose();for(const material of paint)material.dispose();
 }
 customize({});return{group,eyes,feet,customize,pose,equip,setViewDetail,dispose,get displayHeight(){return heldSkewer.visible&&currentHeldItem==='balloon'?Math.max(nameHeight,1.65):nameHeight;},get nameHeight(){return relaxing?1.08:nameHeight;},get gear(){return wardrobeGear;},get winterReady(){return ['ski','board'].includes(equipped)&&boots.every(b=>b.visible);}};
}
