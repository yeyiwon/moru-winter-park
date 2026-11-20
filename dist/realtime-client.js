import {serverNow,observeServerTime} from './server-clock.js';
export function createRealtimeClient({request,pose,onSnapshot,onChat=()=>{},onActive=()=>{},onStatus=()=>{},onCheckpoint=()=>{},Socket=globalThis.WebSocket,clock=Date.now}){
 let socket=null,timer=null,renew=null,retry=null,active=false,enabled=true,disposed=false,attempts=0,seq=0,next=0,lastMessage=0,starting=null,latestRTT=null,lastReport=0;
 const pending=new Map();
 const status=value=>onStatus(value);
 function stopSocket(){clearInterval(timer);clearTimeout(renew);timer=renew=null;const old=socket;socket=null;active=false;onActive(false);pending.clear();if(old){old.onclose=null;old.onmessage=null;old.close();}}
 function schedule(){if(disposed||!enabled||retry)return;if(attempts>=6){status('재연결을 쉬고 있어요. 화면으로 돌아오면 다시 연결합니다.');return;}const delay=Math.min(30000,1000*2**attempts++)*(.85+Math.random()*.3);retry=setTimeout(()=>{retry=null;void connect();},delay);}
 async function credentials(){const sent=clock(),data=await request('realtime',{});if(Number.isFinite(data.serverTime))observeServerTime(data.serverTime,sent,clock());return data;}
 async function refresh(){try{const data=await credentials();if(!data.enabled){enabled=false;stopSocket();return;}renew=setTimeout(refresh,40000);}catch(error){if(error.status===401||error.status===403){enabled=false;stopSocket();status(error.message);}else{stopSocket();schedule();}}}
 function connect(){if(starting||disposed||!enabled)return starting;starting=(async()=>{
  try{const data=await credentials();if(disposed)return;if(!data.enabled){enabled=false;return;}stopSocket();
   const ws=new Socket(data.url,['winter-v1','auth.'+data.ticket]);socket=ws;seq=0;next=0;lastMessage=clock();
   ws.onmessage=event=>{if(socket!==ws)return;let message;try{message=JSON.parse(event.data);}catch{return;}
    lastMessage=clock();if(message.type==='rejected'){pending.clear();next=clock()+200;if(message.code==='movement')onCheckpoint();return;}
    if(message.type==='chat'){if(typeof message.id==='string'&&typeof message.name==='string'&&typeof message.message==='string'&&Number.isFinite(message.at))onChat(message);return;}
    if(!['snapshot','ready'].includes(message.type)||!Array.isArray(message.people))return;
    if(pending.has(message.ack)){latestRTT=Math.max(0,clock()-pending.get(message.ack));pending.delete(message.ack);}
    const first=!active;active=true;attempts=0;if(first){status('');onActive(true);}onSnapshot(message);
   };
   ws.onopen=()=>{renew=setTimeout(refresh,40000);timer=setInterval(()=>{
    if(clock()-lastMessage>12000){stopSocket();schedule();return;}
    // Keep only a small in-flight window. Slow links should send the newest pose,
    // not accumulate a stale movement queue and burst above the server limit.
    if(ws.readyState!==1||clock()<next||ws.bufferedAmount>16384||pending.size>=2)return;
    const p=pose(),moving=(p?.speed||0)>.05;next=clock()+(document.hidden?4000:moving?100:200);
    const report=latestRTT!==null&&clock()-lastReport>=5000?{rttMs:Math.round(latestRTT)}:{};if('rttMs'in report)lastReport=clock();pending.set(++seq,clock());if(pending.size>32)pending.delete(pending.keys().next().value);
    ws.send(JSON.stringify({type:p?'pose':'ping',seq,at:serverNow(),...report,...(p?{pose:p}:{})}));
   },100);};
   ws.onclose=event=>{if(socket!==ws)return;stopSocket();if(event.code===4009){enabled=false;status('다른 탭에서 연결되었습니다. 이 탭을 새로고침해 다시 연결할 수 있어요.');return;}schedule();};
   ws.onerror=()=>{};
  }catch(error){status('실시간 연결을 복구하고 있어요.');schedule();}
 })().finally(()=>{starting=null;});return starting;}
 function wake(){if(disposed||document.hidden)return;next=0;if(active)return;attempts=0;clearTimeout(retry);retry=null;void connect();}
 window.addEventListener('online',wake);document.addEventListener('visibilitychange',wake);
 return{get active(){return active;},connect,restart(){enabled=true;attempts=0;return connect();},stop(){enabled=false;stopSocket();clearTimeout(retry);},dispose(){disposed=true;stopSocket();clearTimeout(retry);window.removeEventListener('online',wake);document.removeEventListener('visibilitychange',wake);}};
}
