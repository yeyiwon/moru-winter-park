import * as THREE from './vendor/three.module.js';

// Accessories share immutable geometry/materials between the world, preview and
// visitors. Each piece is one mesh, with a small number of material draw groups.
const cache=new Map();
const materials={
 black:new THREE.MeshPhysicalMaterial({color:'#101116',roughness:.28,metalness:.04,clearcoat:.75}),
 smoke:new THREE.MeshPhysicalMaterial({color:'#171d26',roughness:.18,metalness:.08,clearcoat:.9}),
 lensGlint:new THREE.MeshBasicMaterial({color:'#b4c9d3',transparent:true,opacity:.32}),
 silver:new THREE.MeshStandardMaterial({color:'#d6e2e6',metalness:.68,roughness:.2,emissive:'#b5c8ce',emissiveIntensity:.07}),
 crystal:new THREE.MeshPhysicalMaterial({color:'#d7ebef',transparent:true,opacity:.13,roughness:.09,metalness:.1,depthWrite:false}),
 glint:new THREE.MeshBasicMaterial({color:'#dcebf0',transparent:true,opacity:.6}),
 gold:new THREE.MeshStandardMaterial({color:'#dcb877',metalness:.86,roughness:.25,side:THREE.DoubleSide}),
 gem:new THREE.MeshPhysicalMaterial({color:'#a5d6d0',metalness:.18,roughness:.12,clearcoat:1}),
 satin:new THREE.MeshPhysicalMaterial({color:'#a38caf',roughness:.5,side:THREE.DoubleSide,sheen:1,sheenColor:'#efd9f3',sheenRoughness:.36}),
 satinEdge:new THREE.MeshPhysicalMaterial({color:'#d0b3d8',roughness:.64,sheen:.9}),
 knit:new THREE.MeshPhysicalMaterial({color:'#d5c6b4',roughness:1,sheen:.8,sheenColor:'#f0e5d7'}),
 knitRib:new THREE.MeshStandardMaterial({color:'#e7dbcb',roughness:1}),
 wool:new THREE.MeshPhysicalMaterial({color:'#5e6878',roughness:1,sheen:.85,sheenColor:'#a9b1c0',sheenRoughness:1}),
 woolBand:new THREE.MeshStandardMaterial({color:'#4d5666',roughness:1}),
};
function merge(parts){
 const geometry=new THREE.BufferGeometry(),attributes={position:[],normal:[],uv:[]};let count=0;
 for(const material of [...new Set(parts.map(p=>p.material))].sort((a,b)=>a-b)){
  const begin=count;
  for(const part of parts){if(part.material!==material)continue;const source=part.geometry.index?part.geometry.toNonIndexed():part.geometry;
   for(const key in attributes)attributes[key].push(...source.attributes[key].array);count+=source.attributes.position.count;
   if(source!==part.geometry)source.dispose();part.geometry.dispose();
  }geometry.addGroup(begin,count-begin,material);
 }
 for(const [key,values] of Object.entries(attributes))geometry.setAttribute(key,new THREE.Float32BufferAttribute(values,key==='uv'?2:3));
 geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}
function tube(points,radius=.01,segments=24,sides=6,closed=false){return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed),segments,radius,sides,closed);}
function sphere(position,scale,segments=16){return new THREE.SphereGeometry(1,segments,12).scale(...scale).translate(...position);}
function extrude(shape,depth=.016,bevel=.004,curveSegments=18){return new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,curveSegments});}
function star(radius=.15,inner=.073){const shape=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?inner:radius;i?shape.lineTo(Math.cos(a)*r,Math.sin(a)*r):shape.moveTo(Math.cos(a)*r,Math.sin(a)*r);}shape.closePath();return shape;}
function curveEyewear(geometry){const p=geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,p.getZ(i)+.77-.115*(x/.6)**2);}geometry.computeVertexNormals();return geometry;}
function eyeContour(side,style,scale=1){
 const shape=new THREE.Shape(),point=(x,y)=>[side*(.255+(x-.255)*scale),.09+(y-.09)*scale];
 const move=(x,y)=>shape.moveTo(...point(x,y)),line=(x,y)=>shape.lineTo(...point(x,y)),curve=(x,y,ex,ey)=>shape.quadraticCurveTo(...point(x,y),...point(ex,ey));
 if(style==='oval')shape.absellipse(side*.255,.09,.196*scale,.123*scale,0,Math.PI*2,side<0);
 else if(style==='cat-eye'){
  move(.066,.145);curve(.081,.205,.174,.211);curve(.331,.216,.479,.264);
  curve(.494,.268,.484,.239);line(.446,.071);curve(.43,-.024,.33,-.027);
  line(.166,-.023);curve(.093,-.018,.078,.053);curve(.064,.109,.066,.145);
 }else{
  move(.066,.177);curve(.062,.221,.112,.225);line(.407,.22);curve(.458,.216,.454,.172);
  line(.433,.029);curve(.425,-.031,.367,-.036);line(.153,-.042);
  curve(.096,-.038,.083,.016);line(.066,.147);curve(.063,.162,.066,.177);
 }
 shape.closePath();return shape;
}
function sunglasses(style='classic'){
 const parts=[],add=(geometry,material)=>parts.push({geometry,material});
 for(const side of [-1,1]){
  // Thin acetate rims surround inset lenses; curved temples reach the sides of the unchanged head.
  const outer=eyeContour(side,style),inner=eyeContour(side,style,.88);outer.holes.push(new THREE.Path(inner.getPoints(10)));
  add(curveEyewear(extrude(outer,.022,.004,10)),0);
  add(curveEyewear(extrude(inner,.007,.002,10).translate(0,0,.01)),1);
  const hinge=style==='cat-eye'?[.467,.217]:style==='oval'?[.441,.112]:[.441,.175];
  add(tube([[side*hinge[0],hinge[1],.715],[side*.578,.15,.44],[side*.684,.105,.07],[side*.657,.035,-.17]],.012,24,8),0);
  add(tube([[side*(hinge[0]-.012),hinge[1],.727],[side*(hinge[0]+.018),hinge[1]-.008,.707]],.005,6,6),2);
  const reflection=style==='oval'?[[.13,.139],[.187,.175],[.247,.18]]:style==='cat-eye'?[[.13,.166],[.225,.18],[.316,.191]]:[[.132,.18],[.222,.185],[.305,.18]];
  add(curveEyewear(tube(reflection.map(([x,y])=>[side*x,y,.02]),.0025,12,5)),3);
 }
 const bridgeY=style==='oval'?.11:.142;add(tube([[-.071,bridgeY,.772],[0,bridgeY+.019,.784],[.071,bridgeY,.772]],.011,14,8),0);
 return {geometry:merge(parts),materials:[materials.black,materials.smoke,materials.silver,materials.lensGlint],name:style==='classic'?'sunglasses':style+'-sunglasses'};
}
function silverGlasses(){
 const parts=[],add=(geometry,material)=>parts.push({geometry,material});
 for(const side of [-1,1]){
  const outline=new THREE.Shape();outline.absellipse(side*.215,.092,.174,.14,0,Math.PI*2,false);
  const inner=new THREE.Path();inner.absellipse(side*.215,.092,.16,.126,0,Math.PI*2,true);outline.holes.push(inner);
  // The lens and beveled rim use the same facial curvature; a flat lens used to cut across the rim.
  add(curveEyewear(extrude(outline,.012,.003,28)),0);
  const lensShape=new THREE.Shape();lensShape.absellipse(side*.215,.092,.159,.125,0,Math.PI*2,false);
  add(curveEyewear(new THREE.ShapeGeometry(lensShape,32).translate(0,0,.004)),1);
  add(tube([[side*.385,.128,.727],[side*.54,.15,.49],[side*.675,.12,.07],[side*.65,.055,-.17]],.011,28,8),0);
  add(sphere([side*.39,.125,.725],[.025,.017,.018]),0);
  add(sphere([side*.067,.038,.724],[.018,.028,.011]),1);
  add(curveEyewear(tube([[side*.13,.172,.018],[side*.21,.193,.018],[side*.27,.18,.018]],.0025,12,6)),2);
 }
 add(tube([[-.048,.103,.782],[0,.135,.79],[.048,.103,.782]],.011,18,8),0);
 return {geometry:merge(parts),materials:[materials.silver,materials.crystal,materials.glint],name:'silver-glasses'};
}
function crown(){
 const parts=[],add=(geometry,material)=>parts.push({geometry,material});
 const radius=.28;
 for(const y of [.765,.815])add(new THREE.TorusGeometry(radius,.016,8,48).rotateX(Math.PI/2).translate(0,y,-.035),0);
 const vertices=[],uv=[],indices=[],segments=80;
 for(let i=0;i<=segments;i++){
  const a=i/segments*Math.PI*2,peak=Math.pow(.5+.5*Math.cos(a*8),2),top=.825+.145*peak;
  for(const y of [.785,top]){vertices.push(Math.cos(a)*radius,y,Math.sin(a)*radius-.035);uv.push(i/segments,(y-.785)/.2);}
  if(i<segments){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
 }
 const band=new THREE.BufferGeometry();band.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));band.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));band.setIndex(indices);band.computeVertexNormals();add(band,0);
 for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*radius,z=Math.sin(a)*radius-.035;add(sphere([x,.978,z],[.025,.025,.025]),0);const gem=new THREE.OctahedronGeometry(.034,0).scale(.85,1.15,.56);gem.rotateY(-a+Math.PI/2);gem.translate(Math.cos(a)*(radius+.007),.811,Math.sin(a)*(radius+.007)-.035);add(gem,1);}
 return {geometry:merge(parts),materials:[materials.gold,materials.gem],name:'jewel-crown'};
}
function brooch(){
 const parts=[{geometry:extrude(star(.139,.068),.024,.009),material:0}];
 parts.push({geometry:extrude(star(.105,.048),.012,.004).translate(0,0,.034),material:1});
 parts.push({geometry:new THREE.OctahedronGeometry(.03).scale(1,1,.65).translate(0,0,.062),material:2});for(let i=0;i<5;i++){const a=Math.PI/2+i*Math.PI*2/5;parts.push({geometry:new THREE.OctahedronGeometry(.012).translate(Math.cos(a)*.095,Math.sin(a)*.095,.043),material:2});}
 parts.push({geometry:new THREE.CapsuleGeometry(.011,.19,4,8).rotateZ(Math.PI/2).translate(0,0,-.018),material:0});
 parts.push({geometry:new THREE.TorusGeometry(.035,.008,6,12,Math.PI).rotateY(Math.PI/2).translate(-.07,0,-.02),material:0});
 return {geometry:merge(parts),materials:[materials.gold,materials.gem,materials.crystal],name:'star-hairpin',position:[.41,.48,.438],rotation:[-.3,.5,-.22]};
}
function ribbonSurface(side,tail=false){
 const p=[],uv=[],idx=[],rows=tail?20:32,cols=8;
 for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){
  const t=i/rows,v=j/cols*2-1;
  let x,y,z;
  if(tail){x=side*(.025+.095*t)+v*(.045-.009*t);y=-.025-.21*t+.024*v;z=.008+.06*Math.sin(t*Math.PI)+.013*Math.cos(v*Math.PI*2)*Math.sin(t*Math.PI);}
  else {x=side*(.025+.2*Math.sin(Math.PI*t));y=v*(.028+.054*Math.sin(Math.PI*t))+.035*Math.sin(Math.PI*t);z=.015+.074*Math.sin(Math.PI*2*t)+.019*Math.cos(v*Math.PI)*Math.sin(Math.PI*t);}
  p.push(x,y,z);uv.push(t,j/cols);if(i<rows&&j<cols){const k=i*(cols+1)+j;idx.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2);}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function ribbon(){
 const parts=[];
 for(const side of [-1,1]){parts.push({geometry:ribbonSurface(side),material:0},{geometry:ribbonSurface(side,true),material:0});
  for(const edge of [-1,1]){const points=[];for(let i=0;i<=32;i++){const t=i/32;points.push([side*(.025+.2*Math.sin(Math.PI*t)),edge*(.028+.054*Math.sin(Math.PI*t))+.035*Math.sin(Math.PI*t),.015+.074*Math.sin(Math.PI*2*t)-.019*Math.sin(Math.PI*t)]);}parts.push({geometry:tube(points,.0035,32,5),material:1});}
 }
 parts.push({geometry:sphere([0,0,.018],[.045,.063,.037]),material:0});
 parts.push({geometry:new THREE.CapsuleGeometry(.011,.23,4,8).rotateZ(Math.PI/2).translate(0,0,-.024),material:2});
 return {geometry:merge(parts),materials:[materials.satin,materials.satinEdge,materials.silver],name:'satin-ribbon',position:[-.4,.5,.37],rotation:[-.2,-.45,.24]};
}
function scarf(remote){
 const parts=[],rows=remote?48:80,points=[],upper=[];
 for(let i=0;i<=rows;i++){const a=i/rows*Math.PI*2,front=(Math.sin(a)+1)*.5;points.push([Math.cos(a)*.716,-.105-front*.18,Math.sin(a)*.647]);upper.push([Math.cos(a)*.708,-.061-front*.165,Math.sin(a)*.633]);}
 const lowerWrap=tube(points,.083,rows,10,true);lowerWrap.scale(1,1.05,1);parts.push({geometry:lowerWrap,material:0},{geometry:tube(upper,.054,rows,8,true),material:0});
 for(let i=0;i<(remote?30:60);i++){
  const a=i/(remote?30:60)*Math.PI*2,front=(Math.sin(a)+1)*.5,y=-.105-front*.18;
  const stitch=[];for(const [offset,dy] of [[-.012,.04],[0,-.035],[.012,.04]])stitch.push([Math.cos(a+offset)*.785,y+dy,Math.sin(a+offset)*.713]);
  parts.push({geometry:tube(stitch,.003,6,4),material:1});
 }
 // Folded, broad fabric tails hang from the side knot, below the chin.
 for(const [x,length,angle] of [[-.29,.34,-.13],[-.16,.25,.12]]){
  const outline=new THREE.Shape();outline.moveTo(-.047,0);outline.quadraticCurveTo(-.072,-length*.5,-.052,-length);outline.lineTo(.052,-length);outline.quadraticCurveTo(.07,-length*.5,.047,0);outline.closePath();
  const fabric=extrude(outline,.045,.012);const p=fabric.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setZ(i,p.getZ(i)+.018*Math.sin(y/length*Math.PI*2));}fabric.computeVertexNormals();fabric.rotateZ(angle);fabric.translate(x,-.29,.62);parts.push({geometry:fabric,material:0});
  for(let i=0;i<5;i++)parts.push({geometry:tube([[x-.038+i*.019,-.29-length,.641],[x-.038+i*.019,-.33-length,.642]],.004,5,4),material:1});
 }
 parts.push({geometry:sphere([-.23,-.265,.64],[.12,.09,.075]),material:0});
 return {geometry:merge(parts),materials:[materials.knit,materials.knitRib],name:'winter-scarf'};
}
function beret(){
 const profile=[[.43,-.015],[.47,0],[.56,.025],[.59,.08],[.56,.14],[.46,.22],[.31,.27],[.14,.309],[0,.31]].map(p=>new THREE.Vector2(...p));
 const cap=new THREE.LatheGeometry(profile,56),position=cap.attributes.position;
 for(let i=0;i<position.count;i++){const x=position.getX(i),y=position.getY(i),z=position.getZ(i);position.setXYZ(i,x+.18*y,y+.012*Math.sin(Math.atan2(z,x)*3)*Math.hypot(x,z),z*.88);}cap.computeVertexNormals();
 const band=new THREE.TorusGeometry(.437,.019,8,56).rotateX(Math.PI/2).scale(1,1,.88).translate(0,-.006,0);
 const stem=tube([[.056,.3,0],[.063,.325,.001],[.081,.348,.005]],.014,12,7);
 const geometry=merge([{geometry:cap,material:0},{geometry:band,material:1},{geometry:stem,material:0}]);
 geometry.rotateZ(-.12).translate(-.055,.69,-.035);
 return {geometry,materials:[materials.wool,materials.woolBand],name:'wool-beret'};
}
export function createStyleAccessories({detail='full'}={}){
 const level=detail==='remote'?'remote':'full';
 if(!cache.has(level))cache.set(level,{glasses:sunglasses(),ovalGlasses:sunglasses('oval'),catEyeGlasses:sunglasses('cat-eye'),silverGlasses:silverGlasses(),crown:crown(),brooch:brooch(),ribbon:ribbon(),scarf:scarf(level==='remote'),beret:beret()});
 return Object.fromEntries(Object.entries(cache.get(level)).map(([key,spec])=>{const mesh=new THREE.Mesh(spec.geometry,spec.materials);mesh.name=spec.name;mesh.visible=false;mesh.castShadow=true;if(spec.position)mesh.position.set(...spec.position);if(spec.rotation)mesh.rotation.set(...spec.rotation);return[key,mesh];}));
}
