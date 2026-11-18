import * as T from './vendor/three.module.js';
import {balloonColors,balloonStyles} from './balloon-design.js';

export function bubbleMaterial(instanced=false){return new T.ShaderMaterial({transparent:true,depthWrite:false,toneMapped:false,uniforms:{tint:{value:new T.Color('#e7f6ff')}},vertexShader:`varying vec3 n;varying vec3 eye;void main(){vec4 p=modelViewMatrix*${instanced?'instanceMatrix*':''}vec4(position,1.);eye=-p.xyz;n=normalize(normalMatrix*${instanced?'mat3(instanceMatrix)*':''}normal);gl_Position=projectionMatrix*p;}`,fragmentShader:'uniform vec3 tint;varying vec3 n;varying vec3 eye;void main(){vec3 normal=normalize(n);float rim=pow(1.-max(0.,dot(normal,normalize(eye))),2.3);float glint=pow(max(0.,dot(normal,normalize(vec3(-.45,.65,1.)))),48.);float oil=.5+.5*sin(normal.y*9.+normal.x*4.);vec3 color=mix(tint,mix(vec3(.58,.84,1.),vec3(1.,.63,.84),oil),.48);gl_FragColor=vec4(color+glint*.65,.02+rim*.43+glint*.65);}'});}
export function balloonStar(){const shape=new T.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.45:1;i?shape.lineTo(Math.cos(a)*r,Math.sin(a)*r):shape.moveTo(Math.cos(a)*r,Math.sin(a)*r);}shape.closePath();return new T.ExtrudeGeometry(shape,{depth:.15,bevelEnabled:true,bevelThickness:.06,bevelSize:.04,bevelSegments:2,steps:1});}

export function createHeldBalloon(parent){
 const root=new T.Group();root.name='held-reactive-balloon';root.visible=false;parent.add(root);
 const balloon=new T.Group();root.add(balloon);
 const paint=new T.MeshPhysicalMaterial({color:balloonColors[0],roughness:.23,metalness:.08,clearcoat:1});
 const sphere=new T.SphereGeometry(1,28,20),solid=new T.Mesh(sphere,paint);solid.scale.set(.34,.43,.34);balloon.add(solid);
 const shell=new T.Mesh(sphere,bubbleMaterial());shell.scale.set(.44,.48,.44);shell.name='clear-balloon-shell';shell.renderOrder=3;balloon.add(shell);
 const ornament=new T.MeshStandardMaterial({color:balloonColors[0],emissive:'#5a3e24',emissiveIntensity:.16,metalness:.25,roughness:.25});
 const star=new T.Mesh(balloonStar(),ornament);star.scale.setScalar(.25);star.position.z=-.02;star.name='balloon-inner-star';balloon.add(star);
 const crystal=new T.OctahedronGeometry(1),snow=new T.InstancedMesh(crystal,ornament,6),dummy=new T.Object3D();snow.name='balloon-inner-snowflake';balloon.add(snow);for(let i=0;i<6;i++){const a=i*Math.PI/3;dummy.scale.set(.045,.18,.045);dummy.position.set(Math.sin(a)*.12,Math.cos(a)*.12,0);dummy.rotation.z=-a;dummy.updateMatrix();snow.setMatrixAt(i,dummy.matrix);}snow.computeBoundingSphere();
 const knot=new T.Mesh(new T.ConeGeometry(.035,.07,10),paint);knot.position.y=-.45;balloon.add(knot);
 const cord=new T.BufferGeometry(),positions=new Float32Array(25*3);cord.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));const string=new T.Line(cord,new T.LineBasicMaterial({color:'#e5d8b9'}));string.name='flexible-balloon-string';string.frustumCulled=false;root.add(string);
 const offset=new T.Vector3(),velocity=new T.Vector3(),target=new T.Vector3(),localOffset=new T.Vector3(),last=new T.Vector3();let previousTime=null,lastTone=-1,lastStyle='';
 return{root,update({time=0,position,yaw=0,active=false,still=false,tone=0,style='classic'}){
  const wasVisible=root.visible;root.visible=active;if(!active){previousTime=null;return;}
  tone=Number.isInteger(tone)&&tone>=0&&tone<balloonColors.length?tone:0;style=balloonStyles.includes(style)?style:'classic';
  if(tone!==lastTone||style!==lastStyle){paint.color.set(balloonColors[tone]);ornament.color.copy(paint.color);shell.material.uniforms.tint.value.copy(paint.color).lerp(new T.Color('#ffffff'),.7);solid.visible=style==='classic';shell.visible=style!=='classic';star.visible=style==='star';snow.visible=style==='snow';lastTone=tone;lastStyle=style;}
  const elapsed=previousTime===null?0:time-previousTime,dt=Math.min(.05,Math.max(0,elapsed));
  if(!wasVisible||elapsed<0||elapsed>.5||!position||last.distanceToSquared(position)>16){offset.set(0,0,0);velocity.set(0,0,0);if(position)last.copy(position);}
  const dx=position&&dt?(position.x-last.x)/dt:0,dz=position&&dt?(position.z-last.z)/dt:0;
  // World-space inertia survives turns: rotating the character must not whip the balloon around.
  target.set(T.MathUtils.clamp(-dx*.20,-1.3,1.3),0,T.MathUtils.clamp(-dz*.20,-1.3,1.3));
  const reset=!wasVisible||elapsed<0||elapsed>.5;
  if(!still&&!reset){target.x+=Math.sin(time*1.05)*.11;target.z+=Math.sin(time*.72)*.09;for(const axis of ['x','z']){velocity[axis]+=(target[axis]-offset[axis])*10*dt;velocity[axis]*=Math.exp(-2.6*dt);offset[axis]+=velocity[axis]*dt;}}
  if(still){offset.set(0,0,0);velocity.set(0,0,0);}
  if(offset.length()>1.65){offset.setLength(1.65);velocity.multiplyScalar(.75);}
  localOffset.set(offset.x*Math.cos(yaw)-offset.z*Math.sin(yaw),0,offset.x*Math.sin(yaw)+offset.z*Math.cos(yaw));
  balloon.position.set(localOffset.x,2.65-offset.length()*.2+(still?0:Math.sin(time*1.15)*.075),localOffset.z);
  balloon.rotation.set(localOffset.z*.25,still?0:Math.sin(time*.6)*.20,-localOffset.x*.25);
  for(let i=0;i<25;i++){const t=i/24,sag=Math.sin(t*Math.PI),bend=sag*(.14+offset.length()*.13);positions[i*3]=localOffset.x*t+localOffset.x*sag*.22+(still?0:Math.sin(time*1.2+t*2.)*bend*.28);positions[i*3+1]=-.17+(balloon.position.y-.45+.17)*t;positions[i*3+2]=localOffset.z*t+localOffset.z*sag*.22-bend;}
  cord.attributes.position.needsUpdate=true;if(position)last.copy(position);previousTime=time;
 }};
}
