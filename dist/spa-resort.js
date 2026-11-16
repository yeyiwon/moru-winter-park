import * as T from './vendor/three.module.js';
import {spa} from './resort-layout.js';

// A bath garden laid out around water, with an open-front pavilion rather than a prop hut.
export function buildSpaResort(api){
 const hitMaterial=new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
 const {scene,M}=api,root=new T.Group();root.name='spa-resort';scene.add(root);
 const interactive=[],steam=[],waterSurfaces=[],moving=new Set();
 const snow=M('#e8eeeb',.98,0),stone=M('#aa9b86',.94,0),stoneLight=M('#c7b69b',.96,0),stoneDark=M('#756353',.94,0),rock=M('#5c6c70',.97,0),rockShade=M('#485b62',.98,0),cedar=M('#b17e52',.92,0),cedarLight=M('#d2aa72',.96,0),cedarDark=M('#70513b',.94,0),slate=M('#3e5358',.86,.04),brass=M('#b59b72',.6,.2),cloth=M('#ece4d0',1,0),green=M('#335b50',1,0),greenLight=M('#4d7262',1,0);
 const water=new T.MeshPhysicalMaterial({color:'#8db6a7',emissive:'#a1793d',emissiveIntensity:.12,roughness:.65,metalness:0,transparent:true,opacity:.84,clearcoat:.08,depthWrite:false});
 const paleWater=new T.MeshBasicMaterial({color:'#b5d9ce',transparent:true,opacity:.24,depthWrite:false});
 const lamp=new T.MeshStandardMaterial({color:'#ffe4b2',emissive:'#ffc177',emissiveIntensity:.62,roughness:.72});
 let seed=913;const rand=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
 const cube=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,12,8);
 function mesh(geo,mat,x=0,y=0,z=0,parent=root){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=!mat.transparent;m.receiveShadow=true;parent.add(m);return m;}
 function box(w,h,d,mat,x,y,z,parent=root){const m=mesh(cube,mat,x,y,z,parent);m.scale.set(w,h,d);return m;}
 function oval(mat,x,y,z,sx,sy,sz,parent=root){const m=mesh(sphere,mat,x,y,z,parent);m.scale.set(sx,sy,sz);return m;}
 function rod(a,b,r,mat,parent=root){const v=new T.Vector3(...a),end=new T.Vector3(...b),d=end.clone().sub(v),m=mesh(new T.CylinderGeometry(r,r,d.length(),6),mat,0,0,0,parent);m.position.copy(v.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
 function target(action,x,y,z,w,h,d){const m=mesh(new T.BoxGeometry(w,h,d),hitMaterial,x,y,z);m.userData={winter:true,action};interactive.push(m);moving.add(m);}
 function outline(cx,cz,rx,rz,n=64,irregular=.025){return Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2,f=1+Math.sin(a*3+.6)*irregular+Math.sin(a*5-.3)*irregular*.5;return new T.Vector2(cx+Math.cos(a)*rx*f,-cz-Math.sin(a)*rz*f);});}
 function shape(points){const s=new T.Shape();s.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))s.lineTo(p.x,p.y);s.closePath();return s;}
 const pools=[{x:-10,z:124,rx:7.4,rz:6.4},{x:-19,z:132,rx:3.7,rz:3}];
 const ground=shape(outline(spa.x,spa.z,spa.r,spa.r,128,.012));
 for(const p of pools)ground.holes.push(new T.Path(outline(p.x,p.z,p.rx,p.rz,64).reverse()));
 const groundGeo=new T.ShapeGeometry(ground,1);groundGeo.rotateX(-Math.PI/2);mesh(groundGeo,snow,0,.09,0);
 // Continuous irregular rock strata, no capped cylinder beneath the recessed pools.
 const sidePos=[],sideIdx=[];for(let ring=0;ring<5;ring++)for(let i=0;i<=128;i++){const a=i/128*Math.PI*2,r=spa.r*(1-ring*.095)*(1+.025*Math.sin(a*5+ring*.3)+.015*Math.sin(a*11)),y=ring===0?0:-ring*2.1+.35*Math.sin(a*4+ring);sidePos.push(Math.cos(a)*r,y,spa.z+Math.sin(a)*r);if(ring<4&&i<128){const n=ring*129+i;sideIdx.push(n,n+129,n+1,n+1,n+129,n+130);}}
 const sideGeo=new T.BufferGeometry();sideGeo.setAttribute('position',new T.Float32BufferAttribute(sidePos,3));sideGeo.setIndex(sideIdx);sideGeo.computeVertexNormals();mesh(sideGeo,rock);
 for(let i=0;i<34;i++){const a=i/34*Math.PI*2,r=spa.r-1,sz=1.4+rand()*1.5;const b=oval(i%3?rock:rockShade,Math.cos(a)*r,-1.9-rand()*3,spa.z+Math.sin(a)*r,sz,2+rand()*2,sz*.7);b.rotation.set(rand()*.2,a,rand()*.25);}
 function ribbon(points,width,mat,y=.12){const curve=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,y,z))),v=[],uv=[],idx=[];for(let i=0;i<=64;i++){const t=i/64,p=curve.getPoint(t),d=curve.getTangent(t),n=new T.Vector3(-d.z,0,d.x).normalize().multiplyScalar(width*.5);v.push(p.x+n.x,p.y,p.z+n.z,p.x-n.x,p.y,p.z-n.z);uv.push(0,t,1,t);if(i<64){const k=i*2;idx.push(k,k+2,k+1,k+1,k+2,k+3);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();mesh(g,mat);return curve;}
 // The paths fork once at a calm forecourt and arrive at real entrances.
 ribbon([[0,88],[0,96],[-.8,104],[0,110]],3.8,stoneLight);
 ribbon([[0,108],[-4,111],[-10,114],[-17.8,119],[-18,124]],3.2,stoneLight);
 ribbon([[-.4,108],[5,111.8],[10,114],[12,117]],3.4,stoneLight);
 const court=shape(outline(0,109,4.8,4,48,.025)),courtGeo=new T.ShapeGeometry(court);courtGeo.rotateX(-Math.PI/2);mesh(courtGeo,stoneLight,0,.135,0);
 for(let z=91;z<108;z+=2.7){const sx=Math.sin(z*.2)*.13;const tile=box(3.25,.024,.035,stone,sx,.15,z);tile.rotation.y=Math.sin(z)*.09;}
 function lantern(x,z,h=1.2){box(.48,.16,.48,stoneDark,x,.17,z);box(.17,h,.17,cedarDark,x,h/2+.2,z);box(.42,.5,.42,lamp,x,h+.2,z);for(const s of [-1,1])for(const t of [-1,1])box(.045,.57,.045,slate,x+s*.23,h+.2,z+t*.23);box(.64,.09,.64,slate,x,h+.51,z);box(.63,.06,.63,snow,x,h+.59,z);}
 for(const [x,z]of [[-2.6,96],[2.6,104],[-8,111],[-19.6,120],[8.6,112],[15.4,115],[-21.8,136],[1,136]])lantern(x,z,.9);
 // Stone terraces surround the water; pool shells stay below the deck.
 for(let poolIndex=0;poolIndex<pools.length;poolIndex++){
  const p=pools[poolIndex],ring=shape(outline(p.x,p.z,p.rx+1.9,p.rz+1.9,80,.025));ring.holes.push(new T.Path(outline(p.x,p.z,p.rx,p.rz,64).reverse()));const g=new T.ShapeGeometry(ring,1);g.rotateX(-Math.PI/2);mesh(g,stoneLight,0,.145,0);
  const basin=shape(outline(p.x,p.z,p.rx*.99,p.rz*.99,64)),bg=new T.ShapeGeometry(basin,1);bg.rotateX(-Math.PI/2);mesh(bg,stoneDark,0,-1.05,0);
  const wg=bg.clone(),surface=mesh(wg,water,0,.025,0);surface.name='recessed-hot-spring';waterSurfaces.push(surface);moving.add(surface);
  const wall=[],wallIdx=[];const edge=outline(p.x,p.z,p.rx,p.rz,64);for(let i=0;i<=64;i++){const e=edge[i%64];wall.push(e.x,.15,-e.y,e.x,-1.06,-e.y);if(i<64){const k=i*2;wallIdx.push(k,k+1,k+2,k+2,k+1,k+3);}}const wallGeo=new T.BufferGeometry();wallGeo.setAttribute('position',new T.Float32BufferAttribute(wall,3));wallGeo.setIndex(wallIdx);wallGeo.computeVertexNormals();mesh(wallGeo,stoneDark);
  const stones=poolIndex?30:52;for(let i=0;i<stones;i++){const a=i/stones*Math.PI*2,f=1+Math.sin(a*3+.6)*.025+Math.sin(a*5-.3)*.0125,x=p.x+Math.cos(a)*p.rx*f,z=p.z+Math.sin(a)*p.rz*f,sz=.48+rand()*.16,b=oval(i%4?stone:stoneDark,x,.25,z,sz,.24+rand()*.08,sz*.8);b.rotation.y=-a;if(i%4===0&&z>p.z+1)oval(snow,x,.46,z,sz*.8,.065,sz*.6);}
  for(let j=0;j<5;j++){const r=.8+j*(poolIndex?.43:.85),m=mesh(new T.RingGeometry(r-.012,r+.012,64),paleWater,p.x-.4,.034,p.z+.2);m.rotation.x=-Math.PI/2;m.scale.y=.76;moving.add(m);waterSurfaces.push(m);}
  // Steam is translucent vapour with normal blending, not emissive light.
  if(api.glowMap)for(let i=0;i<(poolIndex?6:14);i++){const a=rand()*Math.PI*2,r=Math.sqrt(rand())*.7,x=p.x+Math.cos(a)*p.rx*r,z=p.z+Math.sin(a)*p.rz*r,mat=new T.SpriteMaterial({map:api.glowMap,color:'#fff0d9',transparent:true,opacity:.14,depthWrite:false,blending:T.NormalBlending}),s=new T.Sprite(mat);s.position.set(x,.7,z);s.scale.set(2.7,1.8,1);root.add(s);moving.add(s);steam.push({s,x,z,phase:rand()});}
 }
 // Two low ledges make the large bath readable from the footpath.
 for(const [x,z,w,d]of [[-17.8,124,1.15,4],[-8,116.3,4,1],[-23.8,132,1,2.7]]){box(w,.22,d,cedarDark,x,.24,z);for(let i=0;i<Math.max(3,Math.round(w/.17));i++)box(.13,.07,d,cedarLight,x-w/2+.1+i*.17,.39,z);}
 // Rinse station and a small stone cascade into the rear soaking pool.
 for(let i=0;i<10;i++){const a=i*2.4,x=-17.7+Math.cos(a)*(1.5+rand()),z=136+Math.sin(a)*1.2,h=.8+rand()*2.1;const b=oval(i%3?rock:rockShade,x,h*.4,z,1.15+rand()*.5,h,1.05+rand()*.4);b.rotation.y=a;oval(snow,x,h*1.35,z,.85,.14,.7);}
 const fallMat=new T.MeshPhysicalMaterial({color:'#b4d9ce',transparent:true,opacity:.62,roughness:.18,metalness:0,depthWrite:false});
 for(let i=0;i<3;i++){const curve=new T.CatmullRomCurve3([new T.Vector3(-18.7+i*.18,2.8,135.1),new T.Vector3(-18.7+i*.18,2.1,134.7),new T.Vector3(-18.9+i*.17,.08,134)]);const fall=mesh(new T.TubeGeometry(curve,20,.045,5,false),fallMat);moving.add(fall);}
 for(const [x,z]of [[-3.4,116.8],[-1.8,117.4]]){box(.85,.14,.75,cedarDark,x,.21,z);box(.6,.5,.08,stoneDark,x,.47,z+.3);rod([x,.4,z+.28],[x,.82,z+.28],.035,brass);rod([x,.82,z+.28],[x,.82,z+.04],.035,brass);const bucket=mesh(new T.CylinderGeometry(.23,.2,.3,16),cedarLight,x,.42,z-.1);for(let j=0;j<12;j++){const a=j*Math.PI/6;box(.018,.28,.018,cedarDark,x+Math.cos(a)*.215,.42,z-.1+Math.sin(a)*.215);}bucket.rotation.y=.2;}
 // Spacious 18 × 16 m timber pavilion, rendered as an architectural cutaway.
 box(18.4,.3,16.4,stoneDark,12,.14,125);box(18,.08,16,cedar,12,.3,125);
 for(let i=0;i<60;i++)box(.017,.012,15.9,cedarDark,3.1+i*.3,.347,125);
 // Front doors are open, with an uninterrupted 4.4 m entry passage.
 for(const [x,w]of [[6.4,6.8],[17.6,6.8]]){box(w,.62,.18,cedar,x,.65,117);for(let i=0;i<Math.floor(w/.38);i++)box(.045,2.7,.08,cedarDark,x-w/2+.15+i*.38,2.3,117);}
 const glass=new T.MeshPhysicalMaterial({color:'#d0d9c6',transparent:true,opacity:.16,roughness:.3,metalness:0,side:T.DoubleSide,depthWrite:false});
 for(const x of [3,21]){box(.2,.8,16,cedar,x,.74,125);const gl=box(.025,2.9,15.7,glass,x,2.6,125);moving.add(gl);for(let z=117;z<=133;z+=2)box(.22,4.3,.22,cedarDark,x,2.5,z);box(.3,.24,16.8,cedarDark,x,4.65,125);}
 box(18,4.25,.22,cedar,12,2.45,133);for(let x=3.3;x<21;x+=.3)box(.035,4.1,.04,cedarLight,x,2.45,132.86);
 // Deep high windows in the rear wall keep the enclosed part warm and spacious.
 for(const x of [6,12,18]){box(3.4,1.45,.08,lamp,x,3.3,132.72);for(const side of [-1,0,1])box(.065,1.5,.12,cedarDark,x+side*1.12,3.3,132.64);for(const y of [2.58,3.3,4.02])box(3.5,.065,.12,cedarDark,x,y,132.62);}
 for(const z of [117,122,127,133]){for(const x of [3,21])box(.28,4.6,.28,cedarDark,x,2.64,z);rod([2.65,4.85,z],[12,6.8,z],.13,cedarDark);rod([12,6.8,z],[21.35,4.85,z],.13,cedarDark);box(18.7,.22,.22,cedarDark,12,4.75,z);rod([9,4.82,z],[12,6.65,z],.085,cedarLight);rod([15,4.82,z],[12,6.65,z],.085,cedarLight);}
 box(.25,.25,17.2,cedarDark,12,6.8,125);
 function roofPanel(side){const w=9.9,d=7.6,m=box(w,.21,d,slate,12+side*4.75,5.8,130.05);m.rotation.z=-side*.205;const cap=box(w,.1,d,snow,12+side*4.75,5.96,130.05);cap.rotation.z=-side*.205;for(let x=.6;x<9.5;x+=.75){const beam=box(.07,.07,d+.1,cedarDark,12+side*x,6.77-x*.208,130.05);beam.rotation.z=-side*.205;}}
 roofPanel(-1);roofPanel(1);
 // Long benches, lower step benches, individual pads and towel stacks.
 for(const [x,z,d]of [[7.5,125,10],[17,127,6]]){box(2.2,.55,d,cedarDark,x,.62,z);for(let i=0;i<11;i++)box(.16,.08,d,cedarLight,x-1+i*.2,.94,z);box(2.3,.22,d,cedar,x+(x<12?1.5:-1.5),.45,z);for(let i=0;i<Math.floor(d/2);i++){const zz=z-d/2+1+i*2;box(1.1,.09,.8,cloth,x,1.025,zz);const towel=box(.7,.08,.5,cloth,x+.1,1.11,zz+.12);towel.rotation.y=.07;}}
 const stove=mesh(new T.CylinderGeometry(1.1,1.2,.8,16),slate,12,.75,130);for(let i=0;i<18;i++){const a=i*2.4,r=Math.sqrt(i/18)*.9;oval(i%2?stone:stoneDark,12+Math.cos(a)*r,1.23+rand()*.18,130+Math.sin(a)*r,.3,.19,.25);}for(let i=0;i<18;i++){const a=i/18*Math.PI*2;box(.055,.9,.055,cedarDark,12+Math.cos(a)*1.42,.85,130+Math.sin(a)*1.42);}stove.name='sauna-heater';
 // Tea lounge on the open front side and a little shoe alcove.
 box(3.4,.16,1.5,cedarDark,16.5,.76,120);for(const x of [15.15,17.85])for(const z of [119.5,120.5])box(.13,.6,.13,cedarDark,x,.43,z);
 for(const x of [15.4,16.2,17,17.8]){mesh(new T.CylinderGeometry(.11,.1,.18,12),cloth,x,.96,120);mesh(new T.CylinderGeometry(.16,.16,.025,16),brass,x,.86,120);}
 const teapot=oval(slate,16.6,1.02,120.25,.25,.24,.22);rod([16.82,1.02,120.25],[17.02,1.14,120.25],.065,slate);mesh(new T.TorusGeometry(.2,.035,6,16),cedarDark,16.4,1.1,120.25).rotation.y=Math.PI/2;teapot.name='tea-service';
 for(const x of [15.2,17.6])for(const z of [118.8,121.3]){box(.9,.1,.7,cedarLight,x,.43,z);box(.08,.3,.55,cedarDark,x-.34,.25,z);box(.08,.3,.55,cedarDark,x+.34,.25,z);}
 for(let level=0;level<3;level++){box(2.8,.09,.6,cedarDark,5.2,.55+level*.43,118.5);for(let i=0;i<5;i++)box(.09,.43,.6,cedar,3.8+i*.7,.76+level*.43,118.5);for(let i=0;i<4;i++)for(const side of [-1,1])oval(cedarLight,4.16+i*.7+side*.12,.66+level*.43,118.4,.09,.04,.2);}
 for(const x of [9.2,14.8]){rod([x,4.65,121.4],[x,3.7,121.4],.02,brass);box(.55,.55,.55,lamp,x,3.45,121.4);for(const side of [-1,1])box(.04,.6,.6,cedarDark,x+side*.29,3.45,121.4);}
 // Snow garden surrounds the destination, leaving all arrival routes and pool edges open.
 function pine(x,z,h){mesh(new T.CylinderGeometry(.07,.16,h*.74,8),cedarDark,x,h*.37,z);for(let i=0;i<5;i++){const y=h*(.25+i*.14),r=h*(.28-i*.043);const c=mesh(new T.ConeGeometry(r,h*.36,10),i%2?green:greenLight,x,y,z);c.rotation.y=i*.4;const snowCap=mesh(new T.ConeGeometry(r*.82,h*.27,10),snow,x,y+h*.055,z);snowCap.rotation.y=i*.4;}}
 for(const [x,z,h]of [[-24,113,5.5],[-26,119,6.3],[-26,126,5.2],[-24,137,6],[-15,141,7],[-7,143,6.5],[1,144,7.2],[9,142,6.6],[17,139,6],[24,132,7],[27,124,6.5],[25,114,6],[-11,100,4.6],[10,99,5.5],[-18,104,5.8],[19,106,5]])pine(x,z,h);
 for(const [x,z,rx,rz]of [[-8,105,2.8,1.9],[8,105,2.5,1.8],[-21,111,2.8,1.5],[23,112,2.2,1.5]]){for(let i=0;i<5;i++){const a=i*2.4,r=Math.sqrt(rand()),b=oval(stoneDark,x+Math.cos(a)*rx*r,.33,z+Math.sin(a)*rz*r,.6+rand()*.7,.45+rand()*.4,.5+rand()*.7);b.rotation.y=a;oval(snow,b.position.x,b.position.y+.4,b.position.z,b.scale.x*.85,.12,b.scale.z*.8);}}

 // A few local pools of amber light make warmth belong to the rooms and water.
 for(const [x,y,z,power,range] of [[-15,3.2,119,55,20],[8,3.3,124,70,16],[17,3.3,127,65,15]]){const light=new T.PointLight('#ffc484',power,range,2);light.position.set(x,y,z);root.add(light);}
 function paperLamp(x,y,z,r=.48){const shade=oval(lamp,x,y,z,r,r*.78,r);shade.castShadow=false;for(let j=-2;j<=2;j++){const yy=j*r*.24,rr=r*Math.sqrt(Math.max(.1,1-(yy/(r*.78))**2));const hoop=mesh(new T.TorusGeometry(rr,.012,5,24),cedarDark,x,y+yy,z);hoop.rotation.x=Math.PI/2;}rod([x,y+r*.8,z],[x,y+r*1.7,z],.018,brass);}
 for(const [x,z] of [[5,121],[8,127],[16,123],[19,129]])paperLamp(x,3.5,z);
 // Folded linen and padded cedar loungers invite a different posture from the bath.
 const cushion=M('#d8ad88',1,0);
 for(const z of [124.9,127.9]){oval(cushion,17,1.12,z,1,.17,1.25);oval(cloth,17,1.28,z+1,.8,.19,.3);for(let j=0;j<4;j++)box(1.65,.018,.025,cloth,17,1.29,z-.6+j*.12);}
 for(const [x,z] of [[6,120],[19,131],[-16,116]]){const basket=mesh(new T.CylinderGeometry(.48,.38,.55,20),cedar,x,.51,z);for(let i=0;i<8;i++){const ring=mesh(new T.TorusGeometry(.39+i*.01,.018,5,24),cedarDark,x,.27+i*.065,z);ring.rotation.x=Math.PI/2;}for(let i=0;i<3;i++){const roll=mesh(new T.CylinderGeometry(.13,.13,.6,14),cloth,x-.24+i*.24,.87,z);roll.rotation.x=Math.PI/2;}}
 // A little timber landing and broad submerged treads lead into the main bath.
 for(let i=0;i<4;i++)box(2.5,.18,.65,stoneLight,-10,.10-i*.27,117.6+i*.55);
 for(const side of [-1,1])rod([-10+side*1.35,.65,117.3],[-10+side*1.35,-.1,119.5],.045,brass);
 // Low privacy screens frame the garden without closing the approach.
 for(const [cx,cz,n] of [[-22,122,5],[-8,133,8]])for(let i=0;i<n;i++){box(.12,1.9,.13,cedarDark,cx+i*.34,1.05,cz);if(i===0||i===n-1)oval(snow,cx+i*.34,2.04,cz,.14,.07,.15);}
 target('onsen',-10,.7,124,14.8,1.5,12.8);target('sauna',12,2.2,125,18,4.3,16);
 // Merge opaque static geometry by material while keeping water and vapour separate.
 root.updateMatrixWorld(true);const groups=new Map();root.traverse(o=>{if(!o.isMesh||moving.has(o)||Array.isArray(o.material))return;const key=o.material.uuid;if(!groups.has(key))groups.set(key,{material:o.material,items:[]});groups.get(key).items.push(o);});
 for(const {material,items}of groups.values()){if(items.length<2)continue;const chunks={position:[],normal:[],uv:[]};let count=0;for(const o of items){let g=o.geometry.clone().applyMatrix4(o.matrixWorld);if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}if(!g.attributes.normal)g.computeVertexNormals();const size=g.attributes.position.count;chunks.position.push(g.attributes.position.array);chunks.normal.push(g.attributes.normal.array);chunks.uv.push(g.attributes.uv?.array||new Float32Array(size*2));count+=size;g.dispose();o.removeFromParent();}const g=new T.BufferGeometry();for(const key of Object.keys(chunks)){const size=key==='uv'?2:3,out=new Float32Array(count*size);let at=0;for(const chunk of chunks[key]){out.set(chunk,at);at+=chunk.length;}g.setAttribute(key,new T.BufferAttribute(out,size));}g.computeBoundingSphere();mesh(g,material);}
 return{root,interactive,update(time,still){for(const {s,x,z,phase}of steam){const t=still?.4:(time*.075+phase)%1;s.position.set(x+(still?0:Math.sin(time*.12+phase)*.3),.25+t*3.5,z);s.scale.set(2.5+t*2.4,1.7+t*2.1,1);s.material.opacity=Math.sin(t*Math.PI)*.32;}}};
}
