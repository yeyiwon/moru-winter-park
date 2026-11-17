// Pointer ownership keeps camera drags, joystick movement and UI taps independent.
export function joystickVector(dx,dy,radius=42,deadZone=.08){
 const length=Math.hypot(dx,dy),amount=Math.min(1,Math.max(0,(length/radius-deadZone)/(1-deadZone)));
 return length?{x:dx/length*amount,y:dy/length*amount}:{x:0,y:0};
}
export function createTouchControls({canvas,joystick,jumpButton,brakeButton,onMove,onOrbit,onZoom,onTap,onJump,locked=()=>false,onCancel=()=>{}}){
 const stick=joystick.querySelector('.joystick-stick'),pointers=new Map();
 let joyId=null,mode='walk',pinch=0,moved=false,tapStart=null,braking=false;
 const blocked=()=>locked()||mode==='lift';
 const own=e=>{e.preventDefault();e.stopPropagation();};
 function releaseJoy(){joyId=null;onMove(0,0);stick.style.transform='translate(-50%,-50%)';joystick.classList.remove('active');}
 function releaseBrake(){braking=false;brakeButton.classList.remove('active');}
 function reset(){releaseJoy();releaseBrake();pointers.clear();pinch=0;tapStart=null;moved=false;onCancel();}
 function moveJoy(e){const r=joystick.getBoundingClientRect(),v=joystickVector(e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2,Math.min(r.width,r.height)*.32);onMove(v.x,v.y);stick.style.transform=`translate(calc(-50% + ${v.x*28}px),calc(-50% + ${v.y*28}px))`;}
 joystick.addEventListener('pointerdown',e=>{own(e);if(blocked()||joyId!==null)return;joyId=e.pointerId;joystick.setPointerCapture(joyId);joystick.classList.add('active');moveJoy(e);});
 joystick.addEventListener('pointermove',e=>{if(e.pointerId===joyId){own(e);moveJoy(e);}});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(event,e=>{if(e.pointerId===joyId)releaseJoy();});
 jumpButton.addEventListener('pointerdown',e=>{own(e);if(!blocked()){jumpButton.setPointerCapture(e.pointerId);jumpButton.classList.add('active');onJump();}});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])jumpButton.addEventListener(event,()=>jumpButton.classList.remove('active'));
 jumpButton.addEventListener('click',e=>{if(e.detail===0&&!blocked())onJump();});
 brakeButton.addEventListener('pointerdown',e=>{own(e);if(!['ski','skate'].includes(mode)||blocked())return;brakeButton.setPointerCapture(e.pointerId);braking=true;brakeButton.classList.add('active');});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])brakeButton.addEventListener(event,releaseBrake);
 canvas.addEventListener('pointerdown',e=>{if(locked())return;e.preventDefault();document.activeElement?.blur();canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){tapStart={x:e.clientX,y:e.clientY};moved=false;}else{moved=true;pinch=distance();}});
 function distance(){const [a,b]=[...pointers.values()];return a&&b?Math.hypot(a.x-b.x,a.y-b.y):0;}
 canvas.addEventListener('pointermove',e=>{const previous=pointers.get(e.pointerId);if(!previous||locked())return;e.preventDefault();const dx=e.clientX-previous.x,dy=e.clientY-previous.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size>1){const next=distance();if(pinch>0)onZoom((pinch-next)*.07);pinch=next;moved=true;}else{if(tapStart&&Math.hypot(e.clientX-tapStart.x,e.clientY-tapStart.y)>7)moved=true;if(moved)onOrbit(dx,dy);}});
 canvas.addEventListener('pointerup',e=>{if(!pointers.has(e.pointerId))return;const tap=pointers.size===1&&!moved&&!locked();pointers.delete(e.pointerId);pinch=0;if(tap)onTap(e);if(!pointers.size)tapStart=null;});
 for(const event of ['pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{pointers.delete(e.pointerId);pinch=0;moved=true;});
 window.addEventListener('blur',reset);document.addEventListener('visibilitychange',reset);window.addEventListener('lab:pause',reset);window.addEventListener('orientationchange',reset);
 return{reset,get braking(){return braking;},setMode(next){next=['ski','skate','lift'].includes(next)?next:'walk';if(next===mode)return;reset();mode=next;document.body.dataset.controls=mode;joystick.setAttribute('aria-disabled',String(mode==='lift'));jumpButton.disabled=mode!=='walk';brakeButton.hidden=!['ski','skate'].includes(mode);}};
}
