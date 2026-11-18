import {skiMapDestinations} from './resort-layout.js';
import {worldAtlas} from './map-atlas.js';
import {regions} from './region-layout.js';
import {mapIcon} from './map-icons.js';
export const mapFacilities=[...Object.entries({park:'park',spa:'onsen',tree:'tree',museum:'quiz'}).map(([region,id])=>({id,region,name:regions[region].name,...regions[region].arrival})),...skiMapDestinations.map(p=>({...p,travelId:p.id}))];
// Touch targets remain disjoint; short leader lines retain the true world anchor.
export function mapLabelPositions(facilities,view,width,height){
 const placed=[];
 for(const facility of facilities){const anchor=projectMap(facility,view,width,height);if(anchor.x<0||anchor.x>width||anchor.y<0||anchor.y>height)continue;let best=null,score=Infinity;
  const candidates=[[0,0]];for(const r of [48,72,96,120])for(let i=0;i<12;i++)candidates.push([Math.cos(i*Math.PI/6)*r,Math.sin(i*Math.PI/6)*r]);
  for(let y=48;y<=height-48;y+=64)for(let x=42;x<=width-42;x+=80)candidates.push([x-anchor.x,y-anchor.y]);
  for(const [dx,dy]of candidates){const p={x:Math.max(42,Math.min(width-42,anchor.x+dx)),y:Math.max(48,Math.min(height-48,anchor.y+dy))},overlaps=placed.filter(q=>Math.abs(q.x-p.x)<78&&Math.abs(q.y-p.y)<64).length,controls=p.x>width-62&&p.y<168?1:0,cost=(overlaps+controls)*10000+Math.hypot(p.x-anchor.x,p.y-anchor.y);if(cost<score){score=cost;best=p;}}
  placed.push({...best,id:facility.id,anchor});
 }return placed;
}
export const worldMapBounds={minX:-180,maxX:150,minZ:-410,maxZ:120};
const m=worldAtlas.projection,det=m[0]*m[9]-m[8]*m[1],warp=worldAtlas.warp||{start:-80,scale:1};
const atlasZ=z=>z<warp.start?warp.start+(z-warp.start)*warp.scale:z;
const worldZ=z=>z<warp.start?warp.start+(z-warp.start)/warp.scale:z;
function inverseClip(x,y){const a=x-m[12],b=y-m[13];return{x:(a*m[9]-b*m[8])/det,z:worldZ((b*m[0]-a*m[1])/det)};}
function atlasPoint(p){const z=atlasZ(p.z),y=(p.y||0)*(p.z<warp.start?(warp.heightScale??.65):1);return{x:(m[0]*p.x+m[4]*y+m[8]*z+m[12]+1)*worldAtlas.width/2,y:(1-m[1]*p.x-m[5]*y-m[9]*z-m[13])*worldAtlas.height/2};}
export const mapOverview={...inverseClip(0,0),zoom:1};
export const mapDefaultView={...mapOverview,zoom:1.35};
function mapScale(view,width,height){return Math.max(.01,Math.min((width-24)/worldAtlas.width,(height-24)/worldAtlas.height))*view.zoom;}
export function projectMap(p,view,width,height){const a=atlasPoint(p),c=atlasPoint(view),scale=mapScale(view,width,height);return{x:width/2+(a.x-c.x)*scale,y:height/2+(a.y-c.y)*scale,scale};}
export function unprojectMap(p,view,width,height){const c=atlasPoint(view),scale=mapScale(view,width,height),x=c.x+(p.x-width/2)/scale,y=c.y+(p.y-height/2)/scale;return inverseClip(x/worldAtlas.width*2-1,1-y/worldAtlas.height*2);}
export function createWorldMap(root,onTravel){
 root.replaceChildren();root.classList.add('coordinate-map');const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','실제 월드 지도. 드래그로 이동, 휠 또는 두 손가락으로 확대합니다. 주요 구역을 누르면 이동합니다.');canvas.tabIndex=0;
 const controls=document.createElement('div');controls.className='map-controls';controls.innerHTML='<button data-zoom="1.35" aria-label="지도 확대">+</button><button data-zoom=".74" aria-label="지도 축소">−</button><button data-fit aria-label="지도 전체 보기">⌖</button>';
 const labelsLayer=document.createElement('div');labelsLayer.className='map-regions';const regionButtons=new Map();for(const p of mapFacilities){const button=document.createElement('button');button.className='map-region';button.dataset.region=p.id;button.setAttribute('aria-label',p.name+' 이동');button.innerHTML=mapIcon(p.icon||p.id);button.setAttribute('aria-pressed','false');const name=document.createElement('span');name.textContent=({'ski':'초·중급 리프트','ski-right-base':'상급 리프트','ski-middle':'숲길 하차장','ski-peak':'설원 정상','park':'놀이공원','onsen':'온천·료칸','quiz':'별빛 만물관','tree':'소원 트리'})[p.id]||p.name;button.append(name);button.onclick=e=>{e.stopPropagation();select(p.id);};button.onpointerdown=e=>e.stopPropagation();regionButtons.set(p.id,button);labelsLayer.append(button);}root.append(canvas,labelsLayer,controls);
 const ctx=canvas.getContext('2d'),view={...mapDefaultView},pointers=new Map();let width=0,height=0,start=null,moved=false,frame=0;const atlas=document.createElement('img');atlas.decoding='async';atlas.onload=()=>draw();atlas.src=worldAtlas.image;
 function select(id){onTravel(id);}

 function zoom(factor,p={x:width/2,y:height/2}){const before=unprojectMap(p,view,width,height);view.zoom=Math.max(1,Math.min(8,view.zoom*factor));const after=unprojectMap(p,view,width,height);view.x+=before.x-after.x;view.z=worldZ(atlasZ(view.z)+atlasZ(before.z)-atlasZ(after.z));draw();}
 function line(points,color,lineWidth){if(!points.length)return;ctx.beginPath();points.forEach((p,i)=>{const q=projectMap(Array.isArray(p)?{x:p[0],z:p[1]}:p,view,width,height);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.stroke();}
 function draw(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;paint();});}
 function paint(){
  if(!width||!height)return;const scale=projectMap({x:0,z:0},view,width,height).scale;ctx.clearRect(0,0,width,height);ctx.lineCap='round';
  const background=ctx.createRadialGradient(width*.5,height*.35,10,width*.5,height*.5,width*.7);background.addColorStop(0,'#91dcdf0b');background.addColorStop(.6,'#a2bff206');background.addColorStop(1,'#a2bff200');ctx.fillStyle=background;ctx.fillRect(0,0,width,height);
  for(let i=0;i<55;i++){ctx.fillStyle=i%4?'#a8c6dc22':'#e1d1ac65';ctx.beginPath();ctx.arc((i*137.3)%width,(i*71.7)%height,i%4?.7:1.2,0,Math.PI*2);ctx.fill();}
  if(atlas.complete&&atlas.naturalWidth){const c=atlasPoint(view);ctx.drawImage(atlas,width/2-c.x*scale,height/2-c.y*scale,worldAtlas.width*scale,worldAtlas.height*scale);}
  for(const button of regionButtons.values())button.hidden=true;
  for(const p of mapLabelPositions(mapFacilities,view,width,height)){const button=regionButtons.get(p.id);button.hidden=false;button.style.left=p.x+'px';button.style.top=p.y+'px';button.dataset.labelAlign=p.x<width*.35?'left':p.x>width*.65?'right':'center';button.dataset.labelSide=p.y<80?'below':'above';button.style.setProperty('--map-label-width',Math.min(220,width-20)+'px');ctx.strokeStyle='#c3e7f267';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.anchor.x,p.anchor.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.fillStyle='#e5f7fc';ctx.beginPath();ctx.arc(p.anchor.x,p.anchor.y,3,0,Math.PI*2);ctx.fill();}
  const player=window.labInterior?window.labInteriorExit:window.labPlayerState;if(player){const p=projectMap(player,view,width,height);ctx.fillStyle='#9bf2da';ctx.beginPath();ctx.arc(p.x,p.y,4.5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e4fff5b0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.stroke();}
  ctx.font='10px Winter Sans, sans-serif';ctx.textAlign='left';ctx.fillStyle='#d9eaf0a0';ctx.fillText('N ↑',15,24);
 }
 const resize=()=>{const r=canvas.getBoundingClientRect();width=r.width;height=r.height;root.dataset.compact=String(width<400&&height<340);const dpr=Math.min(globalThis.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();};if(globalThis.ResizeObserver)new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
 controls.onclick=e=>{const b=e.target.closest('button');if(b?.dataset.zoom)zoom(Number(b.dataset.zoom));else if(b?.hasAttribute('data-fit')){Object.assign(view,mapOverview);draw();}};
 const point=e=>{const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
 canvas.onpointerdown=e=>{e.preventDefault();e.stopPropagation();canvas.setPointerCapture?.(e.pointerId);pointers.set(e.pointerId,point(e));start=point(e);moved=pointers.size>1;};
 canvas.onpointermove=e=>{if(!pointers.has(e.pointerId))return;e.preventDefault();const old=[...pointers.values()],previous=pointers.get(e.pointerId),p=point(e);pointers.set(e.pointerId,p);if(pointers.size===2){const now=[...pointers.values()],d=Math.hypot(old[0].x-old[1].x,old[0].y-old[1].y);if(d>1)zoom(Math.hypot(now[0].x-now[1].x,now[0].y-now[1].y)/d,{x:(now[0].x+now[1].x)/2,y:(now[0].y+now[1].y)/2});moved=true;}else{if(Math.hypot(p.x-start.x,p.y-start.y)>5)moved=true;const before=unprojectMap(previous,view,width,height),after=unprojectMap(p,view,width,height);view.x+=before.x-after.x;view.z=worldZ(atlasZ(view.z)+atlasZ(before.z)-atlasZ(after.z));draw();}};
 canvas.onpointerup=e=>{if(!moved){const p=point(e),near=mapFacilities.map(f=>({f,d:Math.hypot(projectMap(f,view,width,height).x-p.x,projectMap(f,view,width,height).y-p.y)})).sort((a,b)=>a.d-b.d)[0];if(near?.d<20){select(near.f.id,e.pointerType==='touch');}}pointers.delete(e.pointerId);};canvas.onpointercancel=e=>{pointers.delete(e.pointerId);moved=true;};canvas.onlostpointercapture=e=>{pointers.delete(e.pointerId);moved=true;};
 canvas.addEventListener('wheel',e=>{e.preventDefault();e.stopPropagation();zoom(Math.exp(-e.deltaY*.0015),point(e));},{passive:false});canvas.onkeydown=e=>{if(['+','=','-','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();e.stopPropagation();if(['+','=','-'].includes(e.key))zoom(e.key==='-'?.8:1.25);else{const shift=30/view.zoom;view.x+=e.key==='ArrowLeft'?-shift:e.key==='ArrowRight'?shift:0;view.z+=e.key==='ArrowUp'?-shift:e.key==='ArrowDown'?shift:0;draw();}}};window.addEventListener('lab:pause',()=>{for(const [id,b]of regionButtons){b.setAttribute('aria-pressed','false');}requestAnimationFrame(resize);});
 return{draw,resize};
}
