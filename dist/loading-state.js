const root=document.querySelector('#world-loading'),bar=root.querySelector('progress'),label=root.querySelector('p'),done=new Set();
const stages=['interface','world','frame'];
window.labLoading={complete(stage){if(!stages.includes(stage)||done.has(stage))return;done.add(stage);bar.value=done.size;label.textContent=done.size<2?'공간 준비':done.size<3?'화면 준비':'';if(done.size===stages.length){root.classList.add('loaded');root.addEventListener('transitionend',()=>root.hidden=true,{once:true});if(matchMedia('(prefers-reduced-motion:reduce)').matches)root.hidden=true;}},error(message){label.textContent=message;bar.hidden=true;root.querySelector('button').hidden=false;}};
root.querySelector('button').onclick=()=>location.reload();window.labLoading.complete('interface');
window.addEventListener('error',e=>{if(!done.has('frame'))window.labLoading.error('화면을 불러오지 못했습니다.');});
