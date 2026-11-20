// Display lifetimes start on receipt. Server timestamps identify messages, not
// the device's wall clock (which can be minutes ahead on another computer).
export const chatPreviewMs=5000;
export function bubbleDuration(sentAt,serverTime){
 const age=Math.max(0,serverTime-Number(sentAt));
 return Number.isFinite(age)&&age<15000?Math.max(3500,6500-age):0;
}
export function chatShortcut(event,doc){
 if(event.defaultPrevented||event.repeat||event.isComposing||event.keyCode===229||event.metaKey||event.ctrlKey||event.altKey)return false;
 if(event.key!=='Enter'||doc.body.matches('.invite-gate,.studio-open,.quiz-open')||doc.querySelector('dialog[open]:not([data-nonmodal])'))return false;
 return !event.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])');
}

// Hold input ownership until the keyboard's actual viewport has recovered.
// The baseline also covers Android's resize-layout viewport configuration.
export function createChatViewport({win=window,input,onRestored}){
 const doc=win.document,viewport=win.visualViewport;
 let baseline=win.innerHeight,width=win.innerWidth,closing=false,frame=0,active=false;
 const height=()=>viewport?.height||win.innerHeight;
 function measure(){
  frame=0;
  if(Math.abs(win.innerWidth-width)>80){width=win.innerWidth;baseline=win.innerHeight;}
  if(!active){baseline=win.innerHeight;return;}
  const inset=Math.max(0,win.innerHeight-height()-(viewport?.offsetTop||0));
  doc.documentElement.style.setProperty('--keyboard',inset+'px');
  const occluded=baseline-height()-(viewport?.offsetTop||0)>90;
  if(closing&&!occluded&&doc.activeElement!==input){
   closing=active=false;doc.body.classList.remove('chat-typing','chat-restoring');
   doc.documentElement.style.removeProperty('--keyboard');
   win.dispatchEvent(new win.Event('lab:viewport-restored'));onRestored();
  }
 }
 function schedule(){if(!frame)frame=win.requestAnimationFrame(measure);}
 const bindings=[[viewport,'resize'],[viewport,'scroll'],[win,'resize'],[win,'orientationchange'],[input,'blur']];
 for(const [target,event]of bindings)target?.addEventListener(event,schedule);
 return{open(){if(!active){baseline=win.innerHeight;width=win.innerWidth;}active=true;closing=false;doc.body.classList.remove('chat-restoring');doc.body.classList.add('chat-typing');measure();},close(){closing=true;doc.body.classList.add('chat-restoring');input.blur();measure();},dispose(){win.cancelAnimationFrame(frame);for(const [target,event]of bindings)target?.removeEventListener(event,schedule);}};
}
