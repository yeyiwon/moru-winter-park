import {dressBalloonBooth} from './balloon-booth.js';
import {createStonePaving,pavingColors} from './plaza-paving.js';
import {buildWinterBench} from './winter-bench.js';
import * as T from './vendor/three.module.js';
import {parkStalls,parkBenches,balloonCart,sparklerKiosk} from './park-layout.js';

export function buildParkDetails(api){
 const {scene,mesh,ball,cylinder,box,rod,torus,halo,M}=api;
 const cream=M('#fff0df',.7),gold=M('#e8c587',.32,.62),rose=M('#d88daf',.68),mint=M('#9fcac2',.7),wood=M('#956b7a',.83),ink=M('#504d63',.55,.2),snow=M('#e3e9ed',.96,0),warm=new T.MeshStandardMaterial({color:'#ffe4bb',emissive:'#ffd5a5',emissiveIntensity:1.2,roughness:.36});
 const colors=[rose,mint,M('#c5b0e0',.65)],baked=M('#cd965f',.9),coffee=M('#593c35',.85);
 const glass=new T.MeshPhysicalMaterial({color:'#eff9ff',transparent:true,opacity:.24,roughness:.12,metalness:.02,clearcoat:1,depthWrite:false});
 // The four physical menu boards share one atlas and one material.
 const menuCanvas=document.createElement('canvas');menuCanvas.width=2048;menuCanvas.height=768;
 const ctx=menuCanvas.getContext('2d'),menus=[['팝콘',['카라멜 팝콘','솔티드 팝콘','따뜻한 코코아']],['캔디 · 아이스크림',['막대사탕','솜사탕','아이스크림']],['커피 · 와플',['에스프레소','라테 · 코코아','버터 와플']],['풍선',['풍선 고르기','비눗방울','무료 대여']]];
 menus.forEach(([title,items],i)=>{
  const x=i*512;ctx.fillStyle='#fff0df';ctx.fillRect(x,0,512,768);ctx.fillStyle='#b48b62';ctx.fillRect(x+35,35,442,3);ctx.fillRect(x+35,729,442,3);
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#91656b';ctx.font='500 30px sans-serif';ctx.fillText('MENU',x+256,109);
  ctx.font=(title.length>8?'600 36px':'600 48px')+' sans-serif';ctx.fillStyle='#574c59';ctx.fillText(title,x+256,208);ctx.fillStyle='#d5b7a4';ctx.fillRect(x+72,280,368,2);
  ctx.font='400 34px sans-serif';ctx.fillStyle='#685663';items.forEach((item,j)=>ctx.fillText(item,x+256,365+j*108));
 });
 const menuTexture=new T.CanvasTexture(menuCanvas);menuTexture.colorSpace=T.SRGBColorSpace;menuTexture.anisotropy=4;
 const menuMaterial=new T.MeshBasicMaterial({map:menuTexture,toneMapped:false});
 const smallFoodGeometry=new T.IcosahedronGeometry(.036,1),cupProfile=[[.072,0],[.084,.025],[.105,.2],[.09,.2],[.072,.025]].map(([r,y])=>new T.Vector2(r,y)),cupGeo=new T.LatheGeometry(cupProfile,20);
 function group(name,x,z,yaw=0){const g=new T.Group();g.name=name;g.position.set(x,0,z);g.rotation.y=yaw;scene.add(g);return g;}
 function part(name,parent,x=0,y=0,z=0){const g=new T.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;}
 function ring(r,y,mat,parent){const m=torus(r,.035,mat,0,y,0,parent);m.rotation.x=Math.PI/2;return m;}
 function curve(points,r,mat,parent){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),18,r,6,false),mat,0,0,0,parent);}
 function marquee(parent,width,y,z){box(width,.33,.16,rose,0,y,z,parent);for(let i=0;i<12;i++)ball(warm,-width*.45+width*.9*i/11,y,z+.1,.035,parent);}
 function menuBoard(g,index){
  box(.86,1.03,.055,wood,.87,1.76,-1.08,g);box(.79,.96,.018,gold,.87,1.76,-1.042,g);
  const geometry=new T.PlaneGeometry(.74,.91),uv=geometry.attributes.uv;
  for(let j=0;j<uv.count;j++)uv.setX(j,(index+.01+uv.getX(j)*.98)/4);
  const board=mesh(geometry,menuMaterial,.87,1.76,-1.029,g);board.name='park-menu-'+parkStalls[index].kind;
  for(const dx of [-.29,.29]){box(.065,.11,.035,gold,.87+dx,2.23,-1.01,g);ball(ink,.87+dx,2.25,-.985,.014,g);}
 }
 function mug(parent,x,y,z,{cocoa=false,lid=false}={}){
  const g=part('cafe-cup',parent,x,y,z);cylinder(.16,.16,.018,cream,0,.008,0,g,20);mesh(cupGeo,cream,0,.02,0,g);
  const handle=mesh(new T.TorusGeometry(.06,.014,5,18),gold,.114,.135,0,g);handle.scale.set(.75,1,1);
  if(lid){cylinder(.108,.105,.025,cream,0,.235,0,g,20);box(.046,.012,.014,ink,0,.25,.045,g);}
  else{cylinder(.084,.084,.008,coffee,0,.205,0,g,20);for(let j=0;j<(cocoa?4:2);j++)ball(cream,(j%2-.5)*.045,.214,Math.floor(j/2)*.035-.02,.025,g).scale.multiply(new T.Vector3(1,.28,1.4));}
  return g;
 }
 function pastries(parent,x,y,z){
  const g=part('pastry-display',parent,x,y,z);
  box(.91,.045,.52,wood,0,.02,0,g);box(.87,.018,.48,cream,0,.052,0,g);
  for(const side of [-1,1])for(const back of [-1,1])rod([side*.44,.05,back*.245],[side*.44,.49,back*.245],.012,gold,g);
  box(.93,.025,.54,gold,0,.5,0,g);mesh(new T.BoxGeometry(.89,.43,.49),glass,0,.28,0,g);
  for(let i=0;i<3;i++){
   const waffle=part('waffle',g,-.28+i*.28,.15,-.065);waffle.rotation.set(-.4,0,.07*(i-1));
   box(.21,.23,.055,baked,0,0,0,waffle);
   for(let k=-1;k<=1;k++){box(.012,.19,.014,coffee,k*.055,0,.031,waffle);box(.18,.012,.014,coffee,0,k*.06,.032,waffle);}
   box(.07,.05,.035,cream,.025,.065,.045,waffle);
  }
  for(const x of [-.23,.18]){
   const croissant=mesh(new T.TorusGeometry(.09,.04,6,15,Math.PI*1.5),baked,x,.115,.13,g);croissant.rotation.set(Math.PI/2,0,.38);
   for(let k=0;k<3;k++){const a=.5+k*.6;const seam=mesh(new T.TorusGeometry(.043,.006,4,10,Math.PI),cream,x+Math.cos(a)*.08,.122,.13+Math.sin(a)*.08,g);seam.rotation.y=-a;}
  }
 }
 function espresso(parent){
  const g=part('espresso-machine',parent,-.65,1.02,.48);
  box(1.02,.1,.67,ink,0,.05,0,g);box(.98,.64,.52,cream,0,.42,-.06,g);box(1.04,.07,.59,gold,0,.77,-.045,g);
  box(.86,.23,.035,ink,0,.56,.214,g);box(.86,.055,.29,ink,0,.12,.35,g);
  for(let i=0;i<8;i++)rod([-.36+i*.103,.153,.24],[-.36+i*.103,.153,.46],.007,gold,g);
  for(const x of [-.24,.23]){
   const dial=cylinder(.066,.066,.025,cream,x,.59,.245,g,20);dial.rotation.x=Math.PI/2;
   const rim=mesh(new T.TorusGeometry(.063,.009,4,20),gold,x,.59,.265,g);rod([x,.59,.28],[x+.026,.62,.28],.005,ink,g);
   cylinder(.07,.085,.12,gold,x,.36,.25,g,12);rod([x,.34,.28],[x,.34,.49],.027,ink,g);
   cylinder(.014,.014,.035,gold,x,.275,.265,g,8);
  }
  curve([[.45,.48,.13],[.57,.48,.26],[.57,.28,.46],[.51,.21,.46]],.015,gold,g);
  for(const x of [-.35,.35])rod([x,.81,-.28],[x,.81,.16],.015,gold,g);
  mug(g,-.19,.82,-.055,{lid:true});mug(g,.17,.82,-.055);
  const grinder=part('coffee-grinder',parent,.18,1.02,.42);
  box(.3,.07,.35,ink,0,.035,0,grinder);box(.24,.42,.25,cream,0,.25,-.04,grinder);box(.1,.09,.13,gold,0,.28,.13,grinder);
  cylinder(.13,.075,.23,glass,0,.585,-.04,grinder,16);cylinder(.14,.14,.025,ink,0,.715,-.04,grinder,16);
  for(let j=0;j<14;j++){const a=j*2.4,r=.07*Math.sqrt((j+.5)/14);const bean=ball(coffee,Math.cos(a)*r,.51+(j%3)*.025,-.04+Math.sin(a)*r,.028,grinder);bean.scale.multiply(new T.Vector3(1.2,.6,.8));}
  mug(parent,-1.04,1.0,1.55,{cocoa:true});mug(parent,-.63,1.0,1.55,{lid:true});
  pastries(parent,.69,1.0,1.44);
 }
 function popcorn(parent){
  const g=part('popcorn-machine',parent,-.62,1.01,.55);
  box(.95,.14,.7,rose,0,.07,0,g);box(1.02,.05,.76,gold,0,.17,0,g);
  mesh(new T.BoxGeometry(.88,.83,.63),glass,0,.6,0,g);
  for(const x of [-.46,.46])for(const z of [-.33,.33]){rod([x,.18,z],[x,1.05,z],.026,gold,g);ball(gold,x,1.06,z,.035,g);}
  box(1.02,.11,.76,rose,0,1.1,0,g);box(1.08,.035,.8,cream,0,1.173,0,g);
  for(let i=0;i<8;i++)ball(warm,-.43+i*.123,1.11,.399,.023,g);
  const kettle=cylinder(.19,.145,.2,ink,0,.72,0,g,20);cylinder(.21,.21,.025,gold,0,.835,0,g,20);
  for(const x of [-.23,.23])rod([x,.76,0],[x,1.04,0],.018,gold,g);
  const handle=mesh(new T.TorusGeometry(.08,.014,5,14,Math.PI),gold,0,.86,0,g);handle.rotation.y=Math.PI/2;
  rod([.19,.73,0],[.36,.73,0],.014,ink,g);rod([.36,.73,0],[.36,.65,0],.014,ink,g);
  const kernels=new T.InstancedMesh(smallFoodGeometry,cream,76),dummy=new T.Object3D();kernels.name='popcorn-kernels';
  for(let j=0;j<76;j++){const a=j*2.399,r=Math.sqrt((j+.5)/76);dummy.position.set(Math.cos(a)*r*.37,.25+(j%4)*.026,Math.sin(a)*r*.26);dummy.rotation.set(j*.3,j*.7,0);dummy.scale.set(1.1,.8+(j%3)*.18,1.05);dummy.updateMatrix();kernels.setMatrixAt(j,dummy.matrix);kernels.setColorAt(j,new T.Color(j%4?'#fff0df':'#e8c587'));}kernels.computeBoundingSphere();g.add(kernels);
  box(.11,.035,.06,gold,.32,.53,.354,g);for(const y of [.35,.83])cylinder(.022,.022,.09,gold,-.45,y,.35,g,8);
  for(let j=0;j<3;j++){
   const cup=part('popcorn-cup',parent,.35+j*.35,1,1.52),profile=[[.095,0],[.13,.28],[.116,.28],[.085,.025]].map(([r,y])=>new T.Vector2(r,y));mesh(new T.LatheGeometry(profile,16),j%2?cream:rose,0,0,0,cup);
   for(let k=0;k<6;k++){const a=k*Math.PI/3;rod([Math.sin(a)*.098,.035,Math.cos(a)*.098],[Math.sin(a)*.128,.265,Math.cos(a)*.128],.009,cream,cup);}
   for(let k=0;k<9;k++){const a=k*2.4;ball(cream,Math.cos(a)*.085,.28+(k%3)*.024,Math.sin(a)*.085,.041,cup);}
  }
  mug(parent,-1.07,1.0,1.54,{cocoa:true});
 }
 function iceCream(parent){
  const freezer=part('ice-cream-display',parent,.94,1.04,.27);
  box(.73,.27,.64,mint,0,.135,0,freezer);box(.77,.035,.68,gold,0,.285,0,freezer);
  for(const x of [-.22,0,.22]){
   cylinder(.105,.105,.07,ink,x,.29,0,freezer,16);
   for(let k=0;k<4;k++)ball(x<0?rose:x>0?mint:cream,x+(k%2-.5)*.085,.345,Math.floor(k/2)*.07-.035,.064,freezer);
  }
  const lid=mesh(new T.BoxGeometry(.73,.024,.65),glass,0,.54,-.11,freezer);lid.rotation.x=-.6;
  for(const side of [-1,1])rod([side*.37,.36,-.38],[side*.37,.72,.16],.012,gold,freezer);
  rod([-.37,.72,.16],[.37,.72,.16],.012,gold,freezer);
  curve([[-.07,.73,.16],[-.07,.77,.18],[.07,.77,.18],[.07,.73,.16]],.012,cream,freezer);
  for(let j=0;j<2;j++){
   const cone=part('ice-cream-cone',parent,.96+j*.29,1.0,1.49);
   cylinder(.125,.018,.28,baked,0,.18,0,cone,16);
   for(const sign of [-1,1])for(let k=0;k<6;k++){
    const points=[];for(let n=0;n<7;n++){const t=n/6,a=k*Math.PI/3+sign*t*.85,r=.021+t*.105;points.push(new T.Vector3(Math.sin(a)*r,.045+t*.27,Math.cos(a)*r));}
    mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),7,.004,3,false),coffee,0,0,0,cone);
   }
   ball(j?cream:rose,0,.38,0,.142,cone);for(let k=0;k<6;k++){const a=k*Math.PI/3;ball(j?cream:rose,Math.sin(a)*.105,.31,Math.cos(a)*.105,.038,cone);}
   cylinder(.145,.145,.025,gold,0,.07,0,cone,16);for(const x of [-.13,.13])rod([x,.02,0],[x,.19,0],.009,gold,cone);
  }
 }
 function sweets(parent){
  const sweets=new T.InstancedMesh(smallFoodGeometry,cream,60),dummy=new T.Object3D();sweets.name='candy-jar-sweets';let n=0;
  for(let j=0;j<4;j++){
   const x=-.98+j*.53,y=1.02+(j%2)*.1,z=1.4;
   box(.37,.07+(j%2)*.2,.4,wood,x,.995+(j%2)*.1,z,parent);
   const profile=[[.12,0],[.145,.04],[.145,.27],[.105,.34],[.105,.36],[.09,.36],[.13,.26],[.13,.05],[.11,.02]].map(([r,h])=>new T.Vector2(r,h));
   mesh(new T.LatheGeometry(profile,18),glass,x,y,z,parent);cylinder(.12,.12,.035,gold,x,y+.38,z,parent,18);ball(cream,x,y+.425,z,.045,parent);
   for(let k=0;k<15;k++){const a=k*2.399,r=.095*Math.sqrt((k+.5)/15);dummy.position.set(x+Math.cos(a)*r,y+.07+(k%4)*.045,z+Math.sin(a)*r);dummy.scale.set(1.2,.82,1);dummy.rotation.set(k*.3,j,k*.6);dummy.updateMatrix();sweets.setMatrixAt(n,dummy.matrix);sweets.setColorAt(n,new T.Color(['#d88daf','#9fcac2','#c5b0e0'][j%3]));n++;}
  }
  sweets.computeBoundingSphere();parent.add(sweets);iceCream(parent);
  const holder=part('lollipop-stand',parent,-.68,1.02,.5);cylinder(.32,.36,.07,cream,0,.035,0,holder,20);
  for(let j=0;j<4;j++){
   const x=-.23+j*.15,y=.5+(j%2)*.2;rod([x,.05,0],[x,y,0],.013,gold,holder);
   const disc=cylinder(.125,.125,.045,cream,x,y,0,holder,20);disc.rotation.x=Math.PI/2;
   const spiral=[];for(let k=0;k<=30;k++){const a=k/30*Math.PI*4,r=.01+k/30*.10;spiral.push(new T.Vector3(x+Math.cos(a)*r,y+Math.sin(a)*r,.03));}
   mesh(new T.TubeGeometry(new T.CatmullRomCurve3(spiral),30,.012,4,false),j%2?rose:colors[2],0,0,0,holder);
  }
  for(let j=0;j<2;j++){
   const x=.05+j*.39;rod([x,1.06,.5],[x,1.83,.5],.014,gold,parent);
   for(let k=0;k<5;k++){const a=k*2.4,puff=ball(j?rose:colors[2],x+Math.cos(a)*.07,1.83+(k%3)*.065,.5+Math.sin(a)*.05,.105,parent);puff.scale.multiply(new T.Vector3(1,1.15,.8));}
  }
 }
 function stall(spec,i){
  const g=group('park-'+spec.kind+'-stall',spec.x,spec.z,spec.yaw),accent=colors[i];
  g.userData.lampGlow=[{x:-1.3,y:2.4,z:1.5,radius:3,power:10,range:9},{x:1.3,y:2.4,z:1.5,radius:3,power:10,range:9}];
  for(let j=0;j<18;j++)ball(warm,-1.65+j*3.3/17,2.6,2.22,.045,g);
  // Separate walls leave a real service opening, so equipment is visible inside the booth.
  box(3.1,.86,2.5,cream,0,.43,0,g);box(3.1,1.75,.14,cream,0,1.735,-1.18,g);box(3.1,.34,2.5,cream,0,2.43,0,g);
  for(const side of [-1,1])box(.14,2.6,2.5,cream,side*1.48,1.3,0,g);
  box(2.75,.1,1.5,wood,0,.97,.45,g);box(2.7,.13,.65,wood,0,.9,1.45,g);box(3.16,.085,2.56,gold,0,.11,0,g);
  for(const side of [-1,1]){
   box(.17,2.65,.16,accent,side*1.48,1.36,1.3,g);cylinder(.09,.13,.16,gold,side*1.48,2.65,1.3,g,12);
   box(1.27,.62,.045,accent,side*.71,.49,1.278,g);box(1.1,.47,.025,cream,side*.71,.49,1.31,g);
   curve([[side*.71-.11,.48,1.34],[side*.71-.11,.53,1.39],[side*.71+.11,.53,1.39],[side*.71+.11,.48,1.34]],.014,gold,g);
   for(const y of [.3,.67]){const hinge=cylinder(.022,.022,.095,gold,side*1.3,y,1.33,g,8);for(const dy of [-.06,.06])ball(ink,side*1.3,y+dy,1.34,.012,g);}
  }
  box(.64,1.7,.045,wood,.56,1.02,-1.274,g);box(.54,1.57,.02,accent,.56,1.02,-1.306,g);
  for(const y of [.49,1.57])cylinder(.024,.024,.13,gold,.25,y,-1.33,g,8);
  curve([[.74,.92,-1.33],[.79,.92,-1.4],[.79,1.08,-1.4],[.74,1.08,-1.33]],.014,gold,g);
  for(let k=0;k<7;k++){
   const x=-1.41+k*.47,roof=box(.47,.11,1.35,k%2?cream:accent,x,2.7,1.54,g);roof.rotation.x=.14;
   const valance=ball(k%2?cream:accent,x,2.52,2.15,.235,g);valance.scale.multiply(new T.Vector3(1,.55,.23));
   for(let j=0;j<7;j++){const z=.99+j*.16;const stitch=box(.018,.009,.046,k%2?accent:cream,x-.207,2.758-(z-1.54)*Math.tan(.14),z,g);stitch.rotation.x=.14;}
  }
  rod([-1.64,2.615,2.2],[1.64,2.615,2.2],.018,cream,g);
  const profile=[new T.Vector2(2.15,0),new T.Vector2(1.92,.14),new T.Vector2(1.22,.73),new T.Vector2(.28,1.13),new T.Vector2(.02,1.3)];const roof=mesh(new T.LatheGeometry(profile,4),accent,0,2.67,0,g);roof.rotation.y=Math.PI/4;ball(gold,0,4.02,0,.11,g);
  marquee(g,2.8,2.28,1.32);menuBoard(g,i);
  if(spec.kind==='popcorn')popcorn(g);else if(spec.kind==='candy')sweets(g);else espresso(g);
  // Real cup and confection silhouettes identify the counters above the canopy.
  const badge=cylinder(.43,.43,.09,cream,0,3.2,1.18,g,32);badge.rotation.x=Math.PI/2;
  if(spec.kind==='waffle'){
   box(.27,.23,.10,accent,0,3.19,1.26,g);const handle=mesh(new T.TorusGeometry(.08,.018,5,16),gold,.18,3.2,1.26,g);
   for(const x of [-.07,.07])curve([[x,3.37,1.29],[x-.025,3.43,1.29],[x+.025,3.5,1.29]],.009,gold,g);
  }else if(spec.kind==='popcorn'){
   const bucket=cylinder(.17,.12,.27,accent,0,3.12,1.28,g,12);for(let j=0;j<5;j++)ball(gold,-.13+j*.065,3.3+(j%2)*.025,1.28,.052,g);
  }else{const candy=cylinder(.19,.19,.055,accent,0,3.25,1.27,g,20);candy.rotation.x=Math.PI/2;rod([0,2.98,1.29],[0,3.2,1.29],.017,gold,g);mesh(new T.TorusGeometry(.12,.015,5,20),cream,0,3.25,1.31,g);}
  for(const x of [-1.55,1.55])halo(x,2.35,1.35,'#ffd5a6',1.2,g);
 }
 parkStalls.forEach(stall);
 for(const p of parkBenches)scene.add(buildWinterBench(p));
 const ticket=group('sparkler-kiosk',sparklerKiosk.x,sparklerKiosk.z,sparklerKiosk.yaw);
 cylinder(1.45,1.55,.2,cream,0,.12,0,ticket,8);cylinder(1.15,1.25,2.7,mint,0,1.55,0,ticket,8);
 box(1.5,1.05,.07,ink,0,1.6,1.17,ticket);box(1.65,.12,.6,cream,0,1.03,1.31,ticket);
 for(const x of [-.8,.8])box(.065,1.2,.12,gold,x,1.62,1.21,ticket);
 cylinder(.12,1.75,1.45,rose,0,3.6,0,ticket,8);ring(1.65,2.96,gold,ticket);ball(warm,0,4.4,0,.12,ticket);marquee(ticket,1.6,2.42,1.2);
 // Reuse the existing kiosk footprint; display bundles identify the handheld firework counter.
 for(const x of [-.48,0,.48]){cylinder(.13,.11,.25,gold,x,1.2,1.32,ticket,16);for(let i=0;i<5;i++){const dx=(i-2)*.04;rod([x+dx,1.15,1.32],[x+dx*1.4,1.85+(i%2)*.06,1.32],.008,ink,ticket);}}
 const sparkSign=document.createElement('canvas');sparkSign.width=512;sparkSign.height=128;const sign=sparkSign.getContext('2d');sign.fillStyle='#252c3a';sign.fillRect(0,0,512,128);sign.fillStyle='#f3dfb5';sign.textAlign='center';sign.textBaseline='middle';sign.font='500 48px sans-serif';sign.fillText('스파클러',256,64);const signTexture=new T.CanvasTexture(sparkSign);signTexture.colorSpace=T.SRGBColorSpace;mesh(new T.PlaneGeometry(1.42,.36),new T.MeshBasicMaterial({map:signTexture}),0,2.42,1.291,ticket);
 for(const x of [-.7,.7])ball(warm,x,2.65,1.23,.055,ticket);

 for(let i=0;i<5;i++){const stub=box(.18,.26,.035,i%2?cream:rose,-.52+i*.26,1.19,1.53,ticket);stub.rotation.z=(i-2)*.12;}
 const cart=group('park-balloon-cart',balloonCart.x,balloonCart.z,balloonCart.yaw);box(1.7,.7,.95,rose,0,.84,0,cart);box(1.83,.12,1.07,cream,0,1.25,0,cart);
 for(const x of [-.67,.67])for(const z of [-.52,.52]){const wheel=cylinder(.25,.25,.07,ink,x,.34,z,cart,16);wheel.rotation.x=Math.PI/2;const hub=torus(.17,.025,gold,x,.34,z+.045,cart);ball(gold,x,.34,z+.06,.045,cart);}
 curve([[-.9,.8,0],[-1.2,1.25,0],[-1.28,1.25,0]],.04,gold,cart);
 for(const x of [-.78,.78])for(const z of [-.42,.42]){rod([x,1.3,z],[x,2.48,z],.027,gold,cart);cylinder(.047,.047,.07,cream,x,1.4,z,cart,10);}
 for(let j=0;j<6;j++){
  const x=-.875+j*.35;
  for(const side of [-1,1]){const roof=box(.35,.055,.78,j%2?cream:mint,x,2.58,side*.34,cart);roof.rotation.x=side*.3;}
  const trim=ball(j%2?cream:mint,x,2.37,.715,.175,cart);trim.scale.multiply(new T.Vector3(1,.62,.2));
  for(let k=0;k<4;k++){const z=.18+k*.14;box(.015,.01,.035,j%2?mint:cream,x-.15,2.715-z*.3,z,cart);}
 }
 rod([-1.05,2.715,0],[1.05,2.715,0],.022,gold,cart);for(const x of [-1.06,1.06])ball(gold,x,2.715,0,.045,cart);
 box(.67,.77,.045,wood,.46,1.81,.495,cart);const priceGeo=new T.PlaneGeometry(.61,.71),priceUV=priceGeo.attributes.uv;
 for(let j=0;j<priceUV.count;j++)priceUV.setX(j,(3.01+priceUV.getX(j)*.98)/4);
 const priceBoard=mesh(priceGeo,menuMaterial,.46,1.81,.522,cart);priceBoard.name='balloon-booth-price-board';
 for(const x of [.2,.72])rod([x,2.22,.51],[x,2.4,.51],.01,gold,cart);
 // Pump, bubble bottles and ribbon spools make the counter usable-looking at avatar scale.
 cylinder(.055,.065,.34,ink,-.55,1.5,.15,cart,12);rod([-.55,1.67,.15],[-.55,1.81,.15],.015,gold,cart);rod([-.65,1.82,.15],[-.45,1.82,.15],.02,wood,cart);
 curve([[-.55,1.4,.15],[-.74,1.35,.29],[-.66,1.32,.42]],.013,gold,cart);
 for(let j=0;j<3;j++){const x=-.4+j*.19;cylinder(.055,.055,.17,colors[j],x,1.4,.38,cart,12);cylinder(.06,.06,.035,cream,x,1.502,.38,cart,12);const wand=mesh(new T.TorusGeometry(.032,.007,4,12),gold,x,1.59,.38,cart);rod([x,1.51,.38],[x,1.56,.38],.006,gold,cart);}
 for(const x of [-.45,-.12]){const spool=cylinder(.08,.08,.15,cream,x,1.4,-.24,cart,14);spool.rotation.x=Math.PI/2;for(const z of [-.33,-.15]){const disc=cylinder(.1,.1,.018,gold,x,1.4,z,cart,14);disc.rotation.x=Math.PI/2;}}
 const balloons=dressBalloonBooth(cart);
 // Flush stone inlays make the former lake a walkable square, softened by snowy edges.
 const pavers=createStonePaving(600),dummy=new T.Object3D();let count=0;
 // Small flush forecourts punctuate the snow promenade without changing its soft edges.
 const courts=[{x:-6,z:1,rx:6.2,rz:6.2},{x:-27,z:24,rx:7,rz:1.8},{x:16,z:14,rx:3.5,rz:2},{x:-36,z:7,rx:3.5,rz:2.4}];
 for(const court of courts)for(let row=-9;row<=9;row++)for(let col=-10;col<=10;col++){
  const dx=col*.8+(row%2)*.4,dz=row*.7,x=court.x+dx,z=court.z+dz;
  if((dx/court.rx)**2+(dz/court.rz)**2>1||Math.hypot(x+18,z+5)<6.7||count>=600)continue;
  dummy.position.set(x,.09,z);dummy.rotation.set(0,(row+col)%3*.06,0);dummy.updateMatrix();pavers.setMatrixAt(count,dummy.matrix);pavers.setColorAt(count,new T.Color(pavingColors[count%3]));count++;
 }
 pavers.count=count;pavers.name='park-plaza-inlay';pavers.receiveShadow=true;scene.add(pavers);
 const star=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.55:1.4;i?star.lineTo(Math.cos(a)*r,Math.sin(a)*r):star.moveTo(Math.cos(a)*r,Math.sin(a)*r);}star.closePath();const inset=mesh(new T.ShapeGeometry(star),gold,-6,.109,1);inset.rotation.x=-Math.PI/2;
 const border=torus(1.9,.028,cream,-6,.11,1);border.rotation.x=Math.PI/2;
 // Railings sit within the wheel's existing footprint and leave a two metre entrance.
 for(const side of [-1,1])for(let i=0;i<5;i++){const x=-18+side*(1.4+i*.65);rod([x,.1,1],[x,1.1,1],.035,gold);ball(warm,x,1.13,1,.06);if(i<4)rod([x,1.04,1],[x+side*.65,1.04,1],.025,gold);}
 return balloons;
}
