import {makePanel,communityRequest} from './panels.js';
import {serverNow,observeServerTime} from './server-clock.js';
import {fireworkConfig} from './firework-score.js';
export function fireworkAvailability(show,now=serverNow()){
 if(show&&show.state!=='stopped'&&now<show.startsAt+fireworkConfig.duration*1000)return{active:true,label:now<show.startsAt?`${Math.ceil((show.startsAt-now)/1000)}초 뒤 시작`:'함께 감상하는 중'};
 const remaining=Math.max(0,(show?.nextAvailableAt||0)-now),seconds=Math.ceil(remaining/1000);
 return{active:false,waiting:remaining>0,label:remaining?`다음 공연 신청까지 ${Math.floor(seconds/60)}분 ${seconds%60}초`:'지금 공연을 신청할 수 있어요'};
}
export function createFireworkRequest(){
 const panel=makePanel('firework-request','함께 보는 불꽃놀이','<p data-show-availability role="status"></p><button class="panel-primary" data-request-show>공연 신청</button><p class="fine-print">신청하면 10초 뒤 모두의 하늘에서 시작돼요. 공연이 끝나면 15분 뒤 다시 신청할 수 있어요.</p><output role="status"></output>');
 const button=panel.dialog.querySelector('[data-request-show]'),label=panel.dialog.querySelector('[data-show-availability]'),error=panel.dialog.querySelector('output');let busy=false;
 function render(){const state=fireworkAvailability(window.labFireworks);label.textContent=state.label;button.disabled=busy||state.active||state.waiting;}
 async function refresh(){const sent=Date.now(),data=await communityRequest('fireworks');observeServerTime(data.serverTime,sent,Date.now());window.labFireworks=data.show;window.dispatchEvent(new CustomEvent('lab:fireworks',{detail:data.show}));render();}
 button.onclick=async()=>{busy=true;error.textContent='';render();try{await communityRequest('fireworks',{action:'start'});await refresh();}catch(e){error.textContent=e.message;await refresh().catch(()=>{});}finally{busy=false;render();}};
 window.openFireworkRequest=()=>{panel.open();error.textContent='';render();void refresh().catch(e=>error.textContent=e.message);};
 const timer=setInterval(()=>{if(panel.dialog.open)render();},1000);window.addEventListener('lab:fireworks',render);
 window.addEventListener('pagehide',()=>{clearInterval(timer);window.removeEventListener('lab:fireworks',render);},{once:true});
}
