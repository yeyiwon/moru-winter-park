import {recordServerError} from './operations.js';
import {signTicket,signRPC} from '../realtime/auth.js';
import {rateLimit} from './community-api.js';
import {readFireworkShow} from './fireworks.js';
import {listRideSeats} from './ride-api.js';
export const realtimeConfigured=env=>!!(env.REALTIME_URL&&env.REALTIME_SECRET?.length>=32);
export const worldCapacity=env=>realtimeConfigured(env)?100:12;
export async function realtimeRPC(env,message){
 if(!realtimeConfigured(env))return null;
 const body=JSON.stringify({...message,at:Date.now(),nonce:crypto.randomUUID()});
 const response=await (env.REALTIME_FETCH||fetch)(new URL('/rpc',env.REALTIME_URL),{method:'POST',headers:{'Content-Type':'application/json','X-Winter-Signature':await signRPC(body,env.REALTIME_SECRET)},body,signal:AbortSignal.timeout(2500)});
 if(!response.ok)throw Error('Realtime service unavailable');return response.json();
}
export function realtimeProfile(self){return {id:self.id,name:self.name,color:self.color,colorTop:self.color_top,accessory:self.accessory,fluff:self.fluff,roundness:self.roundness,x:self.x,y:self.y,z:self.z,yaw:self.yaw,mode:self.mode,region:self.region,speed:self.speed||0,updatedAt:self.pose_at||self.seen,chat:self.chat,chatAt:self.chat_at,gesture:self.gesture,gestureAt:self.gesture_at};}
export async function realtimeAPI(request,env,self,now){
 if(new URL(request.url).pathname!=='/api/realtime')return null;
 const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
 if(request.method!=='POST')return reply({error:'지원하지 않는 요청입니다.'},405);
 if(!realtimeConfigured(env))return reply({enabled:false,transport:'polling',serverTime:now});
 if(!await rateLimit(env.DB,'realtime:'+self.id,now,12))return reply({error:'잠시 후 다시 연결해 주세요.'},429);
 const exp=now+120000,profile=realtimeProfile(self);
 const rideSeats=await listRideSeats(env.DB,self.room,now),fireworks=await readFireworkShow(env.DB,now);
 await realtimeRPC(env,{action:'authorize',id:self.id,exp,profile,rideSeats,fireworks});
 return reply({enabled:true,url:env.REALTIME_URL.replace(/^http/,'ws')+'/connect',ticket:await signTicket({aud:'winter-realtime',id:self.id,exp,profile},env.REALTIME_SECRET),serverTime:now});
}
// A transient transport failure must not roll back an already committed wish/chat/show.
let lastTransportError=0;
export async function publishRealtime(env,message){try{return await realtimeRPC(env,message);}catch(error){if(Date.now()-lastTransportError>60000){lastTransportError=Date.now();await recordServerError(env.DB,'/api/realtime',error,Date.now());}return null;}}
