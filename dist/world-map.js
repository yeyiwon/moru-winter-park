import {conservatoryLayout as glasshouse,conservatoryEntry} from './conservatory-layout.js';
import {ferrisDimensions} from './ferris-layout.js';
import {landforms,landRadius,bridges} from './world-layout.js';
import {parkWalkways,carouselLayout} from './park-layout.js';
import {rinkBounds} from './retreat-layout.js';
import {liftPoint,upperLiftPoint,skiRuns,skiRunCenter} from './resort-layout.js';
import {pathRoutes} from './path-routes.js';
export const mapFacilities=[
 {id:'park',name:'놀이공원',x:0,z:24},{id:'tree',name:'트리 광장',x:108,z:53},
 {id:'greenhouse',name:'오로라 온실',...conservatoryEntry},
 {id:'quiz',name:'퀴즈 연구소',x:44,z:24},{id:'onsen',name:'온천 · 료칸',x:0,z:96},
 {id:'ski',name:'스키장',x:-36,z:-185}
];
// The marker stays at the world coordinate; only its connected touch label moves for clearance.
export function mapLabelPositions(facilities,view,width,height){
 if(width<400&&height<340){const visible=facilities.map(f=>({...f,anchor:projectMap(f,view,width,height)})).filter(p=>p.anchor.x>=0&&p.anchor.x<=width&&p.anchor.y>=0&&p.anchor.y<=height).sort((a,b)=>a.anchor.y-b.anchor.y||a.anchor.x-b.anchor.x);return visible.map((p,i)=>({id:p.id,anchor:p.anchor,x:i%2?width-57:57,y:86+Math.floor(i/2)*(height-113)/2}));}
 const placed=[];for(const facility of facilities){const anchor=projectMap(facility,view,width,height);if(anchor.x<0||anchor.x>width||anchor.y<0||anchor.y>height)continue;
 const candidates=[[0,-33],[-63,0],[63,0],[0,34],[-63,-46],[63,-46],[-63,46],[63,46],[0,-82],[0,82]];
 for(let y=27;y<=height-27;y+=52)for(const x of [57,width/2,width-57])candidates.push([x-anchor.x,y-anchor.y]);
 let best=null,score=Infinity;for(const [dx,dy]of candidates){const p={x:Math.max(57,Math.min(width-57,anchor.x+dx)),y:Math.max(27,Math.min(height-27,anchor.y+dy))};const overlaps=placed.filter(q=>Math.abs(q.x-p.x)<116&&Math.abs(q.y-p.y)<51).length,control=p.x>width-113&&p.y<175?1:0,cost=(overlaps+control)*10000+Math.hypot(p.x-anchor.x,p.y-anchor.y);if(cost<score){score=cost;best=p;}}
 placed.push({...best,id:facility.id,anchor});}return placed;
}
export const worldMapBounds={minX:-150,maxX:150,minZ:-410,maxZ:160};
export function projectMap(p,view,width,height){const scale=Math.min((width-32)/300,(height-32)/570)*view.zoom;return{x:width/2+(p.x-view.x)*scale,y:height/2+(p.z-view.z)*scale,scale};}
export function unprojectMap(p,view,width,height){const c=projectMap({x:view.x,z:view.z},view,width,height);return{x:view.x+(p.x-width/2)/c.scale,z:view.z+(p.y-height/2)/c.scale};}
export function createWorldMap(root,onTravel){
 root.replaceChildren();root.classList.add('coordinate-map');const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','실제 월드 지도. 드래그로 이동, 휠 또는 두 손가락으로 확대합니다. 주요 구역을 누르면 이동합니다.');canvas.tabIndex=0;
 const controls=document.createElement('div');controls.className='map-controls';controls.innerHTML='<button data-zoom="1.35" aria-label="지도 확대">+</button><button data-zoom=".74" aria-label="지도 축소">−</button><button data-fit aria-label="지도 전체 보기">⌖</button>';
 const labelsLayer=document.createElement('div');labelsLayer.className='map-regions';const regionButtons=new Map();for(const p of mapFacilities){const button=document.createElement('button');button.className='map-region';button.dataset.region=p.id;button.setAttribute('aria-label',p.name+' 이동');button.textContent=p.name;button.onclick=e=>{e.stopPropagation();onTravel(p.id);};button.onpointerdown=e=>e.stopPropagation();regionButtons.set(p.id,button);labelsLayer.append(button);}root.append(canvas,labelsLayer,controls);
 const ctx=canvas.getContext('2d'),view={x:0,z:-125,zoom:1},pointers=new Map();let width=0,height=0,start=null,moved=false,frame=0,routes=null;
 function zoom(factor,p={x:width/2,y:height/2}){const before=unprojectMap(p,view,width,height);view.zoom=Math.max(1,Math.min(8,view.zoom*factor));const after=unprojectMap(p,view,width,height);view.x+=before.x-after.x;view.z+=before.z-after.z;draw();}
 function line(points,color,lineWidth){if(!points.length)return;ctx.beginPath();points.forEach((p,i)=>{const q=projectMap(Array.isArray(p)?{x:p[0],z:p[1]}:p,view,width,height);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.stroke();}
 function draw(){
  if(!width||!height)return;const scale=projectMap({x:0,z:0},view,width,height).scale;ctx.clearRect(0,0,width,height);ctx.fillStyle='#112338';ctx.fillRect(0,0,width,height);ctx.lineCap='round';
  const background=ctx.createRadialGradient(width*.5,height*.35,10,width*.5,height*.5,width*.7);background.addColorStop(0,'#213e53');background.addColorStop(1,'#0c172c');ctx.fillStyle=background;ctx.fillRect(0,0,width,height);
  for(let i=0;i<55;i++){ctx.fillStyle=i%4?'#a8c6dc22':'#e1d1ac65';ctx.beginPath();ctx.arc((i*137.3)%width,(i*71.7)%height,i%4?.7:1.2,0,Math.PI*2);ctx.fill();}
  for(const form of landforms){
   const outline=Array.from({length:97},(_,i)=>{const a=i/96*Math.PI*2,r=landRadius(form,a);return projectMap({x:form.x+Math.cos(a)*form.rx*r,z:form.z+Math.sin(a)*form.rz*r},view,width,height);});
   const path=(dy=0)=>{ctx.beginPath();outline.forEach((p,i)=>i?ctx.lineTo(p.x,p.y+dy):ctx.moveTo(p.x,p.y+dy));ctx.closePath();};
   path(5);ctx.fillStyle='#020a16aa';ctx.shadowColor='#0009';ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0;
   path();const p=projectMap(form,view,width,height),snow=ctx.createLinearGradient(p.x,p.y-form.rz*scale,p.x,p.y+form.rz*scale);snow.addColorStop(0,form.id==='alpine'?'#b7c7d3':'#b8cdd3');snow.addColorStop(1,'#56788a');ctx.fillStyle=snow;ctx.fill();ctx.strokeStyle='#dbe8e6aa';ctx.lineWidth=1;ctx.stroke();
   if(form.id==='alpine')for(let j=0;j<5;j++){const x=p.x+(j-2)*19*scale,y=p.y+(j%2?18:-24)*scale;ctx.beginPath();ctx.moveTo(x-23*scale,y+25*scale);ctx.lineTo(x,y-35*scale);ctx.lineTo(x+29*scale,y+25*scale);ctx.fillStyle=j%2?'#718fa3':'#8ca7b8';ctx.fill();ctx.beginPath();ctx.moveTo(x-9*scale,y-12*scale);ctx.lineTo(x,y-35*scale);ctx.lineTo(x+12*scale,y-10*scale);ctx.lineTo(x+2*scale,y-17*scale);ctx.lineTo(x-3*scale,y-12*scale);ctx.fillStyle='#e6f0ee';ctx.fill();}
  }
  for(const [a,b]of bridges){line([a,b],'#152239',Math.max(4,8*scale));line([a,b],'#d5bf8e',Math.max(2,6*scale));}
  if(!routes)routes=[...parkWalkways.map(p=>p.points),...pathRoutes.map(p=>p.points)];
  for(const points of routes)line(points,'#e2d7b380',Math.max(1.1,3*scale));
  for(const run of skiRuns)line(Array.from({length:70},(_,i)=>{const z=run.startZ+(run.finish-run.startZ)*i/69;return{x:skiRunCenter(z,run.id),z};}),run.color,Math.max(1,run.width*scale));
  for(const fn of [liftPoint,upperLiftPoint])line(Array.from({length:30},(_,i)=>{const p=fn(i/29);return{x:p[0],z:p[2]};}),'#ffd59a',1.4);
  const ice=projectMap(rinkBounds,view,width,height);ctx.fillStyle='#9cd7e2';ctx.beginPath();ctx.ellipse(ice.x,ice.y,rinkBounds.rx*scale,rinkBounds.rz*scale,0,0,Math.PI*2);ctx.fill();
  // Miniatures sit at their real world coordinates, independent of label positions.
  function landmark(x,z,paint){const p=projectMap({x,z},view,width,height);ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);ctx.lineWidth=1/scale;paint();ctx.restore();}
  landmark(108,35,()=>{ctx.fillStyle='#386d64';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(0,-19+i*7);ctx.lineTo(-10-i*2,3+i*4);ctx.lineTo(10+i*2,3+i*4);ctx.fill();}ctx.fillStyle='#ffdc94';for(let i=0;i<12;i++){const y=-13+i*2;ctx.beginPath();ctx.arc(Math.sin(i*2.4)*(y+20)*.35,y,1.1,0,Math.PI*2);ctx.fill();}});
  landmark(ferrisDimensions.center.x,ferrisDimensions.center.z,()=>{ctx.strokeStyle='#f2dcb0';ctx.beginPath();ctx.arc(0,-9,13,0,Math.PI*2);ctx.moveTo(-7,10);ctx.lineTo(0,-9);ctx.lineTo(7,10);ctx.stroke();for(let i=0;i<12;i++){const a=i/12*Math.PI*2;ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(Math.cos(a)*13,-9+Math.sin(a)*13);ctx.stroke();ctx.fillStyle='#e7f1ef';ctx.fillRect(Math.cos(a)*13-1.8,-9+Math.sin(a)*13,3.6,3);}});
  for(const [x,z,r]of [[16,3.8,8],[glasshouse.x,glasshouse.z,11]])landmark(x,z,()=>{ctx.fillStyle='#b2d4d4';ctx.beginPath();ctx.ellipse(0,0,r,r*.65,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f0ddb6';ctx.beginPath();ctx.moveTo(-r,0);ctx.quadraticCurveTo(-r,-r*1.7,0,-r*1.5);ctx.quadraticCurveTo(r,-r*1.7,r,0);ctx.lineTo(-r,0);ctx.moveTo(0,-r*1.5);ctx.lineTo(0,r*.65);ctx.stroke();});
  for(const [x,z,w,h]of [[12,126,17,11],[46,27,13,9]])landmark(x,z,()=>{ctx.fillStyle='#e4e6dd';ctx.fillRect(-w/2,-h/2,w,h);ctx.fillStyle='#466474';ctx.beginPath();ctx.moveTo(-w*.62,-h/2);ctx.lineTo(0,-h*1.3);ctx.lineTo(w*.62,-h/2);ctx.closePath();ctx.fill();ctx.fillStyle='#f6da94';for(const dx of [-w*.3,0,w*.3])ctx.fillRect(dx-1,-1,2,3);});
  landmark(-10,124,()=>{ctx.fillStyle='#74b7be';ctx.beginPath();ctx.ellipse(0,0,8,6,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e3e9e0';for(const x of [-4,0,4]){ctx.beginPath();ctx.moveTo(x,-3);ctx.bezierCurveTo(x-3,-7,x+3,-8,x,-12);ctx.stroke();}});
  for(const button of regionButtons.values())button.hidden=true;
  for(const p of mapLabelPositions(mapFacilities,view,width,height)){const button=regionButtons.get(p.id);button.hidden=false;button.style.left=p.x+'px';button.style.top=p.y+'px';ctx.strokeStyle='#c3e7f267';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.anchor.x,p.anchor.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.fillStyle='#e5f7fc';ctx.beginPath();ctx.arc(p.anchor.x,p.anchor.y,3,0,Math.PI*2);ctx.fill();}
  const player=window.labInterior?window.labInteriorExit:window.labPlayerState;if(player){const p=projectMap(player,view,width,height);ctx.fillStyle='#9bf2da';ctx.beginPath();ctx.arc(p.x,p.y,4.5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#9bf2da66';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.stroke();}
  ctx.font='10px system-ui';ctx.textAlign='left';ctx.fillStyle='#d9eaf0a0';ctx.fillText('N ↑',15,24);ctx.fillText('드래그 · 확대',15,height-16);
 }
 const resize=()=>{const r=canvas.getBoundingClientRect();width=r.width;height=r.height;root.dataset.compact=String(width<400&&height<340);const dpr=Math.min(globalThis.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();};if(globalThis.ResizeObserver)new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
 controls.onclick=e=>{const b=e.target.closest('button');if(b?.dataset.zoom)zoom(Number(b.dataset.zoom));else if(b?.hasAttribute('data-fit')){Object.assign(view,{x:0,z:-125,zoom:1});draw();}};
 const point=e=>{const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
 canvas.onpointerdown=e=>{e.preventDefault();e.stopPropagation();canvas.setPointerCapture?.(e.pointerId);pointers.set(e.pointerId,point(e));start=point(e);moved=pointers.size>1;};
 canvas.onpointermove=e=>{if(!pointers.has(e.pointerId))return;e.preventDefault();const old=[...pointers.values()],previous=pointers.get(e.pointerId),p=point(e);pointers.set(e.pointerId,p);if(pointers.size===2){const now=[...pointers.values()],d=Math.hypot(old[0].x-old[1].x,old[0].y-old[1].y);if(d>1)zoom(Math.hypot(now[0].x-now[1].x,now[0].y-now[1].y)/d,{x:(now[0].x+now[1].x)/2,y:(now[0].y+now[1].y)/2});moved=true;}else{if(Math.hypot(p.x-start.x,p.y-start.y)>5)moved=true;const scale=projectMap({x:0,z:0},view,width,height).scale;view.x-=(p.x-previous.x)/scale;view.z-=(p.y-previous.y)/scale;draw();}};
 canvas.onpointerup=e=>{if(!moved){const p=point(e),near=mapFacilities.map(f=>({f,d:Math.hypot(projectMap(f,view,width,height).x-p.x,projectMap(f,view,width,height).y-p.y)})).sort((a,b)=>a.d-b.d)[0];if(near?.d<20){onTravel(near.f.id);}}pointers.delete(e.pointerId);};canvas.onpointercancel=e=>{pointers.delete(e.pointerId);moved=true;};canvas.onlostpointercapture=e=>{pointers.delete(e.pointerId);moved=true;};
 canvas.addEventListener('wheel',e=>{e.preventDefault();e.stopPropagation();zoom(Math.exp(-e.deltaY*.0015),point(e));},{passive:false});canvas.onkeydown=e=>{if(['+','=','-','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();e.stopPropagation();if(['+','=','-'].includes(e.key))zoom(e.key==='-'?.8:1.25);else{const shift=30/view.zoom;view.x+=e.key==='ArrowLeft'?-shift:e.key==='ArrowRight'?shift:0;view.z+=e.key==='ArrowUp'?-shift:e.key==='ArrowDown'?shift:0;draw();}}};window.addEventListener('lab:pause',()=>requestAnimationFrame(resize));
 return{draw,resize};
}
