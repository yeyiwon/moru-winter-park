import {createSnowPaths} from './snow-path.js';
import * as THREE from './vendor/three.module.js';
import {alpine,alpineHeight,skiCenter,resortRides} from './resort-layout.js';

// Geometry and ride code sample the same height function: no decorative ramp above an unrelated floor.
export function buildAlpineResort(api){
 const hitMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
 const {scene,mesh,ball,cylinder,box,rod,torus,M}=api;
 const root=new THREE.Group();root.name='alpine-mountain';scene.add(root);
 const snow=M('#e5edf0',.96,0),groomed=M('#f0f4f4',.92,0),bankSnow=M('#d3e0e7',.98,0),rock=M('#526276',.92,.02),rockLight=M('#71828d',.95,0),timber=M('#80634d',.88,0),oak=M('#a38a6b',.83,0),ink=M('#233448',.72,.08),metal=M('#9bacae',.45,.4),brass=M('#b99e73',.48,.4),red=M('#9f4c4b',.66,.02),blue=M('#5d89a4',.7,.02),pine=[M('#294d4e',.98,0),M('#365c57',.98,0),M('#41685e',.98,0)];
 const windowMat=new THREE.MeshStandardMaterial({color:'#d3bb8a',emissive:'#c89a58',emissiveIntensity:.35,roughness:.4,metalness:.12});
 const warm=new THREE.MeshBasicMaterial({color:'#efd4a0'}),interactive=[],dynamic=new Set(),chairs=[];
 let seed=4277;const rand=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
 const ovalGeo=new THREE.SphereGeometry(1,12,8);
 function oval(mat,x,y,z,sx,sy,sz,p=root){const o=mesh(ovalGeo,mat,x,y,z,p);o.scale.set(sx,sy,sz);return o;}
 function place(x,z,name,y=alpineHeight(x,z)){const g=new THREE.Group();g.position.set(x,y,z);g.name=name;root.add(g);return g;}
 function target(x,y,z,w,h,d,action){const m=mesh(new THREE.BoxGeometry(w,h,d),hitMaterial,x,y,z,root);m.userData={winter:true,action};interactive.push(m);dynamic.add(m);return m;}
 function lamp(p,x,z,y=0){cylinder(.07,.12,2.5,ink,x,y+1.25,z,p,8);box(.36,.38,.3,warm,x,y+2.65,z,p);box(.52,.08,.44,ink,x,y+2.9,z,p);for(const dx of [-.18,.18])rod([x+dx,y+2.45,z-.15],[x+dx,y+2.85,z-.15],.015,brass,p);}

 // A smooth polar heightfield gives the island an uninterrupted, traversable mountain skin.
 const rings=100,sectors=160,positions=[alpine.x,alpineHeight(alpine.x,alpine.z),alpine.z],uv=[.5,.5],indices=[];
 for(let j=1;j<=rings;j++){const r=alpine.r*j/rings;for(let i=0;i<sectors;i++){const a=i/sectors*Math.PI*2,x=alpine.x+Math.cos(a)*r,z=alpine.z+Math.sin(a)*r;positions.push(x,alpineHeight(x,z),z);uv.push((x-alpine.x)/alpine.r/2+.5,(z-alpine.z)/alpine.r/2+.5);}}
 for(let i=0;i<sectors;i++)indices.push(0,1+(i+1)%sectors,1+i);
 for(let j=0;j<rings-1;j++)for(let i=0;i<sectors;i++){const a=1+j*sectors+i,b=1+j*sectors+(i+1)%sectors,c=a+sectors,d=b+sectors;indices.push(a,b,c,b,d,c);}
 const terrainGeo=new THREE.BufferGeometry();terrainGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));terrainGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));terrainGeo.setIndex(indices);terrainGeo.computeVertexNormals();const terrain=mesh(terrainGeo,snow,0,0,0,root);terrain.name='alpine-heightfield';
 // Deep blue-grey rock under the snow makes the mountain read as land, not a white slab.
 const underside=new THREE.CylinderGeometry(alpine.r,alpine.r*.66,22,128,7,true),up=underside.attributes.position;
 for(let i=0;i<up.count;i++){const x=up.getX(i),z=up.getZ(i),y=up.getY(i),a=Math.atan2(z,x),f=(11-y)/22,v=1+(.018*Math.sin(a*9)+.013*Math.cos(a*17))*Math.sin(f*Math.PI);up.setXYZ(i,x*v,y-11.08+f*1.7*Math.sin(a*5),z*v);}underside.computeVertexNormals();mesh(underside,rock,alpine.x,0,alpine.z,root);
 for(let i=0;i<28;i++){const a=i/28*Math.PI*2,r=alpine.r*(.86+rand()*.08),x=alpine.x+Math.cos(a)*r,z=alpine.z+Math.sin(a)*r;const cliff=oval(i%3?rock:rockLight,x,-5-rand()*8,z,4+rand()*4,7+rand()*6,4+rand()*3);cliff.rotation.y=-a;}

 function ribbon(points,width,mat,offset=.055){const pos=[],uv=[],idx=[],columns=Math.max(1,Math.ceil(width/.75));for(let i=0;i<points.length;i++){const p=points[i],prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],dx=next[0]-prev[0],dz=next[2]-prev[2],length=Math.hypot(dx,dz)||1,nx=-dz/length,nz=dx/length;for(let j=0;j<=columns;j++){const side=j/columns-.5,x=p[0]+nx*width*side,z=p[2]+nz*width*side;pos.push(x,alpineHeight(x,z)+offset,z);uv.push(j/columns,i/(points.length-1));if(i<points.length-1&&j<columns){const k=i*(columns+1)+j;idx.push(k,k+1,k+columns+1,k+1,k+columns+2,k+columns+1);}}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return mesh(g,mat,0,0,0,root);}

 const skiPoints=resortRides.ski.points.filter((p,i,a)=>i===0||Math.hypot(p[0]-a[i-1][0],p[2]-a[i-1][2])>.02),sledPoints=resortRides.sled.points;
 ribbon(skiPoints,18,groomed);ribbon(sledPoints,6.5,groomed,.075);
 // Subtle parallel grooming lines follow the terrain rather than floating across the gully.
 const grooveMat=M('#d4e1e8',1,0);
 for(const offset of [-7,-4.5,-2,2,4.5,7]){const p=skiPoints.map(v=>[v[0]+offset,0,v[2]]);ribbon(p,.07,grooveMat,.075);}
 function fence(points,width,spacing,mat){for(let i=0;i<points.length;i+=spacing){const p=points[i],prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],dx=next[0]-prev[0],dz=next[2]-prev[2],l=Math.hypot(dx,dz)||1;for(const side of [-1,1]){const x=p[0]-dz/l*width*side,z=p[2]+dx/l*width*side,y=alpineHeight(x,z);rod([x,y,z],[x,y+1.45,z],.035,mat,root);box(.45,.33,.035,side<0?blue:red,x,y+1.25,z,root);}}}
 fence(skiPoints,10.3,6,metal);fence(sledPoints,4,5,oak);
 for(const side of [-1,1]){const pts=sledPoints.map(p=>new THREE.Vector3(p[0]+side*3.9,alpineHeight(p[0]+side*3.9,p[2])+.85,p[2]));mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),100,.035,5,false),timber,0,0,0,root);}

 // One reusable irregular fir profile: layered boughs, quiet snow shelves, varied height and lean.
 function firGeometry(snowCap=false){const profile=snowCap?[new THREE.Vector2(.01,1),new THREE.Vector2(.07,.86),new THREE.Vector2(.03,.85),new THREE.Vector2(.14,.64),new THREE.Vector2(.09,.63),new THREE.Vector2(.23,.39),new THREE.Vector2(.15,.38),new THREE.Vector2(.3,.16)]:[new THREE.Vector2(.005,1),new THREE.Vector2(.1,.79),new THREE.Vector2(.035,.78),new THREE.Vector2(.19,.53),new THREE.Vector2(.08,.52),new THREE.Vector2(.29,.24),new THREE.Vector2(.13,.23),new THREE.Vector2(.36,.07),new THREE.Vector2(.04,.07)];const g=new THREE.LatheGeometry(profile,14),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x),v=1+.055*Math.sin(a*7+y*9);p.setX(i,x*v);p.setZ(i,z*v);}g.computeVertexNormals();return g;}
 const firGeo=firGeometry(),capGeo=firGeometry(true),trunkGeo=new THREE.CylinderGeometry(.025,.045,1,7);
 function tree(x,z,h){const y=alpineHeight(x,z),g=place(x,z,'alpine-fir',y);g.rotation.y=rand()*6;const trunk=mesh(trunkGeo,timber,0,h*.36,0,g);trunk.scale.set(h,h*.72,h);const b=mesh(firGeo,pine[Math.floor(rand()*3)],0,h*.14,0,g);b.scale.set(h,h,h);const cap=mesh(capGeo,bankSnow,0,h*.18,0,g);cap.scale.set(h*.98,h*.99,h*.98);}
 let planted=0;for(let attempt=0;attempt<950&&planted<185;attempt++){const a=rand()*Math.PI*2,r=25+Math.sqrt(rand())*(alpine.r-34),x=alpine.x+Math.cos(a)*r,z=alpine.z+Math.sin(a)*r;if(Math.hypot(x,z-alpine.z)>alpine.r-9)continue;if(z>-169||z<alpine.z-118)continue;if(Math.abs(x-skiCenter(z))<16&&z<-178&&z>-350)continue;const t=Math.max(0,Math.min(1,(-z-188)/152)),lx=-36+44*t;if(Math.abs(x-lx)<5&&z<-183&&z>-347)continue;if(Math.abs(x-72)<9&&z>-275&&z<-185)continue;if(Math.abs(x+40)<16&&Math.abs(z+176)<15)continue;const grade=Math.hypot(alpineHeight(x+1,z)-alpineHeight(x-1,z),alpineHeight(x,z+1)-alpineHeight(x,z-1))/2;if(grade>1.4)continue;tree(x,z,5+rand()*7);planted++;}
 for(const [x,z]of [[-56,-174],[-60,-188],[-25,-171],[20,-169],[34,-179],[49,-187],[89,-199]])tree(x,z,7+rand()*3);
 // A few exposed, rounded rock faces belong to steep mountain shoulders, never the groomed routes.
 for(const [x,z,s]of [[-65,-286,9],[-70,-310,8],[-83,-282,7],[100,-288,8],[93,-312,8],[-47,-339,5],[99,-252,7]]){const y=alpineHeight(x,z);const b=oval(rockLight,x,y-2,z,s,s*.5,s*.7);b.rotation.y=rand()*3;const cap=oval(bankSnow,x,y+s*.25,z,s*.94,.7,s*.64);cap.rotation.y=b.rotation.y;}

 // Long-span chairlift: both cable directions use the exact motion path shared with the rider.
 const liftPoints=resortRides.lift.points,forward=liftPoints.map(p=>new THREE.Vector3(p[0],p[1]+3.1,p[2])),backward=liftPoints.map(p=>new THREE.Vector3(p[0]+4,p[1]+3.1,p[2]));
 for(const pts of [forward,backward])mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),160,.025,5,false),ink,0,0,0,root);
 for(let i=4;i<liftPoints.length-3;i+=5){const p=liftPoints[i],y=alpineHeight(p[0],p[2]),h=p[1]+3.1-y,cx=p[0]+2;rod([cx,y,p[2]],[cx,y+h,p[2]],.11,metal,root);rod([cx-2.6,y+h,p[2]],[cx+2.6,y+h,p[2]],.09,ink,root);for(const side of [-1,1]){rod([cx,y+h-1.1,p[2]],[cx+side*2.2,y+h,p[2]],.05,metal,root);const wheel=torus(.19,.035,ink,cx+side*2,y+h,p[2],root);wheel.rotation.x=Math.PI/2;}cylinder(.42,.55,.18,rock,cx,y+.09,p[2],root,12);}
 function chair(){const g=new THREE.Group();g.name='alpine-lift-chair';root.add(g);dynamic.add(g);
 rod([0,3.1,-.65],[0,.72,-.65],.065,metal,g);
 box(2.5,.16,1.4,oak,0,0,0,g);box(2.5,.85,.13,ink,0,.55,-.65,g);
 for(const side of [-1,1]){rod([side*1.15,.1,-.6],[side*1.15,.9,.65],.045,metal,g);rod([side*1.15,.8,-.6],[0,2.3,-.65],.045,metal,g);}
 rod([-1.15,.9,.65],[1.15,.9,.65],.055,metal,g);rod([-1.1,-.45,1],[1.1,-.45,1],.045,metal,g);
 // Each animated chair needs only three material draws, independent of its frame detail.
 g.updateMatrixWorld(true);for(const mat of [metal,oak,ink]){const items=g.children.filter(o=>o.isMesh&&o.material===mat);if(items.length<2)continue;const chunks={position:[],normal:[],uv:[]};let n=0;for(const o of items){let geo=o.geometry.clone().applyMatrix4(o.matrix);if(geo.index)geo=geo.toNonIndexed();n+=geo.attributes.position.count;for(const key in chunks)chunks[key].push(geo.attributes[key].array);o.removeFromParent();geo.dispose();}const geo=new THREE.BufferGeometry();for(const key in chunks){const size=key==='uv'?2:3,out=new Float32Array(n*size);let off=0;for(const a of chunks[key]){out.set(a,off);off+=a.length;}geo.setAttribute(key,new THREE.BufferAttribute(out,size));}mesh(geo,mat,0,0,0,g);}return g;}
 function pathPoint(t){const f=Math.max(0,Math.min(.999999,t))*(liftPoints.length-1),i=Math.floor(f),a=liftPoints[i],b=liftPoints[Math.min(i+1,liftPoints.length-1)],u=f-i;return new THREE.Vector3(a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u);}
 for(let i=0;i<8;i++){const g=chair(),offset=i/8,back=offset>.5;g.position.copy(pathPoint(back?(1-offset)*2:offset*2));if(back){g.position.x+=4;g.rotation.y=Math.PI;}chairs.push({g,offset});}
 const rideChair=chair();rideChair.name='alpine-personal-chair';rideChair.visible=false;rideChair.position.copy(pathPoint(0));
 function station(point,name){const [x,seat,z]=point,y=alpineHeight(x,z),g=place(x+2,z,name,y);for(const side of [-1,1]){rod([side*3.5,0,-1.2],[side*3.5,5.1,-1.2],.12,ink,g);rod([side*3.5,0,1.2],[side*3.5,5.1,1.2],.12,ink,g);}box(8,.23,4.2,ink,0,5.2,0,g);box(8.2,.12,4.35,snow,0,5.38,0,g);const wheel=torus(.83,.08,metal,0,seat-y+3.1,0,g);wheel.rotation.x=Math.PI/2;box(4.3,.12,3.6,oak,0,.06,0,g);for(const side of [-1,1]){rod([side*2.1,.13,-1.5],[side*2.1,1.05,-1.5],.035,metal,g);rod([side*2.1,1.05,-1.5],[side*2.1,1.05,1.5],.035,metal,g);}return g;}
 station(liftPoints[0],'alpine-base-terminal');station(liftPoints.at(-1),'alpine-summit-terminal');
 // Broad summit terrace belongs to the actual terrain, with an open downhill edge.
 for(let i=0;i<=22;i++){const a=Math.PI*.12+i/22*Math.PI*1.75,x=8+Math.cos(a)*18,z=-348+Math.sin(a)*18;if(z>-334)continue;const y=alpineHeight(x,z);rod([x,y,z],[x,y+1.1,z],.055,timber,root);if(i){const b=a-Math.PI*1.75/22,px=8+Math.cos(b)*18,pz=-348+Math.sin(b)*18;rod([px,alpineHeight(px,pz)+1.05,pz],[x,y+1.05,z],.045,oak,root);}}
 for(const x of [-4,20]){const z=-350,y=alpineHeight(x,z);box(3,.16,.8,oak,x,y+.5,z,root);for(const side of [-1,1])box(.16,.45,.65,timber,x+side*1.1,y+.22,z,root);}
 // Low, snow-covered dismount apron follows ground directly beside the shared endpoint.
 const summit=liftPoints.at(-1);for(let j=0;j<4;j++){const z=summit[2]+j*.65,y=alpineHeight(summit[0],z);box(3.2,.09,.6,oak,summit[0],y+.045,z,root);}
 const trailToBase=Array.from({length:24},(_,i)=>{const t=i/23;return[-36+(8+36)*t,0,-188+Math.sin(t*Math.PI)*6+16*t];});createSnowPaths({root,stone:[M('#a1aaac',.98,0)],snow,heightAt:alpineHeight})(trailToBase.map(p=>[p[0],p[2]]),3.3);

 // Full-scale timber lodge: inset glazing, balcony rails, stone chimney and layered snow roof.
 const lodge=place(-40,-176,'alpine-base-lodge'),foundation=rockLight;
 box(18,.65,12,foundation,0,.32,0,lodge);box(17.3,5.7,11.3,timber,0,3.5,0,lodge);
 for(let i=0;i<54;i++)box(.11,5.6,.06,oak,-8.4+i*.318,3.5,5.69,lodge);
 for(const side of [-1,1])for(let i=0;i<32;i++)box(.06,5.6,.11,oak,side*8.69,3.5,-5.4+i*.34,lodge);
 for(const x of [-6,-3,3,6]){box(2.1,2.45,.08,windowMat,x,3.2,5.76,lodge);for(const dx of [-1.1,0,1.1])box(.065,2.58,.13,ink,x+dx,3.2,5.85,lodge);for(const y of [1.95,3.2,4.45])box(2.25,.065,.13,ink,x,y,5.85,lodge);box(2.4,.12,.4,oak,x,1.88,5.92,lodge);}
 box(1.8,3.2,.13,ink,0,2.2,5.8,lodge);box(1.45,2.6,.04,windowMat,0,2.35,5.89,lodge);rod([.5,1.7,5.98],[.5,2.25,5.98],.035,brass,lodge);
 const gable=new THREE.Shape();gable.moveTo(-8.65,0);gable.lineTo(0,4.3);gable.lineTo(8.65,0);gable.closePath();mesh(new THREE.ShapeGeometry(gable),timber,0,6.35,5.67,lodge);const backGable=mesh(new THREE.ShapeGeometry(gable),timber,0,6.35,-5.67,lodge);backGable.rotation.y=Math.PI;
 for(const side of [-1,1]){const r=box(10,.25,13.5,ink,side*4.3,8.5,0,lodge);r.rotation.z=-side*.46;const s=box(10,.24,13.65,snow,side*4.3,8.73,0,lodge);s.rotation.z=-side*.46;for(let z=-6;z<=6;z+=1.1){const icicle=mesh(new THREE.ConeGeometry(.055,.38+rand()*.35,5),bankSnow,side*8.75,6.25,z,lodge);icicle.rotation.z=Math.PI;}}
 box(1.2,4.1,1.4,rock,-5,9.5,-2,lodge);box(1.5,.2,1.7,ink,-5,11.65,-2,lodge);for(let y=8.2;y<11.5;y+=.35)box(1.24,.035,1.44,rockLight,-5,y,-2,lodge);
 box(18.5,.2,2.3,oak,0,.75,6.7,lodge);for(const side of [-1,1]){for(let i=0;i<8;i++)rod([side*(1.7+i*.96),.85,7.72],[side*(1.7+i*.96),1.75,7.72],.035,ink,lodge);rod([side*1.7,1.75,7.72],[side*8.8,1.75,7.72],.06,oak,lodge);}for(let i=0;i<4;i++)box(2.9,.18,1.0,foundation,0,.11+i*.18,9.6-i*.7,lodge);
 for(const x of [-7,7]){box(2,.16,.65,oak,x,1.15,6.4,lodge);for(const side of [-1,1])box(.12,.5,.5,ink,x+side*.7,.82,6.4,lodge);lamp(lodge,x,8.2);}
 // Skis, poles, folded blankets and a trail board make the base visibly inhabited.
 for(let i=0;i<5;i++){const x=10+i*.25,s=box(.16,2.6,.06,i%2?red:blue,x,1.5,4.6,lodge);s.rotation.z=-.16;rod([x+.08,.3,4.5],[x+.08,2.5,4.5],.016,metal,lodge);}for(let i=0;i<3;i++)box(.75,.12,.5,bankSnow,-7,1.3+i*.13,6.4,lodge);
 const sign=place(-26,-184,'alpine-trail-board');for(const x of [-1.2,1.2])rod([x,0,0],[x,3.1,0],.08,timber,sign);box(3,1.9,.18,ink,0,2.4,0,sign);for(let i=0;i<3;i++){const line=box(1.8,.055,.02,i===0?blue:i===1?red:bankSnow,.15,2.9-i*.42,.11,sign);line.rotation.z=(i-1)*.12;const disc=cylinder(.12,.12,.025,i===0?blue:i===1?red:bankSnow,-1.03,2.9-i*.42,.11,sign,16);disc.rotation.x=Math.PI/2;}box(3.2,.16,.6,snow,0,3.43,0,sign);
 const sledBase=resortRides.sled.points.at(-1),sledRack=place(sledBase[0]+4,sledBase[2]+2,'alpine-sled-hut');for(const x of [-1.4,1.4])rod([x,0,-.7],[x,2.1,-.7],.08,timber,sledRack);box(3.5,.15,2.4,ink,0,2.15,0,sledRack);box(3.55,.14,2.5,snow,0,2.28,0,sledRack);for(let i=0;i<3;i++){const g=new THREE.Group();g.position.set(-1+i,1,.1);g.rotation.z=.2;sledRack.add(g);for(const side of [-1,1]){rod([side*.3,-.55,-.5],[side*.3,-.55,.5],.035,red,g);rod([side*.3,-.55,.5],[side*.3,-.3,.68],.035,red,g);}for(let j=0;j<5;j++)box(.68,.06,.15,oak,0,-.38,-.3+j*.17,g);}lamp(sledRack,-2.5,1.4);
 target(-36,alpineHeight(-36,-188)+1.3,-188,5,2.6,4,'ski');target(sledBase[0]+4,alpineHeight(sledBase[0]+4,sledBase[2]+2)+1.2,sledBase[2]+2,5,2.5,4,'sled');

 // Merge stationary geometry by material. Moving chair roots retain small local meshes.
 root.updateMatrixWorld(true);const batches=new Map();root.traverse(o=>{if(!o.isMesh||Array.isArray(o.material)||dynamic.has(o))return;for(let p=o.parent;p&&p!==root;p=p.parent)if(dynamic.has(p))return;if(!o.geometry.attributes.normal||!o.geometry.attributes.uv)return;const k=o.material.uuid;if(!batches.has(k))batches.set(k,{material:o.material,items:[]});batches.get(k).items.push(o);});
 for(const {material,items}of batches.values()){if(items.length<2)continue;const chunks={position:[],normal:[],uv:[]};let n=0;for(const o of items){let g=o.geometry.clone().applyMatrix4(o.matrixWorld);if(g.index)g=g.toNonIndexed();n+=g.attributes.position.count;for(const key in chunks)chunks[key].push(g.attributes[key].array);o.removeFromParent();g.dispose();}const g=new THREE.BufferGeometry();for(const key in chunks){const size=key==='uv'?2:3,a=new Float32Array(n*size);let offset=0;for(const chunk of chunks[key]){a.set(chunk,offset);offset+=chunk.length;}g.setAttribute(key,new THREE.BufferAttribute(a,size));}g.computeBoundingSphere();mesh(g,material,0,0,0,root);}
 return{root,interactive,rideChair,update(t,still){if(still)return;for(const {g,offset}of chairs){const u=(t/90+offset)%1,back=u>.5;g.position.copy(pathPoint(back?(1-u)*2:u*2));if(back)g.position.x+=4;g.rotation.set(0,back?0:Math.PI,Math.sin(t*.6+offset)*.015);g.visible=!rideChair.visible||g.position.distanceTo(rideChair.position)>5;}}};
}
