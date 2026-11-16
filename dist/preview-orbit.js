export function createPreviewOrbit(canvas){
 let angle=0,pitch=0,velocity=0,pointer=null,lastX=0,lastY=0,lastTime=0;
 canvas.onpointerdown=e=>{if(e.button!==0)return;pointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;lastTime=e.timeStamp;velocity=0;canvas.setPointerCapture?.(pointer);canvas.classList.add('dragging');};
 canvas.onpointermove=e=>{if(pointer!==e.pointerId)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;angle+=dx*.012;pitch=Math.max(-.35,Math.min(.38,pitch+dy*.005));velocity=dx*.012/Math.max(.008,(e.timeStamp-lastTime)/1000);lastX=e.clientX;lastY=e.clientY;lastTime=e.timeStamp;};
 const release=e=>{if(pointer!==e.pointerId)return;pointer=null;canvas.classList.remove('dragging');};
 canvas.onpointerup=release;canvas.onpointercancel=e=>{release(e);velocity=0;};canvas.onlostpointercapture=release;
 canvas.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();e.stopPropagation();if(e.key==='ArrowLeft')angle-=.25;else if(e.key==='ArrowRight')angle+=.25;else pitch=Math.max(-.35,Math.min(.38,pitch+(e.key==='ArrowUp'?-.1:.1)));};
 return{update(dt,still=false){if(pointer===null){if(still)velocity=0;angle+=velocity*Math.min(dt,.05);velocity*=Math.exp(-Math.min(dt,.05)*9);}return{angle,pitch};}};
}
