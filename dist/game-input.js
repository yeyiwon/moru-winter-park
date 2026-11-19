export const isTextInput=element=>!!element?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])');
export function worldInputBlocked(doc=document){
 return doc.hidden||doc.body.matches('.invite-gate,.quiz-open,.studio-open,.chat-typing,.menu-open')||isTextInput(doc.activeElement)||!!doc.querySelector('dialog[open]:not([data-nonmodal])');
}
// A click on the game starts relative mouse look; UI and Escape always release it.
export function createMouseLook({canvas,status,locked=()=>false,onOrbit,onTap=()=>false,doc=document,win=window}){
 const bindings=[];const fail=()=>{canvas.dataset.mouseDrag='true';status.textContent='드래그로 시점을 돌릴 수 있어요.';};const listen=(target,type,fn,options)=>{target.addEventListener(type,fn,options);bindings.push([target,type,fn,options]);};
 const exit=()=>{if(doc.pointerLockElement===canvas)doc.exitPointerLock?.();};
 const update=()=>{const active=doc.pointerLockElement===canvas;doc.body.classList.toggle('mouse-look',active);if(active){delete canvas.dataset.mouseDrag;}if(active)status.textContent='마우스로 둘러보기 · Esc로 커서 해제';};
 listen(canvas,'click',async e=>{
  if(e.pointerType==='touch'||e.pointerType==='pen'||locked()||!canvas.requestPointerLock||canvas.dataset.mouseDrag)return;
  const active=doc.pointerLockElement===canvas,r=canvas.getBoundingClientRect(),point=active?{clientX:r.left+r.width/2,clientY:r.top+r.height/2}:e;
  if(onTap(point)||active)return;
  canvas.focus({preventScroll:true});
  try{await canvas.requestPointerLock();}catch{fail();}
 });
 listen(doc,'mousemove',e=>{if(doc.pointerLockElement===canvas&&!locked())onOrbit(e.movementX,e.movementY);});
 listen(doc,'pointerlockchange',update);listen(doc,'pointerlockerror',()=>{fail();update();});
 listen(win,'keydown',e=>{if(e.code==='Escape'&&doc.pointerLockElement===canvas){e.preventDefault();e.stopImmediatePropagation();exit();}},{capture:true});
 for(const event of ['lab:pause','lab:open','lab:tree-open','blur','pagehide'])listen(win,event,exit);
 listen(doc,'visibilitychange',()=>{if(doc.hidden)exit();});listen(doc,'focusin',e=>{if(isTextInput(e.target))exit();});
 return{exit,dispose(){exit();for(const args of bindings)args[0].removeEventListener(...args.slice(1));}};
}
// Pointer ownership keeps camera drags, joystick movement and UI taps independent.
export function joystickVector(dx,dy,radius=42,deadZone=.08){
 const length=Math.hypot(dx,dy),amount=Math.min(1,Math.max(0,(length/radius-deadZone)/(1-deadZone)));
 return length?{x:dx/length*amount,y:dy/length*amount}:{x:0,y:0};
}
export function createTouchControls({canvas,joystick,jumpButton,brakeButton,runButton,onMove,onOrbit,onZoom,onTap,onJump,locked=()=>false,onCancel=()=>{}}){
 const bindings=[];function listen(target,type,fn,options){if(!target)return;target.addEventListener(type,fn,options);bindings.push([target,type,fn,options]);}
 const stick=joystick.querySelector('.joystick-stick'),pointers=new Map();
 let joyId=null,jumpId=null,runId=null,brakeId=null,originX=0,originY=0,radius=42,knobRadius=28,mode='walk',pinch=0,moved=false,tapStart=null,braking=false,sprinting=false;
 const blocked=()=>locked()||['lift','ride'].includes(mode);
 const own=e=>{e.preventDefault();e.stopPropagation();};
 function releaseJoy(){joyId=null;onMove(0,0);stick.style.transform='translate(-50%,-50%)';joystick.classList.remove('active');joystick.style.removeProperty('--joy-x');joystick.style.removeProperty('--joy-y');}
 function releaseBrake(){brakeId=null;braking=false;brakeButton.classList.remove('active');}
 function setRunning(value){sprinting=value;runButton?.setAttribute('aria-pressed',String(value));runButton?.classList.toggle('active',value);}
 function reset(){releaseJoy();releaseBrake();jumpId=runId=null;setRunning(false);jumpButton.classList.remove('active');pointers.clear();pinch=0;tapStart=null;moved=false;onCancel();}
 // Measure once per gesture. A bounded floating origin avoids a jump on first
 // touch; capture retains the finger beyond the ring without moving the HUD.
 function moveJoy(e){const dx=e.clientX-originX,dy=e.clientY-originY,length=Math.hypot(dx,dy),v=joystickVector(dx,dy,radius);onMove(v.x,v.y);const scale=length>knobRadius?knobRadius/length:1;stick.style.transform=`translate(calc(-50% + ${dx*scale}px),calc(-50% + ${dy*scale}px))`;}
 listen(joystick,'pointerdown',e=>{own(e);if(blocked()||joyId!==null)return;const r=joystick.getBoundingClientRect(),knob=stick.offsetWidth||30,size=Math.min(r.width,r.height),offset=Math.min(10,size*.08),cx=r.left+r.width/2,cy=r.top+r.height/2;radius=parseFloat(window.getComputedStyle(joystick).getPropertyValue('--joystick-radius'))||size*.36;knobRadius=Math.max(8,radius-knob/2);originX=cx+Math.max(-offset,Math.min(offset,e.clientX-cx));originY=cy+Math.max(-offset,Math.min(offset,e.clientY-cy));joystick.style.setProperty('--joy-x',`${originX-cx}px`);joystick.style.setProperty('--joy-y',`${originY-cy}px`);joyId=e.pointerId;joystick.setPointerCapture(joyId);joystick.classList.add('active');moveJoy(e);});
 listen(joystick,'pointermove',e=>{if(e.pointerId===joyId){own(e);moveJoy(e);}});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])listen(joystick,event,e=>{if(e.pointerId===joyId)releaseJoy();});
 listen(jumpButton,'pointerdown',e=>{own(e);if(!blocked()&&mode==='walk'&&jumpId===null){jumpId=e.pointerId;jumpButton.setPointerCapture(e.pointerId);jumpButton.classList.add('active');onJump();}});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])listen(jumpButton,event,e=>{if(e.pointerId===jumpId){jumpId=null;jumpButton.classList.remove('active');}});
 listen(jumpButton,'click',e=>{if(e.detail===0&&!e.pointerType&&jumpId===null&&!blocked()&&mode==='walk')onJump();});
 // Toggle sprint so two thumbs can still steer and jump without holding a third button.
 listen(runButton,'pointerdown',e=>{own(e);if(blocked()||mode!=='walk'||runId!==null)return;runId=e.pointerId;runButton.setPointerCapture(runId);setRunning(!sprinting);});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])listen(runButton,event,e=>{if(e.pointerId===runId){runId=null;if(event==='pointercancel')setRunning(false);}});
 listen(runButton,'click',e=>{own(e);if(e.detail===0&&!e.pointerType&&runId===null&&!blocked()&&mode==='walk')setRunning(!sprinting);});
 listen(brakeButton,'pointerdown',e=>{own(e);if(!['ski','skate'].includes(mode)||blocked()||brakeId!==null)return;brakeId=e.pointerId;brakeButton.setPointerCapture(brakeId);braking=true;brakeButton.classList.add('active');});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])listen(brakeButton,event,e=>{if(e.pointerId===brakeId)releaseBrake();});
 listen(canvas,'pointerdown',e=>{if(e.pointerType==='mouse'&&canvas.requestPointerLock&&!canvas.dataset.mouseDrag)return;if(locked()||document.pointerLockElement===canvas)return;e.preventDefault();document.activeElement?.blur();canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){tapStart={x:e.clientX,y:e.clientY};moved=false;}else{moved=true;pinch=distance();}});
 function distance(){const [a,b]=[...pointers.values()];return a&&b?Math.hypot(a.x-b.x,a.y-b.y):0;}
 listen(canvas,'pointermove',e=>{const previous=pointers.get(e.pointerId);if(!previous||locked()||document.pointerLockElement===canvas)return;e.preventDefault();const dx=e.clientX-previous.x,dy=e.clientY-previous.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size>1){const next=distance();if(pinch>0)onZoom((pinch-next)*.07);pinch=next;moved=true;}else{if(tapStart&&Math.hypot(e.clientX-tapStart.x,e.clientY-tapStart.y)>7)moved=true;if(moved)onOrbit(dx,dy);}});
 listen(canvas,'pointerup',e=>{if(!pointers.has(e.pointerId))return;const tap=pointers.size===1&&!moved&&!locked()&&document.pointerLockElement!==canvas;pointers.delete(e.pointerId);pinch=0;if(tap)onTap(e);if(!pointers.size)tapStart=null;});
 for(const event of ['pointercancel','lostpointercapture'])listen(canvas,event,e=>{pointers.delete(e.pointerId);pinch=0;moved=true;});
 listen(document,'focusin',e=>{if(isTextInput(e.target))reset();});listen(window,'lab:close',reset);listen(window,'blur',reset);listen(document,'visibilitychange',reset);listen(window,'lab:pause',reset);listen(window,'orientationchange',reset);listen(window,'resize',reset);listen(window,'pagehide',reset);listen(window.visualViewport,'resize',reset);
 return{reset,dispose(){reset();for(const [target,type,fn,options]of bindings)target.removeEventListener(type,fn,options);bindings.length=0;},get braking(){return braking;},get sprinting(){return sprinting;},setMode(next){next=['carousel','ferris','bath','sauna','lie','tea','dining','view','rest'].includes(next)?'ride':['ski','skate','lift','wade'].includes(next)?next:'walk';if(next===mode)return;reset();mode=next;document.body.dataset.controls=mode;joystick.setAttribute('aria-disabled',String(mode==='lift'));jumpButton.disabled=mode!=='walk';if(runButton)runButton.hidden=mode!=='walk';brakeButton.hidden=!['ski','skate'].includes(mode);}};
}
