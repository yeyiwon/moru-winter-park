import {museumLayout,conservatoryLayout} from './district-layout.js';
import {treeLayout,treeShift} from './tree-layout.js';
import {alpineShift} from './resort-layout.js';
import {ferrisDimensions} from './ferris-layout.js';
import {landforms,landRadius,bridges} from './world-layout.js';
import {parkWalkways,carouselLayout} from './park-layout.js';
import {rinkBounds} from './retreat-layout.js';
import {spaShift,liftPoint,upperLiftPoint,skiRuns,skiRunCenter} from './resort-layout.js';
import {pathRoutes} from './path-routes.js';
const mapSymbols={
 castle:'M3 27h26M5 26V12h5v14m12 0V12h5v14M4 12l3.5-7 3.5 7m10 0 3.5-7 3.5 7M12 26V13h8v13M11 13l5-10 5 10M14 27v-6a2 2 0 0 1 4 0v6',
 park:'M16 3a11 11 0 1 0 0 22 11 11 0 0 0 0-22Zm0 0v22M5 14h22M8 6l16 16M24 6 8 22M16 14 10 29m6-15 6 15',
 tree:'m16 2-6 9h3l-7 8h4l-6 8h10v3h4v-3h10l-6-8h4l-7-8h3Zm-7 22 14-4M11 16l10-3',
 quiz:'M4 27h24M6 26V14h20v12M5 14a11 11 0 0 1 22 0M16 3v11M5 14h22M16 18a5 3 20 1 0 0 7 5 3 20 1 0 0-7M16 17v10',
 conservatory:'M3 27h26V16a13 13 0 0 0-26 0Zm0-11h26M16 3v24M16 3C5 9 5 22 9 27M16 3c11 6 11 19 7 24M16 24c-8 0-8-6-6-8 6 0 6 8 6 8Zm0-5c0-6 6-8 8-7 1 5-5 8-8 7Z',
 onsen:'M3 22c0 9 26 9 26 0M4 22h24M9 18c-5-5 5-5 0-10m7 10c-5-5 5-5 0-10m7 10c-5-5 5-5 0-10M2 8l14-6 14 6',
 ski:'m2 27 11-23 6 12 4-8 8 19ZM8 15l5 2 3-7M21 15l3 2 2-3'
};
export const mapFacilities=[
 {id:'castle',name:'겨울 성',x:0,z:-7},{id:'park',name:'놀이공원',x:0,z:24},{id:'tree',name:'트리 광장',...treeLayout.arrival},
 {id:'quiz',name:'별빛 만물관',...museumLayout.arrival},{id:'onsen',name:'온천 · 료칸',x:0,z:96+spaShift},
 {id:'ski',name:'스키장',x:-36,z:-185+alpineShift},{id:'conservatory',name:'오로라 식물원',...conservatoryLayout.arrival}
];
// Touch targets remain disjoint; short leader lines retain the true world anchor.
export function mapLabelPositions(facilities,view,width,height){
 const placed=[];
 for(const facility of facilities){const anchor=projectMap(facility,view,width,height);if(anchor.x<0||anchor.x>width||anchor.y<0||anchor.y>height)continue;let best=null,score=Infinity;
  const candidates=[[0,0]];for(const r of [48,72,96,120])for(let i=0;i<12;i++)candidates.push([Math.cos(i*Math.PI/6)*r,Math.sin(i*Math.PI/6)*r]);
  for(const [dx,dy]of candidates){const p={x:Math.max(25,Math.min(width-25,anchor.x+dx)),y:Math.max(30,Math.min(height-36,anchor.y+dy))},overlaps=placed.filter(q=>Math.abs(q.x-p.x)<48&&Math.abs(q.y-p.y)<48).length,controls=p.x>width-62&&p.y<168?1:0,cost=(overlaps+controls)*10000+Math.hypot(p.x-anchor.x,p.y-anchor.y);if(cost<score){score=cost;best=p;}}
  placed.push({...best,id:facility.id,anchor});
 }return placed;
}
export const worldMapBounds={minX:-180,maxX:150,minZ:-410,maxZ:120};
export const mapOverview={x:-15,z:-22,zoom:1};
// A compressed northern scale keeps the resort readable beside the park, like an illustrated park atlas.
const atlasZ=z=>z< -90?-90+(z+90)*.27:z;
const worldZ=z=>z< -90?-90+(z+90)/.27:z;
export function projectMap(p,view,width,height){const scale=Math.min((width-32)/350,(height-42)/320)*view.zoom;return{x:width/2+(p.x-view.x)*scale,y:height/2+(atlasZ(p.z)-atlasZ(view.z))*scale,scale};}
export function unprojectMap(p,view,width,height){const c=projectMap({x:view.x,z:view.z},view,width,height);return{x:view.x+(p.x-width/2)/c.scale,z:worldZ(atlasZ(view.z)+(p.y-height/2)/c.scale)};}
export function createWorldMap(root,onTravel){
 root.replaceChildren();root.classList.add('coordinate-map');const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','실제 월드 지도. 드래그로 이동, 휠 또는 두 손가락으로 확대합니다. 주요 구역을 누르면 이동합니다.');canvas.tabIndex=0;
 const controls=document.createElement('div');controls.className='map-controls';controls.innerHTML='<button data-zoom="1.35" aria-label="지도 확대">+</button><button data-zoom=".74" aria-label="지도 축소">−</button><button data-fit aria-label="지도 전체 보기">⌖</button>';
 const labelsLayer=document.createElement('div');labelsLayer.className='map-regions';const regionButtons=new Map();for(const p of mapFacilities){const button=document.createElement('button');button.className='map-region';button.dataset.region=p.id;button.setAttribute('aria-label',p.name+' 이동');button.innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="'+mapSymbols[p.id]+'"/></svg>';button.setAttribute('aria-pressed','false');const name=document.createElement('span');name.textContent=p.name;button.append(name);let touch=false;button.onclick=e=>{e.stopPropagation();select(p.id,touch&&e.detail!==0);};button.onpointerdown=e=>{touch=e.pointerType==='touch';e.stopPropagation();};regionButtons.set(p.id,button);labelsLayer.append(button);}root.append(canvas,labelsLayer,controls);
 const ctx=canvas.getContext('2d'),view={...mapOverview},pointers=new Map();let width=0,height=0,start=null,moved=false,frame=0,routes=null,selected=null;
 function select(id,touch){if(touch&&selected!==id){selected=id;for(const [key,b]of regionButtons){b.setAttribute('aria-pressed',String(key===id));b.querySelector('span').textContent=mapFacilities.find(f=>f.id===key).name+(key===id?' · 다시 눌러 이동':'');}return;}onTravel(id);}
 function zoom(factor,p={x:width/2,y:height/2}){const before=unprojectMap(p,view,width,height);view.zoom=Math.max(1,Math.min(8,view.zoom*factor));const after=unprojectMap(p,view,width,height);view.x+=before.x-after.x;view.z+=before.z-after.z;draw();}
 function line(points,color,lineWidth){if(!points.length)return;ctx.beginPath();points.forEach((p,i)=>{const q=projectMap(Array.isArray(p)?{x:p[0],z:p[1]}:p,view,width,height);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.stroke();}
 function draw(){
  if(!width||!height)return;const scale=projectMap({x:0,z:0},view,width,height).scale;ctx.clearRect(0,0,width,height);ctx.lineCap='round';
  const background=ctx.createRadialGradient(width*.5,height*.35,10,width*.5,height*.5,width*.7);background.addColorStop(0,'#1b41556e');background.addColorStop(1,'#0b1e3555');ctx.fillStyle=background;ctx.fillRect(0,0,width,height);
  for(let i=0;i<55;i++){ctx.fillStyle=i%4?'#a8c6dc22':'#e1d1ac65';ctx.beginPath();ctx.arc((i*137.3)%width,(i*71.7)%height,i%4?.7:1.2,0,Math.PI*2);ctx.fill();}
  for(const form of landforms){
   const outline=Array.from({length:97},(_,i)=>{const a=i/96*Math.PI*2,r=landRadius(form,a);return projectMap({x:form.x+Math.cos(a)*form.rx*r,z:form.z+Math.sin(a)*form.rz*r},view,width,height);});
   const path=(dy=0)=>{ctx.beginPath();outline.forEach((p,i)=>i?ctx.lineTo(p.x,p.y+dy):ctx.moveTo(p.x,p.y+dy));ctx.closePath();};
   path(12);ctx.fillStyle='#101f3659';ctx.shadowColor='#07112388';ctx.shadowBlur=16;ctx.fill();ctx.shadowBlur=0;for(let cliff=10;cliff>=2;cliff-=2){path(cliff);ctx.fillStyle=cliff>6?'#3d627f':'#6490a5';ctx.fill();}
   path();const p=projectMap(form,view,width,height),snow=ctx.createLinearGradient(p.x,p.y-form.rz*scale,p.x,p.y+form.rz*scale);const palette=form.id==='alpine'?['#e5f6ffed','#8fb7d5c9']:form.z>60?['#fff0d6e3','#a6cdc4c9']:form.x>55?['#f0f9e9e6','#8ac8b5cb']:['#e8f7faeb','#9fc8daca'];snow.addColorStop(0,palette[0]);snow.addColorStop(1,palette[1]);ctx.fillStyle=snow;ctx.fill();ctx.strokeStyle='#e5f9f4ac';ctx.lineWidth=1.2;ctx.stroke();
   for(const inset of [.90,.78]){ctx.save();ctx.translate(p.x,p.y);ctx.scale(inset,inset);ctx.translate(-p.x,-p.y);path();ctx.strokeStyle='#f0ffff22';ctx.lineWidth=.7;ctx.stroke();ctx.restore();}
   if(form.id==='alpine')for(let j=0;j<5;j++){const x=p.x+(j-2)*19*scale,y=p.y+(j%2?2:-8)*scale;ctx.beginPath();ctx.moveTo(x-23*scale,y+12*scale);ctx.lineTo(x,y-20*scale);ctx.lineTo(x+29*scale,y+12*scale);ctx.fillStyle=j%2?'#86acd5':'#9ccbdc';ctx.fill();ctx.beginPath();ctx.moveTo(x-9*scale,y-8*scale);ctx.lineTo(x,y-20*scale);ctx.lineTo(x+12*scale,y-8*scale);ctx.lineTo(x+2*scale,y-17*scale);ctx.lineTo(x-3*scale,y-10*scale);ctx.fillStyle='#e9fbff';ctx.fill();}
  }
  for(const [a,b]of bridges){line([a,b],'#c3dfeb50',Math.max(4,8*scale));line([a,b],'#d5bf8e',Math.max(2,6*scale));}
  if(!routes)routes=[...parkWalkways.map(p=>p.points),...pathRoutes.map(p=>p.points)];
  for(const points of routes)line(points,'#e2d7b380',Math.max(1.1,3*scale));
  for(const run of skiRuns)line(Array.from({length:70},(_,i)=>{const z=run.startZ+(run.finish-run.startZ)*i/69;return{x:skiRunCenter(z,run.id),z};}),'#e8f9ff9c',Math.max(.8,run.width*scale*.5));
  for(const fn of [liftPoint,upperLiftPoint])line(Array.from({length:30},(_,i)=>{const p=fn(i/29);return{x:p[0],z:p[2]};}),'#ffd59a',1.4);
  const ice=projectMap(rinkBounds,view,width,height);ctx.fillStyle='#9cd7e2';ctx.beginPath();ctx.ellipse(ice.x,ice.y,rinkBounds.rx*scale,rinkBounds.rz*scale,0,0,Math.PI*2);ctx.fill();
  // Miniatures sit at their real world coordinates, independent of label positions.
  function landmark(x,z,paint){const p=projectMap({x,z},view,width,height);ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);ctx.lineWidth=1/scale;paint();ctx.restore();}
  landmark(0,-14,()=>{ctx.fillStyle='#f1f3ed';ctx.fillRect(-15,-12,30,19);ctx.fillRect(-5,-28,10,25);for(const [x,h]of [[-14,21],[-7,29],[0,43],[7,29],[14,21]]){ctx.fillStyle='#f3f1e5';ctx.fillRect(x-2.4,-h+6,4.8,h-1);ctx.fillStyle='#3b718e';ctx.beginPath();ctx.moveTo(x-4,-h+7);ctx.lineTo(x,-h-3);ctx.lineTo(x+4,-h+7);ctx.closePath();ctx.fill();ctx.fillStyle='#ffdf9e';ctx.fillRect(x-.7,-h+10,1.4,3);ctx.beginPath();ctx.arc(x,-h-4,1,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#4d7d90';ctx.beginPath();ctx.moveTo(-3,7);ctx.lineTo(-3,0);ctx.quadraticCurveTo(0,-6,3,0);ctx.lineTo(3,7);ctx.fill();});
  landmark(treeLayout.x,treeLayout.z,()=>{ctx.fillStyle='#386d64';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(0,-19+i*7);ctx.lineTo(-10-i*2,3+i*4);ctx.lineTo(10+i*2,3+i*4);ctx.fill();}ctx.fillStyle='#ffdc94';for(let i=0;i<12;i++){const y=-13+i*2;ctx.beginPath();ctx.arc(Math.sin(i*2.4)*(y+20)*.35,y,1.1,0,Math.PI*2);ctx.fill();}});
  landmark(ferrisDimensions.center.x,ferrisDimensions.center.z,()=>{ctx.strokeStyle='#f2dcb0';ctx.beginPath();ctx.arc(0,-9,13,0,Math.PI*2);ctx.moveTo(-7,10);ctx.lineTo(0,-9);ctx.lineTo(7,10);ctx.stroke();for(let i=0;i<12;i++){const a=i/12*Math.PI*2;ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(Math.cos(a)*13,-9+Math.sin(a)*13);ctx.stroke();ctx.fillStyle='#e7f1ef';ctx.fillRect(Math.cos(a)*13-1.8,-9+Math.sin(a)*13,3.6,3);}});
  for(const [x,z,r]of [[16,3.8,8]])landmark(x,z,()=>{ctx.fillStyle='#b2d4d4';ctx.beginPath();ctx.ellipse(0,0,r,r*.65,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f0ddb6';ctx.beginPath();ctx.moveTo(-r,0);ctx.quadraticCurveTo(-r,-r*1.7,0,-r*1.5);ctx.quadraticCurveTo(r,-r*1.7,r,0);ctx.lineTo(-r,0);ctx.moveTo(0,-r*1.5);ctx.lineTo(0,r*.65);ctx.stroke();});
  for(const [x,z,w,h]of [[12,126+spaShift,17,11]])landmark(x,z,()=>{ctx.fillStyle='#e4e6dd';ctx.fillRect(-w/2,-h/2,w,h);ctx.fillStyle='#466474';ctx.beginPath();ctx.moveTo(-w*.62,-h/2);ctx.lineTo(0,-h*1.3);ctx.lineTo(w*.62,-h/2);ctx.closePath();ctx.fill();ctx.fillStyle='#f6da94';for(const dx of [-w*.3,0,w*.3])ctx.fillRect(dx-1,-1,2,3);});
  landmark(-10,124+spaShift,()=>{ctx.fillStyle='#74b7be';ctx.beginPath();ctx.ellipse(0,0,8,6,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e3e9e0';for(const x of [-4,0,4]){ctx.beginPath();ctx.moveTo(x,-3);ctx.bezierCurveTo(x-3,-7,x+3,-8,x,-12);ctx.stroke();}});
  for(const district of [museumLayout,conservatoryLayout])landmark(district.x,district.z,()=>{const w=district.rx,h=district.height*.7;ctx.fillStyle='#80b5bf';ctx.strokeStyle='#e7d7aa';ctx.beginPath();ctx.ellipse(0,0,w,w*.5,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-w,0);ctx.bezierCurveTo(-w,-h*1.4,w,-h*1.4,w,0);ctx.closePath();ctx.fillStyle='#bcdedfbb';ctx.fill();ctx.stroke();for(const ratio of [-.65,-.33,0,.33,.65]){ctx.beginPath();ctx.moveTo(ratio*w,0);ctx.quadraticCurveTo(ratio*w*.7,-h*.8,0,-h*1.05);ctx.stroke();}ctx.fillStyle='#fff0c4';ctx.fillRect(-2,-2,4,6);});
  // Small snow-capped groups echo the forests, leaving paths and landmarks legible.
  for(const f of landforms){if(f.id==='alpine')continue;for(let i=0;i<12;i++){const a=i*2.399,r=.66+.16*Math.sin(i*3.1),x=f.x+Math.cos(a)*f.rx*r,z=f.z+Math.sin(a)*f.rz*r;landmark(x,z,()=>{ctx.fillStyle='#315767';ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(-2.8,2);ctx.lineTo(2.8,2);ctx.fill();ctx.fillStyle='#edf5ee';ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(-1.6,-1);ctx.lineTo(.3,-2);ctx.lineTo(1.8,-1);ctx.fill();});}}
  for(const button of regionButtons.values())button.hidden=true;
  for(const p of mapLabelPositions(mapFacilities,view,width,height)){const button=regionButtons.get(p.id);button.hidden=false;button.style.left=p.x+'px';button.style.top=p.y+'px';ctx.strokeStyle='#c3e7f267';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.anchor.x,p.anchor.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.fillStyle='#e5f7fc';ctx.beginPath();ctx.arc(p.anchor.x,p.anchor.y,3,0,Math.PI*2);ctx.fill();}
  const player=window.labInterior?window.labInteriorExit:window.labPlayerState;if(player){const p=projectMap(player,view,width,height);ctx.fillStyle='#9bf2da';ctx.beginPath();ctx.arc(p.x,p.y,4.5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e4fff5b0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.stroke();}
  ctx.font='10px Winter Sans, sans-serif';ctx.textAlign='left';ctx.fillStyle='#d9eaf0a0';ctx.fillText('N ↑',15,24);ctx.fillText('산악 구간 축약 · 아이콘을 눌러 이동',15,height-16);
 }
 const resize=()=>{const r=canvas.getBoundingClientRect();width=r.width;height=r.height;root.dataset.compact=String(width<400&&height<340);const dpr=Math.min(globalThis.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();};if(globalThis.ResizeObserver)new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
 controls.onclick=e=>{const b=e.target.closest('button');if(b?.dataset.zoom)zoom(Number(b.dataset.zoom));else if(b?.hasAttribute('data-fit')){Object.assign(view,mapOverview);draw();}};
 const point=e=>{const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
 canvas.onpointerdown=e=>{e.preventDefault();e.stopPropagation();canvas.setPointerCapture?.(e.pointerId);pointers.set(e.pointerId,point(e));start=point(e);moved=pointers.size>1;};
 canvas.onpointermove=e=>{if(!pointers.has(e.pointerId))return;e.preventDefault();const old=[...pointers.values()],previous=pointers.get(e.pointerId),p=point(e);pointers.set(e.pointerId,p);if(pointers.size===2){const now=[...pointers.values()],d=Math.hypot(old[0].x-old[1].x,old[0].y-old[1].y);if(d>1)zoom(Math.hypot(now[0].x-now[1].x,now[0].y-now[1].y)/d,{x:(now[0].x+now[1].x)/2,y:(now[0].y+now[1].y)/2});moved=true;}else{if(Math.hypot(p.x-start.x,p.y-start.y)>5)moved=true;const scale=projectMap({x:0,z:0},view,width,height).scale;view.x-=(p.x-previous.x)/scale;view.z=worldZ(atlasZ(view.z)-(p.y-previous.y)/scale);draw();}};
 canvas.onpointerup=e=>{if(!moved){const p=point(e),near=mapFacilities.map(f=>({f,d:Math.hypot(projectMap(f,view,width,height).x-p.x,projectMap(f,view,width,height).y-p.y)})).sort((a,b)=>a.d-b.d)[0];if(near?.d<20){select(near.f.id,e.pointerType==='touch');}}pointers.delete(e.pointerId);};canvas.onpointercancel=e=>{pointers.delete(e.pointerId);moved=true;};canvas.onlostpointercapture=e=>{pointers.delete(e.pointerId);moved=true;};
 canvas.addEventListener('wheel',e=>{e.preventDefault();e.stopPropagation();zoom(Math.exp(-e.deltaY*.0015),point(e));},{passive:false});canvas.onkeydown=e=>{if(['+','=','-','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();e.stopPropagation();if(['+','=','-'].includes(e.key))zoom(e.key==='-'?.8:1.25);else{const shift=30/view.zoom;view.x+=e.key==='ArrowLeft'?-shift:e.key==='ArrowRight'?shift:0;view.z+=e.key==='ArrowUp'?-shift:e.key==='ArrowDown'?shift:0;draw();}}};window.addEventListener('lab:pause',()=>requestAnimationFrame(resize));
 return{draw,resize};
}
