import * as T from './vendor/three.module.js';

const fabric=new T.MeshPhysicalMaterial({color:'#314b63',roughness:.92,sheen:.45,sheenColor:'#a6b2b8',side:T.DoubleSide});
const ivory=new T.MeshPhysicalMaterial({color:'#ebe4cf',roughness:.94,sheen:.35,side:T.DoubleSide});
const stitch=new T.MeshStandardMaterial({color:'#b7cbd0',roughness:.9});
const gold=new T.MeshStandardMaterial({color:'#c4b188',roughness:.65,metalness:.18});
const snow=new T.MeshPhysicalMaterial({color:'#f2f1e8',roughness:1,sheen:.6,sheenColor:'#e0f4f3'});
const twig=new T.MeshStandardMaterial({color:'#70503c',roughness:1});
const coal=new T.MeshPhysicalMaterial({color:'#25323b',roughness:.3,clearcoat:.4});
const carrot=new T.MeshStandardMaterial({color:'#d39150',roughness:.85});

for(const material of [fabric,ivory,stitch,gold,snow,twig,coal,carrot])material.userData.shared=true;
// Tiny woven variations stay deterministic and work without a DOM/canvas.
const weave=new Uint8Array(64*64*4);for(let y=0;y<64;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4,v=218+((x%3===0?11:0)+(y%3===0?14:0))+Math.sin(x*19+y*31)*5;weave[i]=weave[i+1]=weave[i+2]=v;weave[i+3]=255;}
const weaveMap=new T.DataTexture(weave,64,64,T.RGBAFormat);weaveMap.wrapS=weaveMap.wrapT=T.RepeatWrapping;weaveMap.repeat.set(7,7);weaveMap.needsUpdate=true;fabric.map=ivory.map=weaveMap;

function surface(rows,columns,point){const positions=[],uv=[],indices=[];for(let i=0;i<=rows;i++)for(let j=0;j<=columns;j++){positions.push(...point(i/rows,j/columns));uv.push(j/columns,i/rows);if(i<rows&&j<columns){const n=i*(columns+1)+j;indices.push(n,n+1,n+columns+1,n+1,n+columns+2,n+columns+1);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;}
function tube(points,r=.01,segments=20,sides=6){return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments,r,sides,false);}
function orb(x,y,z,sx,sy,sz){return new T.SphereGeometry(1,24,16).scale(sx,sy,sz).translate(x,y,z);}
function batch(parent,parts){const groups=new Map();for(const [geometry,material]of parts){if(!groups.has(material))groups.set(material,[]);groups.get(material).push(geometry);}for(const [material,list]of groups){const values={position:[],normal:[],uv:[]};for(const original of list){const g=original.index?original.toNonIndexed():original;for(const k of Object.keys(values))values[k].push(...g.attributes[k].array);if(g!==original)g.dispose();original.dispose();}const g=new T.BufferGeometry();for(const [k,v]of Object.entries(values))g.setAttribute(k,new T.Float32BufferAttribute(v,k==='uv'?2:3));g.computeBoundingBox();g.computeBoundingSphere();const mesh=new T.Mesh(g,material);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);}}
const robeRadius=y=>Math.max(.51,Math.sqrt(Math.max(0,.74*.74-y*y))+.065);
const frontZ=(x,y,extra=0)=>Math.sqrt(Math.max(.015,robeRadius(y)**2-x*x))*.91+extra;

export function createYukata(){
 const root=new T.Group();root.name='resort-yukata';const parts=[];
 // This is a draped, tapered shell around Moru's lower body, not a box overlay.
 parts.push([surface(18,80,(v,u)=>{const a=u*Math.PI*2,top=-.19+(1-Math.cos(a))*.125,y=top+(-.775-top)*v,r=robeRadius(y)+Math.sin(a*10+.3)*.012*v*v;return[Math.sin(a)*r,y+Math.cos(a*10)*.007*v*v,Math.cos(a)*r*.91];}),fabric]);
 const hem=[];for(let i=0;i<=80;i++){const a=i/80*Math.PI*2,r=robeRadius(-.775)+Math.sin(a*10+.3)*.012;hem.push([Math.sin(a)*r,-.766+Math.cos(a*10)*.007,Math.cos(a)*r*.91]);}parts.push([tube(hem,.008,80),ivory]);
 // Crossed collar follows the sphere; the eye, cheek and mouth area stays exposed.
 for(const side of [-1,1]){const lapel=surface(24,4,(v,u)=>{const x=side*(.54-.74*v)+(u-.5)*.075,y=-.13-.35*v;return[x,y,frontZ(x,y,.022+(side>0?.009:0))];});parts.push([lapel,ivory]);const seam=[];for(let i=0;i<=24;i++){const v=i/24,x=side*(.54-.74*v),y=-.13-.35*v;seam.push([x,y,frontZ(x,y,.036)]);}parts.push([tube(seam,.0035,24,4),gold]);}
 const obi=surface(6,80,(v,u)=>{const a=u*Math.PI*2,y=-.45-v*.135,r=robeRadius(y)+.024;return[Math.sin(a)*r,y,Math.cos(a)*r*.91];});parts.push([obi,ivory]);
 for(const side of [-1,1]){
  const sleeve=surface(16,40,(v,u)=>{const a=u*Math.PI*2,x=side*(.58+.4*v),drop=.08+.1*v,y=-.16-drop+Math.sin(a)*(.15+.09*v)-Math.max(0,-Math.sin(a))*.13,z=Math.cos(a)*(.26-.025*v);return[x,y,z];});parts.push([sleeve,fabric]);
  const cuff=[];for(let i=0;i<=40;i++){const a=i/40*Math.PI*2;cuff.push([side*.982,-.34+Math.sin(a)*.24-Math.max(0,-Math.sin(a))*.13,Math.cos(a)*.235]);}parts.push([tube(cuff,.012,40),ivory]);
 }
 // Folded obi knot sits on the back, outside the fur shell.
 for(const side of [-1,1])parts.push([surface(18,8,(v,u)=>{const x=side*(.02+.22*Math.sin(v*Math.PI)),y=-.505+(u-.5)*(.08+.15*Math.sin(v*Math.PI)),z=-.57-.065*Math.sin(v*Math.PI*2);return[x,y,z];}),ivory]);parts.push([orb(0,-.505,-.59,.055,.075,.045),gold]);
 // Small six-armed stitched snow crystals repeat over the front fabric.
 for(const [x,y,r]of [[-.32,-.32,.036],[.3,-.34,.034],[-.27,-.64,.03],[.23,-.67,.032],[0,-.68,.025]])for(let a=0;a<6;a++){const angle=a*Math.PI/3,points=[];for(let i=0;i<=3;i++){const t=i/3,px=x+Math.sin(angle)*r*t,py=y+Math.cos(angle)*r*t;points.push([px,py,frontZ(px,py,.012)]);}parts.push([tube(points,.0028,3,4),stitch]);}
 batch(root,parts);root.userData.wearable='yukata';root.userData.faceClearance={minY:-.1,frontZ:.62};return root;
}

export function createSnowfolk(){
 const root=new T.Group();root.name='snowfolk-vendor';const body=new T.Group(),head=new T.Group(),left=new T.Group(),right=new T.Group();root.add(body,head,left,right);head.position.y=1.91;left.position.set(-.55,1.23,0);right.position.set(.55,1.23,0);
 const bp=[[orb(0,.72,0,.7,.72,.62),snow],[orb(0,1.28,0,.49,.48,.46),snow],[orb(-.28,.11,.32,.25,.12,.31),snow],[orb(.28,.11,.32,.25,.12,.31),snow]];
 for(const [y,z]of [[1.22,.455],[.95,.59],[.67,.626]]){bp.push([orb(0,y,z,.045,.048,.025),coal]);bp.push([orb(-.012,y+.014,z+.022,.009,.009,.004),ivory]);}
 // A broad fabric scarf with a curved fall, stitched borders and short fringe.
 bp.push([surface(5,64,(v,u)=>{const a=u*Math.PI*2,y=1.54-v*.14,r=.49*Math.sqrt(1-((y-1.28)/.48)**2)+.035+.01*Math.cos(a*4);return[Math.sin(a)*r,y,Math.cos(a)*r*.94];}),fabric]);
 for(const [x,len]of [[-.17,.43],[.02,.32]]){bp.push([surface(16,6,(v,u)=>[x+(u-.5)*.13,1.44-v*len,.49+.09*Math.sin(v*Math.PI*.7)+.01*Math.sin(u*Math.PI*3)]),fabric]);for(let j=0;j<5;j++)bp.push([tube([[x-.05+j*.025,1.44-len,.55],[x-.05+j*.025,1.4-len,.55]],.005,3,5),ivory]);}
 batch(body,bp);
 const hp=[[orb(0,0,0,.445,.43,.42),snow]];
 for(const side of [-1,1]){hp.push([orb(side*.14,.09,.399,.042,.055,.026),coal]);hp.push([orb(side*.14-.01,.108,.421,.012,.015,.008),ivory]);hp.push([orb(side*.245,-.045,.349,.063,.026,.01),new T.MeshStandardMaterial({color:'#d9a9a3',roughness:1})]);}
 const nose=new T.ConeGeometry(.058,.25,16,3);nose.rotateX(Math.PI/2);nose.translate(0,-.008,.512);hp.push([nose,carrot]);
 const smile=[];for(let i=0;i<=18;i++){const x=-.125+i/18*.25,y=-.155+.038*(x/.125)**2;smile.push([x,y,Math.sqrt(Math.max(0,.42*.42-x*x-y*y))+.008]);}hp.push([tube(smile,.009,18,6),coal]);
 // Low knit cap and a small pom give an original compact silhouette.
 const cap=new T.SphereGeometry(1,32,12,0,Math.PI*2,0,Math.PI/2);cap.scale(.365,.205,.35);cap.translate(0,.31,-.02);hp.push([cap,fabric]);const brim=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;brim.push([Math.cos(a)*.365,.31,Math.sin(a)*.35-.02]);}hp.push([tube(brim,.055,64,8),ivory]);hp.push([orb(.04,.555,-.02,.1,.105,.1),ivory]);for(let i=0;i<16;i++){const a=i/16*Math.PI*2,points=[];for(let j=0;j<=10;j++){const v=j/10*Math.PI/2;points.push([Math.cos(a)*.367*Math.cos(v),.31+.207*Math.sin(v),Math.sin(a)*.352*Math.cos(v)-.02]);}hp.push([tube(points,.003,10,4),stitch]);}
 batch(head,hp);
 for(const [side,arm]of [[-1,left],[1,right]]){const ap=[];ap.push([tube([[0,0,0],[side*.24,.1,.01],[side*.51,.23,.08],[side*.64,.26,.07]],.027,16,7),twig]);for(const [start,end]of [[[.4,.18,.05],[.46,.36,.06]],[[.51,.23,.08],[.66,.38,.09]],[[.55,.24,.07],[.7,.14,.13]]])ap.push([tube([[side*start[0],start[1],start[2]],[side*end[0],end[1],end[2]]],.016,5,6),twig]);batch(arm,ap);}
 const update=(time=0)=>{const t=Number.isFinite(time)?time:0;head.rotation.y=Math.sin(t*.55)*.055;head.rotation.z=Math.sin(t*.8)*.018;left.rotation.z=Math.sin(t*.9)*.028;right.rotation.z=-Math.sin(t*.9+.4)*.035;};root.update=update;root.userData.update=update;root.userData.role='vendor';root.userData.height=2.57;return root;
}
