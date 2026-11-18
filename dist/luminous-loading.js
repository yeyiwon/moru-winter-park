let serial=0;
const drawSeconds=2.7,holdUntil=3.3,fadeSeconds=.65,cycleSeconds=4.15;
// One continuous, tapered 3D-looking ribbon, authored against the supplied reference.
export function loadingTreePath(){return 'M70 449 C210 407 509 421 532 454 C571 509 8 493 70 449 C182 362 526 307 480 334 C406 379 89 365 126 320 C232 248 452 188 411 207 C345 227 161 212 195 184 C235 149 398 138 360 112 C330 90 307 67 300 32';}
export function createLuminousLoading(root){
 const id='luminous-'+serial++,path=loadingTreePath(),doc=root.ownerDocument;
 const frame=doc.createElement('div');frame.className='luminous-loading';
 frame.innerHTML=`<svg class="luminous-tree" viewBox="0 0 600 540" aria-hidden="true"><defs><linearGradient id="${id}-color" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="#ffe3ed"/><stop offset=".28" stop-color="#ffe5ad"/><stop offset=".6" stop-color="#fff3da"/><stop offset=".78" stop-color="#cfe8f8"/><stop offset=".87" stop-color="#f8d8d8"/><stop offset="1" stop-color="#f6d6a4"/></linearGradient><filter id="${id}-halo" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4.2"/></filter><filter id="${id}-soft" x="-15%" y="-15%" width="130%" height="130%"><feGaussianBlur stdDeviation="1.2"/></filter><path id="${id}-path" d="${path}" pathLength="1"/></defs><g class="luminous-drawing"><use href="#${id}-path" class="luminous-line luminous-halo" stroke="url(#${id}-color)" filter="url(#${id}-halo)"/><use href="#${id}-path" class="luminous-line luminous-soft" stroke="url(#${id}-color)" filter="url(#${id}-soft)"/><use href="#${id}-path" class="luminous-line luminous-core" stroke="url(#${id}-color)"/><g class="luminous-particles"></g><g class="luminous-tip"><circle r="7" fill="#ffe1b5" filter="url(#${id}-halo)"/><circle r="2.5" fill="#fff8e9"/></g></g></svg><div class="luminous-caption"><p>Loading ...</p></div>`;
 root.prepend(frame);const curve=frame.querySelector('path'),drawing=frame.querySelector('.luminous-drawing'),tip=frame.querySelector('.luminous-tip'),layer=frame.querySelector('.luminous-particles'),lines=frame.querySelectorAll('.luminous-line'),media=matchMedia('(prefers-reduced-motion:reduce)');
 const particles=Array.from({length:innerWidth<650?16:28},(_,i)=>{const node=doc.createElementNS('http://www.w3.org/2000/svg','circle');node.setAttribute('r',String(.5+(i%4)*.22));node.setAttribute('fill',i%5?'#ffe6bd':'#e7eaff');node.setAttribute('opacity','0');layer.append(node);return{node,born:-99,x:0,y:0,dx:Math.sin(i*8.1)*9,dy:4+i%6};});
 let raf=0,start=0,running=false,lastSpawn=0,cursor=0,lastCycle=-1,length=0;
 function paint(now){
  if(!running)return;const elapsed=(now-start)/1000,cycle=Math.floor(elapsed/cycleSeconds),phase=elapsed%cycleSeconds;
  const reduced=media.matches||doc.body.classList.contains('still'),t=reduced?1:Math.min(1,phase/drawSeconds),progress=t*t*(3-2*t),opacity=reduced?1:phase<holdUntil?1:Math.max(0,1-(phase-holdUntil)/fadeSeconds);
  for(const line of lines)line.style.strokeDashoffset=String(1-progress);drawing.style.opacity=String(opacity);
  if(curve.getTotalLength){length ||=curve.getTotalLength();const point=curve.getPointAtLength(progress*length);tip.setAttribute('transform',`translate(${point.x} ${point.y})`);tip.style.opacity=reduced||phase>drawSeconds?'0':'1';
   if(cycle!==lastCycle){for(const p of particles)p.born=-99;lastCycle=cycle;lastSpawn=elapsed;}
   if(!reduced&&phase<drawSeconds&&elapsed-lastSpawn>.045){const p=particles[cursor++%particles.length];p.x=point.x;p.y=point.y;p.born=elapsed;lastSpawn=elapsed;}
  }
  for(const p of particles){const age=elapsed-p.born,a=!reduced&&age<1.3?Math.sin(Math.min(1,age/.1)*Math.PI/2)*(1-age/1.3):0;p.node.setAttribute('opacity',String(Math.max(0,a)*.72));if(a>0){p.node.setAttribute('cx',String(p.x+p.dx*age));p.node.setAttribute('cy',String(p.y+p.dy*age));}}
  if(!reduced)raf=requestAnimationFrame(paint);
 }
 function startAnimation(){stop();running=true;start=performance.now();lastCycle=-1;paint(start);}
 function stop(){running=false;cancelAnimationFrame(raf);raf=0;}
 function preference(){if(running)startAnimation();}
 media.addEventListener?.('change',preference);
 return{start:startAnimation,stop,dispose(){stop();media.removeEventListener?.('change',preference);frame.remove();}};
}
