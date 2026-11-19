// Run before the new Worker is connected to the live world. Secret arrives on hidden stdin.
import fs from 'node:fs/promises';
import readline from 'node:readline';
import WebSocket from 'ws';
import {signTicket,signRPC} from '../realtime/auth.js';
const input=readline.createInterface({input:process.stdin});
console.log('Ready for hidden signing key');
const secret=await new Promise(resolve=>input.once('line',resolve));input.close();
const origin='https://winterlight-realtime.winterlight.workers.dev';
const allowed='https://moru-winter-park.vercel.app',clients=[],report={at:new Date().toISOString(),checks:[],roundTripMs:[],productionWorldConnected:false};
function check(name,ok){report.checks.push({name,ok});if(!ok)throw Error(name);}
async function rpc(data){const body=JSON.stringify({...data,at:Date.now(),nonce:crypto.randomUUID()});const r=await fetch(origin+'/rpc',{method:'POST',headers:{'Content-Type':'application/json','X-Winter-Signature':await signRPC(body,secret)},body});if(!r.ok)throw Error('RPC status '+r.status);return r.json();}
async function connect(ticket,from=allowed){return new Promise((resolve,reject)=>{const ws=new WebSocket(origin.replace('https:','wss:')+'/connect',['winter-v1','auth.'+ticket],{origin:from,handshakeTimeout:12000});ws.once('error',()=>reject(Error('WS handshake failed')));ws.once('unexpected-response',(_,r)=>{r.resume();ws.terminate();resolve({denied:r.statusCode});});ws.once('message',b=>resolve({ws,ready:JSON.parse(b)}));});}
async function send(c,data){return new Promise((resolve,reject)=>{const began=performance.now(),timer=setTimeout(()=>reject(Error('Snapshot timeout')),6000);c.ws.once('message',b=>{clearTimeout(timer);report.roundTripMs.push(performance.now()-began);resolve(JSON.parse(b));});c.ws.send(JSON.stringify({...data,seq:++c.seq,at:Date.now()}));});}
try{
 const health=await fetch(origin+'/health');check('health is public and exposes no credentials',health.ok&&(await health.json()).service==='winterlight-realtime');
 check('unsigned server RPC is denied',(await fetch(origin+'/rpc',{method:'POST',body:'{}'})).status===403);
 check('forged guest ticket is denied',(await connect('invalid')).denied===401);
 check('unapproved browser origin is denied',(await connect('invalid','https://untrusted.invalid')).denied===403);
 const initial=await rpc({action:'metrics'});check('preflight Worker has no live users',initial.connections===0);
 for(let i=0;i<10;i++){const id=crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-',''),profile={id,name:'사전검증',x:0,y:.95,z:30,yaw:0,speed:0,mode:'',region:'outdoors',color:'#faf1e8',accessory:'none'};const ticket=await signTicket({aud:'winter-realtime',id,exp:Date.now()+120000,profile},secret);const c=await connect(ticket);c.id=id;c.seq=0;clients.push(c);}
 check('ten authenticated sockets share one world',clients.at(-1).ready.count===10);
 const moved=await send(clients[0],{type:'pose',pose:{x:1,y:.95,z:30,yaw:1,speed:2,mode:''}});
 const seen=await send(clients[1],{type:'ping'});check('movement reaches another client',moved.type==='snapshot'&&seen.people.some(p=>p.id===clients[0].id&&p.x===1));
 await rpc({action:'patch',id:clients[0].id,profile:{chat:'동기화 검증',chatAt:Date.now(),color:'#80a8cd'}});
 const patched=await send(clients[1],{type:'ping'});check('server-authorized chat and appearance updates propagate',patched.people.some(p=>p.id===clients[0].id&&p.chat==='동기화 검증'&&p.color==='#80a8cd'));
 for(let i=0;i<8;i++)await Promise.all(clients.map(c=>send(c,{type:'ping'})));
 const closed=new Promise(resolve=>clients[0].ws.once('close',resolve));await rpc({action:'revoke',id:clients[0].id});check('server revocation closes only the selected session',await closed===4001);
}finally{
 await Promise.all(clients.filter(c=>c.ws.readyState===WebSocket.OPEN).map(c=>new Promise(resolve=>{c.ws.once('close',resolve);c.ws.close();setTimeout(()=>{c.ws.terminate();resolve();},3000).unref();})));
 const final=await rpc({action:'metrics'});report.remainingConnections=final.connections;report.handlerP95Ms=final.handlerP95Ms;
 check('all preflight sockets are cleaned up',final.connections===0);
 const values=report.roundTripMs.sort((a,b)=>a-b);report.network={samples:values.length,p50:values[Math.floor(values.length*.5)],p95:values[Math.floor(values.length*.95)]};delete report.roundTripMs;
 await fs.writeFile('qa/operations-v46/cloudflare-preflight.json',JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify(report));
