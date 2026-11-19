import {yieldForPaint} from './startup-work.js';
import {createFireworkNotice} from './firework-notice.js';
import {createExplorationCamera,explorationView} from './exploration-camera.js';
import {serverNow} from './server-clock.js';
import {createLuminousLoading} from './luminous-loading.js';
import {createWinterFireworks} from './winter-fireworks.js';
import {onsenEntrances} from './onsen-layout.js';
import {createLightingThemeManager} from './lighting-theme.js';
import {mountMuseumPuzzle} from './museum-puzzle.js';
import './world-settings.js';
import {interiorDoors,museumGalleries} from './district-layout.js';
import {activityCameraView} from './activity-camera.js';
import {createNavigationClient} from './navigation-client.js';
import {createFrameMetrics} from './frame-metrics.js';
import {disposeOwnedScene} from './scene-resources.js';
import {createSimulationClock} from './simulation-clock.js';
import {createPlayerState} from './player-state.js';
import {createLocalLights} from './local-lights.js';
import {createRenderBudget,projectedCharacterHeight} from './render-budget.js';
import {treeLayout,treeShift,treeInteractionRadius} from './tree-layout.js';
import {alpineShift} from './resort-layout.js';
import {createCameraClearance} from './camera-clearance.js';
import {createGlowPass} from './glow-pass.js';
import {createFantasyVFX} from './fantasy-vfx.js';
import {buildInteriors} from './interior-world.js';
import {interiorRooms,interiorAt,interiorInteractions} from './interior-layout.js';
import {surfaceAt} from './audio-world.js';
import {createTouchControls,createMouseLook,worldInputBlocked,isTextInput} from './game-input.js';
import {createActivityReactions} from './activity-reactions.js';
import {createPlazaSnowman} from './plaza-snowman.js';
import {createMoveMarker} from './move-marker.js';
import {createPreviewOrbit} from './preview-orbit.js';
import {placePrompt,createLabelLayout} from './world-labels.js';
import {createSkiTrails} from './ski-trails.js';
import {createSharedTree} from './shared-tree.js';
import {createFootprints} from './footprints.js';
import {createWinterSky} from './winter-sky.js';
import {createWinterExperience} from './winter-experience.js';
import {createVisitors} from './visitors.js';
import * as T from './vendor/three.module.js';
import {moveVector,moveOnGround,canStandAt} from './movement.js?v=winter27';
import {findPath} from './navigation.js?v=winter27';
import {rooms,islands,islandAt,surfaceHeight} from './world-layout.js';
import {createCompanion} from './companion.js?v=winter27';
import {buildWorldAsync} from './themepark-world.js?v=winter27';
import {createDiscoveryGate} from './discovery.js';
const canvas=document.querySelector('#park-canvas'),status=document.querySelector('#park-status');
function compactRenderer(){return innerWidth<650||matchMedia('(pointer: coarse)').matches;}
let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch{document.body.classList.add('no-webgl');window.labLoading?.error('3D 화면을 사용할 수 없습니다.');status.textContent='3D 화면을 사용할 수 없습니다. 바로 학습하기는 계속 이용할 수 있어요.';}
if(renderer){
await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<650?1.25:1.5));renderer.setSize(innerWidth,innerHeight,false);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.info.autoReset=false;
const scene=new T.Scene();scene.background=new T.Color('#34304b');scene.fog=new T.Fog('#8b9aaa',110,330);const camera=new T.PerspectiveCamera(explorationView.fov,innerWidth/innerHeight,.1,1200);
const hemi=new T.HemisphereLight('#fff1e8','#697d74',1.5);scene.add(hemi);const moon=new T.DirectionalLight('#f4e7ff',2.1);moon.position.set(-13,25,12);moon.castShadow=true;moon.shadow.mapSize.set(compactRenderer()?1024:2048,compactRenderer()?1024:2048);Object.assign(moon.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:1,far:210});moon.shadow.normalBias=.04;moon.shadow.bias=-.0002;scene.add(moon,moon.target);const fill=new T.DirectionalLight('#ffe6c8',.8);fill.position.set(15,5,20);scene.add(fill);
const world=await buildWorldAsync(scene),lightingTheme=createLightingThemeManager(scene);window.labLoading?.complete('world');world.winter.destinations.push(...[{id:'view-park',name:'놀이공원 전망',x:-34,z:26,kind:'photo',view:{distance:14,yaw:-1.0,pitch:.17}},{id:'view-mountain',name:'설산 전망',x:-15,z:-146+alpineShift,kind:'photo',view:{distance:14,yaw:.2,pitch:.1}},{id:'view-tree',name:'트리 전망',x:treeLayout.x-14,z:treeLayout.z+21,kind:'photo',view:{distance:16,yaw:-.55,pitch:.06}}]);

await yieldForPaint();
world.experiment({kind:'bridge',key:true,lantern:false});const companion=createCompanion(),fluff=companion.group;fluff.position.set(0,.95,24);fluff.rotation.y=-.15;scene.add(fluff);await yieldForPaint();
const winterSky=createWinterSky(scene,hemi,moon,fill,world),visitors=createVisitors(scene,{rideChair:world.winter.rideChair});
await yieldForPaint();
const exteriorVisibility=new Map();const exteriorNodes=scene.children.filter(o=>![hemi,moon,moon.target,fill,fluff].includes(o));const interiors=buildInteriors(scene,{lazy:true,onLoad:root=>localLights.register(root),onRelease:root=>{cameraClearance.reset();localLights.unregister(root);}});window.labLoading?.complete('interiors');let activeInterior=null,transitioning=false,returnPosition=null;const roomFade=document.createElement('div');roomFade.id='room-transition';roomFade.setAttribute('aria-hidden','true');roomFade.setAttribute('role','status');document.body.append(roomFade);const roomLoader=createLuminousLoading(roomFade);window.labInterior=null;
mountMuseumPuzzle();
const experience=createWinterExperience(world.winter,companion,(id,show=true)=>window.travelToPlace(id,show));window.labWinter=world.winter;window.dispatchEvent(new Event('lab:winter-ready'));
const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;const gc=glowCanvas.getContext('2d'),gradient=gc.createRadialGradient(32,32,3,32,32,32);gradient.addColorStop(0,'#00000088');gradient.addColorStop(1,'#00000000');gc.fillStyle=gradient;gc.fillRect(0,0,64,64);
const shadow=new T.Mesh(new T.PlaneGeometry(2.2,1.8),new T.MeshBasicMaterial({map:new T.CanvasTexture(glowCanvas),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.105;scene.add(shadow);
// The resolved app preference honors an explicit full-motion choice on every OS.
let still=()=>document.body.classList.contains('still'),paused=()=>transitioning||worldInputBlocked();
const cameraClearance=createCameraClearance(),cameraControl=createExplorationCamera(camera,{clearance:cameraClearance,surfaceHeight,constrainPosition:position=>{if(activeInterior)interiors.setCamera(position);},mobile:compactRenderer()}),target=cameraControl.focus;
const sensitivityControl=document.querySelector('#camera-sensitivity'),sensitivityValue=document.querySelector('#camera-sensitivity-value');
try{sensitivityControl.value=localStorage.getItem('winter-camera-sensitivity')||'100';}catch{}
function cameraSensitivity(){const value=Number(sensitivityControl.value);cameraControl.setSensitivity(value/100);sensitivityValue.textContent=value+'%';}
cameraSensitivity();sensitivityControl.addEventListener('input',()=>{cameraSensitivity();try{localStorage.setItem('winter-camera-sensitivity',sensitivityControl.value);}catch{}});
let route=[],destination=null,phase=0,velocity=new T.Vector2(),jump=0,jumpVelocity=0,land=0,time=0,nearby=null,regionTimer,region='';
const keys=new Set(),directions={KeyW:[0,-1],ArrowUp:[0,-1],KeyS:[0,1],ArrowDown:[0,1],KeyA:[-1,0],ArrowLeft:[-1,0],KeyD:[1,0],ArrowRight:[1,0]},joy=new T.Vector2(),gate=createDiscoveryGate(750);let shown=null;
const navigation=createNavigationClient(findPath),physics=createSimulationClock(),playerState=createPlayerState();let simulationView=null;
let running=false;function clear(){navigation.cancel();physics.reset();simulationView=null;playerState.reset();running=false;keys.clear();joy.set(0,0);route=[];destination=null;velocity.set(0,0);if(window.labPlayerState)window.labPlayerState.speed=0;}
document.addEventListener('focusin',e=>{if(isTextInput(e.target))clear();});window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);window.addEventListener('lab:open',()=>{clear();window.dismissParkDiscovery();});window.addEventListener('lab:pause',clear);window.addEventListener('lab:close',clear);
function startJump(){if(!paused()&&!experience.active&&playerState.canJump()&&jump===0&&jumpVelocity===0){jumpVelocity=4.6;window.labSound?.('jump');}}
window.addEventListener('keydown',e=>{if(paused()||e.metaKey||e.ctrlKey||e.altKey||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||e.target.isContentEditable)return;if(e.code==='ShiftLeft'||e.code==='ShiftRight')running=true;if(directions[e.code]){e.preventDefault();keys.add(e.code);route=[];navigation.cancel();}if(e.code==='Space'&&!e.target.closest?.('button,a,summary,[role=button]')){e.preventDefault();startJump();}});window.addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='ShiftLeft'||e.code==='ShiftRight')running=false;});
const joystick=document.querySelector('#joystick');
joystick.querySelectorAll('button').forEach(b=>b.onclick=e=>{if(e.detail)return;const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[b.dataset.move];const v=moveVector(...d,cameraControl.yaw);moveTo(fluff.position.x+v.x*1.5,fluff.position.z+v.z*1.5);});
const point=new T.Vector3(),ray=new T.Raycaster();
function tapWorld(e){
 if(paused())return false;const r=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);
 if(!activeInterior){
  if(Math.hypot(fluff.position.x+6.5,fluff.position.z-3)<5&&ray.intersectObject(snowman.root,true).length){snowman.interact(time);return true;}
  const treeDistance=Math.hypot(fluff.position.x-treeLayout.x,fluff.position.z-treeLayout.z);
  if(treeDistance<=treeInteractionRadius&&sharedTree.readAt(ray))return true;
  const treeHit=ray.intersectObjects(world.winter.treeTargets,false)[0];
  if(treeHit){
   if(treeDistance>treeInteractionRadius){window.labToast?.('트리에 조금 더 가까이 와 주세요.');return true;}
   if(window.treeDecorationActive?.())window.placeTreeDecoration(treeHit.point);else window.dispatchEvent(new Event('lab:tree-open'));
   return true;
  }
  const hit=ray.intersectObjects(world.interactive,false)[0];if(hit){const data=hit.object.userData,bath=data.action==='onsen'?onsenEntrances[data.activity||'bath']:null,p=bath?{id:'onsen',...bath.access}:world.winter.destinations.find(p=>p.id===data.action);if(p){if(Math.hypot(p.x-fluff.position.x,p.z-fluff.position.z)<5)experience.show(p.id,data.activity);else moveTo(p.x,p.z);return true;}if(data.action==='sound'){window.openSoundExperiment?.();return true;}if(!data.winter){window.openWorldExperiment?.();return true;}}
  if(ray.intersectObject(fluff,true).length){if(!experience.useHeldItem())startJump();return true;}
 }
 // Mouse clicks enter relative look. Touch retains the existing floor-to-walk action.
 if(e.pointerType==='touch'||e.pointerType==='pen'||!canvas.requestPointerLock||canvas.dataset.mouseDrag){const floor=new T.Plane(new T.Vector3(0,1,0),-surfaceHeight(fluff.position.x,fluff.position.z));if(ray.ray.intersectPlane(floor,point))moveTo(point.x,point.z);}
 return false;
}
const touchControls=createTouchControls({canvas,joystick,jumpButton:document.querySelector('#jump-button'),brakeButton:document.querySelector('#brake-button'),runButton:document.querySelector('#run-button'),locked:paused,onMove:(x,y)=>{joy.set(x,y);route=[];navigation.cancel();},onOrbit:orbitCamera,onZoom:zoomCamera,onTap:tapWorld,onJump:startJump});
function orbitCamera(dx,dy){cameraControl.orbit(dx,dy);}
function zoomCamera(amount){cameraControl.zoom(amount);}
canvas.addEventListener('wheel',e=>{e.preventDefault();if(!paused())zoomCamera(e.deltaY*.02);},{passive:false});
const mouseLook=createMouseLook({canvas,status,locked:paused,onOrbit:orbitCamera,onTap:tapWorld});
const moveMarker=createMoveMarker(scene);
function ripple(x,z){moveMarker.show(x,surfaceHeight(x,z),z);}
async function moveTo(x,z){if(experience.active&&!experience.wake())return;route=[];destination=null;velocity.set(0,0);const next=await navigation.request({x:fluff.position.x,z:fluff.position.z},{x,z});if(!next)return;if(!next.length){status.textContent='그곳에는 길이 없습니다. 산책로를 눌러 주세요.';return;}route=next;destination=route.at(-1);ripple(destination.x,destination.z);window.labSound?.('move');}
window.travelToIsland=id=>{const island=islands.find(r=>r.id===id);if(!island||island.hidden)return;setInterior(null);experience.cancel();clear();jump=jumpVelocity=0;fluff.position.set(island.spawn.x,.86+surfaceHeight(island.spawn.x,island.spawn.z),island.spawn.z);fluff.rotation.y=Math.atan2(island.x-island.spawn.x,island.z-island.spawn.z);publishPlayerPose();cameraControl.place(fluff.position);document.body.classList.add('has-walked');window.dismissParkDiscovery();ripple(island.spawn.x,island.spawn.z);window.labSound?.('travel');};
function publishPlayerPose(){window.labPlayerState={x:fluff.position.x,y:fluff.position.y,z:fluff.position.z,yaw:fluff.rotation.y,mode:'',speed:0};}
function setInterior(id){cameraClearance.reset();if(id&&!activeInterior)for(const o of exteriorNodes)exteriorVisibility.set(o,o.visible);const leaving=activeInterior&&!id;activeInterior=id;window.labInterior=id;interiors.setActive(id);for(const o of exteriorNodes){if(id)o.visible=false;else if(leaving)o.visible=exteriorVisibility.get(o)??true;}document.body.classList.toggle('inside-room',!!id);}
function placePlayer(p,yawValue){cameraClearance.reset();clear();jump=jumpVelocity=0;fluff.position.set(p.x,.86+surfaceHeight(p.x,p.z),p.z);fluff.rotation.y=yawValue;window.labPlayerState={x:p.x,y:fluff.position.y,z:p.z,yaw:yawValue,mode:'',speed:0};cameraControl.place(fluff.position,{interior:activeInterior});}
async function transitionRoom(change,name='겨울 공원'){if(transitioning)return;transitioning=true;clear();experience.cancel();roomFade.setAttribute('aria-label',name+' 준비 중');roomLoader.start();roomFade.setAttribute('aria-hidden','false');roomFade.classList.add('active');try{
 // Give the overlay a paint before building an uncached room; no invented progress/delay.
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));await change();
 if(glowPass)await glowPass.prepare(scene,camera);else await renderer.compileAsync?.(scene,camera);transitioning=false;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 }catch(e){status.textContent=e.message;window.labToast?.(e.message);}finally{roomLoader.stop();roomFade.classList.remove('active');roomFade.setAttribute('aria-hidden','true');transitioning=false;window.dispatchEvent(new Event('lab:close'));}}
window.enterInterior=id=>{const room=interiorRooms[id],door=interiorDoors[id];if(!room||!door||activeInterior)return;if(window.worldContentEnabled?.(id)===false){status.textContent='지금은 점검 중입니다.';return;}if(Math.hypot(fluff.position.x-door.x,fluff.position.z-door.z)>6){window.labToast?.('입구에 가까이 와 주세요.');return;}return transitionRoom(async()=>{interiors.ensure(id);const approved=await window.changeWinterRegion(id);returnPosition={x:door.x,z:door.z};window.labInteriorExit=returnPosition;setInterior(id);placePlayer(approved.position,approved.yaw);},room.name);};
// Exhibit feedback belongs to the object; opening a card never takes over the user's camera.
window.addEventListener('lab:exhibit-focus',e=>{if(activeInterior==='museum')interiors.react(e.detail,time);});
window.addEventListener('lab:exhibit-correct',e=>{interiors.react(e.detail,time);const g=museumGalleries.find(g=>g.id===e.detail);if(g&&!document.body.classList.contains('reduce-flash')&&!still())fantasy.burst({x:600+g.x,y:3.5,z:g.z,kind:'correct',color:g.color,strength:.7});});
window.addEventListener('lab:puzzle-turn',e=>interiors.puzzle(e.detail));
window.exitInterior=()=>{if(!activeInterior)return;return transitionRoom(async()=>{const approved=await window.changeWinterRegion('outdoors');setInterior(null);placePlayer(approved.position,approved.yaw);});};

window.travelToPlace=(id,show=true)=>{const p=world.winter.destinations.find(p=>p.id===id);if(!p)return;setInterior(null);experience.cancel();clear();jump=jumpVelocity=0;fluff.position.set(p.x,.86+surfaceHeight(p.x,p.z),p.z);fluff.rotation.y=Math.PI;publishPlayerPose();cameraControl.place(fluff.position);document.body.classList.add('has-walked');window.dismissParkDiscovery();if(show)experience.show(id);};
window.dismissParkDiscovery=()=>{gate.dismiss();shown=null;window.showParkDiscovery?.(null);};window.parkCelebrate=()=>{land=.5;window.labSound?.('correct');};window.parkNearbyCategory=()=>nearby?.id;
window.addEventListener('lab:simulation',e=>world.experiment(e.detail));window.addEventListener('lab:content-ready',()=>{shown=null;gate.update(null,performance.now());});
let lightColor=new T.Color('#c5c8ea'),brightness=1;function appearance(o){companion.customize(o);if(!window.labDraftAppearance)portrait?.customize(o);lightColor.set(o.light||'#c5c8ea');brightness=(o.brightness||100)/100;lightingTheme.set(lightColor,brightness);}window.addEventListener('lab:appearance',e=>appearance(e.detail));
let portrait=null,portraitRenderer,portraitScene,portraitCamera,portraitOrbit,portraitWidth=0,portraitHeight=0;
function ensurePortrait(){if(portraitRenderer)return;try{const pc=document.querySelector('#fluff-preview');portraitRenderer=new T.WebGLRenderer({canvas:pc,antialias:true,alpha:true});portraitRenderer.setPixelRatio(Math.min(devicePixelRatio,1.5));portraitRenderer.outputColorSpace=T.SRGBColorSpace;portraitRenderer.toneMapping=T.ACESFilmicToneMapping;portraitScene=new T.Scene();portraitScene.background=null;portraitCamera=new T.PerspectiveCamera(32,1,.1,10);portraitCamera.position.set(0,.05,3.8);portraitCamera.lookAt(0,0,0);portrait=createCompanion();portraitScene.add(portrait.group);portraitScene.add(new T.HemisphereLight('#fff5eb','#6b7285',2));const key=new T.DirectionalLight('#fff0dd',2.5);key.position.set(-3,4,4);portraitScene.add(key);portraitOrbit=createPreviewOrbit(pc);}catch{document.querySelector('#fluff-preview').hidden=true;}portrait?.customize(window.labDraftAppearance||window.labAppearance||{});}

window.addEventListener('lab:preview-appearance',e=>portrait?.customize(e.detail));
window.addEventListener('lab:preview-front',()=>portraitOrbit?.reset());
appearance(window.labAppearance||{});
await yieldForPaint();
let prev=performance.now();const frameMetrics=createFrameMetrics(renderer);window.labPerformance=frameMetrics;
const fireworkNotice=createFireworkNotice(),fireworks=createWinterFireworks(scene,{light:fill}),fantasy=createFantasyVFX(scene),glowPass=renderer.getDrawingBufferSize?createGlowPass(renderer):null;
window.addEventListener('lab:vfx',e=>{if(document.body.classList.contains('reduce-flash')&&['correct','wrong'].includes(e.detail?.kind))return;const p=window.labPlayerState;if(p)fantasy.burst({...p,...e.detail});});
const qualityControl=document.querySelector('#vfx-quality');let renderMode='auto';try{renderMode=localStorage.getItem('winter-render-mode')||(localStorage.getItem('winter-vfx-quality')==='low'?'low':'auto');}catch{}
const renderBudget=createRenderBudget({pixelRatio:devicePixelRatio,mobile:compactRenderer(),mode:renderMode}),localLights=createLocalLights(scene,{limit:compactRenderer()?4:6});let shadowElapsed=Infinity,backgroundDirty=true;
function applyRenderBudget(){backgroundDirty=true;const settings=renderBudget.settings;document.documentElement.dataset.renderQuality=settings.quality;if(moon.shadow.mapSize.x!==settings.shadowSize){moon.shadow.map?.dispose();moon.shadow.map=null;moon.shadow.mapSize.set(settings.shadowSize,settings.shadowSize);}fantasy.setQuality(settings.quality);fireworks.setQuality(settings.quality);glowPass?.setQuality(settings.quality,{samples:settings.samples});interiors.setQuality(settings.quality);world.winter.setQuality?.(settings.quality);world.setQuality?.(settings.quality);winterSky.setQuality?.(settings.quality);renderer.setPixelRatio(settings.pixelRatio);renderer.setSize(innerWidth,innerHeight,false);shadowElapsed=Infinity;if(qualityControl)qualityControl.value=renderBudget.mode;try{localStorage.setItem('winter-render-mode',renderBudget.mode);localStorage.setItem('winter-vfx-quality',settings.quality);}catch{}}
renderBudget.setMode(renderMode);applyRenderBudget();qualityControl?.addEventListener('change',()=>{renderBudget.setMode(qualityControl.value);applyRenderBudget();});
const reactions=createActivityReactions(scene),snowman=createPlazaSnowman(scene);window.addEventListener('lab:snowman',()=>{if(snowman.interact(time))fantasy.burst({kind:'joy',x:snowman.root.position.x,y:1.6,z:snowman.root.position.z,color:'#ffe5b4',strength:.6});});
const skiTrails=createSkiTrails(scene),footprints=createFootprints(scene),sharedTree=createSharedTree(scene,fantasy);localLights.register(scene);
window.addEventListener('lab:interaction-end',()=>{cameraClearance.reset();touchControls.setMode('');});
window.addEventListener('lab:stand',e=>{if(e.detail?.position){const p=e.detail.position;fluff.position.set(p.x,.86+surfaceHeight(p.x,p.z),p.z);}if(!canStandAt(fluff.position.x,fluff.position.z)){let found=false;for(let r=.4;r<=3&&!found;r+=.3)for(let a=0;a<Math.PI*2;a+=Math.PI/8){const x=fluff.position.x+Math.sin(a)*r,z=fluff.position.z+Math.cos(a)*r;if(canStandAt(x,z)){fluff.position.x=x;fluff.position.z=z;found=true;break;}}}});
const selfLabel=document.querySelector('#self-label'),bubble=document.querySelector('#self-bubble'),selfLayout=createLabelLayout(selfLabel);
const screen=new T.Vector3(),soundForward=new T.Vector3();let nextRegionCheck=0,nextProximityCheck=0,interiorPrefetch=null;let frame=0,wasPaused=false,cameraRideMode='';
function simulatePlayer(dt){
 let ix=joy.x,iz=joy.y;for(const k of keys){ix+=directions[k]?.[0]||0;iz+=directions[k]?.[1]||0;}let input=moveVector(ix,iz,cameraControl.yaw),speed=(running||touchControls.sprinting)?8:4.3;if(!ix&&!iz&&route.length){let p=route[0],d=Math.hypot(p.x-fluff.position.x,p.z-fluff.position.z);if(d<.18){route.shift();p=route[0];}if(p){d=Math.hypot(p.x-fluff.position.x,p.z-fluff.position.z);input={x:(p.x-fluff.position.x)/d,z:(p.z-fluff.position.z)/d};speed=Math.min(4.3,d*7);}else{destination=null;velocity.set(0,0);}}
 velocity.x+=(input.x*speed-velocity.x)*(1-Math.exp(-dt*13));velocity.y+=(input.z*speed-velocity.y)*(1-Math.exp(-dt*13));const ride=experience.update(dt,{steer:ix,throttle:-iz,handbrake:touchControls.braking,push:iz<-.25,brake:iz>.25||touchControls.braking,x:input.x,z:input.z,running:running||touchControls.sprinting}),before={x:fluff.position.x,z:fluff.position.z},next=ride||moveOnGround(before,{x:velocity.x,z:velocity.y},dt),travel=Math.hypot(next.x-before.x,next.z-before.z),walking=travel>.001&&(!ride||ride.mode==='summit');fluff.position.x=next.x;fluff.position.z=next.z;
 if(walking){phase+=travel*5.4;const facing=Math.atan2(velocity.x,velocity.y),diff=Math.atan2(Math.sin(facing-fluff.rotation.y),Math.cos(facing-fluff.rotation.y));fluff.rotation.y+=diff*(1-Math.exp(-dt*10));document.body.classList.add('has-walked');if(Math.floor(phase/Math.PI)!==Math.floor((phase-travel*5.4)/Math.PI))window.labSound?.('step',{surface:surfaceAt(next.x,next.z,ride?.mode),running:running||touchControls.sprinting});}
 if(!ride&&experience.facing!==null){const angle=experience.facing-fluff.rotation.y;fluff.rotation.y+=Math.atan2(Math.sin(angle),Math.cos(angle))*(1-Math.exp(-dt*8));}
 if(jumpVelocity||jump){jumpVelocity-=13*dt;jump+=jumpVelocity*dt;if(jump<0){jump=0;jumpVelocity=0;land=1;window.labSound?.('jump-land',{surface:surfaceAt(next.x,next.z,ride?.mode)});}}land=Math.max(0,land-dt*4.2);fluff.position.y=ride?ride.y:.86+surfaceHeight(next.x,next.z)+jump;if(cameraRideMode&&!ride?.mode)velocity.set(0,0);if(ride)fluff.rotation.y=ride.yaw;cameraRideMode=ride?.mode||'';touchControls.setMode(cameraRideMode==='bath'&&!activeInterior?'wade':cameraRideMode);window.labPlayerState={x:fluff.position.x,y:fluff.position.y,z:fluff.position.z,yaw:fluff.rotation.y,mode:ride?.mode||'',speed:ride?.speed||travel/Math.max(dt,.001),gesture:experience.gesture,heldItem:experience.heldItem,balloonTone:experience.balloonTone,balloonStyle:experience.balloonStyle,roast:experience.roast};playerState.update({mode:ride?.mode,jump,moving:walking,running:running||touchControls.sprinting,gesture:experience.focusGesture,room:activeInterior});if(ride&&ride.mode!=='summit'){jump=jumpVelocity=0;}const gaze=destination?destination.x-next.x:velocity.x;
 return{ride,next,walking,travel,gaze};
}
window.addEventListener('lab:onsen-start',()=>{clear();jump=jumpVelocity=0;});
window.addEventListener('lab:onsen-end',clear);
const treeDock=document.querySelector('#tree-tools'),dockFraction=()=>Math.min(.47,(treeDock.offsetHeight||180)/innerHeight+.03);
const treeResize=typeof ResizeObserver==='function'?new ResizeObserver(()=>cameraControl.resizeTree(fluff.position,dockFraction())):null;treeResize?.observe(treeDock);
window.addEventListener('lab:tree-open',()=>queueMicrotask(()=>{cameraControl.beginTree(fluff.position,{still:still(),dockFraction:dockFraction()});clear();}));
window.addEventListener('lab:tree-closed',e=>cameraControl.endTree(e.detail?.restore!==false));
window.addEventListener('lab:room',()=>cameraControl.endTree(false));
window.addEventListener('lab:session-ended',()=>{experience.cancel();clear();cameraControl.endTree(false);});
window.addEventListener('lab:watch-fireworks',()=>{if(activeInterior)return;cameraControl.watchShow(window.labFireworks,fluff.position);});
let animationFrame;function animate(now){animationFrame=requestAnimationFrame(animate);const raw=now-prev;prev=now;if(document.hidden)return;
 // A callback queued before synchronous world construction can carry an older timestamp.
 const dt=Math.max(0,Math.min(.05,raw/1000)),exhibitActive=activeInterior==='museum'&&document.body.classList.contains('quiz-open'),isPaused=paused()&&frame>0&&!exhibitActive;time+=isPaused?0:dt;
 // Resizing clears the drawing buffer even while menus freeze the world.
 // Redraw the same pose once; do not resume simulation or a continuous GPU loop.
 if(isPaused&&backgroundDirty){if(glowPass)glowPass.render(scene,camera);else renderer.render(scene,camera);backgroundDirty=false;}
 if(isPaused&&!window.labPreviewVisible){physics.reset();wasPaused=true;return;} // Reading really freezes the background render loop.
 if(!isPaused){frameMetrics.begin();if(activeInterior)interiors.update(time,still());else world.update(time,still());let travelled=0;physics.advance(dt,step=>{simulationView=simulatePlayer(step);travelled+=simulationView.travel;});if(!simulationView)simulationView=simulatePlayer(0);const {ride,next,walking,gaze}=simulationView,travel=travelled;
  // Animate the final simulated pose once per display frame, even after catch-up steps.
  companion.pose({phase,walking,time,room:activeInterior,mode:ride?.mode,lean:ride?.lean,tilt:ride?.tilt,speed:ride?.speed??window.labPlayerState.speed,brake:ride?.brake,gesture:experience.gesture,heldItem:experience.heldItem,balloonTone:experience.balloonTone,balloonStyle:experience.balloonStyle,roast:experience.roast,landing:land,still:still(),look:still()?0:Math.max(-.02,Math.min(.02,gaze*.005))});shadow.visible=!['bath','sauna','lie','tea','dining'].includes(ride?.mode);shadow.position.set(next.x,surfaceHeight(next.x,next.z)+.015,next.z);shadow.scale.setScalar(1-jump*.12);shadow.material.opacity=1-jump*.3;
 const activity=activityCameraView(experience.focusGesture,{yaw:fluff.rotation.y,mobile:compactRenderer()});
 scene.updateMatrixWorld();
 cameraControl.update(dt,{player:fluff.position,groundY:fluff.position.y-jump,ride,activity:activity?{...activity,kind:experience.focusGesture}:null,interior:activeInterior,walking,occluders:activeInterior?interiors.occluders:world.occluders,show:window.labFireworks,now:serverNow()});
 const skiing=ride?.mode==='ski';
 camera.getWorldDirection(soundForward);window.labAudio?.updateWorld({...window.labPlayerState,speed:ride?.speed||0,lean:ride?.lean,brake:ride?.brake},{x:camera.position.x,y:camera.position.y,z:camera.position.z,fx:soundForward.x,fy:soundForward.y,fz:soundForward.z});

 frame++;
 moon.position.set(target.x-40,target.y+70,target.z+40);moon.target.position.set(target.x,target.y-1.2,target.z);winterSky.update(time,still(),target,brightness);lightingTheme.update(dt);scene.fog.near=next.z< -170+alpineShift?260:130;scene.fog.far=next.z< -170+alpineShift?950:500;if(activeInterior){scene.background.set(activeInterior==='ryokan'?'#292921':'#152b2b');scene.fog.color.copy(scene.background);scene.fog.near=50;scene.fog.far=110;hemi.intensity=1.2;moon.intensity=.55;fill.intensity=.45;}
 skiTrails.update({x:next.x,z:next.z,yaw:fluff.rotation.y,speed:ride?.speed||0,lean:ride?.lean||0,brake:ride?.brake,gear:companion.gear,active:skiing,time,dt,still:still()});sharedTree.update(next.x,next.z,time,still());reactions.update({gesture:experience.gesture,mode:ride?.mode,x:next.x,y:fluff.position.y,z:next.z,yaw:fluff.rotation.y,time,dt,still:still()});snowman.root.visible=!activeInterior;snowman.update(time,still(),next);footprints.update(time);if(walking&&!jump&&!activeInterior)footprints.walk(next.x,next.z,fluff.rotation.y,travel,time);moveMarker.update(dt,still());
 camera.updateMatrixWorld();companion.setViewDetail(projectedCharacterHeight(camera,fluff.position,innerHeight));
 if(!bubble.hidden){const remaining=Number(bubble.dataset.until)-Date.now();bubble.style.opacity=String(Math.max(0,Math.min(1,remaining/700)));if(remaining<=0)bubble.hidden=true;}screen.copy(fluff.position).add(new T.Vector3(0,companion.nameHeight??1.05,0)).project(camera);selfLabel.hidden=screen.z>1||screen.z< -1||!document.querySelector('#self-name').textContent;const ownScreen=selfLayout.fit((screen.x*.5+.5)*innerWidth,(-screen.y*.5+.5)*innerHeight-6,innerWidth,innerHeight);selfLabel.style.transform=`translate(${ownScreen.x}px,${ownScreen.y}px) translate(-50%,-100%)`;const selfBounds=selfLabel.hidden?null:ownScreen.bounds;visitors.update(dt,time,camera,selfBounds);
 if(now>=nextProximityCheck){experience.proximity(next.x,next.z);nextProximityCheck=now+100;}const hint=experience.anchor,prompt=document.querySelector('#place-card');if(hint&&!prompt.hidden){screen.set(hint.x,hint.y,hint.z).project(camera);const avoid=selfBounds;const layout=placePrompt({x:(screen.x*.5+.5)*innerWidth,y:(-screen.y*.5+.5)*innerHeight,width:prompt.offsetWidth,height:prompt.offsetHeight,viewportWidth:innerWidth,viewportHeight:innerHeight,avoid});prompt.style.left=layout.x+'px';prompt.style.top=layout.y+'px';prompt.style.visibility=screen.z>1||screen.z< -1?'hidden':'visible';}
 const close=experience.active?null:world.markers.reduce((best,r)=>{const d=Math.hypot(next.x-r.door.x,next.z-r.door.z);return d<2.8&&(!best||d<best.d)?{r,d}:best;},null);nearby=close?.r||null;const eligible=gate.update(nearby?.id||null,now);if(eligible!==shown){shown=eligible;window.showParkDiscovery?.(eligible?{...nearby,cat:nearby.id}:null);}
 if(nearby){screen.set(nearby.door.x,2.2,nearby.door.z).project(camera);const card=document.querySelector('#discovery-card');card.style.setProperty('--anchor-x',T.MathUtils.clamp((screen.x*.5+.5)*innerWidth,165,innerWidth-165)+'px');card.style.setProperty('--anchor-y',T.MathUtils.clamp((-screen.y*.5+.5)*innerHeight-45,135,innerHeight-150)+'px');}
 if(now>=nextRegionCheck){nextRegionCheck=now+1000;const door=world.winter.destinations.find(p=>p.id==='sauna'),near=door&&Math.hypot(next.x-door.x,next.z-door.z)<38;interiors.maintain(now,near);if(near&&!interiors.rooms.ryokan&&!interiorPrefetch){const prepare=()=>{interiorPrefetch=null;interiors.ensure('ryokan');};interiorPrefetch=window.requestIdleCallback?window.requestIdleCallback(prepare,{timeout:1500}):setTimeout(prepare,0);}}
 const currentIsland=islandAt(next.x,next.z)?.id;if(currentIsland&&region!==currentIsland){region=currentIsland;window.dispatchEvent(new CustomEvent('lab:region',{detail:region}));}
 fireworks.setShow(window.labFireworks);fireworks.update(serverNow(),{still:still(),reduceFlash:document.body.classList.contains('reduce-flash'),interior:!!activeInterior,listener:camera.position,pixelRatio:renderer.getPixelRatio()});
 fantasy.update({time,dt,still:still(),reduceFlash:document.body.classList.contains('reduce-flash'),camera,peers:visitors.effectStates(),player:{...window.labPlayerState,id:'self',speed:window.labPlayerState.speed||Math.hypot(velocity.x,velocity.y),jump,accessory:window.labAppearance?.accessory,emote:experience.gesture}});
 localLights.update(dt,camera,target);shadowElapsed+=dt;if(shadowElapsed>=renderBudget.settings.shadowInterval){renderer.shadowMap.needsUpdate=true;shadowElapsed=0;}renderer.info.reset?.();
 if(glowPass)glowPass.render(scene,camera);else renderer.render(scene,camera);backgroundDirty=false;window.labLoading?.complete('frame',canvas);const measurement=frameMetrics.end(wasPaused?0:raw,now);if(measurement)window.labPerformanceResult=measurement;if(!wasPaused&&frame>10&&renderBudget.sample(raw,now))applyRenderBudget();wasPaused=false;
 }
 if(window.labPreviewVisible)ensurePortrait();
 if(window.labPreviewVisible&&portraitRenderer){const c=document.querySelector('#fluff-preview');if(portraitWidth!==c.clientWidth||portraitHeight!==c.clientHeight){portraitWidth=c.clientWidth;portraitHeight=c.clientHeight;portraitRenderer.setSize(Math.max(1,portraitWidth),Math.max(1,portraitHeight),false);portraitCamera.aspect=Math.max(1,portraitWidth)/Math.max(1,portraitHeight);portraitCamera.updateProjectionMatrix();}const orbit=portraitOrbit.update(dt,still());portrait.pose({time:now/1000,still:still()});portrait.group.rotation.set(orbit.pitch,orbit.angle,0);const displayHeight=portrait.displayHeight??portrait.nameHeight,center=(displayHeight-.85)/2;portraitCamera.position.set(0,center,Math.max(3.8,Math.max((displayHeight+.95)/2,(portrait.gear==='none'?.93:1.3)/portraitCamera.aspect)/Math.tan(16*Math.PI/180)*1.15));portraitCamera.lookAt(0,center,0);portraitRenderer.render(portraitScene,portraitCamera);}

}
function resize(){const w=innerWidth,h=innerHeight;renderBudget.viewport(devicePixelRatio,compactRenderer());applyRenderBudget();camera.aspect=w/h;camera.updateProjectionMatrix();cameraControl.resizeTree(fluff.position,dockFraction());}
resize();
// Compile available programs while the lightweight loading animation is still visible.
if(glowPass)await glowPass.prepare(scene,camera);else await renderer.compileAsync?.(scene,camera);
window.addEventListener('resize',resize);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();window.labLoading?.error('3D 화면을 사용할 수 없습니다.');status.textContent='3D 화면 연결이 끊겼습니다. 학습은 계속할 수 있어요. 새로고침하면 화면을 다시 엽니다.';document.body.classList.add('no-webgl');});status.textContent='WASD 또는 터치로 이동합니다. M으로 지도를 열 수 있어요.';document.body.classList.add('world-ready');animationFrame=requestAnimationFrame(animate);
window.addEventListener('pagehide',event=>{if(event.persisted)return;cancelAnimationFrame(animationFrame);if(interiorPrefetch){if(window.cancelIdleCallback)window.cancelIdleCallback(interiorPrefetch);else clearTimeout(interiorPrefetch);}navigation.dispose();selfLayout.dispose();frameMetrics.dispose();touchControls.dispose?.();mouseLook.dispose();treeResize?.disconnect();visitors.dispose?.();sharedTree.dispose?.();cameraClearance.reset();localLights.dispose();interiors.dispose();glowPass?.dispose();fireworks.dispose();fireworkNotice.dispose();roomLoader.dispose();companion.dispose();portrait?.dispose();disposeOwnedScene(scene);if(portraitScene)disposeOwnedScene(portraitScene);portraitRenderer?.dispose();renderer.dispose();},{once:false});
}
