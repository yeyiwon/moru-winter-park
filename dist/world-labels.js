// Coordinates use a centre-x / bottom-y anchor, matching the world prompt transform.
export function placePrompt({x,y,width,height,viewportWidth,viewportHeight,avoid}){
 const margin=14,half=Math.min(width/2,viewportWidth/2-margin),top=Math.min(90,viewportHeight*.2),bottom=Math.min(viewportWidth<=1000?170:130,viewportHeight*.42);
 const clamp=(v,a,b)=>Math.max(a,Math.min(Math.max(a,b),v));
 const fit=p=>({x:clamp(p.x,half+margin,viewportWidth-half-margin),y:clamp(p.y,height+top,viewportHeight-bottom)});
 const origin=fit({x,y});if(!avoid)return origin;
 const overlap=p=>Math.max(0,Math.min(p.x+half,avoid.right+14)-Math.max(p.x-half,avoid.left-14))*Math.max(0,Math.min(p.y,avoid.bottom+14)-Math.max(p.y-height,avoid.top-14));
 return [origin,{x:avoid.right+half+28,y},{x:avoid.left-half-28,y},{x,y:avoid.top-18},{x,y:avoid.bottom+height+18}].map(fit).sort((a,b)=>overlap(a)-overlap(b)||Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y))[0];
}

// Cache label dimensions, not its projected position. Measuring after every
// transform forced synchronous layout once per visitor on every frame.
export function nearbyLabel({player,camera,subject,pixels,visible=false}){
 if(!player)return false;
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
 // Hysteresis is independent of avatar culling. Summit/base height counts too.
 return distance(player,subject)<(visible?42:34)&&distance(camera,subject)<(visible?82:72)&&pixels>(visible?13:17);
}

export function createLabelLayout(element){
 const bubble=element.querySelector('.speech-bubble');let dirty=true,signature='',extent=null;
 const Observer=element.ownerDocument.defaultView.ResizeObserver,observer=Observer?new Observer(()=>dirty=true):null;
 observer?.observe(element);if(bubble)observer?.observe(bubble);
 const layout={bounds(x,y){
  const key=element.textContent+'|'+!!bubble?.hidden+'|'+element.ownerDocument.defaultView.innerWidth;
  if(dirty||key!==signature||!extent){const r=element.getBoundingClientRect(),b=bubble&&!bubble.hidden?bubble.getBoundingClientRect():r;extent={left:Math.min(r.left,b.left)-r.left-r.width/2,right:Math.max(r.right,b.right)-r.left-r.width/2,top:Math.min(r.top,b.top)-r.bottom,bottom:Math.max(r.bottom,b.bottom)-r.bottom};dirty=false;signature=key;}
  return{left:x+extent.left,right:x+extent.right,top:y+extent.top,bottom:y+extent.bottom};
 },fit(x,y,width,height){
  const b=layout.bounds(x,y),margin=10;
  const dx=Math.max(0,margin-b.left)-Math.max(0,b.right-width+margin),dy=Math.max(0,margin-b.top)-Math.max(0,b.bottom-height+margin);
  return {x:x+dx,y:y+dy,bounds:{left:b.left+dx,right:b.right+dx,top:b.top+dy,bottom:b.bottom+dy}};
 },dispose(){observer?.disconnect();}};
 return layout;
}
