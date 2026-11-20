import {boundedRequest} from '../server/request-body.js';
import {verifyTicket,verifyRPC} from './auth.js';
import {RealtimeWorld} from './world.js';
export default{fetch(request,env){const path=new URL(request.url).pathname;if(path==='/health'&&request.method==='GET')return Response.json({ok:true,service:'winterlight-realtime',revision:env.RELEASE_REVISION||'local'},{headers:{'Cache-Control':'no-store'}});if(!['/connect','/rpc'].includes(path))return new Response('Not found',{status:404});return env.WORLD.get(env.WORLD.idFromName('winter-plaza')).fetch(request);}};
export class WinterWorld{
 constructor(ctx,env){this.ctx=ctx;this.env=env;this.nonces=new Map();this.world=new RealtimeWorld({restore:ctx.getWebSockets()});ctx.blockConcurrencyWhile(async()=>{const saved=await ctx.storage.get('shared');if(saved){this.world.rpc(saved);this.world.revoked=new Map(saved.revoked||[]);this.sharedJSON=JSON.stringify(saved);}});}
 async fetch(request){
  const url=new URL(request.url);
  if(url.pathname==='/rpc'){
   if(request.method!=='POST'||Number(request.headers.get('content-length')||0)>65536)return new Response('Invalid request',{status:400});
   try{request=await boundedRequest(request,65536);}catch{return new Response('Request too large',{status:413});}
   const raw=await request.text();if(raw.length>65536||!await verifyRPC(raw,request.headers.get('x-winter-signature'),this.env.REALTIME_SECRET))return new Response('Unauthorized',{status:403});
   const b=JSON.parse(raw);if(Math.abs(Date.now()-b.at)>10000||!b.nonce||this.nonces.has(b.nonce))return new Response('Expired',{status:403});
   for(const [key,time]of this.nonces)if(time<Date.now()-10000)this.nonces.delete(key);if(this.nonces.size>4096)return new Response('Busy',{status:429});this.nonces.set(b.nonce,Date.now());
   const result=this.world.rpc(b);if(b.action==='metrics'){result.revision=this.env.RELEASE_REVISION||'local';result.protocol='winter-v1';}
   if('fireworks'in b||b.rideSeats||b.action==='revoke'){const shared={fireworks:this.world.fireworks,rideSeats:this.world.rideSeats,revoked:[...this.world.revoked]},json=JSON.stringify(shared);if(json!==this.sharedJSON){await this.ctx.storage.put('shared',shared);this.sharedJSON=json;}}
   return Response.json(result);
  }
  if(request.headers.get('upgrade')?.toLowerCase()!=='websocket')return new Response('WebSocket required',{status:426});
  const origins=(this.env.ALLOWED_ORIGINS||'').split(',');if(!origins.includes(request.headers.get('origin')))return new Response('Origin denied',{status:403});
  const protocols=(request.headers.get('sec-websocket-protocol')||'').split(',').map(s=>s.trim()),token=protocols.find(s=>s.startsWith('auth.'))?.slice(5);
  const claims=await verifyTicket(token,this.env.REALTIME_SECRET);if(!claims)return new Response('Session expired',{status:401});
  const [client,server]=Object.values(new WebSocketPair());this.ctx.acceptWebSocket(server);this.world.accept(server,claims);
  return new Response(null,{status:101,webSocket:client,headers:{'Sec-WebSocket-Protocol':'winter-v1'}});
 }
 webSocketMessage(ws,message){this.world.message(ws,message);}
 webSocketClose(ws){this.world.close(ws);}
 webSocketError(ws){this.world.close(ws);}
}
