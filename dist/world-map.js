import {snowfields} from './world-layout.js';
import {worldPathLinks} from './world-paths.js';
import {parkWalkways,carouselLayout} from './park-layout.js';
import {festivalDestinations} from './festival-layout.js';
import {postOffice,skateRental,rinkBounds} from './retreat-layout.js';
import {resortDestinations,liftPoint,upperLiftPoint,skiRuns,skiRunCenter} from './resort-layout.js';
import {findPath} from './navigation.js';
export const mapFacilities=[
 {id:'park',name:'놀이공원',x:0,z:24},{id:'tree',name:'트리 광장',x:108,z:53},
 {id:'post-office',name:'소원 우체국',...postOffice.entry},{id:'greenhouse',name:'오로라 온실',x:0,z:40.8},
 {id:'quiz',name:'퀴즈 연구소',x:44,z:24},{id:'carousel',name:'회전목마',x:carouselLayout.x,z:12.2},{id:'ferris',name:'관람차',x:-13,z:2},
 {id:'skating',name:'아이스링크',...skateRental.entry},...resortDestinations.map(({id,name,x,z})=>({id,name,x,z})),
 {id:'ski-gear',name:'스키 장비',x:-44,z:-181.8},...festivalDestinations.filter(p=>p.kind==='ride')
];
export const worldMapBounds={minX:-150,maxX:150,minZ:-410,maxZ:160};
export function projectMap(p,view,width,height){const scale=Math.min((width-32)/300,(height-32)/570)*view.zoom;return{x:width/2+(p.x-view.x)*scale,y:height/2+(p.z-view.z)*scale,scale};}
export function unprojectMap(p,view,width,height){const c=projectMap({x:view.x,z:view.z},view,width,height);return{x:view.x+(p.x-width/2)/c.scale,z:view.z+(p.y-height/2)/c.scale};}
export function createWorldMap(root,onTravel){
 root.replaceChildren();root.classList.add('coordinate-map');const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','실제 월드 지도. 드래그로 이동, 휠 또는 두 손가락으로 확대합니다. 아래 장소 목록으로 선택할 수 있습니다.');canvas.tabIndex=0;
 const controls=document.createElement('div');controls.className='map-controls';controls.innerHTML='<button data-zoom="1.35" aria-label="지도 확대">+</button><button data-zoom=".74" aria-label="지도 축소">−</button><button data-fit aria-label="지도 전체 보기">⌖</button>';
 const info=document.createElement('div');info.className='map-destination';const label=document.createElement('label');label.textContent='장소';const select=document.createElement('select');select.setAttribute('aria-label','지도 장소');for(const p of mapFacilities){const o=document.createElement('option');o.value=p.id;o.textContent=p.name;select.append(o);}label.append(select);const go=document.createElement('button');go.textContent='이동';go.onclick=()=>onTravel(select.value);info.append(label,go);root.append(canvas,controls,info);
 const ctx=canvas.getContext('2d'),view={x:0,z:-125,zoom:1},pointers=new Map();let width=0,height=0,start=null,moved=false,frame=0,routes=null;
 function selected(){return mapFacilities.find(p=>p.id===select.value);}
 function zoom(factor,p={x:width/2,y:height/2}){const before=unprojectMap(p,view,width,height);view.zoom=Math.max(1,Math.min(8,view.zoom*factor));const after=unprojectMap(p,view,width,height);view.x+=before.x-after.x;view.z+=before.z-after.z;draw();}
 function line(points,color,lineWidth){if(!points.length)return;ctx.beginPath();points.forEach((p,i)=>{const q=projectMap(Array.isArray(p)?{x:p[0],z:p[1]}:p,view,width,height);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.stroke();}
 function draw(){
  if(!width||!height)return;const scale=projectMap({x:0,z:0},view,width,height).scale;ctx.clearRect(0,0,width,height);ctx.fillStyle='#112338';ctx.fillRect(0,0,width,height);ctx.lineCap='round';
  for(const field of snowfields)line([field.a,field.b],'#456574',field.r*2*scale);
  const mountain=projectMap({x:0,z:-260},view,width,height);ctx.fillStyle='#456574';ctx.beginPath();ctx.arc(mountain.x,mountain.y,144*scale,0,Math.PI*2);ctx.fill();
  for(let i=0;i<4;i++){const q=projectMap({x:-15+i*7,z:-350+i*16},view,width,height);ctx.strokeStyle='#afc9d61c';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(q.x,q.y,(35+i*13)*scale,(15+i*16)*scale,0,0,Math.PI*2);ctx.stroke();}
  if(!routes)routes=[...parkWalkways.map(p=>p.points),...worldPathLinks.map(([a,b])=>[[...a],...findPath({x:a[0],z:a[1]},{x:b[0],z:b[1]}).map(p=>[p.x,p.z])])];
  for(const points of routes)line(points,'#e2d7b380',Math.max(1.1,3*scale));
  for(const run of skiRuns)line(Array.from({length:70},(_,i)=>{const z=run.startZ+(run.finish-run.startZ)*i/69;return{x:skiRunCenter(z,run.id),z};}),run.color,Math.max(1,run.width*scale));
  for(const fn of [liftPoint,upperLiftPoint])line(Array.from({length:30},(_,i)=>{const p=fn(i/29);return{x:p[0],z:p[2]};}),'#ffd59a',1.4);
  const ice=projectMap(rinkBounds,view,width,height);ctx.fillStyle='#9cd7e2';ctx.beginPath();ctx.ellipse(ice.x,ice.y,rinkBounds.rx*scale,rinkBounds.rz*scale,0,0,Math.PI*2);ctx.fill();
  for(const facility of mapFacilities){const p=projectMap(facility,view,width,height),active=facility===selected();ctx.beginPath();ctx.arc(p.x,p.y,active?6:3.2,0,Math.PI*2);ctx.fillStyle=active?'#ffd59a':'#eaf2fb';ctx.fill();if(active||view.zoom>2.4){ctx.font='500 11px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#112338';ctx.strokeText(facility.name,p.x,p.y-12);ctx.fillStyle='#f4f6fa';ctx.fillText(facility.name,p.x,p.y-12);}}
  const player=window.labInterior?window.labInteriorExit:window.labPlayerState;if(player){const p=projectMap(player,view,width,height);ctx.fillStyle='#9bf2da';ctx.beginPath();ctx.arc(p.x,p.y,4.5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#9bf2da66';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.stroke();}
  ctx.font='10px system-ui';ctx.textAlign='left';ctx.fillStyle='#d9eaf0a0';ctx.fillText('N ↑',15,24);ctx.fillText('드래그 · 확대',15,height-16);
 }
 const resize=()=>{const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const dpr=Math.min(devicePixelRatio,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();};if(globalThis.ResizeObserver)new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
 select.onchange=()=>{const p=selected();view.x=p.x;view.z=p.z;view.zoom=Math.max(2,view.zoom);draw();};controls.onclick=e=>{const b=e.target.closest('button');if(b?.dataset.zoom)zoom(Number(b.dataset.zoom));else if(b?.hasAttribute('data-fit')){Object.assign(view,{x:0,z:-125,zoom:1});draw();}};
 const point=e=>{const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
 canvas.onpointerdown=e=>{e.preventDefault();e.stopPropagation();canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,point(e));start=point(e);moved=false;};
 canvas.onpointermove=e=>{if(!pointers.has(e.pointerId))return;e.preventDefault();const old=[...pointers.values()],previous=pointers.get(e.pointerId),p=point(e);pointers.set(e.pointerId,p);if(pointers.size===2){const now=[...pointers.values()],d=Math.hypot(old[0].x-old[1].x,old[0].y-old[1].y);if(d>1)zoom(Math.hypot(now[0].x-now[1].x,now[0].y-now[1].y)/d,{x:(now[0].x+now[1].x)/2,y:(now[0].y+now[1].y)/2});moved=true;}else{if(Math.hypot(p.x-start.x,p.y-start.y)>5)moved=true;const scale=projectMap({x:0,z:0},view,width,height).scale;view.x-=(p.x-previous.x)/scale;view.z-=(p.y-previous.y)/scale;draw();}};
 canvas.onpointerup=e=>{if(!moved){const p=point(e),near=mapFacilities.map(f=>({f,d:Math.hypot(projectMap(f,view,width,height).x-p.x,projectMap(f,view,width,height).y-p.y)})).sort((a,b)=>a.d-b.d)[0];if(near?.d<20){select.value=near.f.id;draw();}}pointers.delete(e.pointerId);};canvas.onpointercancel=e=>pointers.delete(e.pointerId);canvas.onlostpointercapture=e=>pointers.delete(e.pointerId);
 canvas.addEventListener('wheel',e=>{e.preventDefault();e.stopPropagation();zoom(Math.exp(-e.deltaY*.0015),point(e));},{passive:false});canvas.onkeydown=e=>{if(['+','=','-','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();e.stopPropagation();if(['+','=','-'].includes(e.key))zoom(e.key==='-'?.8:1.25);else{const shift=30/view.zoom;view.x+=e.key==='ArrowLeft'?-shift:e.key==='ArrowRight'?shift:0;view.z+=e.key==='ArrowUp'?-shift:e.key==='ArrowDown'?shift:0;draw();}}};window.addEventListener('lab:pause',()=>requestAnimationFrame(resize));
 return{draw,resize};
}
