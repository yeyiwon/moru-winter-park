import * as T from './vendor/three.module.js';
import {postOffice,rinkBounds,rinkEntry,skateRental,rinkLamps,rinkBenches} from './retreat-layout.js';

// Two authored destinations; their real interactions and terrain live in the controllers.
export function buildWinterRetreat(scene){
 const root=new T.Group();root.name='winter-retreat';scene.add(root);const dynamic=[];
 const cache=new Map(),M=(color,roughness=.8,metalness=0)=>{const key=[color,roughness,metalness].join();if(!cache.has(key))cache.set(key,new T.MeshStandardMaterial({color,roughness,metalness}));return cache.get(key);};
 const cedar=M('#9b7359'),cream=M('#e7d4b9'),dark=M('#3b4f55',.8,.12),brass=M('#c7a572',.3,.72),plum=M('#603d46',.65,.12),snow=M('#e3eaf0',1),blade=M('#bacbd0',.22,.72),glass=new T.MeshStandardMaterial({color:'#dfdcc7',emissive:'#ffb66e',emissiveIntensity:.65,roughness:.28,metalness:.12});
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
 const mailbox=group('wish-postbox',postOffice.x+postOffice.w/2+.8,postOffice.z+1.15);cylinder(.29,.34,.18,dark,0,.18,0,mailbox,20);cylinder(.24,.28,1.24,plum,0,.87,0,mailbox,24);mesh(new T.SphereGeometry(.29,24,12,0,Math.PI*2,0,Math.PI/2),plum,0,1.49,0,mailbox);ring(.28,.02,brass,0,.37,0,mailbox);ring(.29,.02,brass,0,1.49,0,mailbox);box(.33,.07,.035,dark,0,1.39,.28,mailbox);box(.36,.025,.065,brass,0,1.445,.29,mailbox);envelope(mailbox,0,.91,.282,.58);box(.27,.42,.018,plum,0,.59,.28,mailbox);oval(brass,.08,.61,.31,.022,.022,.01,mailbox);
 const rental=group('winter-skate-rental',skateRental.x,skateRental.z);booth(rental,skateRental.w,skateRental.d,'skate');
 const r=rinkBounds,rink=group('winter-outdoor-rink',r.x,r.z);
 const navy=M('#263d50',.55,.3),silver=M('#b9cbd1',.26,.72),marble=M('#d7dfe0',.63,.12),inlay=M('#748f9f',.46,.26),glow=new T.MeshBasicMaterial({color:'#ffe2ac',toneMapped:false});
 // The flush perimeter is a resort concourse, not a second island or a raised obstruction.
 function annulus(rx0,rz0,rx1,rz1,y,material,start=0,end=Math.PI*2,parent=rink){
  const positions=[],uv=[],indices=[],segments=Math.max(8,Math.ceil((end-start)*24));
  for(let i=0;i<=segments;i++){const a=start+(end-start)*i/segments;for(const [rx,rz]of [[rx0,rz0],[rx1,rz1]]){positions.push(Math.cos(a)*rx,y,Math.sin(a)*rz);uv.push(i/segments,rx===rx0?0:1);}if(i<segments){const k=i*2;indices.push(k,k+2,k+1,k+2,k+3,k+1);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return mesh(g,material,0,0,0,parent);
 }
 const concourse=annulus(r.rx-.08,r.rz-.08,r.fenceRx+2.6,r.fenceRz+2.6,.105,marble);concourse.name='rink-flush-concourse';
 for(const offset of [.23,2.33])annulus(r.fenceRx+offset,r.fenceRz+offset,r.fenceRx+offset+.025,r.fenceRz+offset+.025,.109,brass);
 // Fine expansion joints are flush with the stone and leave the east gate unobstructed.
 for(let j=0;j<64;j++){const a=j*Math.PI*2/64;rod([Math.cos(a)*(r.fenceRx+.3),.112,Math.sin(a)*(r.fenceRz+.3)],[Math.cos(a)*(r.fenceRx+2.3),.112,Math.sin(a)*(r.fenceRz+2.3)],.006,inlay,rink);}
 const iceBase=new T.MeshStandardMaterial({color:'#90b8c7',roughness:.48,metalness:.08});
 const base=mesh(new T.CircleGeometry(1,128),iceBase,0,r.iceY-.012,0,rink);base.rotation.x=-Math.PI/2;base.scale.set(r.rx,r.rz,1);base.name='skating-ice-bed';
 const frost=new T.MeshPhysicalMaterial({color:'#c3e5ec',roughness:.13,metalness:.16,transparent:true,opacity:.56,clearcoat:1,clearcoatRoughness:.075,ior:1.31,depthWrite:false});
 const ice=mesh(new T.CircleGeometry(1,128),frost,0,r.iceY,0,rink);ice.rotation.x=-Math.PI/2;ice.scale.set(r.rx,r.rz,1);ice.name='skating-ice';dynamic.push(ice);
 // Layered resurfacing lines, submerged bubbles and analytic lamp highlights.
 // These are authored ice shading, not a claim of real-time scene reflections.
 const lampPositions=rinkLamps.slice(0,8).map(p=>new T.Vector3(p.x,3.25,p.z));while(lampPositions.length<8)lampPositions.push(new T.Vector3(10000,10000,10000));
 const icePattern=new T.Mesh(new T.CircleGeometry(1,128),new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},lampPositions:{value:lampPositions},lampCount:{value:Math.min(rinkLamps.length,8)}},vertexShader:`varying vec2 vUv;varying vec3 vWorld;
 void main(){vUv=uv;vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`,
 fragmentShader:`varying vec2 vUv;varying vec3 vWorld;uniform float time;uniform vec3 lampPositions[8];uniform int lampCount;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 void main(){
  vec2 p=(vUv-.5)*2.;float radius=length(p),angle=atan(p.y,p.x);
  float streak=pow(max(0.,sin(radius*185.+sin(angle*3.)*.7+sin(angle*7.)*.15)),34.);
  float fine=pow(max(0.,sin(p.x*145.+sin(p.y*9.)*.7)),45.)*pow(max(0.,1.-abs(p.y)),3.);
  vec2 grid=p*58.,cell=floor(grid),within=fract(grid)-.5;float bubble=(1.-smoothstep(.025,.075,length(within)))*step(.975,hash(cell));
  float frostEdge=smoothstep(.87,1.,radius)*(.6+.4*hash(floor(p*72.)));
  vec3 viewDirection=normalize(cameraPosition-vWorld),reflection=reflect(-viewDirection,vec3(0.,1.,0.));float glint=0.;
  for(int i=0;i<8;i++){if(i>=lampCount)break;vec3 lightDirection=normalize(lampPositions[i]-vWorld);float spec=pow(max(0.,dot(reflection,lightDirection)),95.);glint+=spec*.8;}
  float sheen=pow(max(0.,1.-length((p-vec2(-.28,.1))*vec2(.75,1.1))),3.)*.045;
  float sparkle=pow(max(0.,sin(time*.3+hash(cell)*6.28)),28.)*bubble*.13;
  float alpha=min(.56,streak*.028+fine*.018+bubble*.11+frostEdge*.11+sheen+glint*.38+sparkle);
  vec3 color=mix(vec3(.66,.86,.94),vec3(1.,.86,.61),min(1.,glint));gl_FragColor=vec4(color,alpha);
 }`}));icePattern.name='ice-surface-detail';icePattern.rotation.x=-Math.PI/2;icePattern.position.y=r.iceY+.004;icePattern.scale.set(r.rx,r.rz,1);rink.add(icePattern);dynamic.push(icePattern);
 const gateAngle=Math.asin(r.gateHalfWidth/r.fenceRz),fenceSteps=112,low=gateAngle,high=Math.PI*2-gateAngle;
 function edge(a,rx=r.fenceRx,rz=r.fenceRz,y=0){return[Math.cos(a)*rx,y,Math.sin(a)*rz];}
 // Wrought-silver balustrade: structural posts, narrow rails and arched tracery.
 for(let j=0;j<=fenceSteps;j++){
  const a=low+(high-low)*j/fenceSteps,[x,,z]=edge(a),major=j%8===0||j===fenceSteps;
  cylinder(major?.082:.035,major?.105:.045,major?1.3:1.04,navy,x,major?.73:.6,z,rink,major?12:8);
  if(major){cylinder(.17,.21,.16,marble,x,.18,z,rink,12);cylinder(.12,.12,.045,brass,x,1.3,z,rink,12);oval(silver,x,1.43,z,.115,.135,.115,rink);}
  if(j<fenceSteps){const next=low+(high-low)*(j+1)/fenceSteps,mid=(a+next)/2,[xx,,zz]=edge(next);for(const y of [.31,1.08])rod([x,y,z],[xx,y,zz],.025,silver,rink);curve([[x,.58,z],edge(mid,r.fenceRx,r.fenceRz,.9),[xx,.58,zz]],.013,brass,rink,6);}
 }
 // Tall light finials follow the fence footprint; no poles occupy the walking concourse.
 const bays=14,bulbs=[];
 for(let bay=0;bay<=bays;bay++){
  const a=low+(high-low)*bay/bays,[x,,z]=edge(a);
  cylinder(.045,.08,2.9,navy,x,1.55,z,rink,12);cylinder(.11,.11,.055,brass,x,2.9,z,rink,12);oval(glow,x,3.04,z,.12,.16,.12,rink);oval(snow,x,3.2,z,.14,.035,.14,rink);
  if(bay<bays){const b=low+(high-low)*(bay+1)/bays,points=[];for(let k=0;k<=18;k++){const t=k/18,angle=a+(b-a)*t,y=2.97-.37*Math.sin(t*Math.PI);points.push(edge(angle,r.fenceRx,r.fenceRz,y));if(k>0&&k<18&&k%2===0)bulbs.push(edge(angle,r.fenceRx,r.fenceRz,y-.075));}curve(points,.012,navy,rink,18);}
 }
 for(const [x,y,z]of bulbs){cylinder(.019,.019,.055,silver,x,y+.035,z,rink,6);oval(glow,x,y-.015,z,.036,.052,.036,rink);}
 const snowPoints=[];for(let j=0;j<=120;j++){const a=low+(high-low)*j/120;snowPoints.push(edge(a,r.fenceRx+.13,r.fenceRz+.13,.16));}curve(snowPoints,.11,snow,rink,120);
 // Broad gate piers sit at the fence endpoints, outside the usable entry width.
 for(const side of [-1,1]){const x=Math.cos(gateAngle)*r.fenceRx,z=side*r.gateHalfWidth;cylinder(.15,.23,1.42,navy,x,.82,z,rink,12);cylinder(.23,.23,.09,brass,x,1.57,z,rink,12);oval(glow,x,1.76,z,.16,.18,.16,rink);}
 for(const lamp of rinkLamps)lantern(lamp.x,lamp.z,3.45);
 for(const {x,z,yaw=0}of rinkBenches){
  const b=group('rink-cedar-bench',x,z);b.rotation.y=yaw;
  for(let j=0;j<6;j++)box(4.6,.055,.13,cedar,0,.58,-.36+j*.145,b);
  for(const dx of [-1.9,1.9]){curve([[dx,.1,.36],[dx,.62,.36],[dx,.88,-.36],[dx,1.27,-.42]],.05,navy,b,18);rod([dx,.1,-.35],[dx,.59,-.35],.045,navy,b);curve([[dx,.61,.2],[dx,.87,.26],[dx,.94,-.16]],.033,brass,b,12);}
  for(const y of [.93,1.15])box(4.6,.12,.075,cedar,0,y,-.4,b);box(4.55,.035,.095,snow,0,1.235,-.4,b);
  for(const dx of [-1.3,0,1.3]){box(.035,.27,.08,brass,dx,1.04,-.39,b);oval(brass,dx,1.04,-.335,.05,.05,.012,b);}
 }
 // Two real lights support the authored ice highlights; the remaining bulbs share emissive finish.
 for(const side of [-1,1]){const light=new T.PointLight('#ffdaa2',28,29,2);light.position.set(r.x+side*r.rx*.57,3.6,r.z);root.add(light);}
 const officeLight=new T.PointLight('#ffc789',14,9,2);officeLight.position.set(postOffice.entry.x,2.5,postOffice.entry.z);root.add(officeLight);
 // Opaque parts are merged by finish; the entire retreat remains a small draw set.
 const batches=new Map();root.updateMatrixWorld(true);root.traverse(o=>{if(!o.isMesh||o.material.transparent||o.material.isShaderMaterial||dynamic.includes(o)||Array.isArray(o.material))return;const key=o.material.uuid;if(!batches.has(key))batches.set(key,{material:o.material,items:[]});batches.get(key).items.push(o);});
 for(const {material,items}of batches.values()){if(items.length<2)continue;const arrays={position:[],normal:[],uv:[]};let count=0;for(const item of items){let g=item.geometry.clone().applyMatrix4(item.matrixWorld);if(g.index){const source=g;g=g.toNonIndexed();source.dispose();}if(!g.attributes.normal)g.computeVertexNormals();const n=g.attributes.position.count;for(const key of Object.keys(arrays))arrays[key].push(g.attributes[key]?.array||new Float32Array(n*(key==='uv'?2:3)));count+=n;item.removeFromParent();g.dispose();}const g=new T.BufferGeometry();for(const key of Object.keys(arrays)){const width=key==='uv'?2:3,out=new Float32Array(count*width);let offset=0;for(const a of arrays[key]){out.set(a,offset);offset+=a.length;}g.setAttribute(key,new T.BufferAttribute(out,width));}g.computeBoundingSphere();mesh(g,material);}
 return{root,dynamic,entry:rinkEntry,update(time,still){icePattern.material.uniforms.time.value=still?0:time;}};
}
