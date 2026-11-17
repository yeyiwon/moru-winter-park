let settings={notice:'',disabled:[]};
const notice=document.createElement('aside');notice.id='world-notice';notice.hidden=true;notice.setAttribute('role','status');document.body.append(notice);
function apply(value){if(!value||!Array.isArray(value.disabled))return;settings=value;notice.textContent=String(value.notice||'');notice.hidden=!value.notice;}
window.worldContentEnabled=id=>!settings.disabled.includes(id);
window.addEventListener('lab:world-settings',e=>apply(e.detail));
let pending=false;
async function refresh(){if(pending||!window.labSocialJoined||document.hidden)return;pending=true;try{const response=await fetch('/api/world-state',{signal:AbortSignal.timeout(5000)});if(response.ok)apply(await response.json());}catch{}finally{pending=false;}}
window.addEventListener('lab:room',refresh);const timer=setInterval(refresh,30000);
window.addEventListener('pagehide',e=>{if(!e.persisted)clearInterval(timer);});
