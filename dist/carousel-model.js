import * as T from './vendor/three.module.js';
import {sculptedHorseCoats} from './carousel-horse-geometry.js';

// Authored carousel geometry is shared by the live world and the Blender/GLB export.
// Horses face local +Z. Saddle sockets are the physical cushion surface, not avatar origins.
export const carouselDimensions = Object.freeze({radius:7, orbitRadius:4.6, deckTop:.5, ceiling:5.55, horseCount:8, saddleHeight:1.77, bobBase:.65, bobAmplitude:.16});
const V=(x,y,z)=>new T.Vector3(x,y,z);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const transform=new T.Object3D();
function catmull(a,b,c,d,t){return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);}
function radiusAt(sections,t,key){const p=t*(sections.length-1),i=Math.floor(p),u=p-i;return Math.max(.001,catmull(sections[Math.max(0,i-1)][key],sections[i][key],sections[Math.min(sections.length-1,i+1)][key],sections[Math.min(sections.length-1,i+2)][key],u));}
function sculptedSweep(sections,steps=32,sides=20){
 const curve=new T.CatmullRomCurve3(sections.map(s=>V(s[0],s[1],s[2])),false,'catmullrom',.35),positions=[],uv=[],indices=[];
 for(let i=0;i<=steps;i++){
  const t=i/steps,p=curve.getPoint(t),tangent=curve.getTangent(t).normalize(),side=V(1,0,0);side.addScaledVector(tangent,-side.dot(tangent));if(side.lengthSq()<.001)side.set(0,0,1).addScaledVector(tangent,-tangent.z);side.normalize();const normal=new T.Vector3().crossVectors(tangent,side).normalize(),rx=radiusAt(sections,t,3),ry=radiusAt(sections,t,4);
  for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,q=p.clone().addScaledVector(side,Math.cos(a)*rx).addScaledVector(normal,Math.sin(a)*ry);positions.push(q.x,q.y,q.z);uv.push(j/sides,t);if(i<steps&&j<sides){const k=i*(sides+1)+j;indices.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}}
 }
 // Closed cross-section caps preserve thin legs when the authored anatomy is voxel welded.
 for(const end of [0,steps]){const center=positions.length/3,p=curve.getPoint(end/steps);positions.push(p.x,p.y,p.z);uv.push(.5,end/steps);for(let j=0;j<sides;j++){const a=end*(sides+1)+j;if(end===0)indices.push(center,a+1,a);else indices.push(center,a,a+1);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
 const normals=g.attributes.normal;for(let i=0;i<=steps;i++){const a=i*(sides+1),b=a+sides,n=V(normals.getX(a)+normals.getX(b),normals.getY(a)+normals.getY(b),normals.getZ(a)+normals.getZ(b)).normalize();normals.setXYZ(a,n.x,n.y,n.z);normals.setXYZ(b,n.x,n.y,n.z);}return g;
}
function curve(points,r=.025,steps=24,sides=6){return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>V(...p))),steps,r,sides,false);}
function rod(a,b,r){const start=V(...a),end=V(...b),delta=end.clone().sub(start),g=new T.CylinderGeometry(r,r,delta.length(),8);transform.position.copy(start.add(end).multiplyScalar(.5));transform.quaternion.setFromUnitVectors(V(0,1,0),delta.normalize());transform.scale.set(1,1,1);transform.updateMatrix();return g.applyMatrix4(transform.matrix);}
function bevelBlock(w,h,d,r=.04){
 r=Math.min(r,w/5,h/5,d/5);const x=-w/2,y=-h/2,s=new T.Shape();s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);const g=new T.ExtrudeGeometry(s,{depth:d-r*2,bevelEnabled:true,bevelThickness:r,bevelSize:r*.35,bevelSegments:2,curveSegments:6});g.translate(0,0,-d/2+r);return g;
}
function batch(parent,name,palette,painted=false){
 const parts=[];
 function add(g,material,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]){transform.position.set(...position);transform.rotation.set(...rotation);transform.scale.set(...scale);transform.updateMatrix();g.applyMatrix4(transform.matrix);parts.push({g,material,color:palette[material].color.clone(),finish:painted&&palette[material].metalness<.2?'painted':material});}
 function finish(){
  const meshList=[];
  for(const material of new Set(parts.map(p=>p.finish))){const selected=parts.filter(p=>p.finish===material),total=selected.reduce((n,{g})=>n+(g.index?g.index.count:g.attributes.position.count),0);const pos=new Float32Array(total*3),normal=new Float32Array(total*3),uv=new Float32Array(total*2),colors=material==='painted'?new Float32Array(total*3):null;let at=0;
   for(const {g,color} of selected){const plain=g.index?g.toNonIndexed():g;pos.set(plain.attributes.position.array,at*3);normal.set(plain.attributes.normal.array,at*3);uv.set(plain.attributes.uv.array,at*2);if(colors)for(let i=0;i<plain.attributes.position.count;i++)colors.set(color.toArray(),(at+i)*3);at+=plain.attributes.position.count;if(plain!==g)plain.dispose();g.dispose();}
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(pos,3));geometry.setAttribute('normal',new T.BufferAttribute(normal,3));geometry.setAttribute('uv',new T.BufferAttribute(uv,2));if(colors)geometry.setAttribute('color',new T.BufferAttribute(colors,3));geometry.computeBoundingSphere();const mesh=new T.Mesh(geometry,palette[material]);mesh.name=name+'-'+material;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);meshList.push(mesh);
  }return meshList;
 }
 return{add,finish};
}
function cushionGeometry(){
 const positions=[],uv=[],indices=[],nx=16,nz=20;
 for(let layer=0;layer<2;layer++)for(let iz=0;iz<=nz;iz++)for(let ix=0;ix<=nx;ix++){const u=ix/nx*2-1,v=iz/nz*2-1,x=u*.53,z=v*.55-.1,y=1.76-.21*u*u+.075*Math.pow(Math.abs(v),5)-(layer?.075:0);positions.push(x,y,z);uv.push(ix/nx,iz/nz);const k=layer*(nx+1)*(nz+1)+iz*(nx+1)+ix;if(ix<nx&&iz<nz){if(!layer)indices.push(k,k+nx+1,k+1,k+1,k+nx+1,k+nx+2);else indices.push(k,k+1,k+nx+1,k+1,k+nx+2,k+nx+1);}}
 const count=(nx+1)*(nz+1),edge=[];for(let i=0;i<=nx;i++)edge.push(i);for(let i=1;i<=nz;i++)edge.push(i*(nx+1)+nx);for(let i=nx-1;i>=0;i--)edge.push(nz*(nx+1)+i);for(let i=nz-1;i>0;i--)edge.push(i*(nx+1));for(let i=0;i<edge.length;i++){const a=edge[i],b=edge[(i+1)%edge.length];indices.push(a,b,a+count,b,b+count,a+count);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function earGeometry(side){return sculptedSweep([[side*.2,2.68,.94,.07,.09],[side*.23,2.83,.92,.09,.07],[side*.27,3.04,.88,.04,.025],[side*.28,3.11,.89,.001,.001]],14,12);}
function horseModel(parent,palette,index,sculpted=true){
 const horse=new T.Group();horse.name='carved-carousel-horse-'+index;parent.add(horse);const b=batch(horse,'sculpted-horse-'+index,palette,true),coat=index%3===0?'ivory':index%3===1?'pearl':'silverCoat',saddle=index%3===1?'burgundy':'navy';
 const baked=sculpted?sculptedHorseCoats[index%3]:null;
 const coatPart=g=>{if(baked)g.dispose();else b.add(g,coat);};
 if(baked){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(baked.position,3));g.setAttribute('normal',new T.Float32BufferAttribute(baked.normal,3));g.setAttribute('uv',new T.Float32BufferAttribute(baked.position.flatMap((v,i)=>i%3===0?[v*.2+.5,baked.position[i+2]*.2+.5]:[]),2));g.setIndex(baked.index);b.add(g,coat);}
 // Rounded rib cage, barrel and croup use authored cross-sections, not stretched spheres.
 coatPart(sculptedSweep([[0,1.23,-1.06,.005,.005],[0,1.28,-.86,.32,.35],[0,1.28,-.55,.49,.45],[0,1.24,-.12,.52,.46],[0,1.28,.35,.45,.43],[0,1.29,.68,.35,.4],[0,1.28,.85,.02,.02]],42,28));
 coatPart(sculptedSweep([[0,1.21,.52,.30,.30],[0,1.52,.67,.31,.34],[0,1.91,.73,.25,.29],[0,2.25,.89,.19,.25],[0,2.57,1.02,.17,.19],[0,2.72,1.02,.07,.10]],32,24));
 // Brow, cheek, long nasal bridge and a separate flattened muzzle profile.
 coatPart(sculptedSweep([[0,2.65,.89,.035,.045],[0,2.66,1.06,.195,.22],[0,2.55,1.27,.205,.23],[0,2.34,1.52,.17,.18],[0,2.20,1.72,.23,.16],[0,2.19,1.87,.2,.14],[0,2.21,1.96,.015,.025]],30,24));
 for(const side of [-1,1]){
  coatPart(earGeometry(side));b.add(sculptedSweep([[side*.205,2.77,.98,.01,.01],[side*.236,2.88,.978,.045,.015],[side*.267,3.04,.92,.002,.003]],10,10),'burgundy');
  b.add(new T.SphereGeometry(1,16,10), 'dark',[side*.191,2.60,1.18],[0,side*.17,0],[.028,.052,.071]);
  b.add(new T.SphereGeometry(.012,10,7),'ivory',[side*.217,2.618,1.21]);
  b.add(new T.SphereGeometry(1,14,8),'dark',[side*.207,2.245,1.80],[0,side*.2,.2],[.016,.041,.065]);
  b.add(curve([[side*.17,2.157,1.88],[side*.205,2.14,1.77],[side*.18,2.145,1.62]],.012,16),'leather');
 }
 for(const side of [-1,1]){
  const swing=((index+(side>0?1:0))%3-1)*.12;
  // Humerus/forearm, knee, cannon and pastern retain a recognisable equine silhouette.
  const fore=side>0?[[side*.31,1.35,.61,.17,.19],[side*.34,1.00,.67,.13,.15],[side*.35,.72,.69+swing,.1,.11],[side*.36,.39,.77+swing,.062,.075],[side*.36,.18,.78+swing,.085,.09],[side*.36,.11,.82+swing,.085,.12]]:[[side*.30,1.30,.57,.17,.18],[side*.34,1.00,.79,.13,.14],[side*.35,.73,.99,.09,.12],[side*.35,.53,.81,.067,.08],[side*.35,.57,.52,.08,.10]];
  coatPart(sculptedSweep(fore,22,14));const toe=fore[fore.length-1];b.add(sculptedSweep([[toe[0],toe[1]+.055,toe[2],.09,.12],[toe[0],toe[1]-.06,toe[2]+.025,.13,.16],[toe[0],toe[1]-.1,toe[2]+.04,.13,.16]],7,14),'hoof');
  const rear=side>0?[[side*.34,1.35,-.68,.20,.22],[side*.35,.95,-.70,.16,.18],[side*.36,.68,-.49,.11,.13],[side*.37,.43,-.82,.075,.09],[side*.37,.16,-.90,.08,.10]]:[[side*.32,1.33,-.69,.2,.22],[side*.35,.95,-.81,.15,.18],[side*.36,.66,-.66,.10,.13],[side*.36,.31,-.99,.068,.08],[side*.37,.12,-1.09,.08,.1]];
  coatPart(sculptedSweep(rear,24,14));const hoof=rear[rear.length-1];b.add(sculptedSweep([[hoof[0],hoof[1]+.05,hoof[2],.09,.12],[hoof[0],hoof[1]-.06,hoof[2]+.025,.125,.155],[hoof[0],hoof[1]-.10,hoof[2]+.04,.13,.16]],7,14),'hoof');
  // Hoof shoes and feathered fetlock texture stay small relative to the anatomy.
  for(const toe of [fore[fore.length-1],rear[rear.length-1]])b.add(curve([[toe[0]-.10,toe[1]-.08,toe[2]-.04],[toe[0]-.1,toe[1]-.08,toe[2]+.14],[toe[0],toe[1]-.08,toe[2]+.18],[toe[0]+.1,toe[1]-.08,toe[2]+.14],[toe[0]+.1,toe[1]-.08,toe[2]-.04]],.014,16),'silver');
 }
 // Mane is a flowing carved crest with layered strands; its roots follow the neck.
 for(let j=0;j<10;j++){const t=j/9,y=2.72-t*1.20,z=.85-t*.42,x=.04*Math.sin(j*1.7);b.add(sculptedSweep([[x,y,z,.055,.07],[x-.07,y-.10,z-.16,.065,.085],[x-.12,y-.26,z-.22,.04,.045],[x-.10,y-.34,z-.19,.005,.005]],10,10),'mane');}
 b.add(sculptedSweep([[0,1.42,-.95,.13,.15],[.07,1.30,-1.22,.16,.17],[.11,.98,-1.43,.16,.18],[.12,.64,-1.55,.13,.15],[.04,.27,-1.57,.05,.08],[-.04,.17,-1.50,.005,.005]],28,16),'mane');
 for(let j=0;j<5;j++)b.add(curve([[.06+(j-2)*.04,1.28,-1.25],[.10+(j-2)*.04,.85,-1.48],[.04+(j-2)*.02,.29,-1.59]],.009,20),'gold');
 // Layered saddle cloth, gilded piping, padded cushion and working stirrups.
 for(const side of [-1,1]){const cloth=new T.Shape();cloth.moveTo(-.57,0);cloth.lineTo(.57,0);cloth.lineTo(.55,-.46);cloth.quadraticCurveTo(0,-.68,-.55,-.46);cloth.closePath();b.add(new T.ExtrudeGeometry(cloth,{depth:.035,bevelEnabled:true,bevelSize:.018,bevelThickness:.012,bevelSegments:2}),saddle,[side*.56,1.52,-.1],[0,side*Math.PI/2,0]);
  b.add(curve([[side*.585,1.49,-.60],[side*.59,1.12,-.60],[side*.59,.99,-.1],[side*.59,1.12,.40],[side*.585,1.49,.40]],.025,24),'gold');
  b.add(curve([[side*.53,1.66,-.07],[side*.58,1.36,-.07],[side*.61,.86,.02]],.028,16),'leather');b.add(new T.TorusGeometry(.16,.025,8,24), 'gold',[side*.61,.76,.02],[0,Math.PI/2,0],[1,.8,1]);
  // Hand-to-bit reins clear the rider's face and leave the middle of the saddle unobstructed.
  b.add(curve([[side*.23,2.28,1.71],[side*.39,1.99,1.05],[side*.45,2.12,.44]],.018,24),'leather');
  b.add(curve([[side*.20,2.64,1.02],[side*.235,2.35,1.39],[side*.23,2.28,1.74]],.022,20),'leather');b.add(new T.TorusGeometry(.062,.013,6,16),'gold',[side*.245,2.28,1.70],[0,Math.PI/2,0]);
 }
 b.add(cushionGeometry(),saddle);for(const z of [-.63,.44])b.add(curve([[-.50,1.64,z],[-.30,1.8,z],[0,1.83,z],[.3,1.8,z],[.50,1.64,z]],.035,20),'gold');
 b.add(curve([[-.22,2.38,1.62],[0,2.42,1.65],[.22,2.38,1.62]],.026,20),'leather');b.finish();
 const saddleSocket=new T.Object3D();saddleSocket.name='carousel-saddle-'+index;saddleSocket.position.set(0,carouselDimensions.saddleHeight,-.1);saddleSocket.userData={seatSurface:true,forwardAxis:'+Z',avatarOriginOffset:.82};horse.add(saddleSocket);return{horse,saddleSocket};
}
function roofGeometry(start,end){
 const positions=[],uv=[],indices=[],rings=22,steps=10;
 for(let i=0;i<=rings;i++){const t=i/rings,r=.15+(6.86-.15)*t,y=5.64+2.9*Math.pow(1-t,.63)+.12*Math.sin(t*Math.PI);for(let j=0;j<=steps;j++){const a=start+(end-start)*j/steps;positions.push(Math.cos(a)*r,y,Math.sin(a)*r);uv.push(j/steps,t);if(i<rings&&j<steps){const k=i*(steps+1)+j;indices.push(k,k+1,k+steps+1,k+1,k+steps+2,k+steps+1);}}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function buildCarousel({sculpted=true}={}){
 const root=new T.Group();root.name='winter-grand-carousel';const rotor=new T.Group();rotor.name='carousel-moving-platform';root.add(rotor);
 const standard=(color,roughness=.6,metalness=.05)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const palette={painted:new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.5,metalness:.02}),ivory:standard('#eee6d4',.42),pearl:standard('#d5e0df',.42),silverCoat:standard('#a8b6bf',.44),gold:standard('#c6ab76',.28,.75),silver:standard('#b6c4cc',.25,.8),navy:standard('#1c3448',.44,.15),burgundy:standard('#612c38',.62),dark:standard('#111b25',.5),mane:standard('#a89b80',.57),hoof:standard('#35414b',.46,.1),leather:standard('#493c35',.62),wood:standard('#84705a',.85),light:new T.MeshBasicMaterial({color:'#ffe5ad',toneMapped:false}),iceLight:new T.MeshBasicMaterial({color:'#bcdcec',toneMapped:false})};
 const architecture=batch(root,'carousel-architecture',palette),floor=batch(rotor,'carousel-parquet',palette),bulbPositions=[];
 architecture.add(new T.CylinderGeometry(6.92,7,.25,96),'navy',[0,.16,0]);architecture.add(new T.CylinderGeometry(6.83,6.9,.13,96),'gold',[0,.35,0]);floor.add(new T.CylinderGeometry(6.72,6.72,.12,96),'wood',[0,.44,0]);
 for(const r of [1.4,2.9,6.4,6.68])floor.add(new T.TorusGeometry(r,.022,6,96),'gold',[0,.507,0],[Math.PI/2,0,0]);for(let i=0;i<64;i++){const a=i*Math.PI/32;floor.add(rod([Math.cos(a)*1.35,.508,Math.sin(a)*1.35],[Math.cos(a)*6.67,.508,Math.sin(a)*6.67],.009),'dark');}
 floor.finish();
 // Center housing and eight structural columns support a full height, clear canopy.
 architecture.add(new T.CylinderGeometry(.82,1.0,4.8,48),'ivory',[0,2.9,0]);for(const y of [.6,1.05,4.9,5.35])architecture.add(new T.CylinderGeometry(1.04,1.04,.12,48),'gold',[0,y,0]);
 for(let j=0;j<8;j++){const a=j*Math.PI/4+Math.PI/8,x=Math.cos(a)*6.25,z=Math.sin(a)*6.25;architecture.add(new T.CylinderGeometry(.13,.19,4.9,16),'ivory',[x,3,z]);for(const y of [.65,.9,5.12,5.35])architecture.add(new T.CylinderGeometry(.25,.25,.11,16),'gold',[x,y,z]);for(let k=0;k<4;k++){const angle=k*Math.PI/2;architecture.add(rod([x+Math.cos(angle)*.13,.95,z+Math.sin(angle)*.13],[x+Math.cos(angle)*.13,5,z+Math.sin(angle)*.13],.014),'gold');}
  const tangent=V(-Math.sin(a),0,Math.cos(a));for(const sign of [-1,1])architecture.add(curve([[x,4.65,z],[x+tangent.x*sign*.55,5.15,z+tangent.z*sign*.55],[x+tangent.x*sign*1.14,5.42,z+tangent.z*sign*1.14]],.055,24),'gold');
 }
 architecture.add(new T.CylinderGeometry(6.87,6.87,.20,96),'navy',[0,5.55,0]);for(const y of [5.43,5.66])architecture.add(new T.TorusGeometry(6.88,.046,8,96),'gold',[0,y,0],[Math.PI/2,0,0]);
 // Cream/navy silk roof panels, silver ribs, scalloped fascia and raised medallions.
 for(let i=0;i<24;i++){const a=i/24*Math.PI*2,b=(i+1)/24*Math.PI*2;architecture.add(roofGeometry(a,b),i%3===0?'ivory':'navy');const pts=[];for(let j=0;j<=22;j++){const t=j/22,r=.15+6.71*t;pts.push([Math.cos(a)*r,5.66+2.9*Math.pow(1-t,.63)+.12*Math.sin(t*Math.PI),Math.sin(a)*r]);}architecture.add(curve(pts,.025,28),'gold');const mid=(a+b)/2,x=Math.cos(mid)*6.88,z=Math.sin(mid)*6.88;architecture.add(new T.TorusGeometry(.49,.033,6,24,Math.PI),'gold',[x,5.43,z],[0,-mid+Math.PI/2,Math.PI]);for(let k=0;k<5;k++){const theta=a+(b-a)*k/5;bulbPositions.push([Math.cos(theta)*6.91,5.53,Math.sin(theta)*6.91]);}
  const plaque=new T.Shape();plaque.moveTo(-.35,-.02);plaque.bezierCurveTo(-.39,.26,-.16,.41,0,.44);plaque.bezierCurveTo(.16,.41,.39,.26,.35,-.02);plaque.bezierCurveTo(.2,-.17,-.2,-.17,-.35,-.02);architecture.add(new T.ExtrudeGeometry(plaque,{depth:.055,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2}),'ivory',[x,5.75,z],[0,-mid+Math.PI/2,0]);architecture.add(new T.TorusGeometry(.16,.022,8,24),'gold',[Math.cos(mid)*6.95,5.90,Math.sin(mid)*6.95],[0,-mid+Math.PI/2,0],[1,.9,1]);
 }
 architecture.add(new T.CylinderGeometry(.26,.55,.47,24),'gold',[0,8.66,0]);architecture.add(new T.CylinderGeometry(.09,.11,.72,16),'silver',[0,9.1,0]);
 // Snowflake finial uses six articulated branches rather than a blinding light ball.
 for(let j=0;j<6;j++){const a=j*Math.PI/3,x=Math.sin(a)*.40,y=Math.cos(a)*.40;architecture.add(rod([0,9.65,0],[x,9.65+y,0],.035),'gold');for(const sign of [-1,1])architecture.add(rod([x*.62,9.65+y*.62,0],[x*.62+Math.sin(a+sign*.8)*.16,9.65+y*.62+Math.cos(a+sign*.8)*.16,0],.02),'silver');}
 const seats=[],horses=[];
 for(let i=0;i<carouselDimensions.horseCount;i++){const a=i/carouselDimensions.horseCount*Math.PI*2,pivot=new T.Group();pivot.name='carousel-horse-pivot-'+i;pivot.position.set(Math.cos(a)*carouselDimensions.orbitRadius,0,Math.sin(a)*carouselDimensions.orbitRadius);pivot.rotation.y=-a;rotor.add(pivot);const {horse,saddleSocket}=horseModel(pivot,palette,i,sculpted);horse.position.y=carouselDimensions.bobBase;horses.push(horse);seats.push(saddleSocket);
  const support=batch(pivot,'carousel-offset-lift-'+i,palette);support.add(rod([.96,.5,-.25],[.96,5.43,-.25],.045),'gold');support.add(new T.CylinderGeometry(.085,.085,.40,12),'silver',[.96,1.65,-.25]);support.add(rod([.96,1.45,-.25],[.48,1.45,-.25],.045),'silver');support.finish();
 }
 for(let i=0;i<96;i++){const a=i/96*Math.PI*2;bulbPositions.push([Math.cos(a)*6.91,.29,Math.sin(a)*6.91]);}
 const lamps=new T.InstancedMesh(new T.SphereGeometry(.045,8,6),palette.light,bulbPositions.length);lamps.name='carousel-warm-bulbs';for(let i=0;i<bulbPositions.length;i++){transform.position.set(...bulbPositions[i]);transform.rotation.set(0,0,0);transform.scale.set(1,1,1);transform.updateMatrix();lamps.setMatrixAt(i,transform.matrix);}lamps.castShadow=false;root.add(lamps);architecture.finish();
 // Interior rings keep the seats visible at night without a bright central bloom.
 for(const x of [-3.5,3.5]){const light=new T.PointLight('#ffdfa9',11,9,2);light.position.set(x,5.1,0);root.add(light);}
 function update(time,still=false){if(still)return;rotor.rotation.y=time*.10;horses.forEach((horse,i)=>horse.position.y=carouselDimensions.bobBase+Math.sin(time*1.05+i*Math.PI*.5)*carouselDimensions.bobAmplitude);}
 root.userData.asset='authored-swept-equine-carousel';root.updateMatrixWorld(true);return{root,rotor,seats,horses,update,dimensions:carouselDimensions};
}
