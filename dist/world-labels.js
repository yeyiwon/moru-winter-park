// Coordinates use a centre-x / bottom-y anchor, matching the world prompt transform.
export function placePrompt({x,y,width,height,viewportWidth,viewportHeight,avoid}){
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),margin=14;
 x=clamp(x,width/2+margin,viewportWidth-width/2-margin);y=clamp(y,height+90,viewportHeight-130);
 if(avoid&&x+width/2>avoid.left-14&&x-width/2<avoid.right+14&&y>avoid.top-14&&y-height<avoid.bottom+14){
  if(avoid.right+28+width<viewportWidth-margin)x=avoid.right+28+width/2;
  else if(avoid.left-28-width>margin)x=avoid.left-28-width/2;
  else if(avoid.top-18-height>88)y=avoid.top-18;
  else y=avoid.bottom+height+18;
 }
 return{x,y};
}
