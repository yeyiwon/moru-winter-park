import {fireworkConfig} from './firework-score.js';
import {observeServerTime,serverNow} from './server-clock.js';

export function fireworkRequestState(show,now){
 if(!show)return {phase:'idle',remaining:0};
 const endsAt=show.endsAt??show.startsAt+fireworkConfig.duration*1000;
 const nextRequestAt=show.nextRequestAt??endsAt+fireworkConfig.cooldownMs;
 if(show.state!=='stopped'&&now<show.startsAt)return {phase:'scheduled',remaining:Math.ceil((show.startsAt-now)/1000)};
 if(show.state!=='stopped'&&now<endsAt)return {phase:'playing',remaining:Math.ceil((endsAt-now)/1000)};
 if(now<nextRequestAt)return {phase:'cooldown',remaining:Math.ceil((nextRequestAt-now)/1000)};
 return {phase:'idle',remaining:0};
}

// Presence and request replies can arrive out of order. A stale reply must never
// restart a stopped show or replace a newer performance with its predecessor.
export function mergeFireworkShow(current,incoming){
 if(!incoming)return current||null;
 if(!incoming.id||!Number.isFinite(incoming.startsAt))return current||null;
 if(current){
  if(incoming.id===current.id){
   if((incoming.revision||1)<(current.revision||1))return current;
   if(current.state==='stopped'&&(incoming.revision||1)<=(current.revision||1))return current;
  }else if(incoming.startsAt<=current.startsAt)return current;
 }
 return incoming;
}

export function installFireworkRequests({win=window,doc=document,now=serverNow}={}){
 const actions=doc.querySelector('#studio-public-actions')||doc.querySelector('#pane-light');
 if(!actions||doc.querySelector('#firework-request'))return null;
 const button=doc.createElement('button');button.id='firework-request';button.type='button';button.className='quiet-action';
 button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v5m0 10v5M2 12h5m10 0h5M5 5l3.5 3.5m7 7L19 19M5 19l3.5-3.5m7-7L19 5"/></svg><span>불꽃놀이 신청</span>';
 const status=doc.createElement('span');status.id='firework-request-status';status.setAttribute('aria-live','off');
 button.setAttribute('aria-describedby',status.id);actions.append(button,status);
 const notice=doc.createElement('div');notice.id='firework-notice';notice.hidden=true;notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');notice.setAttribute('aria-atomic','false');
 const noticeText=doc.createElement('span');noticeText.className='firework-notice-text';noticeText.textContent='잠시 후 불꽃놀이가 시작돼요';
 const countdown=doc.createElement('span');countdown.className='firework-notice-countdown';countdown.setAttribute('aria-hidden','true');notice.append(noticeText,countdown);doc.body.append(notice);
 const label=button.querySelector('span');let show=win.labFireworks||null,busy=false,timer=0,refreshing=null,error='',errorUntil=0,disposed=false;
 const listeners=[];
 const listen=(target,event,fn)=>{target.addEventListener(event,fn);listeners.push(()=>target.removeEventListener(event,fn));};
 const format=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
 const text=(el,value)=>{if(el.textContent!==value)el.textContent=value;};
 function refresh(){
  win.clearTimeout(timer);timer=0;if(disposed)return;
  const time=now(),state=fireworkRequestState(show,time),joined=!!win.labSocialJoined;
  button.disabled=busy||!joined||state.phase!=='idle';
  text(label,busy?'신청 중…':state.phase==='scheduled'?'곧 시작해요':state.phase==='playing'?'불꽃놀이 진행 중':'불꽃놀이 신청');
  let info=!joined?'공간에 입장하면 신청할 수 있어요.':state.phase==='scheduled'?state.remaining+'초 후 시작':state.phase==='cooldown'?'다음 신청까지 '+format(state.remaining):'';
  if(error&&time<errorUntil)info=error;
  text(status,info);status.hidden=!info;
  // Only a future scheduled start produces an announcement. Resuming a tab or
  // closing an editor after the start cannot replay a stale countdown.
  const announce=joined&&!doc.hidden&&!doc.body.classList.contains('studio-open')&&state.phase==='scheduled'&&state.remaining<=Math.ceil(fireworkConfig.leadMs/1000);
  notice.hidden=!announce;if(announce)text(countdown,state.remaining+'초');
  if(joined&&!doc.hidden&&(state.phase!=='idle'||time<errorUntil))timer=win.setTimeout(refresh,1000);
 }
 function receive(incoming){
  if(disposed)return;
  show=mergeFireworkShow(show,incoming);win.labFireworks=show;refresh();
 }
 function accept(data,sent,received){
  if(disposed)return;
  if(Number.isFinite(data.serverTime))observeServerTime(data.serverTime,sent,received);
  if(Object.hasOwn(data,'show')){
   receive(data.show);
   win.dispatchEvent(new win.CustomEvent('lab:fireworks',{detail:show}));
  }
 }
 async function refreshFromServer(){
  if(disposed||!win.labSocialJoined||doc.hidden)return;
  if(refreshing)return refreshing;
  refreshing=(async()=>{
   const sent=Date.now();
   try{
    const response=await win.fetch('/api/fireworks',{signal:AbortSignal.timeout(8000)}),data=await response.json();
    if(response.ok)accept(data,sent,Date.now());
   }catch{/* Presence will deliver the next authoritative snapshot. */}
   finally{refreshing=null;}
  })();
  return refreshing;
 }
 async function requestShow(){
  if(busy||!win.labSocialJoined)return;
  busy=true;error='';refresh();const sent=Date.now();
  try{
   const response=await win.fetch('/api/fireworks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'request'}),signal:AbortSignal.timeout(8000)});
   const data=await response.json();accept(data,sent,Date.now());
   if(!response.ok)throw Error(data.error||'신청을 보내지 못했어요. 다시 시도해 주세요.');
  }catch(e){error=e.message;errorUntil=now()+6000;}
  finally{busy=false;refresh();}
 }
 listen(button,'click',requestShow);
 listen(win,'lab:fireworks',event=>receive(event.detail));
 listen(win,'lab:room',()=>{refresh();refreshFromServer();});
 listen(win,'lab:access',refresh);
 listen(win,'lab:pause',refresh);
 listen(win,'lab:close',refresh);
 listen(doc,'visibilitychange',()=>{refresh();if(!doc.hidden)refreshFromServer();});
 listen(win,'pagehide',()=>{win.clearTimeout(timer);notice.hidden=true;});
 listen(win,'pageshow',()=>{refresh();refreshFromServer();});
 refresh();if(win.labSocialJoined)refreshFromServer();
 return {button,notice,refresh,dispose(){disposed=true;win.clearTimeout(timer);listeners.forEach(remove=>remove());button.remove();status.remove();notice.remove();}};
}

if(typeof window!=='undefined'&&typeof document!=='undefined')installFireworkRequests();
