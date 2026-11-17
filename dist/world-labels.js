// Coordinates use a centre-x / bottom-y anchor, matching the world prompt transform.
export function placePrompt({x,y,width,height,viewportWidth,viewportHeight,avoid}){
 const margin=14,half=Math.min(width/2,viewportWidth/2-margin),top=Math.min(90,viewportHeight*.2),bottom=Math.min(viewportWidth<=1000?170:130,viewportHeight*.42);
 const clamp=(v,a,b)=>Math.max(a,Math.min(Math.max(a,b),v));
 const fit=p=>({x:clamp(p.x,half+margin,viewportWidth-half-margin),y:clamp(p.y,height+top,viewportHeight-bottom)});
 const origin=fit({x,y});if(!avoid)return origin;
 const overlap=p=>Math.max(0,Math.min(p.x+half,avoid.right+14)-Math.max(p.x-half,avoid.left-14))*Math.max(0,Math.min(p.y,avoid.bottom+14)-Math.max(p.y-height,avoid.top-14));
 return [origin,{x:avoid.right+half+28,y},{x:avoid.left-half-28,y},{x,y:avoid.top-18},{x,y:avoid.bottom+height+18}].map(fit).sort((a,b)=>overlap(a)-overlap(b)||Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y))[0];
}
