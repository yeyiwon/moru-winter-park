import * as THREE from './vendor/three.module.js';
// Short, dense down follows the body; face trimming blends radially around each eye.
export function createCompanion({detail='full'}={}){
 const group=new THREE.Group(),shape=new THREE.Group();group.add(shape);
 const velvet=new THREE.MeshPhysicalMaterial({color:'#f4eee5',roughness:1,metalness:0,sheen:1,sheenColor:'#fff9f1',sheenRoughness:.85});
 const geo=new THREE.SphereGeometry(1,48,40),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const y=p.getY(i),width=.74*(1-.045*y);p.setXYZ(i,p.getX(i)*width,y*.74,p.getZ(i)*width*.91);}geo.computeVertexNormals();
 const body=new THREE.Mesh(geo,velvet);body.castShadow=true;shape.add(body);
 let seed=5921;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
 const positions=[],indices=[],segments=5,sides=3;
 for(let j=0;j<=segments;j++)for(let k=0;k<sides;k++){
  const t=j/segments,a=k/sides*Math.PI*2,r=.0016*(1-t)+.00012;
  positions.push(Math.cos(a)*r+.009*t*t,t*.055,Math.sin(a)*r+.006*t*t);
  if(j<segments){const v=j*sides+k,w=j*sides+(k+1)%sides;indices.push(v,w,v+sides,w,w+sides,v+sides);}
 }
 const fibreGeometry=new THREE.BufferGeometry();fibreGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));fibreGeometry.setIndex(indices);fibreGeometry.computeVertexNormals();
 const fibreMaterial=new THREE.MeshBasicMaterial({color:'#f4eee5',side:THREE.DoubleSide});
 const count=detail==='remote'?1800:(globalThis.innerWidth??1024)<650?16000:26000,fur=new THREE.InstancedMesh(fibreGeometry,fibreMaterial,count);fur.name='plush-fur';fur.frustumCulled=false;shape.add(fur);
 const fibres=[],dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0);
 for(let i=0;i<count;i++){
  const y=random()*2-1,a=random()*Math.PI*2,r=Math.sqrt(1-y*y),v=new THREE.Vector3(r*Math.cos(a),y,r*Math.sin(a)),width=.74*(1-.045*y);
  fibres.push({position:new THREE.Vector3(v.x*width,y*.74,v.z*width*.91),normal:new THREE.Vector3(v.x/width,y/.74,v.z/(width*.91)).normalize(),length:.8+random()*.35,twist:random()*Math.PI*2});
  // Wrapped baked light keeps subpixel fibres soft instead of dark, glittering triangles.
  fur.setColorAt(i,new THREE.Color().setScalar(.78+.19*Math.max(0,y*.65+v.z*.3)+random()*.025));
 }
 let lastFluff=-1;
 function groom(fluff){if(lastFluff===fluff)return;lastFluff=fluff;
  for(let i=0;i<count;i++){const f=fibres[i],eyeDistance=Math.min(Math.hypot((f.position.x-.205)/.13,(f.position.y-.075)/.15),Math.hypot((f.position.x+.205)/.13,(f.position.y-.075)/.15)),faceBlend=f.position.z>.45?1-Math.exp(-eyeDistance*eyeDistance*1.5):1;
   dummy.position.copy(f.position);dummy.quaternion.setFromUnitVectors(up,f.normal);dummy.rotateY(f.twist);
   // A continuous radial falloff avoids a rectangular shaved patch around the eyes.
   const underside=THREE.MathUtils.smoothstep(f.position.y,-.74,-.52);
   const length=(.18+.82*faceBlend)*(.35+.65*underside)*f.length*(.65+fluff/100*.35);
   dummy.scale.set(1,length,1);dummy.updateMatrix();fur.setMatrixAt(i,dummy.matrix);
  }fur.instanceMatrix.needsUpdate=true;
 }
 const orb=(mat,x,y,z,sx,sy,sz,parent=shape)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(1,28,20),mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;parent.add(m);return m;};
 const eyeMat=new THREE.MeshPhysicalMaterial({color:'#0d1422',roughness:.17,metalness:0,clearcoat:.6});const eyes=[],feet=[];
 for(const s of [-1,1]){const eye=orb(eyeMat,s*.205,.075,.663,.068,.094,.046);eyes.push(eye);orb(new THREE.MeshBasicMaterial({color:'#f7f2e9'}),-.25,.32,.94,.16,.12,.1,eye);feet.push(orb(velvet,s*.27,-.74,.14,.18,.12,.25));}
 const glasses=new THREE.Group();glasses.name='sunglasses';shape.add(glasses);
 const frameMat=new THREE.MeshStandardMaterial({color:'#17151f',roughness:.3,metalness:.15}),lensMat=new THREE.MeshPhysicalMaterial({color:'#172333',roughness:.14,metalness:.4,clearcoat:1});
 for(const side of [-1,1]){
  orb(frameMat,side*.245,.12,.704,.248,.188,.068,glasses);
  orb(lensMat,side*.245,.12,.755,.209,.146,.035,glasses);
  const arm=new THREE.Mesh(new THREE.BoxGeometry(.045,.045,.43),frameMat);arm.position.set(side*.47,.15,.51);arm.rotation.y=side*-.28;glasses.add(arm);
  const glint=orb(new THREE.MeshBasicMaterial({color:'#8a9ba9'}),side*.245-.045,.18,.785,.07,.012,.006,glasses);glint.rotation.z=-.35;
 }
 const bridge=new THREE.Mesh(new THREE.CapsuleGeometry(.025,.12,4,8),frameMat);bridge.rotation.z=Math.PI/2;bridge.position.set(0,.16,.73);glasses.add(bridge);
 const accents=new THREE.Group();shape.add(accents);
 const pin=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.075:.16;i?pin.lineTo(Math.cos(a)*r,Math.sin(a)*r):pin.moveTo(Math.cos(a)*r,Math.sin(a)*r);}pin.closePath();const brooch=new THREE.Mesh(new THREE.ExtrudeGeometry(pin,{depth:.025,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:3}),new THREE.MeshStandardMaterial({color:'#c5a578',metalness:.65,roughness:.3}));brooch.position.set(.43,.47,.4);brooch.rotation.z=-.2;accents.add(brooch);brooch.visible=false;
 const ribbon=new THREE.Group();ribbon.position.set(-.4,.5,.35);ribbon.rotation.z=.2;accents.add(ribbon);const satin=new THREE.MeshPhysicalMaterial({color:'#9684b2',roughness:.7,sheen:1});for(const side of [-1,1]){const loop=orb(satin,side*.11,0,0,.13,.085,.045,ribbon);loop.rotation.z=side*.35;}orb(satin,0,0,.035,.045,.06,.04,ribbon);ribbon.visible=false;
 const santa=new THREE.Group();santa.name='santa-hat';santa.position.set(0,.62,0);shape.add(santa);
 const red=new THREE.MeshStandardMaterial({color:'#a5444b',roughness:.95}),white=new THREE.MeshStandardMaterial({color:'#f7f2e9',roughness:1});
 const hp=[],hi=[],rings=14,slices=32;
 for(let j=0;j<=rings;j++){const t=j/rings,cx=.36*t*t,cy=.58*t-.17*t*t*t,rad=.44*Math.pow(1-t,.8)+.004;for(let k=0;k<=slices;k++){const a=k/slices*Math.PI*2;hp.push(cx+Math.cos(a)*rad,cy,Math.sin(a)*rad*.83);if(j<rings&&k<slices){const n=j*(slices+1)+k;hi.push(n,n+slices+1,n+1,n+1,n+slices+1,n+slices+2);}}}
 const hg=new THREE.BufferGeometry();hg.setAttribute('position',new THREE.Float32BufferAttribute(hp,3));hg.setIndex(hi);hg.computeVertexNormals();santa.add(new THREE.Mesh(hg,red));
 const brim=new THREE.Mesh(new THREE.TorusGeometry(.44,.065,8,32),white);brim.rotation.x=Math.PI/2;brim.scale.y=.83;santa.add(brim);orb(white,.38,.41,0,.105,.11,.105,santa);
 const boots=[];for(const foot of feet){const boot=orb(red,0,.13,-.06,1.1,1.18,1.04,foot);boot.visible=false;boots.push(boot);}
 const skis=new THREE.Group();skis.name='ski-equipment';shape.add(skis);
 const skiMat=new THREE.MeshStandardMaterial({color:'#a44b4f',roughness:.4,metalness:.15});for(const side of [-1,1]){const ski=new THREE.Mesh(new THREE.BoxGeometry(.16,.045,1.65),skiMat);ski.position.set(side*.27,-.87,.12);skis.add(ski);const tip=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(side*.27,-.87,.92),new THREE.Vector3(side*.27,-.85,1.02),new THREE.Vector3(side*.27,-.77,1.13)]),8,.07,5,false),skiMat);tip.scale.y=1;skis.add(tip);}
 const sled=new THREE.Group();sled.name='sled-equipment';shape.add(sled);const wood=new THREE.MeshStandardMaterial({color:'#ad815c',roughness:.85});for(let i=0;i<5;i++){const slat=new THREE.Mesh(new THREE.BoxGeometry(.8,.055,.18),wood);slat.position.set(0,-.88,-.36+i*.2);sled.add(slat);}for(const side of [-1,1]){const runner=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(side*.4,-1.02,-.65),new THREE.Vector3(side*.4,-1.02,.55),new THREE.Vector3(side*.4,-.8,.77)]),14,.035,6,false),skiMat);sled.add(runner);}
 function equip(kind='none'){skis.visible=kind==='ski';sled.visible=kind==='sled';boots.forEach(b=>b.visible=kind==='ski');}equip();
 let roundness=0;
 function customize(o){velvet.color.set(o.fur||'#f4eee5');fibreMaterial.color.copy(velvet.color);groom(o.fluff??100);glasses.visible=o.accessory==='sunglasses';roundness=((o.roundness??50)-50)/500;shape.scale.set(1+roundness,1-roundness*.5,1);brooch.visible=o.accessory==='star';ribbon.visible=o.accessory==='ribbon';santa.visible=o.accessory==='santa';}
 function pose({phase=0,walking=false,time=0,landing=0,still=false,look=0}={}){
  const swing=walking&&!still?Math.sin(phase):0;
  group.rotation.z=still?0:-swing*.065;
  const bounce=still?0:walking?Math.sin(phase*2)*.035:Math.sin(time*2.2)*.009;
  shape.scale.set(1+roundness+landing*.11-bounce*.5,1-roundness*.5-landing*.16+bounce,1+landing*.08);
  feet.forEach((f,i)=>{const ph=phase+i*Math.PI;f.position.z=.14+(walking&&!still?Math.sin(ph)*.2:0);f.position.y=-.74+(walking&&!still?Math.max(0,Math.cos(ph))*.11:0);});
  // Keep the supporting sole on the ground as the body rolls, changes shape or lands.
  const sin=Math.sin(group.rotation.z),cos=Math.cos(group.rotation.z);
  const lowest=Math.min(...feet.map(f=>f.position.x*shape.scale.x*sin+f.position.y*shape.scale.y*cos-Math.hypot(f.scale.x*shape.scale.x*sin,f.scale.y*shape.scale.y*cos)));
  shape.position.y=(-.86-lowest)/cos;
  const blink=still?1:((time%5.7)>5.5?Math.max(.06,Math.abs((time%5.7)-5.6)*10):1);
  eyes.forEach((e,i)=>{e.scale.y=.094*blink;e.position.x=(i?1:-1)*.205+Math.max(-.025,Math.min(.025,look));});
 }
 customize({});return{group,eyes,feet,customize,pose,equip};
}
