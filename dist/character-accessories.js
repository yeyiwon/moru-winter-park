import * as THREE from './vendor/three.module.js';

// Accessories share geometry/materials between the world, preview and
// visitors. Only the visible nose LED changes its shared material color. Each piece is one mesh, with a small number of material draw groups.
const cache=new Map();
const materials={
 black:new THREE.MeshPhysicalMaterial({color:'#101116',roughness:.28,metalness:.04,clearcoat:.75}),
 smoke:new THREE.MeshPhysicalMaterial({color:'#171d26',roughness:.18,metalness:.08,clearcoat:.9}),
 lensGlint:new THREE.MeshBasicMaterial({color:'#b4c9d3',transparent:true,opacity:.32}),
 silver:new THREE.MeshStandardMaterial({color:'#d6e2e6',metalness:.68,roughness:.2,emissive:'#b5c8ce',emissiveIntensity:.07}),
 crystal:new THREE.MeshPhysicalMaterial({color:'#d7ebef',transparent:true,opacity:.13,roughness:.09,metalness:.1,depthWrite:false}),
 glint:new THREE.MeshBasicMaterial({color:'#dcebf0',transparent:true,opacity:.6}),
 gold:new THREE.MeshStandardMaterial({color:'#dcb877',metalness:.86,roughness:.25,side:THREE.DoubleSide}),
 gem:new THREE.MeshPhysicalMaterial({color:'#d4f0ff',emissive:'#9bd3ef',emissiveIntensity:.24,metalness:.32,roughness:.08,clearcoat:1,flatShading:true}),
 crownSilver:new THREE.MeshStandardMaterial({color:'#e2ecf4',emissive:'#c6d7e9',emissiveIntensity:.18,metalness:.78,roughness:.17,side:THREE.DoubleSide}),
 diamondGlint:new THREE.MeshBasicMaterial({color:'#f4fbff',toneMapped:false}),
 satin:new THREE.MeshPhysicalMaterial({color:'#c795a6',roughness:.72,side:THREE.DoubleSide,sheen:1,sheenColor:'#dfbac9',sheenRoughness:.78}),
 satinEdge:new THREE.MeshPhysicalMaterial({color:'#e1bfc8',roughness:.8,sheen:.9}),
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
// Raised front/back facets give stars volume from the side, without a support bar.
function facetedStar(radius,depth){
 const positions=[],uv=[],points=Array.from({length:10},(_,i)=>{const a=Math.PI/2+i*Math.PI/5,r=i%2?radius*.46:radius;return[Math.cos(a)*r,Math.sin(a)*r,0];});
 for(let i=0;i<10;i++)for(const face of [[[0,0,depth],points[i],points[(i+1)%10]],[[0,0,-depth],points[(i+1)%10],points[i]]])for(const p of face){positions.push(...p);uv.push(p[0]/radius*.5+.5,p[1]/radius*.5+.5);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
function diamond(radius){
 const profile=[[0,-.65],[.94,-.06],[1,0],[.58,.42],[0,.42]].map(([r,y])=>new THREE.Vector2(r*radius,y*radius));
 return new THREE.LatheGeometry(profile,8).toNonIndexed().rotateX(Math.PI/2);
}
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
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4,x=Math.cos(a)*radius,z=Math.sin(a)*radius-.035,front=Math.sin(a)>.9,size=front?.071:.05;
  add(sphere([x,.971,z],[.018,.018,.018],10),0);
  add(diamond(size).rotateY(Math.PI/2-a).translate(Math.cos(a)*(radius+.012),.817,Math.sin(a)*(radius+.012)-.035),1);
  for(const dy of [-1,1])for(const tangent of [-1,1])add(new THREE.OctahedronGeometry(.009).translate(Math.cos(a)*(radius+.018)-Math.sin(a)*size*.58*tangent,.817+dy*size*.63,Math.sin(a)*(radius+.018)+Math.cos(a)*size*.58*tangent-.035),0);
  add(diamond(.032).rotateY(Math.PI/2-a).translate(x,1.008,z),1);
 }
 // Small white facets catch light even when the world has no environment map.
 add(facetedStar(.033,.007).scale(.55,1,1).translate(-.025,.846,radius+.018),2);
 add(facetedStar(.018,.005).translate(.21,1.023,.19),2);
 return {geometry:merge(parts),materials:[materials.crownSilver,materials.gem,materials.diamondGlint],name:'jewel-crown'};
}
function brooch(){
 const parts=[{geometry:extrude(star(.139,.068),.024,.009),material:0}];
 parts.push({geometry:extrude(star(.105,.048),.012,.004).translate(0,0,.034),material:1});
 parts.push({geometry:new THREE.OctahedronGeometry(.03).scale(1,1,.65).translate(0,0,.062),material:2});for(let i=0;i<5;i++){const a=Math.PI/2+i*Math.PI*2/5;parts.push({geometry:new THREE.OctahedronGeometry(.012).translate(Math.cos(a)*.095,Math.sin(a)*.095,.043),material:2});}
 parts.push({geometry:new THREE.CapsuleGeometry(.011,.19,4,8).rotateZ(Math.PI/2).translate(0,0,-.018),material:0});
 parts.push({geometry:new THREE.TorusGeometry(.035,.008,6,12,Math.PI).rotateY(Math.PI/2).translate(-.07,0,-.02),material:0});
 return {geometry:merge(parts),materials:[materials.silver,materials.gem,materials.glint],name:'star-hairpin',position:[.41,.48,.438],rotation:[-.3,.5,-.22]};
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
function winterHat(kind){
 const parts=[],add=(geometry,material=0)=>parts.push({geometry,material});
 const cap=new THREE.SphereGeometry(1,36,20,0,Math.PI*2,0,Math.PI/2).scale(.52,kind==='beanie'?.41:.29,.46).translate(0,.65,-.07);add(cap);
 const rim=new THREE.TorusGeometry(.49,kind==='fur-hat'?.072:.042,10,48).rotateX(Math.PI/2).scale(1,1,.93).translate(0,.66,-.07);add(rim,1);
 if(kind==='beanie'){
  for(let i=0;i<24;i++){const a=i/24*Math.PI*2,points=[];for(let j=0;j<=12;j++){const t=j/12*Math.PI/2;points.push([Math.cos(a)*.522*Math.cos(t),.65+.412*Math.sin(t),-.07+Math.sin(a)*.462*Math.cos(t)]);}add(tube(points,.004,12,4),1);}
  add(sphere([0,1.07,-.07],[.095,.09,.09],18),1);
 }else if(kind==='fur-hat'){
  for(const side of [-1,1])add(sphere([side*.48,.56,-.08],[.07,.15,.15]),1);
 }else{
  add(new THREE.SphereGeometry(1,28,14).scale(.36,.028,.25).translate(0,.635,.33),1);
  add(extrude(star(.055,.026),.012,.005).translate(0,.81,.365),2);
 }
 return{geometry:merge(parts),materials:[materials.wool,materials.knit,materials.silver],name:kind};
}
function charmGlasses(kind){
 const parts=[],add=(geometry,material=0)=>parts.push({geometry,material});
 const heart=(cx,scale)=>{const s=new THREE.Shape(),p=(x,y)=>[cx+x*scale,.075+y*scale];s.moveTo(...p(0,-.20));s.bezierCurveTo(...p(-.28,-.01),...p(-.24,.23),...p(-.10,.20));s.quadraticCurveTo(...p(-.035,.19),...p(0,.115));s.quadraticCurveTo(...p(.035,.19),...p(.10,.20));s.bezierCurveTo(...p(.24,.23),...p(.28,-.01),...p(0,-.20));return s;};
 for(const side of [-1,1]){
  let outline,inner;
  if(kind==='heart-glasses'){outline=heart(side*.235,1);inner=heart(side*.235,.89);const pts=inner.getPoints(20);outline.holes.push(new THREE.Path(pts));add(curveEyewear(extrude(outline,.013,.004,20)));}
  else{outline=new THREE.Shape();outline.absellipse(side*.225,.085,.177,.153,0,Math.PI*2);inner=new THREE.Path();inner.absellipse(side*.225,.085,.163,.139,0,Math.PI*2,true);outline.holes.push(inner);add(curveEyewear(extrude(outline,.013,.004,20)));add(curveEyewear(extrude(star(.053,.026),.016,.004).translate(side*.4,.2,.02)),1);}
  add(tube([[side*.41,.15,.71],[side*.58,.16,.41],[side*.66,.08,-.14]],.01,20,6));
 }
 add(tube([[-.055,.115,.79],[0,.14,.8],[.055,.115,.79]],.01,14,6));
 return{geometry:merge(parts),materials:[materials.silver,materials.gem],name:kind};
}
function horns(){const parts=[];for(const side of [-1,1]){const pts=[[side*.45,.65,-.06],[side*.54,.78,-.08],[side*.53,.93,-.1],[side*.46,1.06,-.12]],curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),g=new THREE.TubeGeometry(curve,24,.09,10);const p=g.attributes.position;for(let i=0;i<p.count;i++){const t=Math.floor(i/11)/24,c=curve.getPointAt(Math.min(1,t)),scale=Math.max(.04,1-t);p.setXYZ(i,c.x+(p.getX(i)-c.x)*scale,c.y+(p.getY(i)-c.y)*scale,c.z+(p.getZ(i)-c.z)*scale);}g.computeVertexNormals();parts.push({geometry:g,material:0});}return{geometry:merge(parts),materials:[materials.knit],name:'little-horns'};}
function snowFlower(){
 const parts=[];for(let i=0;i<6;i++){const a=i*Math.PI/3;parts.push({geometry:sphere([0,0,0],[.035,.058,.025]).rotateZ(-a).translate(Math.sin(a)*.071,Math.cos(a)*.071,0),material:0});}
 parts.push({geometry:sphere([0,0,.025],[.034,.034,.022]),material:1});return{geometry:merge(parts),materials:[materials.knitRib,materials.silver],name:'winter-flower',position:[-.42,.48,.41],rotation:[-.2,-.4,0]};
}
function neckPiece(kind){
 const parts=[],add=(geometry,material=0)=>parts.push({geometry,material});
 const collar=[];for(let i=0;i<=48;i++){const a=i/48*Math.PI*2;collar.push([Math.cos(a)*.72,-.19-(Math.sin(a)+1)*.07,Math.sin(a)*.66]);}
 add(tube(collar,kind==='winter-cape'?.045:.018,48,7,true));
 if(kind==='winter-cape'){
  const p=[],uv=[],idx=[];for(let row=0;row<=12;row++)for(let col=0;col<=48;col++){const t=row/12,a=.72+col/48*(Math.PI*2-1.44),r=.72+t*.1; p.push(Math.sin(a)*r,-.2-t*.42,-Math.cos(a)*r*.94);uv.push(col/48,t);if(row<12&&col<48){const n=row*49+col;idx.push(n,n+49,n+1,n+1,n+49,n+50);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();add(g);
  add(sphere([0,-.33,.68],[.048,.048,.028]),1);
 }else if(kind==='bell'){
  add(sphere([0,-.43,.687],[.085,.085,.065]),1);add(tube([[0,-.37,.7],[0,-.32,.7]],.012,8,6),1);add(tube([[-.055,-.45,.742],[0,-.46,.754],[.055,-.45,.742]],.005,12,5),2);
 }else if(kind==='snow-pendant'){
  add(extrude(star(.09,.039),.023,.007).translate(0,-.43,.69),1);
 }else{
  for(const side of [-1,1]){add(sphere([side*.105,-.4,.69],[.12,.075,.055]),kind==='bow-tie'?2:0);if(kind==='neck-ribbon')add(new THREE.CapsuleGeometry(.027,.12,4,10).rotateZ(side*.25).translate(side*.05,-.51,.69));}
  add(sphere([0,-.4,.73],[.044,.054,.036]),1);
 }
 return{geometry:merge(parts),materials:[materials.satin,materials.silver,materials.wool],name:kind};
}
// Shared static pieces keep a larger catalog from adding draw calls until worn.
const playfulIDs=['tree-star','pine-cap','witch-hat','pumpkin-cap','ghost-cap','antlers','moon-cap','earbuds','headphones','cat-headphones','glow-nose'];
const playfulMaterials=[
 new THREE.MeshStandardMaterial({color:'#f0eee6',roughness:.75}),
 new THREE.MeshStandardMaterial({color:'#d5a766',roughness:.7}),
 new THREE.MeshPhysicalMaterial({color:'#df781e',roughness:.43,clearcoat:.32,clearcoatRoughness:.4}),
 new THREE.MeshStandardMaterial({color:'#286347',roughness:.85}),
 new THREE.MeshStandardMaterial({color:'#342740',roughness:.72,side:THREE.DoubleSide}),
 materials.silver,materials.black,materials.gold,
 new THREE.MeshStandardMaterial({color:'#72544b',roughness:.95}),
 new THREE.MeshStandardMaterial({color:'#c67787',roughness:.8}),
 new THREE.MeshStandardMaterial({color:'#ffe8a4',emissive:'#ffd36b',emissiveIntensity:1.5,roughness:.4}),
 new THREE.MeshPhysicalMaterial({color:'#b4a3d4',metalness:.22,roughness:.28,clearcoat:.65}),
 new THREE.MeshStandardMaterial({color:'#e7c6d7',roughness:.78}),
 new THREE.MeshStandardMaterial({color:'#8a496c',roughness:.8}),
 new THREE.MeshStandardMaterial({color:'#684335',roughness:.88}),
 new THREE.MeshPhysicalMaterial({color:'#d51232',emissive:'#ff1538',emissiveIntensity:.85,roughness:.12,metalness:.08,clearcoat:1,clearcoatRoughness:.08}),
 new THREE.MeshBasicMaterial({color:'#fff1da',toneMapped:false}),
 new THREE.MeshStandardMaterial({color:'#ef9c35',emissive:'#ff6f18',emissiveIntensity:.45,roughness:.65}),
 new THREE.MeshPhysicalMaterial({color:'#293b66',roughness:.83,sheen:.6,sheenColor:'#647aa2',side:THREE.DoubleSide}),
 new THREE.MeshStandardMaterial({color:'#ff5371',emissive:'#ff244c',emissiveIntensity:1.5,roughness:.22}),
 new THREE.MeshStandardMaterial({color:'#87d5ff',emissive:'#40aaff',emissiveIntensity:1.5,roughness:.22}),
];
const glowPixels=new Uint8Array(32*32*4);
for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4,r=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5);glowPixels.set([255,255,255,Math.round(Math.max(0,1-r)**2*255)],i);}
const wearableGlowMap=new THREE.DataTexture(glowPixels,32,32);wearableGlowMap.needsUpdate=true;wearableGlowMap.userData.shared=true;
const noseHaloColor=new THREE.Color('#ff2447');
function wearableGlow(id){
 const points=[],colors=[],put=(x,y,z,c)=>{points.push(x,y,z);colors.push(...new THREE.Color(c).toArray());};
 if(id==='pine-cap'){for(let i=0;i<18;i++){const t=i/17,a=t*Math.PI*6,r=.355-t*.22;put(Math.cos(a)*r,.70+t*.56,Math.sin(a)*r-.04,['#ffe8a4','#ff5371','#87d5ff'][i%3]);}put(0,1.43,.018,'#ffe8a4');}
 else if(id==='tree-star')put(0,.87,.165,'#ffe8a4');
 else if(id==='glow-nose')put(0,-.09,.861,'#ffffff');
 else return null;
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.userData.shared=true;
 const material=new THREE.PointsMaterial({map:wearableGlowMap,vertexColors:true,size:id==='pine-cap'?.14:id==='glow-nose'?.8:.28,transparent:true,opacity:id==='tree-star'?.28:id==='glow-nose'?.32:.5,depthWrite:false,blending:id==='glow-nose'?THREE.NormalBlending:THREE.AdditiveBlending,toneMapped:false});material.userData.shared=true;if(id==='glow-nose')material.color=noseHaloColor;
 return{geometry,material};
}
function taperedBranch(points,radius,segments=20){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),g=new THREE.TubeGeometry(curve,segments,radius,8),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const t=Math.floor(i/9)/segments,c=curve.getPointAt(t),s=.06+.94*(1-t)**.65;p.setXYZ(i,c.x+(p.getX(i)-c.x)*s,c.y+(p.getY(i)-c.y)*s,c.z+(p.getZ(i)-c.z)*s);}g.computeVertexNormals();return g;
}
function playfulAccessory(id){
 const parts=[],add=(geometry,material=0)=>parts.push({geometry,material});
 const ball=(p,s,m=0,segments=16)=>add(sphere(p,s,segments),m);
 const band=(radius,y,m=0)=>add(new THREE.TorusGeometry(radius,.028,6,32).rotateX(Math.PI/2).scale(1,1,.9).translate(0,y,-.035),m);
 const cap=(sx,sy,sz,m)=>add(new THREE.SphereGeometry(1,24,12,0,Math.PI*2,0,Math.PI/2).scale(sx,sy,sz).translate(0,.64,-.035),m);
 const badge=(size,x,y,z,m=7)=>add(extrude(star(size,size*.46),.018,.004,5).translate(x,y,z),m);
 if(id==='tree-star'){
  add(facetedStar(.245,.085).translate(0,.87,.075),10);
  add(facetedStar(.024,.012).translate(0,.87,.165),16);
 }else if(id==='pine-cap'){
  for(const [r,h,y]of [[.38,.34,.82],[.29,.33,1.02],[.2,.3,1.21]]){
   const tier=new THREE.ConeGeometry(r,h,32,8),p=tier.attributes.position;
   for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),a=Math.atan2(z,x),t=(p.getY(i)+h/2)/h,f=1+.035*Math.cos(a*10)*(1-t);p.setXYZ(i,x*f,p.getY(i)+y+.012*Math.cos(a*10)*(1-t)**3,z*f-.04);}tier.computeVertexNormals();add(tier,3);
  }
  add(facetedStar(.102,.035).translate(0,1.43,-.02),10);
  const cable=[];for(let i=0;i<=64;i++){const t=i/64,a=t*Math.PI*6,r=.35-t*.22;cable.push([Math.cos(a)*r,.70+t*.56,Math.sin(a)*r-.04]);}add(tube(cable,.004,64,4),3);
  for(let i=0;i<18;i++){const t=i/17,a=t*Math.PI*6,r=.355-t*.22;ball([Math.cos(a)*r,.70+t*.56,Math.sin(a)*r-.04],[.023,.028,.023],[10,19,20][i%3],10);}
 }else if(id==='witch-hat'||id==='moon-cap'){
  const cloth=id==='moon-cap'?18:4;
  // The brim is a continuous folded surface, with a rolled hem rather than a flat disk.
  const brim=new THREE.RingGeometry(.23,.59,48,6),bp=brim.attributes.position,hem=[];
  const brimY=(r,a)=>.69+.065*Math.sin(a*2+.4)*(r/.59)**2+.045*Math.cos(a+1)*(r/.59)**4;
  for(let i=0;i<bp.count;i++){const x=bp.getX(i),z=bp.getY(i),r=Math.hypot(x,z),a=Math.atan2(z,x);bp.setXYZ(i,x,brimY(r,a),z*.88-.035);}brim.computeVertexNormals();add(brim,cloth);
  for(let i=0;i<=48;i++){const a=i/48*Math.PI*2;hem.push([Math.cos(a)*.59,brimY(.59,a),Math.sin(a)*.59*.88-.035]);}add(tube(hem,.013,48,6),cloth);
  const profile=[[.31,0],[.325,.045],[.3,.13],[.25,.24],[.19,.36],[.125,.49],[.065,.6],[.026,.66],[0,.675]].map(p=>new THREE.Vector2(...p)),cone=new THREE.LatheGeometry(profile,40),p=cone.attributes.position;
  for(let i=0;i<p.count;i++){const y=p.getY(i),x=p.getX(i),z=p.getZ(i),a=Math.atan2(z,x),fold=1+.026*Math.sin(a*7+y*10)*(1-y/.7);p.setXYZ(i,x*fold+.35*(y/.675)**3,y-.13*(y/.675)**5,z*fold);}cone.computeVertexNormals();add(cone.translate(0,.71,-.035),cloth);
  add(new THREE.CylinderGeometry(.315,.342,.105,40,1,true).scale(1,1,.99).translate(0,.792,-.035),13);
  for(const y of [.749,.832]){const points=[];for(let i=0;i<=36;i++){const a=i/36*Math.PI*2,r=y<.8?.342:.315;points.push([Math.cos(a)*r,y,Math.sin(a)*r-.035]);}add(tube(points,.004,36,5),7);}
  if(id==='moon-cap'){for(const [y,a]of [[.20,-.42],[.33,.34],[.46,-.20]]){let j=0;while(j<profile.length-2&&y>profile[j+1].y)j++;const t=(y-profile[j].y)/(profile[j+1].y-profile[j].y),r=profile[j].x+(profile[j+1].x-profile[j].x)*t,x=.35*(y/.675)**3+Math.sin(a)*r,z=Math.cos(a)*r-.024;badge(.034,x,.71+y,z,10);}}
  else{const buckle=new THREE.Shape();buckle.moveTo(-.07,-.049);buckle.lineTo(.07,-.049);buckle.lineTo(.07,.049);buckle.lineTo(-.07,.049);buckle.closePath();const hole=new THREE.Path();hole.moveTo(-.047,-.029);hole.lineTo(-.047,.029);hole.lineTo(.047,.029);hole.lineTo(.047,-.029);hole.closePath();buckle.holes.push(hole);add(extrude(buckle,.018,.004,4).translate(0,.792,.31),7);add(tube([[0,.765,.335],[0,.823,.335]],.005,4,5),7);add(tube([[-.31,.78,.12],[-.37,.66,.17],[-.37,.59,.18]],.005,12,5),7);badge(.047,-.37,.55,.18,10);}
 }else if(id==='pumpkin-cap'){
  // Connected lobes and recessed seams read as one pumpkin, not intersecting balls.
  const pumpkin=new THREE.SphereGeometry(1,64,28),p=pumpkin.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x),rib=.93+.07*Math.cos(a*9);p.setXYZ(i,x*.47*rib,.82+y*.245-Math.max(0,y)**8*.028,z*.42*rib-.035);}pumpkin.computeVertexNormals();add(pumpkin,2);
  add(taperedBranch([[0,1.02,-.035],[.015,1.10,-.045],[.073,1.15,-.055],[.10,1.14,-.045]],.04,18),3);
  const leaf=new THREE.Shape();leaf.moveTo(0,0);leaf.bezierCurveTo(-.05,.12,.10,.18,.19,.11);leaf.bezierCurveTo(.17,.03,.07,-.01,0,0);add(extrude(leaf,.007,.002,12).rotateX(-.6).rotateZ(-.25).translate(.015,1.025,.005),3);add(tube([[.035,1.04,.012],[.10,1.08,-.015],[.17,1.10,-.035]],.004,10,5),14);
  const vine=[];for(let i=0;i<=32;i++){const t=i/32,a=t*Math.PI*3;vine.push([-.035-t*.18,.985+Math.sin(a)*.035,.02+Math.cos(a)*.035]);}add(tube(vine,.006,32,5),3);
  const face=(shape,m)=>{const g=extrude(shape,.006,.002,8),v=g.attributes.position;for(let i=0;i<v.count;i++){const x=v.getX(i),y=v.getY(i),front=Math.sqrt(Math.max(0,1-(x/.47)**2-((y-.82)/.245)**2));v.setZ(i,v.getZ(i)+front*.42*(.93+.07*Math.cos(Math.atan2(front*.42,x)*9))-.023);}g.computeVertexNormals();add(g,m);};
  for(const side of [-1,1]){const eye=new THREE.Shape();eye.moveTo(side*.085,.84);eye.quadraticCurveTo(side*.13,.94,side*.18,.93);eye.lineTo(side*.21,.845);eye.closePath();face(eye,6);}
  const smile=new THREE.Shape();smile.moveTo(-.17,.77);smile.quadraticCurveTo(0,.62,.17,.77);smile.lineTo(.12,.75);smile.lineTo(.07,.76);smile.lineTo(.055,.72);smile.lineTo(.015,.72);smile.lineTo(0,.75);smile.lineTo(-.06,.73);smile.closePath();face(smile,6);
 }else if(id==='ghost-cap'){
  cap(.39,.4,.34,0);for(let i=0;i<10;i++){const a=i/10*Math.PI*2;ball([Math.cos(a)*.31,.66,Math.sin(a)*.27-.035],[.10,.06,.10]);}
  for(const side of [-1,1])ball([side*.1,.85,.29],[.032,.046,.016],6);ball([0,.75,.307],[.025,.035,.014],6);
 }else if(id==='antlers'){
  for(const side of [-1,1]){
   add(taperedBranch([[side*.34,.72,-.08],[side*.38,.86,-.09],[side*.51,1.03,-.13],[side*.59,1.20,-.14],[side*.56,1.30,-.13]],.045,26),14);
   add(taperedBranch([[side*.44,.95,-.11],[side*.30,1.06,-.09],[side*.27,1.18,-.065]],.029,16),14);
   add(taperedBranch([[side*.54,1.09,-.13],[side*.71,1.12,-.12],[side*.74,1.22,-.08]],.024,16),14);
   for(let j=0;j<3;j++)add(taperedBranch([[side*(.355+j*.012),.755,-.049],[side*(.39+j*.012),.87,-.066],[side*(.48+j*.009),.99,-.10]],.003,12),8);
  }
 }else if(id==='glow-nose'){
  ball([0,-.09,.755],[.105,.095,.10],15);
  ball([-.034,-.052,.837],[.013,.018,.008],16);
  add(tube([[-.055,-.045,.816],[-.044,-.025,.818],[-.022,-.015,.82]],.0035,12,5),16);
 }else if(id==='earbuds'){
  for(const side of [-1,1]){ball([side*.713,.15,.12],[.062,.07,.075]);add(new THREE.CapsuleGeometry(.025,.13,3,8).translate(side*.732,.04,.12));ball([side*.761,.16,.13],[.008,.022,.025],6);}
 }else if(id==='cat-headphones'){
  const outer=[],inner=[];for(let i=0;i<=32;i++){const a=i/32*Math.PI;outer.push([Math.cos(a)*.77,.16+Math.sin(a)*.72,-.025]);inner.push([Math.cos(a)*.745,.16+Math.sin(a)*.688,-.025]);}add(tube(outer,.036,32,8),11);add(tube(inner,.019,32,6),12);
  for(const side of [-1,1]){
   ball([side*.775,.12,-.025],[.082,.245,.195],12);ball([side*.853,.12,-.025],[.062,.228,.181],11);
   const rim=[];for(let i=0;i<=32;i++){const a=i/32*Math.PI*2;rim.push([side*.909,.12+Math.cos(a)*.202,-.025+Math.sin(a)*.158]);}add(tube(rim,.006,32,5),5);
   add(tube([[side*.735,.39,-.025],[side*.86,.37,-.025],[side*.895,.29,-.025]],.016,16,6),5);ball([side*.904,.29,-.025],[.013,.024,.024],5);
   const bandY=x=>.16+.72*Math.sqrt(1-(x/.77)**2);
   const ear=inset=>{const shape=new THREE.Shape(),p=(x,y)=>[side*x,y],left=.26+inset,right=.58-inset;
    shape.moveTo(...p(left,bandY(left)-.022+inset));shape.quadraticCurveTo(...p(.31+inset,.99-inset),...p(.414,1.10-inset));shape.quadraticCurveTo(...p(.435,1.125-inset),...p(.46,1.085-inset));shape.quadraticCurveTo(...p(.53-inset,.85),...p(right,bandY(right)-.022+inset));
    for(let i=1;i<=10;i++){const x=right+(left-right)*i/10;shape.lineTo(...p(x,bandY(x)-.022+inset));}shape.closePath();return shape;};
   add(extrude(ear(0),.10,.012,8).translate(0,0,-.075),11);add(extrude(ear(.035),.009,.005,8).translate(0,0,.04),12);
   const seam=[];for(let i=0;i<3;i++)seam.push([side*(.338+i*.032),.90+i*.065,.06]);add(tube(seam,.004,12,5),0);
   // Embossed paw motif on each cup; it follows the cup's side rather than floating in front.
   ball([side*.918,.13,-.025],[.007,.034,.038],0,10);for(const [y,z]of [[.178,-.061],[.19,-.025],[.178,.011]])ball([side*.918,y,z],[.007,.014,.013],0,8);
  }
 }else{
  const path=[];for(let i=0;i<=24;i++){const a=i/24*Math.PI;path.push([Math.cos(a)*.77,.13+Math.sin(a)*.75,-.02]);}add(tube(path,.036,28,8),5);
  for(const side of [-1,1]){ball([side*.77,.15,-.02],[.095,.18,.15],6);ball([side*.823,.15,-.02],[.055,.155,.13],5);add(tube([[side*.875,.11,.015],[side*.875,.2,.015]],.009,5,5),0);}
 }
 return{geometry:merge(parts).translate(0,['witch-hat','moon-cap'].includes(id)?.105:0,0),materials:playfulMaterials,name:id,glow:wearableGlow(id)};
}
const noseColors=['#ff2447','#ef4bba','#985bff','#328aff','#36d4b8','#ffbc42'].map(c=>new THREE.Color(c));
export function updateNoseLight(time,still=false){
 const phase=still?0:((time%24)+24)%24/4,index=Math.floor(phase),t=phase-index,s=t*t*(3-2*t),led=playfulMaterials[15];
 led.color.copy(noseColors[index]).lerp(noseColors[(index+1)%noseColors.length],s);led.emissive.copy(led.color);noseHaloColor.copy(led.color);
}
function noseBeforeRender(){updateNoseLight(Date.now()/1000,globalThis.document?.body?.classList.contains('still')||globalThis.document?.body?.classList.contains('reduce-flash'));}
export const extraAccessoryIDs=['heart-glasses','star-glasses','little-horns','winter-flower',...playfulIDs];
export function createStyleAccessories({detail='full'}={}){
 const level=detail==='remote'?'remote':'full';
 if(!cache.has(level))cache.set(level,{glasses:sunglasses(),ovalGlasses:sunglasses('oval'),catEyeGlasses:sunglasses('cat-eye'),silverGlasses:silverGlasses(),crown:crown(),brooch:brooch(),ribbon:ribbon(),scarf:scarf(level==='remote'),beret:beret(),...Object.fromEntries(extraAccessoryIDs.map(id=>[id,playfulIDs.includes(id)?playfulAccessory(id):id.includes('glasses')?charmGlasses(id):['beanie','fur-hat','winter-cap'].includes(id)?winterHat(id):id==='little-horns'?horns():id==='winter-flower'?snowFlower():neckPiece(id)]))});
 return Object.fromEntries(Object.entries(cache.get(level)).map(([key,spec])=>{spec.geometry.userData.shared=true;spec.materials.forEach(m=>m.userData.shared=true);const mesh=new THREE.Mesh(spec.geometry,spec.materials);mesh.name=spec.name;if(key==='glow-nose')mesh.onBeforeRender=noseBeforeRender;mesh.visible=false;mesh.castShadow=true;if(spec.glow){const glow=new THREE.Points(spec.glow.geometry,spec.glow.material);glow.name=spec.name+'-glow';mesh.add(glow);}if(spec.position)mesh.position.set(...spec.position);if(spec.rotation)mesh.rotation.set(...spec.rotation);return[key,mesh];}));
}
