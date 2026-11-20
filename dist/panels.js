import {closeDialog,cancelDialogClose} from './ui-motion.js';
const quizDialogs='#learning[open],#quick-quiz[open],#museum-puzzle[open],#quiz-journal[open]';
const suspendedPanels=new WeakMap();
export function syncPanelState(){
 const modal=[...document.querySelectorAll('dialog[open]:not([data-nonmodal])')];
 document.body.classList.toggle('studio-open',modal.some(dialog=>!dialog.matches(quizDialogs)));
 document.body.classList.toggle('quiz-open',!!document.querySelector(quizDialogs));
 // Pinned lists keep their open state and scroll position while a modal owns
 // the screen. Restore any pre-existing accessibility state on return.
 for(const panel of document.querySelectorAll('dialog[data-nonmodal]')){
  if(modal.length&&panel.open){
   if(!suspendedPanels.has(panel))suspendedPanels.set(panel,{inert:panel.hasAttribute('inert'),ariaHidden:panel.getAttribute('aria-hidden')});
   panel.setAttribute('inert','');panel.setAttribute('aria-hidden','true');panel.dataset.panelSuspended='true';
  }else if(suspendedPanels.has(panel)){
   const previous=suspendedPanels.get(panel);panel.toggleAttribute('inert',previous.inert);
   if(previous.ariaHidden===null)panel.removeAttribute('aria-hidden');else panel.setAttribute('aria-hidden',previous.ariaHidden);
   delete panel.dataset.panelSuspended;suspendedPanels.delete(panel);
  }
 }
}
// Opening a panel owns focus and input, without ending the active ride or meal.
export function preparePanelOpen(dialog){
 cancelDialogClose(dialog);
 if(dialog.hasAttribute('data-nonmodal')){queueMicrotask(syncPanelState);return;}
 window.dismissParkDiscovery?.();
 const chat=document.querySelector('#chat-form'),toggle=document.querySelector('#chat-toggle');
 if(window.closeWinterChat)window.closeWinterChat();
 else if(chat&&!chat.hidden){toggle?.click();chat.hidden=true;document.querySelector('#chat-input')?.blur();document.body.classList.remove('chat-typing');}
 toggle?.setAttribute('aria-expanded','false');
 for(const other of document.querySelectorAll('dialog[open]:not([data-nonmodal])'))if(other!==dialog){cancelDialogClose(other);other.close();}
 window.dispatchEvent(new Event('lab:pause'));
 queueMicrotask(syncPanelState);
}
// Native close events are asynchronous. Reconcile after individual handlers so
// an old panel cannot unlock gameplay underneath the panel that replaced it.
if(typeof document!=='undefined')document.addEventListener('close',()=>queueMicrotask(syncPanelState),true);
export function makePanel(id,title,html,{modal=true}={}){
 const dialog=document.createElement('dialog');dialog.id=id;dialog.className='glass-panel';if(!modal)dialog.dataset.nonmodal='true';dialog.setAttribute('aria-labelledby',id+'-title');dialog.innerHTML=`<header class="panel-heading"><h2 id="${id}-title"></h2><button class="icon-button" aria-label="닫기"><svg viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17"/></svg></button></header><div class="panel-scroll">${html}</div>`;dialog.querySelector('h2').textContent=title;document.body.append(dialog);
 const viewport=()=>{if(!dialog.open)return;const v=window.visualViewport;dialog.style.setProperty('--dialog-viewport',(v?.height||window.innerHeight)+'px');dialog.style.setProperty('--dialog-top',(v?.offsetTop||0)+'px');};window.visualViewport?.addEventListener('resize',viewport);window.visualViewport?.addEventListener('scroll',viewport);
 const close=()=>closeDialog(dialog);dialog.querySelector('.icon-button').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('close',()=>{if(dialog.open)return;syncPanelState();window.dispatchEvent(new Event('lab:close'));});
 return{dialog,open(){preparePanelOpen(dialog);if(!dialog.open){if(modal)dialog.showModal();else dialog.show();}viewport();syncPanelState();},close};
}
export async function communityRequest(path,body){const r=await fetch('/api/'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(['assist','experience'].includes(path)?11000:8000)});const data=await r.json();if(!r.ok)throw Error(data.error||'연결을 확인해 주세요.');return data;}
