import {serverNow} from './server-clock.js';
import {fireworkConfig} from './firework-score.js';
export function createFireworkNotice(){
 const root=document.createElement('aside');root.id='firework-notice';root.hidden=true;root.setAttribute('aria-label','불꽃놀이 공연');
 const text=document.createElement('span');text.setAttribute('role','status');root.append(text);document.body.append(root);
 let show=null;
 function update(){const age=show?(serverNow()-show.startsAt)/1000:Infinity,active=show&&['scheduled','playing'].includes(show.state)&&age<fireworkConfig.duration;root.hidden=!active||!!window.labInterior;if(root.hidden)return;const message=age<0?`${Math.ceil(-age)}초 뒤 불꽃놀이가 시작돼요`:'밤하늘에 불꽃놀이가 펼쳐지고 있어요';if(text.textContent!==message)text.textContent=message;}
 function receive(e){show=e.detail;update();}
 window.addEventListener('lab:fireworks',receive);const timer=setInterval(update,250);
 return{dispose(){clearInterval(timer);window.removeEventListener('lab:fireworks',receive);root.remove();}};
}
