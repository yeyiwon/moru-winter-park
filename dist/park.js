import {serverNow} from './server-clock.js';
import {createLuminousLoading} from './luminous-loading.js';
import {createWinterFireworks} from './winter-fireworks.js';
import {onsenEntrances} from './onsen-layout.js';
import {createLightingThemeManager} from './lighting-theme.js';
import {mountMuseumPuzzle} from './museum-puzzle.js';
import './world-settings.js';
import {interiorDoors,museumGalleries} from './district-layout.js';
import {createCameraTransition,cameraDefaults,createCameraPolicy,smoothCameraAngle,followCameraHeight,cameraSubjectFocus,cameraOrbitPosition,cameraOrbitFocus,constrainCameraFocusToRoom,constrainCameraToRoom,constrainCameraToTerrain,clearSkiCameraTerrain} from './camera-policy.js';
import {createNavigationClient} from './navigation-client.js';
import {createFrameMetrics} from './frame-metrics.js';
import {disposeOwnedScene} from './scene-resources.js';
import {createSimulationClock,shouldPauseSimulation} from './simulation-clock.js';
import {createPlayerState} from './player-state.js';
import {createLocalLights} from './local-lights.js';
import {createRenderBudget,projectedCharacterHeight} from './render-budget.js';
import {treeLayout,treeOrnamentPoint} from './tree-layout.js';
import {alpineShift} from './resort-layout.js';
import {createCameraClearance} from './camera-clearance.js';
import {createGlowPass} from './glow-pass.js';
import {createFantasyVFX} from './fantasy-vfx.js';
import {buildInteriors} from './interior-world.js';
import {interiorRooms,interiorAt,interiorInteractions} from './interior-layout.js';
import {surfaceAt} from './audio-world.js';
import {createTouchControls,worldInputBlocked,isTextInput} from './game-input.js';
import {createActivityReactions} from './activity-reactions.js';
import {createPlazaSnowman} from './plaza-snowman.js';
import {createMoveMarker} from './move-marker.js';
import {createPreviewOrbit} from './preview-orbit.js';
import {createLabelLayout} from './world-labels.js';
import {createSkiTrails} from './ski-trails.js';
import {createOrnamentPreviews} from './ornament-preview.js';
import {createSharedTree} from './shared-tree.js';
import {createFootprints} from './footprints.js';
import {createWinterSky} from './winter-sky.js';
import {createWinterExperience} from './winter-experience.js';
import {pickSharedSeat} from './ride-seats.js';
import {nearestCameraSurface} from './camera-raycast.js';
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
const scene=new T.Scene();scene.background=new T.Color('#34304b');scene.fog=new T.Fog('#8b9aaa',110,330);const camera=new T.PerspectiveCamera(cameraDefaults.fov,innerWidth/innerHeight,.1,9000);
const hemi=new T.HemisphereLight('#fff1e8','#697d74',1.5);scene.add(hemi);const moon=new T.DirectionalLight('#f4e7ff',2.1);moon.position.set(-13,25,12);moon.castShadow=true;moon.shadow.mapSize.set(compactRenderer()?1024:2048,compactRenderer()?1024:2048);Object.assign(moon.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:1,far:210});moon.shadow.normalBias=.04;moon.shadow.bias=-.0002;scene.add(moon,moon.target);const fill=new T.DirectionalLight('#ffe6c8',.8);fill.position.set(15,5,20);scene.add(fill);
const world=await buildWorldAsync(scene),lightingTheme=createLightingThemeManager(scene);window.labLoading?.complete('world');world.winter.destinations.push(...[{id:'view-park',name:'놀이공원 전망',x:-34,z:26,kind:'photo',view:{distance:14,yaw:-1.0,pitch:.17}},{id:'view-mountain',name:'설산 전망',x:-15,z:-146+alpineShift,kind:'photo',view:{distance:14,yaw:.2,pitch:.1}},{id:'view-tree',name:'트리 전망',x:treeLayout.x-14,z:treeLayout.z+21,kind:'photo',view:{distance:16,yaw:-.55,pitch:.06}}]);

world.experiment({kind:'bridge',key:true,lantern:false});const companion=createCompanion(),fluff=companion.group;fluff.position.set(0,.95,24);fluff.rotation.y=-.15;scene.add(fluff);
const winterSky=createWinterSky(scene,hemi,moon,fill,world),visitors=createVisitors(scene,{rideChair:world.winter.rideChair,occluders:()=>activeInterior?interiors.occluders:world.occluders});
const exteriorVisibility=new Map();const exteriorNodes=scene.children.filter(o=>![hemi,moon,moon.target,fill,fluff].includes(o));const interiors=buildInteriors(scene,{lazy:true,onLoad:root=>localLights.register(root),onRelease:root=>{cameraClearance.reset();localLights.unregister(root);}});window.labLoading?.complete('interiors');let activeInterior=null,transitioning=false,returnPosition=null;const roomFade=document.createElement('div');roomFade.id='room-transition';roomFade.setAttribute('aria-hidden','true');roomFade.setAttribute('role','status');document.body.append(roomFade);const roomLoader=createLuminousLoading(roomFade);window.labInterior=null;
mountMuseumPuzzle();
const experience=createWinterExperience(world.winter,companion,(id,show=true)=>window.travelToPlace(id,show));window.labWinter=world.winter;window.dispatchEvent(new Event('lab:winter-ready'));
const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;const gc=glowCanvas.getContext('2d'),gradient=gc.createRadialGradient(32,32,3,32,32,32);gradient.addColorStop(0,'#00000088');gradient.addColorStop(1,'#00000000');gc.fillStyle=gradient;gc.fillRect(0,0,64,64);
const shadow=new T.Mesh(new T.PlaneGeometry(2.2,1.8),new T.MeshBasicMaterial({map:new T.CanvasTexture(glowCanvas),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.105;scene.add(shadow);
// The resolved app preference honors an explicit full-motion choice on every OS.
let still=()=>document.body.classList.contains('still'),paused=()=>transitioning||worldInputBlocked();
const cameraPolicy=createCameraPolicy(),cameraTransition=createCameraTransition();
let target=new T.Vector3(fluff.position.x,fluff.position.y+cameraDefaults.focusHeight,fluff.position.z),yaw=cameraDefaults.yaw,pitch=cameraDefaults.pitch,distance=cameraDefaults.distance,route=[],destination=null,phase=0,velocity=new T.Vector2(),jump=0,jumpVelocity=0,land=0,time=0,nearby=null,regionTimer,region='';
const keys=new Set(),directions={KeyW:[0,-1],ArrowUp:[0,-1],KeyS:[0,1],ArrowDown:[0,1],KeyA:[-1,0],ArrowLeft:[-1,0],KeyD:[1,0],ArrowRight:[1,0]},joy=new T.Vector2(),gate=createDiscoveryGate(750);let shown=null;
const navigation=createNavigationClient(findPath),physics=createSimulationClock(),playerState=createPlayerState();let simulationView=null;
let running=false;function clear(){window.labAudio?.stopFootsteps?.();navigation.cancel();physics.reset();simulationView=null;playerState.reset();running=false;keys.clear();joy.set(0,0);route=[];destination=null;velocity.set(0,0);}
document.addEventListener('focusin',event=>{if(isTextInput(event.target))clear();});window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);window.addEventListener('lab:open',()=>{clear();window.dismissParkDiscovery();});window.addEventListener('lab:pause',clear);window.addEventListener('lab:close',clear);
function startJump(){if(!paused()&&experience.rides.mode==='ski'){window.dispatchEvent(new Event('lab:ski-jump'));window.labSound?.('jump');return;}if(!paused()&&!experience.active&&playerState.canJump()&&jump===0&&jumpVelocity===0){jumpVelocity=4.6;window.labSound?.('jump');}}
window.addEventListener('keydown',e=>{if(paused()||e.metaKey||e.ctrlKey||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||e.target.isContentEditable)return;if(e.code==='ShiftLeft'||e.code==='ShiftRight')running=true;if(directions[e.code]){e.preventDefault();keys.add(e.code);route=[];navigation.cancel();}if(e.code==='Space'&&!e.target.closest?.('button,a,summary,[role=button]')){e.preventDefault();startJump();}});window.addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='ShiftLeft'||e.code==='ShiftRight')running=false;});
const joystick=document.querySelector('#joystick');
joystick.querySelectorAll('button').forEach(b=>b.onclick=e=>{if(e.detail)return;const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[b.dataset.move];const v=moveVector(...d,yaw);moveTo(fluff.position.x+v.x*1.5,fluff.position.z+v.z*1.5);});
const plane=new T.Plane(new T.Vector3(0,1,0),-.15),point=new T.Vector3(),ray=new T.Raycaster();let pointer=null,lastX=0,lastY=0,dragged=0;
function tapSeat(e){
 if(paused()||experience.active&&!['bench','dining'].includes(window.labRideReservation?.kind))return false;
 const bounds=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-bounds.left)/bounds.width*2-1,-(e.clientY-bounds.top)/bounds.height*2+1),camera);
 const chosen=pickSharedSeat(ray.ray,fluff.position,activeInterior||'outdoors');if(!chosen)return false;
 // Exact chair hit planes never bypass a wall. The existing triangle BVH avoids
 // a second renderer or per-frame picking pass; work happens only on this tap.
 ray.far=chosen.distance+.1;let blocked=false;
 for(const object of activeInterior?interiors.occluders:world.occluders){let visible=true;for(let p=object;p;p=p.parent)if(!p.visible){visible=false;break;}if(!visible)continue;const materials=Array.isArray(object.material)?object.material:[object.material];if(materials.every(m=>m.isShaderMaterial||m.opacity<.1))continue;const hit=nearestCameraSurface(object,ray);if(hit&&hit.distance<chosen.distance-.9){blocked=true;break;}}
 ray.far=Infinity;if(blocked)return false;clear();void experience.selectSeat(chosen.placeId,chosen.seat);return true;
}
function tapWorld(e){if(tapSeat(e))return;if(activeInterior&&!paused()){const r=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const floor=new T.Plane(new T.Vector3(0,1,0),-surfaceHeight(fluff.position.x,fluff.position.z));if(ray.ray.intersectPlane(floor,point))moveTo(point.x,point.z);return;}if(!paused()){const r=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);if(Math.hypot(fluff.position.x+6.5,fluff.position.z-3)<5&&ray.intersectObject(snowman.root,true).length){snowman.interact(time);pointer=null;return;}if(sharedTree.readAt(ray)){pointer=null;return;}const fixtureHit=ray.intersectObjects(world.interactive.concat(world.winter.treeTargets),false)[0];if(fixtureHit){if(fixtureHit.object.userData.winter){if(fixtureHit.object.userData.action==='tree'&&window.treeDecorationActive?.()){window.placeTreeDecoration(fixtureHit.point);pointer=null;return;}const hit=fixtureHit.object.userData;const bath=hit.action==='onsen'?onsenEntrances[hit.activity||'bath']:null;const p=bath?{id:'onsen',...bath.access}:world.winter.destinations.find(p=>p.id===hit.action);if(p&&(p.id==='tree'?Math.hypot(fluff.position.x-treeLayout.x,fluff.position.z-treeLayout.z)<30:Math.hypot(p.x-fluff.position.x,p.z-fluff.position.z)<5))experience.show(p.id,hit.activity);else if(p)moveTo(p.x,p.z);}else if(fixtureHit.object.userData.action==='sound')window.openSoundExperiment?.();else window.openWorldExperiment?.();}else if(ray.intersectObject(fluff,true).length){if(!experience.useHeldItem())startJump();}else{const fixture=world.markers.find(m=>ray.intersectObject(m.root,true).length);if(fixture)moveTo(fixture.door.x,fixture.door.z);else if(ray.ray.intersectPlane(plane,point))moveTo(point.x,point.z);}}pointer=null;};
const touchControls=createTouchControls({canvas,joystick,jumpButton:document.querySelector('#jump-button'),brakeButton:document.querySelector('#brake-button'),runButton:document.querySelector('#run-button'),locked:paused,onMove:(x,y)=>{joy.set(x,y);route=[];navigation.cancel();},onOrbit:orbitCamera,onZoom:zoomCamera,onTap:tapWorld,onJump:startJump});
function orbitCamera(dx,dy){interruptTreeCamera();cameraPolicy.orbit(dx,dy,yaw);}
function zoomCamera(amount){interruptTreeCamera();cameraPolicy.zoom(amount,distance);}
window.resetWinterCamera=()=>{cameraPolicy.reset();endTreeFrame();backgroundDirty=true;};
window.addEventListener('lab:camera-reset',()=>window.resetWinterCamera());
window.addEventListener('keydown',event=>{
 if(event.code!=='KeyR'||event.repeat||event.isComposing||event.metaKey||event.ctrlKey||event.altKey||event.defaultPrevented||paused()||document.querySelector('dialog[open]:not([data-nonmodal])')||event.target.closest?.('input,textarea,select,[contenteditable=true]'))return;
 event.preventDefault();window.resetWinterCamera();
});
window.getWinterCameraState=()=>({...cameraPolicy.snapshot(),rendered:{yaw,pitch,distance,fov:camera.fov},focus:{x:target.x,y:target.y,z:target.z},eye:{x:camera.position.x,y:camera.position.y,z:camera.position.z},aim:{x:orbitFocus.x,y:orbitFocus.y,z:orbitFocus.z}});
const moveMarker=createMoveMarker(scene);
function ripple(x,z){moveMarker.show(x,surfaceHeight(x,z),z);}
async function moveTo(x,z){if(experience.active&&!experience.wake())return;route=[];destination=null;velocity.set(0,0);const next=await navigation.request({x:fluff.position.x,z:fluff.position.z},{x,z});if(!next)return;if(!next.length){status.textContent='그곳에는 길이 없습니다. 산책로를 눌러 주세요.';return;}route=next;destination=route.at(-1);ripple(destination.x,destination.z);window.labSound?.('move');}
window.travelToIsland=id=>{const island=islands.find(r=>r.id===id);if(!island||island.hidden)return;experience.cancel();setInterior(null);placePlayer(island.spawn,Math.atan2(island.x-island.spawn.x,island.z-island.spawn.z));window.dismissParkDiscovery();ripple(island.spawn.x,island.spawn.z);window.labSound?.('travel');document.body.classList.add('has-walked');};
function publishPlayerPose(){window.labPlayerState={x:fluff.position.x,y:fluff.position.y,z:fluff.position.z,yaw:fluff.rotation.y,mode:'',speed:0};}
function setInterior(id){cameraClearance.reset();cameraPolicy.setContext(id);if(id&&!activeInterior)for(const o of exteriorNodes)exteriorVisibility.set(o,o.visible);const leaving=activeInterior&&!id;activeInterior=id;window.labInterior=id;interiors.setActive(id);for(const o of exteriorNodes){if(id)o.visible=false;else if(leaving)o.visible=exteriorVisibility.get(o)??true;}document.body.classList.toggle('inside-room',!!id);}
function placePlayer(p,yawValue){endTreeFrame(false);cameraTransition.cancel();cameraClearance.reset();clear();jump=jumpVelocity=0;fluff.position.set(p.x,.86+surfaceHeight(p.x,p.z),p.z);fluff.rotation.y=yawValue;publishPlayerPose();cameraPolicy.setMode('',yaw);snapCameraToPlayer();}
async function transitionRoom(change,name='겨울 공원'){if(transitioning)return;transitioning=true;clear();experience.cancel();roomFade.setAttribute('aria-label',name+' 준비 중');roomLoader.start();roomFade.setAttribute('aria-hidden','false');roomFade.classList.add('active');try{
 // Give the overlay a paint before building an uncached room; no invented progress/delay.
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));await change();
 // Hidden show shaders are prepared with the world, avoiding a first-burst compile stall.
const showRoots=[fireworks.root,fireworks.smoke,fireworks.castle.root];showRoots.forEach(o=>o.visible=true);
try{if(glowPass)await glowPass.prepare(scene,camera);else await renderer.compileAsync?.(scene,camera);}finally{showRoots.forEach(o=>o.visible=false);}transitioning=false;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 }catch(e){status.textContent=e.message;window.labToast?.(e.message);}finally{roomLoader.stop();roomFade.classList.remove('active');roomFade.setAttribute('aria-hidden','true');transitioning=false;window.dispatchEvent(new Event('lab:close'));}}
window.enterInterior=id=>{const room=interiorRooms[id],door=interiorDoors[id];if(!room||!door||activeInterior)return;if(window.worldContentEnabled?.(id)===false){status.textContent='지금은 점검 중입니다.';return;}if(Math.hypot(fluff.position.x-door.x,fluff.position.z-door.z)>6){window.labToast?.('입구에 가까이 와 주세요.');return;}return transitionRoom(async()=>{interiors.ensure(id);const approved=await window.changeWinterRegion(id);returnPosition={x:door.x,z:door.z};window.labInteriorExit=returnPosition;setInterior(id);placePlayer(approved.position,approved.yaw);},room.name);};
// Exhibit feedback belongs to the object; opening a card never takes over the user's camera.
window.addEventListener('lab:exhibit-focus',e=>{if(activeInterior==='museum')interiors.react(e.detail,time);});
window.addEventListener('lab:exhibit-correct',e=>{interiors.react(e.detail,time);const g=museumGalleries.find(g=>g.id===e.detail);if(g&&!document.body.classList.contains('reduce-flash')&&!still())fantasy.burst({x:600+g.x,y:3.5,z:g.z,kind:'correct',color:g.color,strength:.7});});
window.addEventListener('lab:puzzle-turn',e=>interiors.puzzle(e.detail));
window.exitInterior=()=>{if(!activeInterior)return;return transitionRoom(async()=>{const approved=await window.changeWinterRegion('outdoors');setInterior(null);placePlayer(approved.position,approved.yaw);});};

window.travelToPlace=(id,show=true)=>{const p=world.winter.destinations.find(p=>p.id===id);if(!p)return;experience.cancel();setInterior(null);if(p.region==='ski'&&p.view)cameraPolicy.adopt(p.view);placePlayer(p,Math.PI);document.body.classList.add('has-walked');window.dismissParkDiscovery();if(show)experience.show(id);};
window.dismissParkDiscovery=()=>{gate.dismiss();shown=null;window.showParkDiscovery?.(null);};window.parkCelebrate=()=>{land=.5;window.labSound?.('correct');};window.parkNearbyCategory=()=>nearby?.id;
window.addEventListener('lab:simulation',e=>world.experiment(e.detail));window.addEventListener('lab:content-ready',()=>{shown=null;gate.update(null,performance.now());});
let lightColor=new T.Color('#c5c8ea'),brightness=1;function appearance(o){companion.customize(o);if(!window.labDraftAppearance)portrait?.customize(o);lightColor.set(o.light||'#c5c8ea');brightness=(o.brightness||100)/100;lightingTheme.set(lightColor,brightness);}window.addEventListener('lab:appearance',e=>appearance(e.detail));
let portrait=null,portraitRenderer,portraitScene,portraitCamera,portraitOrbit,portraitWidth=0,portraitHeight=0;
function ensurePortrait(){if(portraitRenderer)return;try{const pc=document.querySelector('#fluff-preview');portraitRenderer=new T.WebGLRenderer({canvas:pc,antialias:true,alpha:true});portraitRenderer.setPixelRatio(Math.min(devicePixelRatio,1.5));portraitRenderer.outputColorSpace=T.SRGBColorSpace;portraitRenderer.toneMapping=T.ACESFilmicToneMapping;portraitScene=new T.Scene();portraitScene.background=null;portraitCamera=new T.PerspectiveCamera(32,1,.1,10);portraitCamera.position.set(0,.05,3.8);portraitCamera.lookAt(0,0,0);portrait=createCompanion();portraitScene.add(portrait.group);portraitScene.add(new T.HemisphereLight('#fff5eb','#6b7285',2));const key=new T.DirectionalLight('#fff0dd',2.5);key.position.set(-3,4,4);portraitScene.add(key);portraitOrbit=createPreviewOrbit(pc);}catch{document.querySelector('#fluff-preview').hidden=true;}portrait?.customize(window.labDraftAppearance||window.labAppearance||{});}

window.addEventListener('lab:preview-appearance',e=>portrait?.customize(e.detail));
window.addEventListener('lab:preview-front',()=>portraitOrbit?.reset());
appearance(window.labAppearance||{});
let prev=performance.now();const frameMetrics=createFrameMetrics(renderer);window.labPerformance=frameMetrics;
const fireworks=createWinterFireworks(scene,{light:fill}),fantasy=createFantasyVFX(scene),glowPass=renderer.getDrawingBufferSize?createGlowPass(renderer):null;
window.addEventListener('lab:vfx',e=>{if(document.body.classList.contains('reduce-flash')&&['correct','wrong'].includes(e.detail?.kind))return;const p=window.labPlayerState;if(p)fantasy.burst({...p,...e.detail});});
const qualityControl=document.querySelector('#vfx-quality');let renderMode='auto';try{renderMode=localStorage.getItem('winter-render-mode')||(localStorage.getItem('winter-vfx-quality')==='low'?'low':'auto');}catch{}
const renderBudget=createRenderBudget({pixelRatio:devicePixelRatio,mobile:compactRenderer(),mode:renderMode}),localLights=createLocalLights(scene,{limit:compactRenderer()?4:6});let shadowElapsed=Infinity,backgroundDirty=true;
function applyRenderBudget(){backgroundDirty=true;const settings=renderBudget.settings;document.documentElement.dataset.renderQuality=settings.quality;if(moon.shadow.mapSize.x!==settings.shadowSize){moon.shadow.map?.dispose();moon.shadow.map=null;moon.shadow.mapSize.set(settings.shadowSize,settings.shadowSize);}fantasy.setQuality(settings.quality);fireworks.setQuality(settings.quality);glowPass?.setQuality(settings.quality,{samples:settings.samples});interiors.setQuality(settings.quality);world.winter.setQuality?.(settings.quality);world.setQuality?.(settings.quality);winterSky.setQuality?.(settings.quality);renderer.setPixelRatio(settings.pixelRatio);renderer.setSize(innerWidth,innerHeight,false);shadowElapsed=Infinity;if(qualityControl)qualityControl.value=renderBudget.mode;try{localStorage.setItem('winter-render-mode',renderBudget.mode);localStorage.setItem('winter-vfx-quality',settings.quality);}catch{}}
renderBudget.setMode(renderMode);applyRenderBudget();qualityControl?.addEventListener('change',()=>{renderBudget.setMode(qualityControl.value);applyRenderBudget();});
const reactions=createActivityReactions(scene),snowman=createPlazaSnowman(scene);window.addEventListener('lab:snowman',()=>{if(snowman.interact(time))fantasy.burst({kind:'joy',x:snowman.root.position.x,y:1.6,z:snowman.root.position.z,color:'#ffe5b4',strength:.6});});
const skiTrails=createSkiTrails(scene),footprints=createFootprints(scene),sharedTree=createSharedTree(scene,fantasy),ornamentPreviews=createOrnamentPreviews(renderer,sharedTree.ornaments);localLights.register(scene);
window.addEventListener('lab:interaction-end',()=>{touchControls.setMode('');});
window.addEventListener('lab:stand',e=>{if(e.detail?.position){const p=e.detail.position;fluff.position.set(p.x,.86+surfaceHeight(p.x,p.z),p.z);}if(!canStandAt(fluff.position.x,fluff.position.z)){let found=false;for(let r=.4;r<=3&&!found;r+=.3)for(let a=0;a<Math.PI*2;a+=Math.PI/8){const x=fluff.position.x+Math.sin(a)*r,z=fluff.position.z+Math.cos(a)*r;if(canStandAt(x,z)){fluff.position.x=x;fluff.position.z=z;found=true;break;}}}publishPlayerPose();});
const selfLabel=document.querySelector('#self-label'),bubble=document.querySelector('#self-bubble'),selfLayout=createLabelLayout(selfLabel);
const treeCameraOccluders=world.occluders.filter(o=>!o.userData.treeFraming);
const cameraClearance=createCameraClearance(),screen=new T.Vector3(),soundForward=new T.Vector3(),cameraAim=new T.Vector3(),orbitFocus=new T.Vector3();let nextRegionCheck=0,nextProximityCheck=0,interiorPrefetch=null;let frame=0,wasPaused=false,cameraRideMode='';
function positionCamera(mode='',dt=0){
 if(activeInterior)constrainCameraFocusToRoom(target,interiorRooms[activeInterior]);
 cameraOrbitFocus(target,{pitch,distance},orbitFocus);
 if(activeInterior)constrainCameraFocusToRoom(orbitFocus,interiorRooms[activeInterior]);
 cameraOrbitPosition(orbitFocus,{yaw,pitch,distance},camera.position);
 if(activeInterior)constrainCameraToRoom(orbitFocus,camera.position,interiorRooms[activeInterior]);
 else if(mode==='ski'||mode==='summit'||!mode&&target.z< -300)clearSkiCameraTerrain(orbitFocus,camera.position,surfaceHeight);
 else constrainCameraToTerrain(orbitFocus,camera.position,surfaceHeight,8);
 scene.updateMatrixWorld();
 cameraClearance.update(camera,orbitFocus,activeInterior?interiors.occluders:wishShot||cameraTransition.active?treeCameraOccluders:world.occluders.concat(world.winter.rideOccluders||[]),dt,{mode:activeInterior||(wishShot||cameraTransition.active?'tree':mode)||'walk',maxRecoverySpeed:wishShot||cameraTransition.active?24:3.5,minDistance:mode==='ferris'?4:['carousel','lift'].includes(mode)?4.2:2.5});
 if(activeInterior)interiors.setCamera(camera.position);
 camera.up.set(0,1,0);camera.lookAt(orbitFocus);
}
function snapCameraToPlayer(){
 cameraSubjectFocus(fluff.position,{groundY:.86+surfaceHeight(fluff.position.x,fluff.position.z)},target);
 const view=cameraPolicy.view({mode:'',renderedYaw:yaw});yaw=view.yaw;pitch=view.pitch;distance=view.distance;positionCamera('',0);
}
function simulatePlayer(dt){
 let ix=joy.x,iz=joy.y;for(const k of keys){ix+=directions[k]?.[0]||0;iz+=directions[k]?.[1]||0;}let input=moveVector(ix,iz,yaw),speed=(running||touchControls.sprinting)?8:4.3;if(!ix&&!iz&&route.length){let p=route[0],d=Math.hypot(p.x-fluff.position.x,p.z-fluff.position.z);if(d<.18){route.shift();p=route[0];}if(p){d=Math.hypot(p.x-fluff.position.x,p.z-fluff.position.z);input={x:(p.x-fluff.position.x)/d,z:(p.z-fluff.position.z)/d};speed=Math.min(4.3,d*7);}else{destination=null;velocity.set(0,0);}}
 velocity.x+=(input.x*speed-velocity.x)*(1-Math.exp(-dt*13));velocity.y+=(input.z*speed-velocity.y)*(1-Math.exp(-dt*13));const ride=experience.update(dt,{steer:ix,throttle:-iz,handbrake:touchControls.braking,push:iz<-.25,brake:iz>.25||touchControls.braking,x:input.x,z:input.z,running:running||touchControls.sprinting}),before={x:fluff.position.x,z:fluff.position.z},next=ride||moveOnGround(before,{x:velocity.x,z:velocity.y},dt),travel=Math.hypot(next.x-before.x,next.z-before.z),walking=travel>.001&&(!ride||ride.mode==='summit'||ride.walking);fluff.position.x=next.x;fluff.position.z=next.z;
 if(walking){phase+=travel*5.4;const facing=Math.atan2(velocity.x,velocity.y),diff=Math.atan2(Math.sin(facing-fluff.rotation.y),Math.cos(facing-fluff.rotation.y));fluff.rotation.y+=diff*(1-Math.exp(-dt*10));document.body.classList.add('has-walked');if(!jump&&!jumpVelocity&&Math.floor(phase/Math.PI)!==Math.floor((phase-travel*5.4)/Math.PI))window.labSound?.('step',{surface:surfaceAt(next.x,next.z,ride?.mode),running:running||touchControls.sprinting});}
 if(!walking||jump||jumpVelocity)window.labAudio?.stopFootsteps?.();
 if(!ride&&experience.facing!==null){const angle=experience.facing-fluff.rotation.y;fluff.rotation.y+=Math.atan2(Math.sin(angle),Math.cos(angle))*(1-Math.exp(-dt*8));}
 if(jumpVelocity||jump){jumpVelocity-=13*dt;jump+=jumpVelocity*dt;if(jump<0){jump=0;jumpVelocity=0;land=1;window.labSound?.('jump-land',{surface:surfaceAt(next.x,next.z,ride?.mode)});}}
 land=Math.max(0,land-dt*4.2);fluff.position.y=ride?ride.y:.86+surfaceHeight(next.x,next.z)+jump;
 if(cameraRideMode&&!ride?.mode)velocity.set(0,0);if(ride)fluff.rotation.y=ride.yaw;
 cameraRideMode=ride?.mode||'';cameraPolicy.setMode(cameraRideMode,yaw);
 touchControls.setMode(cameraRideMode==='bath'&&!activeInterior?'wade':cameraRideMode);window.labPlayerState={x:fluff.position.x,y:fluff.position.y,z:fluff.position.z,yaw:fluff.rotation.y,mode:ride?.mode||'',lean:ride?.lean||0,tilt:ride?.tilt||0,brake:!!ride?.brake,air:ride?.air||0,speed:ride?.speed||travel/Math.max(dt,.001),gesture:experience.gesture,heldItem:experience.heldItem,balloonTone:experience.balloonTone,balloonStyle:experience.balloonStyle,roast:experience.roast};playerState.update({mode:ride?.mode,jump,moving:walking,running:running||touchControls.sprinting,gesture:experience.focusGesture,room:activeInterior});if(ride&&ride.mode!=='summit'){jump=jumpVelocity=0;}const gaze=destination?destination.x-next.x:velocity.x;
 return{ride,next,walking,travel,gaze};
}
window.addEventListener('lab:onsen-start',()=>{clear();jump=jumpVelocity=0;});
window.addEventListener('lab:onsen-end',clear);
let wishShot=null,treeCameraSession=null;
function frameTree(){
 if(activeInterior||treeCameraSession)return;
 treeCameraSession=true;
 if(still())return;
 cameraTransition.begin(target,{yaw,pitch,distance});
 // Fit the real canopy above the compact decoration dock, keeping the player's
 // viewing side. The same orbit control remains available throughout editing.
 wishShot={aim:new T.Vector3(treeLayout.x,15.2,treeLayout.z)};
 const aspect=innerWidth/innerHeight,halfFov=Math.tan(cameraDefaults.fov*Math.PI/360);
 cameraPolicy.beginTree({yaw,pitch:.10,distance:Math.max(17/(halfFov*.78),10.5/(halfFov*aspect*.88))});clear();
}
function endTreeFrame(restore=true){if(!restore||still())cameraTransition.cancel();if(treeCameraSession&&restore&&!still())cameraTransition.begin(target,{yaw,pitch,distance});wishShot=null;treeCameraSession=null;cameraPolicy.endTree();}
function interruptTreeCamera(){if(!cameraTransition.active)return;if(wishShot){cameraPolicy.beginTree({yaw,pitch,distance});wishShot.aim.copy(target);}cameraTransition.cancel();}
window.addEventListener('lab:tree-open',frameTree);
window.addEventListener('lab:tree-frame',frameTree);
// Arriving ornaments leave the editing view alone; only closing the dock ends it.
window.addEventListener('lab:wish-submitted',()=>{
 if(!wishShot)return;
 cameraTransition.cancel();
 // Hold the visible distance, including collision recovery, not the wider goal.
 distance=camera.position.distanceTo(orbitFocus);
 cameraPolicy.beginTree({yaw,pitch,distance});wishShot.aim.copy(target);
});
window.addEventListener('lab:tree-closed',e=>endTreeFrame(e.detail?.restore!==false));
window.addEventListener('lab:room',()=>{endTreeFrame(false);});
window.addEventListener('lab:session-ended',()=>{experience.cancel();clear();endTreeFrame(false);});
let animationFrame;function animate(now){animationFrame=requestAnimationFrame(animate);const raw=now-prev;prev=now;if(document.hidden)return;
 // A callback queued before synchronous world construction can carry an older timestamp.
 const dt=Math.max(0,Math.min(.05,raw/1000)),exhibitActive=activeInterior==='museum'&&document.body.classList.contains('quiz-open'),isPaused=shouldPauseSimulation({blocked:worldInputBlocked(),transitioning,mode:cameraRideMode,exhibit:exhibitActive,ready:frame>0});time+=isPaused?0:dt;
 // Resizing clears the drawing buffer even while menus freeze the world.
 // Redraw the same pose once; do not resume simulation or a continuous GPU loop.
 if(isPaused&&backgroundDirty){if(glowPass)glowPass.render(scene,camera);else renderer.render(scene,camera);backgroundDirty=false;}
 ornamentPreviews.update();
 if(isPaused&&!window.labPreviewVisible){physics.reset();wasPaused=true;return;} // Reading really freezes the background render loop.
 if(!isPaused){frameMetrics.begin();if(activeInterior)interiors.update(time,still());else world.update(time,still());let travelled=0;physics.advance(dt,step=>{simulationView=simulatePlayer(step);travelled+=simulationView.travel;});if(!simulationView)simulationView=simulatePlayer(0);const {ride,next,walking,gaze}=simulationView,travel=travelled;
  // Animate the final simulated pose once per display frame, even after catch-up steps.
  companion.pose({phase,walking,time,room:activeInterior,mode:ride?.walking?'':ride?.mode,diningStartedAt:ride?.diningStartedAt,diningNow:serverNow(),lean:ride?.lean,tilt:ride?.tilt,speed:ride?.speed??window.labPlayerState.speed,brake:ride?.brake,gesture:experience.gesture,heldItem:experience.heldItem,balloonTone:experience.balloonTone,balloonStyle:experience.balloonStyle,roast:experience.roast,landing:ride?.landing??land,still:still(),look:still()?0:Math.max(-.02,Math.min(.02,gaze*.005))});shadow.visible=!['bath','sauna','lie','tea','dining'].includes(ride?.mode);shadow.position.set(next.x,surfaceHeight(next.x,next.z)+.015,next.z);shadow.scale.setScalar(1-jump*.12);shadow.material.opacity=1-jump*.3;
 const skiing=ride?.mode==='ski',heading=ride?.heading??ride?.yaw??0;
 cameraSubjectFocus(fluff.position,{groundY:.86+surfaceHeight(next.x,next.z),mode:ride?.mode,view:ride?.view,heading},cameraAim);
 if(wishShot){if(walking||ride||still())endTreeFrame();else cameraAim.copy(wishShot.aim);}
 const view={...cameraPolicy.view({mode:ride?.mode,heading,renderedYaw:yaw})},followBlend=1-Math.exp(-dt*9);
 if(cameraTransition.step(cameraAim,view,dt)){target.copy(cameraAim);yaw=view.yaw;pitch=view.pitch;distance=view.distance;}else{
 for(const axis of ['x','z']){const change=(cameraAim[axis]-target[axis])*followBlend;target[axis]+=wishShot?T.MathUtils.clamp(change,-dt*14,dt*14):change;}
 target.y=wishShot?target.y+T.MathUtils.clamp((cameraAim.y-target.y)*(1-Math.exp(-dt*4)),-dt*10,dt*10):followCameraHeight(target.y,cameraAim.y,dt,ride?.mode);
 if(!ride&&!wishShot)target.y=Math.max(target.y,surfaceHeight(target.x,target.z)+.7);
 yaw=smoothCameraAngle(yaw,view.yaw,dt,{automatic:view.automaticYaw});
 pitch+=T.MathUtils.clamp((view.pitch-pitch)*(1-Math.exp(-dt*9)),-dt*.8,dt*.8);
 distance+=T.MathUtils.clamp((view.distance-distance)*(1-Math.exp(-dt*7)),-dt*(wishShot?16:8),dt*(wishShot?16:8));
 }
 positionCamera(ride?.mode,dt);
 camera.getWorldDirection(soundForward);window.labAudio?.updateWorld({...window.labPlayerState,speed:ride?.speed||0,lean:ride?.lean,brake:ride?.brake},{x:camera.position.x,y:camera.position.y,z:camera.position.z,fx:soundForward.x,fy:soundForward.y,fz:soundForward.z});

 frame++;
 moon.position.set(target.x-40,target.y+70,target.z+40);moon.target.position.set(target.x,target.y-1.2,target.z);winterSky.update(time,still(),target,brightness,false,camera.position);lightingTheme.update(dt);const mountainAtmosphere=T.MathUtils.smoothstep(-next.z,80,400);scene.fog.near=130+770*mountainAtmosphere;scene.fog.far=500+6700*mountainAtmosphere;if(activeInterior){scene.background.set(activeInterior==='ryokan'?'#292921':'#152b2b');scene.fog.color.copy(scene.background);scene.fog.near=50;scene.fog.far=110;hemi.intensity=1.2;moon.intensity=.55;fill.intensity=.45;}
 skiTrails.update({x:next.x,z:next.z,yaw:fluff.rotation.y,speed:ride?.speed||0,lean:ride?.lean||0,brake:ride?.brake,gear:companion.gear,air:ride?.air||0,active:skiing,time,dt,still:still()});sharedTree.update(next.x,next.z,time,still());reactions.update({gesture:experience.gesture,mode:ride?.mode,x:next.x,y:fluff.position.y,z:next.z,yaw:fluff.rotation.y,time,dt,still:still()});snowman.root.visible=!activeInterior;snowman.update(time,still(),next);footprints.update(time);if(walking&&!jump&&!activeInterior)footprints.walk(next.x,next.z,fluff.rotation.y,travel,time);moveMarker.update(dt,still());
 camera.updateMatrixWorld();companion.setViewDetail(projectedCharacterHeight(camera,fluff.position,innerHeight));
 if(!bubble.hidden){const remaining=Number(bubble.dataset.until)-Date.now();bubble.style.opacity=String(Math.max(0,Math.min(1,remaining/700)));if(remaining<=0)bubble.hidden=true;}screen.copy(fluff.position).add(new T.Vector3(0,companion.nameHeight??1.05,0)).project(camera);selfLabel.hidden=screen.z>1||screen.z< -1||!document.querySelector('#self-name').textContent;const ownScreen=selfLayout.fit((screen.x*.5+.5)*innerWidth,(-screen.y*.5+.5)*innerHeight-6,innerWidth,innerHeight);selfLabel.style.transform=`translate(${ownScreen.x}px,${ownScreen.y}px) translate(-50%,-100%)`;const selfBounds=selfLabel.hidden?null:ownScreen.bounds;visitors.update(dt,time,camera,selfBounds);
 if(now>=nextProximityCheck){experience.proximity(next.x,next.z);nextProximityCheck=now+100;}const hint=experience.anchor,prompt=document.querySelector('#place-card');if(hint&&!prompt.hidden)prompt.style.visibility='visible';
 const close=experience.active||!prompt.hidden||window.treeDecorationActive?.()?null:world.markers.reduce((best,r)=>{const d=Math.hypot(next.x-r.door.x,next.z-r.door.z);return d<2.8&&(!best||d<best.d)?{r,d}:best;},null);nearby=close?.r||null;const eligible=gate.update(nearby?.id||null,now);if(eligible!==shown){shown=eligible;window.showParkDiscovery?.(eligible?{...nearby,cat:nearby.id}:null);}
 if(nearby){screen.set(nearby.door.x,2.2,nearby.door.z).project(camera);const card=document.querySelector('#discovery-card');card.style.setProperty('--anchor-x',T.MathUtils.clamp((screen.x*.5+.5)*innerWidth,165,innerWidth-165)+'px');card.style.setProperty('--anchor-y',T.MathUtils.clamp((-screen.y*.5+.5)*innerHeight-45,135,innerHeight-150)+'px');}
 if(now>=nextRegionCheck){nextRegionCheck=now+1000;const door=world.winter.destinations.find(p=>p.id==='sauna'),near=door&&Math.hypot(next.x-door.x,next.z-door.z)<38;interiors.maintain(now,near);if(near&&!interiors.rooms.ryokan&&!interiorPrefetch){const prepare=()=>{interiorPrefetch=null;interiors.ensure('ryokan');};interiorPrefetch=window.requestIdleCallback?window.requestIdleCallback(prepare,{timeout:1500}):setTimeout(prepare,0);}}
 const currentIsland=islandAt(next.x,next.z)?.id;if(currentIsland&&region!==currentIsland){region=currentIsland;window.dispatchEvent(new CustomEvent('lab:region',{detail:region}));}
 fireworks.setShow(window.labFireworks);fireworks.update(serverNow(),{still:still(),reduceFlash:document.body.classList.contains('reduce-flash'),interior:!!activeInterior,listener:camera.position,pixelRatio:renderer.getPixelRatio()});
 fantasy.update({time,dt,still:still(),reduceFlash:document.body.classList.contains('reduce-flash'),camera,peers:visitors.effectStates(),player:{...window.labPlayerState,id:'self',speed:window.labPlayerState.speed||Math.hypot(velocity.x,velocity.y),jump,accessory:window.labAppearance?.accessory,emote:experience.gesture}});
 localLights.update(dt,camera,target);shadowElapsed+=dt;if(shadowElapsed>=renderBudget.settings.shadowInterval){renderer.shadowMap.needsUpdate=true;shadowElapsed=0;}renderer.info.reset?.();
 if(glowPass)glowPass.render(scene,camera);else renderer.render(scene,camera);backgroundDirty=false;window.labLoading?.complete('frame',canvas);frameMetrics.end(wasPaused?0:raw,now);if(!wasPaused&&frame>10&&renderBudget.sample(raw,now))applyRenderBudget();wasPaused=false;
 }
 if(window.labPreviewVisible)ensurePortrait();
 if(window.labPreviewVisible&&portraitRenderer){const c=document.querySelector('#fluff-preview');if(portraitWidth!==c.clientWidth||portraitHeight!==c.clientHeight){portraitWidth=c.clientWidth;portraitHeight=c.clientHeight;portraitRenderer.setSize(Math.max(1,portraitWidth),Math.max(1,portraitHeight),false);portraitCamera.aspect=Math.max(1,portraitWidth)/Math.max(1,portraitHeight);portraitCamera.updateProjectionMatrix();}const orbit=portraitOrbit.update(dt,still());portrait.pose({time:now/1000,still:still()});portrait.group.rotation.set(orbit.pitch,orbit.angle,0);const displayHeight=portrait.displayHeight??portrait.nameHeight,center=(displayHeight-.85)/2;portraitCamera.position.set(0,center,Math.max(3.8,Math.max((displayHeight+.95)/2,(portrait.gear==='none'?.93:1.3)/portraitCamera.aspect)/Math.tan(16*Math.PI/180)*1.15));portraitCamera.lookAt(0,center,0);portraitRenderer.render(portraitScene,portraitCamera);}

}
function resize(){if(document.body.classList.contains('chat-typing'))return;const w=innerWidth,h=innerHeight;renderBudget.viewport(devicePixelRatio,compactRenderer());applyRenderBudget();camera.aspect=w/h;camera.fov=cameraDefaults.fov;camera.updateProjectionMatrix();}
resize();snapCameraToPlayer();
// Compile available programs while the lightweight loading animation is still visible.
// Hidden show shaders are prepared with the world, avoiding a first-burst compile stall.
const showRoots=[fireworks.root,fireworks.smoke,fireworks.castle.root];showRoots.forEach(o=>o.visible=true);
try{if(glowPass)await glowPass.prepare(scene,camera);else await renderer.compileAsync?.(scene,camera);}finally{showRoots.forEach(o=>o.visible=false);}
window.addEventListener('resize',resize);window.addEventListener('lab:viewport-restored',resize);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();window.labLoading?.error('3D 화면을 사용할 수 없습니다.');status.textContent='3D 화면 연결이 끊겼습니다. 학습은 계속할 수 있어요. 새로고침하면 화면을 다시 엽니다.';document.body.classList.add('no-webgl');});status.textContent='WASD 또는 터치로 이동하고, 화면을 잡아 돌려 둘러보세요.';document.body.classList.add('world-ready');window.labCameraReady=true;window.dispatchEvent(new Event('lab:camera-ready'));animationFrame=requestAnimationFrame(animate);
window.addEventListener('pagehide',event=>{if(event.persisted)return;window.labCameraReady=false;cancelAnimationFrame(animationFrame);if(interiorPrefetch){if(window.cancelIdleCallback)window.cancelIdleCallback(interiorPrefetch);else clearTimeout(interiorPrefetch);}navigation.dispose();selfLayout.dispose();frameMetrics.dispose();touchControls.dispose?.();visitors.dispose?.();ornamentPreviews.dispose();sharedTree.dispose?.();cameraClearance.reset();localLights.dispose();interiors.dispose();glowPass?.dispose();fireworks.dispose();roomLoader.dispose();world.winter.mountainTerrain?.dispose();companion.dispose();portrait?.dispose();disposeOwnedScene(scene);if(portraitScene)disposeOwnedScene(portraitScene);portraitRenderer?.dispose();renderer.dispose();},{once:false});
}
