import {cancelDialogClose} from './ui-motion.js';

// This UI has no renderer dependency. A successful world renderer opts in via
// lab:camera-ready; the non-WebGL learning fallback never receives extra controls.
export function createCameraControls(doc=document,win=window){
 const canvas=doc.querySelector('#park-canvas');if(!canvas||doc.querySelector('#camera-toggle'))return null;
 const bindings=[];const listen=(target,type,handler,options)=>{target?.addEventListener(type,handler,options);bindings.push([target,type,handler,options]);};
 const toggle=doc.createElement('button');toggle.id='camera-toggle';toggle.type='button';toggle.hidden=true;toggle.setAttribute('aria-label','시야 조절');toggle.setAttribute('title','시야 조절');toggle.setAttribute('aria-pressed','false');toggle.setAttribute('aria-controls','camera-toolbar');
 toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.4-6 10-6 10 6 10 6-3.4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path d="m9 3 3-2 3 2m-6 18 3 2 3-2"/></svg>';
 const toolbar=doc.createElement('div');toolbar.id='camera-toolbar';toolbar.hidden=true;toolbar.setAttribute('role','group');toolbar.setAttribute('aria-label','시야 조절 중');
 toolbar.innerHTML='<span class="camera-mode-label">시야 조절 <small>드래그 · 핀치 / 휠</small></span><button type="button" id="camera-reset" aria-label="기본 시야로 돌아가기">기본</button><button type="button" id="camera-done">완료</button>';
 const setting=doc.createElement('div');setting.className='camera-setting';setting.hidden=true;
 setting.innerHTML='<span>시야<small>정한 시야를 그대로 유지해요.</small></span><div><button type="button" id="camera-settings-edit">조절</button><button type="button" id="camera-settings-reset">기본으로</button></div>';
 const pane=doc.querySelector('#pane-light'),activities=doc.querySelector('#studio-public-actions');
 if(pane){if(activities)activities.after(setting);else pane.prepend(setting);}
 doc.body.append(toggle,toolbar);
 let active=false;win.labCameraAdjusting=false;
 const available=()=>!!win.labCameraReady;
 const blocked=()=>doc.body.matches('.invite-gate,.chat-typing')||!!doc.querySelector('dialog[open]:not([data-nonmodal])');
 function render(){
  const ready=available();toggle.hidden=!ready;setting.hidden=!ready;toolbar.hidden=!ready||!active;
  toggle.setAttribute('aria-pressed',String(active));toggle.setAttribute('aria-label',active?'시야 조절 끝내기':'시야 조절');
  doc.body.classList.toggle('camera-adjusting',active&&ready);
 }
 function setMode(next,{focus=false}={}){
  next=!!next&&available();if(next&&blocked())return false;
  if(next===active){render();return active;}
  // Clear a pending walk or held joystick before editing, without resetting the
  // chosen camera value or ending the current ride/meal.
  if(next)win.dispatchEvent(new win.Event('lab:pause'));
  active=next;win.labCameraAdjusting=active;render();
  win.dispatchEvent(new win.CustomEvent('lab:camera-mode',{detail:{active}}));
  if(focus&&!blocked())canvas.focus({preventScroll:true});return active;
 }
 function resetView({focus=false}={}){
  if(!available())return;
  setMode(false,{focus});win.dispatchEvent(new win.Event('lab:camera-reset'));
 }
 toggle.onclick=()=>setMode(!active,{focus:true});
 toolbar.querySelector('#camera-done').onclick=()=>setMode(false,{focus:true});
 toolbar.querySelector('#camera-reset').onclick=()=>resetView({focus:true});
 setting.querySelector('#camera-settings-reset').onclick=()=>resetView();
 setting.querySelector('#camera-settings-edit').onclick=()=>{
  if(!available())return;const studio=doc.querySelector('#studio');
  if(studio?.open){studio.addEventListener('close',()=>setMode(true,{focus:true}),{once:true});cancelDialogClose(studio);studio.close();}
  else setMode(true,{focus:true});
 };
 for(const element of [toggle,toolbar,setting])listen(element,'pointerdown',event=>event.stopPropagation());
 listen(win,'lab:camera-ready',()=>{if(!available())setMode(false);render();});
 listen(win,'lab:pause',()=>setMode(false));
 listen(win,'blur',()=>setMode(false));listen(win,'pagehide',()=>setMode(false));
 listen(doc,'visibilitychange',()=>{if(doc.hidden)setMode(false);});
 listen(win,'keydown',event=>{
  if(event.repeat||event.isComposing||event.metaKey||event.ctrlKey||event.altKey||event.defaultPrevented||!available()||blocked()||event.target.closest?.('input,textarea,select,[contenteditable=true]'))return;
  if(event.key==='Escape'&&active){event.preventDefault();event.stopPropagation();setMode(false,{focus:true});}
  else if(event.code==='KeyR'){event.preventDefault();resetView();}
 },true);
 render();
 return {setMode,resetView,get active(){return active;},dispose(){setMode(false);for(const [target,type,handler,options] of bindings)target?.removeEventListener(type,handler,options);toggle.remove();toolbar.remove();setting.remove();}};
}
if(typeof document!=='undefined')createCameraControls();
