// Remote avatars display accepted poses. They must never run local navigation
// or keep applying a velocity after the bounded prediction window expires.
export function createRemoteMotion({delay=1100,prediction=120}={}){
 const samples=[];
 return{push(state,receivedAt){
  const at=Number.isFinite(state.updatedAt)?state.updatedAt:receivedAt,last=samples.at(-1);
  if(last&&at<=last.at)return false;
  const pose={...state,at};
  if(last&&(pose.region!==last.region||Math.hypot(pose.x-last.x,pose.z-last.z)>Math.max(12,(pose.mode==='ski'?50:10)*(at-last.at)/1000*1.8)))samples.length=0;
  samples.push(pose);if(samples.length>8)samples.shift();return true;
 },sample(now,out={}){
  if(!samples.length)return null;
  const when=now-delay;let a=samples[0],b=a;
  for(let i=1;i<samples.length;i++){b=samples[i];if(b.at>=when)break;a=b;}
  if(a===b){Object.assign(out,a);const previous=samples.at(-2),age=when-a.at;
   if(previous&&a.speed>0&&age>0&&age<=prediction&&a.mode===previous.mode){const scale=age/Math.max(1,a.at-previous.at);out.x+=(a.x-previous.x)*scale;out.z+=(a.z-previous.z)*scale;}
   // Once the time window closes, hold its final predicted point, not a
   // snap back to the original snapshot (which looks like reverse walking).
   else if(previous&&a.speed>0&&age>prediction&&a.mode===previous.mode){const scale=prediction/Math.max(1,a.at-previous.at);out.x+=(a.x-previous.x)*scale;out.z+=(a.z-previous.z)*scale;}
   if(age>prediction)out.speed=0;return out;
  }
  const t=Math.max(0,Math.min(1,(when-a.at)/Math.max(1,b.at-a.at)));
  Object.assign(out,t<1?a:b);out.x=a.x+(b.x-a.x)*t;out.y=(a.y??.95)+((b.y??.95)-(a.y??.95))*t;out.z=a.z+(b.z-a.z)*t;
  out.yaw=a.yaw+Math.atan2(Math.sin(b.yaw-a.yaw),Math.cos(b.yaw-a.yaw))*t;return out;
 },get latest(){return samples.at(-1);}};
}
