import * as T from './vendor/three.module.js';
import {makeBuilder,mergeFinish} from './architecture-kit.js';

const TAU=Math.PI*2;
const tints={science:'#a9d2e3',nature:'#a8c4ba',history:'#d3b88d',logic:'#b4bfd8'};

// Exclusively owned by this room. The curved vitrines use ordinary alpha, not
// transmission/refraction, so they do not introduce a render target or pass.
export function museumDetailPalette(m){
 return{
  ...m,
  ivory:new T.MeshStandardMaterial({color:'#e3e0d3',roughness:.66}),
  ink:new T.MeshStandardMaterial({color:'#1b3548',roughness:.48,metalness:.16}),
  paper:new T.MeshStandardMaterial({color:'#c8c5b1',roughness:.92}),
  glass:new T.MeshStandardMaterial({color:'#c4e1ea',roughness:.25,metalness:.05,transparent:true,opacity:.105,depthWrite:false,side:T.DoubleSide}),
  crystal:new T.MeshStandardMaterial({color:'#bcdde6',emissive:'#648eac',emissiveIntensity:.13,roughness:.27,metalness:.15,transparent:true,opacity:.32,depthWrite:false}),
 };
}

function book(b,m,x,y,z,angle=0,scale=1,open=false){
 const g=new T.Group();g.position.set(x,y,z);g.rotation.y=angle;
 const cover=(dx,tilt)=>{const leaf=new T.Group();leaf.position.x=dx;leaf.rotation.z=tilt;g.add(leaf);b.box(.46*scale,.045*scale,.64*scale,m.ink,0,0,0,leaf);b.box(.40*scale,.10*scale,.59*scale,m.paper,0,.067*scale,0,leaf);b.box(.46*scale,.026*scale,.64*scale,open?m.paper:m.ink,0,.13*scale,0,leaf);for(const zz of (open?[-.18,-.09,0,.09,.18]:[-.18,.18]))b.box((open?.28:.37)*scale,.007,.009,open?m.ink:m.brass,0,.147*scale,zz*scale,leaf);};
 if(open){cover(-.20*scale,-.10);cover(.20*scale,.10);}else cover(0,0);
 return g;
}

function foot(b,m){
 b.mesh(new T.CylinderGeometry(2.12,2.29,.28,48),m.ivory,0,.23,0);
 b.mesh(new T.CylinderGeometry(2.03,2.12,.57,48),m.ink,0,.60,0);
 b.mesh(new T.CylinderGeometry(2.10,2.10,.11,48),m.brass,0,.94,0);
 b.mesh(new T.CylinderGeometry(2.04,2.04,.09,48),m.ivory,0,1.04,0);
 for(const r of [1.98,2.18])b.ring(r,.017,m.brass,0,.32,0);
 for(let i=0;i<32;i++){const a=i/32*TAU,r=2.055;const panel=b.box(.025,.30,.025,m.brass,Math.sin(a)*r,.61,Math.cos(a)*r);panel.rotation.y=a;}
 // The front lip is a physical label rail. Actual actions stay in the existing
 // nearby exhibit/quiz UI; there are no decorative, nonfunctional 3D buttons.
 b.box(1.17,.23,.06,m.ink,0,.76,2.04);
 for(const x of [-.51,.51])b.box(.015,.17,.015,m.brass,x,.76,2.082);
 for(const y of [.72,.79])b.box(.72,.012,.015,m.brass,0,y,2.082);
}

export function buildMuseumGallery(parent,m,spec){
 const root=new T.Group();root.name='museum-gallery-'+spec.id;root.userData.keepGroup=true;
 root.userData.exhibitId=spec.id;root.userData.interactionId='gallery-'+spec.id;
 root.userData.fixtureRadius=2.4;root.position.set(spec.x,0,spec.z);parent.add(root);
 const b=makeBuilder(root),accent=new T.MeshStandardMaterial({color:tints[spec.id],emissive:tints[spec.id],emissiveIntensity:.07,roughness:.4,metalness:.25});
 foot(b,m);
 // Open front, curved glass back: visitors see the object without a solid wall
 // or floating arch intruding into the route between adjacent galleries.
 for(const a of [Math.PI/2,Math.PI,Math.PI*1.5]){
  const x=Math.sin(a)*1.84,z=Math.cos(a)*1.84;
  b.mesh(new T.CylinderGeometry(.045,.065,3.48,10),m.brass,x,2.83,z);
  b.mesh(new T.CylinderGeometry(.11,.11,.12,12),m.ivory,x,1.16,z);
  b.oval(m.lamp,x,4.61,z,.075,.075,.075);
 }
 const vitrine=b.mesh(new T.CylinderGeometry(1.84,1.84,3.28,40,1,true,Math.PI/2,Math.PI),m.glass,0,2.82,0);vitrine.name='museum-vitrine-'+spec.id;vitrine.castShadow=false;
 const crown=b.mesh(new T.TorusGeometry(1.84,.042,6,48,Math.PI),m.brass,0,4.51,0);crown.rotation.set(Math.PI/2,0,Math.PI);
 b.ring(1.84,.022,accent,0,1.15,0);
 b.box(1.23,.07,.44,m.ink,0,1.13,1.50);
 root.add(book(b,m,-1.26,1.11,.67,-.35,.68),book(b,m,1.21,1.11,.71,.22,.71,true));

 const exhibit=new T.Group();exhibit.name='museum-learning-object-'+spec.id;exhibit.userData.keepGroup=true;exhibit.position.y=1.88;root.add(exhibit);
 const eb=makeBuilder(exhibit),rings=[];
 if(spec.id==='science'){
  const globe=eb.oval(m.crystal,0,.45,0,.72,.72,.72);globe.name='museum-science-crystal';
  eb.oval(m.coolLamp,0,.45,0,.19,.19,.19);
  for(const [i,tilt]of [-.85,0,.85].entries()){
   const orbit=eb.mesh(new T.TorusGeometry(1.25,.027,6,56),m.brass,0,.45,0);orbit.rotation.set(Math.PI/2,tilt,.45);
   const a=i*TAU/3+.3;eb.oval(accent,Math.cos(a)*1.25,.45+Math.sin(a)*.45,Math.sin(a)*.91,.13,.13,.13);
  }
  eb.mesh(new T.CylinderGeometry(.26,.48,.18,24),m.ivory,0,-.74,0);
  eb.rod([0,-.7,0],[0,.45,0],.034,m.brass);
  const prism=eb.mesh(new T.ConeGeometry(.25,.72,6),m.crystal,1.03,-.43,0);prism.rotation.z=.18;
 }else if(spec.id==='nature'){
  // A carefully spaced double helix, with two botanical study specimens below.
  for(let i=0;i<12;i++){
   const a=i*.55,y=-.72+i*.21;
   const ends=[-1,1].map(side=>[Math.cos(a)*side*.56,y,Math.sin(a)*side*.56]);
   eb.rod(ends[0],ends[1],.022,m.ivory);
   for(let side=0;side<2;side++){
    eb.oval(side?accent:m.brass,...ends[side],.075,.075,.075);
    if(i){const sign=side?1:-1;eb.rod(ends[side],[Math.cos(a-.55)*sign*.56,y-.21,Math.sin(a-.55)*sign*.56],.028,side?accent:m.brass);}
   }
  }
  for(const side of [-1,1]){
   eb.mesh(new T.CylinderGeometry(.37,.42,.07,24),m.ivory,side*1.03,-.80,.08);
   eb.rod([side*1.03,-.76,.08],[side*.92,-.06,.08],.017,m.brass);
   for(let j=0;j<4;j++)for(const leafSide of [-1,1]){
    const leaf=eb.oval(accent,side*1.01+leafSide*.12,-.64+j*.14,.08,.20,.045,.08);leaf.rotation.z=leafSide*.48;
   }
  }
 }else if(spec.id==='history'){
  const profile=[[.36,-.78],[.51,-.73],[.54,-.59],[.79,-.32],[.84,.13],[.73,.49],[.40,.76],[.28,.85],[.27,1.10],[.40,1.17],[.40,1.24],[.29,1.24]].map(p=>new T.Vector2(...p));
  eb.mesh(new T.LatheGeometry(profile,40),m.ivory);
  for(const [r,y]of [[.49,-.69],[.79,-.25],[.80,.27],[.38,1.18]])eb.ring(r,.018,m.brass,0,y,0);
  for(const side of [-1,1]){const handle=eb.mesh(new T.TorusGeometry(.32,.055,7,28),m.brass,side*.66,.63,0);handle.scale.y=1.4;}
  for(let j=0;j<16;j++){const a=j/16*TAU;const mark=eb.box(.03,.18,.025,accent,Math.sin(a)*.819,.05,Math.cos(a)*.819);mark.rotation.y=a;}
  for(const side of [-1,1]){const shard=eb.mesh(new T.CylinderGeometry(.32,.38,.045,5),accent,side*1.26,-.72,.1);shard.rotation.set(.13,side*.7,side*.08);}
 }else if(spec.id==='logic'){
  eb.mesh(new T.CylinderGeometry(.30,.52,.16,24),m.ivory,0,-.74,0);
  eb.rod([0,-.66,0],[0,.50,0],.035,m.brass);
  for(let i=0;i<3;i++){
   const ring=new T.Group();ring.name='puzzle-ring-'+i;ring.userData.keepGroup=true;ring.position.y=.50;ring.rotation.z=(i+1)*Math.PI/2;exhibit.add(ring);
   const r=.48+i*.38;eb.mesh(new T.TorusGeometry(r,.04,6,56),i===1?m.brass:accent,0,0,0,ring);
   eb.oval(m.lamp,0,r,0,.078,.078,.06,ring);
   for(let j=0;j<8;j++){const a=j/8*TAU;const mark=eb.box(.018,.07,.025,m.brass,Math.sin(a)*r,Math.cos(a)*r,0,ring);mark.rotation.z=-a;}
   mergeFinish(ring);rings.push(ring);
  }
  eb.oval(m.coolLamp,0,.5,0,.13,.13,.10);
 }
 mergeFinish(exhibit);mergeFinish(root);
 return{spec,root,exhibit,accent,rings,vitrine,boost:0};
}

export function buildMuseumFloorInlays(root,m){
 const b=makeBuilder(root);
 // Flush inlays communicate a loop around the central display. Nothing here
 // is tall enough to be furniture or to change the navigation/collision map.
 for(let i=0;i<48;i++){
  const a=i/48*TAU,r=8.88,major=i%4===0;
  const tick=b.box(major?.055:.024,.007,major?.47:.16,m.brass,Math.sin(a)*r,.111,Math.cos(a)*r);tick.rotation.y=a;
 }
 for(let i=0;i<8;i++){
  const a=i/8*TAU,r=6.15,shape=new T.Shape([new T.Vector2(0,.60),new T.Vector2(.12,0),new T.Vector2(0,-.19),new T.Vector2(-.12,0)]);
  const diamond=b.mesh(new T.ShapeGeometry(shape),i%2?m.brass:m.ivory,Math.sin(a)*r,.114,Math.cos(a)*r);diamond.rotation.set(-Math.PI/2,0,-a);
 }
 for(const [x,z]of [[-14,-11],[14,-11],[14,11],[-14,11]]){
  b.ring(2.85,.012,m.brass,x,.115,z);
  for(const side of [-1,1]){const tick=b.box(.34,.006,.025,m.brass,x+side*.52,.116,z+2.92);tick.rotation.y=side*.12;}
 }
}

export function buildMuseumDomeChart(root,m){
 // Large, authored decorative constellations, projected onto the inside of
 // the existing 22 m dome. No real sky/data accuracy is implied by the pattern.
 const lines=[],stars=[],r=21.64,centerY=6;
 const project=(az,theta)=>new T.Vector3(Math.sin(theta)*Math.sin(az)*r,centerY+Math.cos(theta)*r,Math.sin(theta)*Math.cos(az)*r);
 const layouts=[[[0,0],[-.14,.10],[-.24,.04],[-.30,.18],[-.11,.24],[.08,.17],[.15,.30]],[[0,0],[.13,.06],[.24,-.03],[.32,.13],[.18,.24],[.02,.18],[-.11,.29]],[[0,0],[-.16,-.04],[-.24,.12],[-.12,.26],[.05,.19],[.18,.31],[.29,.21]]];
 for(let cluster=0;cluster<6;cluster++){
  const az=cluster*TAU/6,points=layouts[cluster%3].map(([x,y])=>project(az+x,.49+y));
  points.forEach(p=>stars.push(...p));for(let i=1;i<points.length;i++)lines.push(...points[i-1],...points[i]);
 }
 const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(lines,3));
 const chart=new T.LineSegments(geometry,new T.LineBasicMaterial({color:'#b2c9d7',transparent:true,opacity:.42,depthWrite:false}));chart.name='museum-large-constellations';root.add(chart);
 const starGeometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(stars,3));
 const nodes=new T.Points(starGeometry,new T.PointsMaterial({color:'#efe3c6',size:.13,transparent:true,opacity:.90,depthWrite:false}));nodes.name='museum-constellation-jewels';root.add(nodes);
 const b=makeBuilder(root);
 for(let i=0;i<72;i++){const a=i/72*TAU,radius=21.73,major=i%6===0;const mark=b.box(major?.12:.035,major?.46:.19,.022,i%6?m.brass:m.ivory,Math.sin(a)*radius,6.55,Math.cos(a)*radius);mark.rotation.y=a;}
 return{chart,nodes};
}

export function buildMuseumOrrery(root,m){
 const plinth=new T.Group();plinth.name='museum-orrery-plinth';plinth.userData.keepGroup=true;plinth.userData.fixtureRadius=4.2;root.add(plinth);const b=makeBuilder(plinth);
 b.mesh(new T.CylinderGeometry(3.92,4.10,.26,64),m.ivory,0,.24,0);
 b.mesh(new T.CylinderGeometry(3.60,3.90,.38,64),m.ink,0,.53,0);
 b.mesh(new T.CylinderGeometry(3.65,3.65,.09,64),m.brass,0,.765,0);
 for(const radius of [2.35,3.47])b.ring(radius,.025,m.brass,0,.84,0);
 for(let i=0;i<72;i++){const a=i/72*TAU,r=3.23,tick=b.box(.025,.012,i%6===0?.34:.13,m.brass,Math.sin(a)*r,.805,Math.cos(a)*r);tick.rotation.y=a;}
 const profile=[[.92,.82],[.92,.98],[.63,1.12],[.40,2.35],[.30,3.52],[.48,3.67],[.48,3.86]].map(p=>new T.Vector2(...p));
 b.mesh(new T.LatheGeometry(profile,32),m.brass);for(const y of [1.1,2.4,3.55])b.ring(y===1.1?.64:.40,.035,m.ivory,0,y,0);
 const motion=new T.Group();motion.name='museum-central-orrery';motion.userData.keepGroup=true;motion.position.y=4.28;plinth.add(motion);
 const sun=b.oval(m.lamp,0,0,0,.72,.72,.72,motion);sun.name='museum-orrery-sun';
 const orbits=[];
 for(let i=0;i<6;i++){
  const orbit=new T.Group();orbit.name='museum-orbit-'+i;orbit.userData.keepGroup=true;orbit.rotation.z=(i-2)*.10;orbit.rotation.y=i*.8;motion.add(orbit);
  const radius=1.2+i*.46,planetSize=.12+i*.027;b.ring(radius,.018,m.brass,0,0,0,orbit);
  b.oval(i%2?m.coolLamp:m.ivory,radius,0,0,planetSize,planetSize,planetSize,orbit);
  if(i===4)b.ring(.33,.018,m.brass,radius,0,0,orbit).rotation.x=.75;
  mergeFinish(orbit);orbits.push({root:orbit,phase:i*.8,speed:.022+i*.008});
 }
 mergeFinish(plinth);return{root:plinth,orbits};
}
