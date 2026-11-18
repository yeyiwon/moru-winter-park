import {createLuminousLoading} from './luminous-loading.js';
const root=document.querySelector('#world-loading'),bar=root.querySelector('progress'),label=root.querySelector('#loading-stage'),done=new Set(),animation=createLuminousLoading(root);
const stages=['interface','world','interiors','frame','connection'];let hideTimer=0,timeout=0,failed=false;
animation.start();
function hide(){root.hidden=true;clearTimeout(hideTimer);}
window.labLoading={complete(stage){
 if(!stages.includes(stage)||done.has(stage))return;done.add(stage);bar.value=done.size;
 if(stage==='frame')root.classList.add('has-world');
 label.textContent=!done.has('world')?'월드 준비':!done.has('interiors')?'실내 공간 준비':!done.has('frame')?'화면 준비':!done.has('connection')?'서버 연결':'준비 완료';
 if(done.size===stages.length&&!failed){clearTimeout(timeout);animation.stop();root.classList.add('loaded');root.addEventListener('transitionend',hide,{once:true});if(matchMedia('(prefers-reduced-motion:reduce)').matches)hide();else hideTimer=setTimeout(hide,250);}
},error(message){
 failed=true;clearTimeout(timeout);clearTimeout(hideTimer);root.removeEventListener('transitionend',hide);animation.stop();root.hidden=false;root.classList.remove('loaded');const error=root.querySelector('.loading-error');error.textContent=message;error.hidden=false;label.textContent=message;bar.hidden=true;root.querySelector('button').hidden=false;
}};
root.querySelector('button').onclick=()=>location.reload();window.labLoading.complete('interface');
timeout=setTimeout(()=>{if(done.size<stages.length)window.labLoading.error('연결이 지연되고 있습니다. 다시 시도해 주세요.');},30000);
window.addEventListener('error',()=>{if(!done.has('frame'))window.labLoading.error('화면을 불러오지 못했습니다.');});
window.addEventListener('pagehide',e=>{if(e.persisted)return;animation.dispose();clearTimeout(timeout);clearTimeout(hideTimer);});
