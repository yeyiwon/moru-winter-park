// Server timestamps arrive at variable network latency. Slew corrections instead
// of changing ride progress on every presence response.
export function createServerClock(epoch=Date.now(),monotonic=()=>performance.now()){
 const origin=monotonic();let offset=0,target=0,last=origin,ready=false;
 return{observe(serverTime,sent,received){if(!Number.isFinite(serverTime)||received-sent>2000)return;target=serverTime-(sent+received)/2;if(!ready){offset=target;ready=true;}},now(){const tick=monotonic(),dt=Math.max(0,tick-last);last=tick;offset+=Math.max(-dt*.02,Math.min(dt*.02,target-offset));return epoch+(tick-origin)+offset;}};
}
const clock=createServerClock();export const serverNow=()=>clock.now();export const observeServerTime=(...args)=>clock.observe(...args);
