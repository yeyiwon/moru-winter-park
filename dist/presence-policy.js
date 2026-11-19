// HTTP polling stays bounded by the existing server's 500 ms write limit and
// 20 s expiry. A quiet tab still sends heartbeats; it does not silently leave.
export function presenceDelay({hidden=false,moving=false,chat=false,failures=0}={}){
 if(failures)return Math.min(8000,1000*2**Math.min(failures,3));
 return hidden?8000:moving||chat?700:1600;
}
export function createPresenceCache(){
 const states=new Map();let bucket=null;
 return{reset(){states.clear();bucket=null;},request(){return{farBucket:bucket,farIds:[...states.keys()].slice(0,32)};},merge(people,nextBucket){
  const ids=new Set(people.map(p=>p.id));for(const id of states.keys())if(!ids.has(id))states.delete(id);
  for(const p of people){if(p.distant&&!states.has(p.id))continue;states.set(p.id,{...states.get(p.id),...p,distant:!!p.distant});}
  bucket=nextBucket??null;return [...states.values()];
 }};
}
export function interestSnapshot(people,self,request,now,rideSeats=[]){
 const farBucket=Math.floor(now/5000),known=new Set(Array.isArray(request.farIds)?request.farIds.slice(0,32):[]),riders=new Set(rideSeats.map(s=>s.id));
 const eligible=people.filter(p=>!self.region||p.region===self.region);if(eligible.length>32)eligible.sort((a,b)=>Math.hypot(a.x-self.x,a.z-self.z)-Math.hypot(b.x-self.x,b.z-self.z));
 return{farBucket,people:eligible.slice(0,32).map(p=>request.farBucket===farBucket&&known.has(p.id)&&!riders.has(p.id)&&Math.hypot(p.x-self.x,p.z-self.z)>90?{id:p.id,name:p.name,region:p.region,distant:true,chat:p.chat,chatAt:p.chatAt,gesture:p.gesture,gestureAt:p.gestureAt}:p)};
}
