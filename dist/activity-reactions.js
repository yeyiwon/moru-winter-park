import * as T from './vendor/three.module.js';

export function createActivityReactions(scene){
  const limit=32,geometry=new T.SphereGeometry(1,16,12),opacity=new T.InstancedBufferAttribute(new Float32Array(limit),1),phase=new T.InstancedBufferAttribute(new Float32Array(limit),1);
  geometry.setAttribute('bubbleOpacity',opacity);geometry.setAttribute('bubblePhase',phase);
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,
    vertexShader:`attribute float bubbleOpacity;attribute float bubblePhase;varying float alpha;varying float phase;varying vec3 viewDirection;varying vec3 viewNormal;void main(){vec4 p=modelViewMatrix*instanceMatrix*vec4(position,1.);viewDirection=-p.xyz;viewNormal=normalize(normalMatrix*mat3(instanceMatrix)*normal);alpha=bubbleOpacity;phase=bubblePhase;gl_Position=projectionMatrix*p;}`,
    fragmentShader:`varying float alpha;varying float phase;varying vec3 viewDirection;varying vec3 viewNormal;void main(){vec3 n=normalize(viewNormal),v=normalize(viewDirection);float rim=pow(1.-max(0.,dot(n,v)),2.2);float band=.5+.5*sin(n.y*7.+n.x*3.+phase);vec3 tint=mix(vec3(.7,.92,1.),vec3(1.,.73,.88),band);float glint=pow(max(0.,dot(n,normalize(vec3(-.4,.6,1.)))),35.);gl_FragColor=vec4(tint+glint*.4,alpha*(.025+rim*.48+glint*.32));}`});
  const bubbles=new T.InstancedMesh(geometry,material,limit);bubbles.name='floating-activity-bubbles';bubbles.frustumCulled=false;bubbles.instanceMatrix.setUsage(T.DynamicDrawUsage);bubbles.visible=false;scene.add(bubbles);
  const heart=new T.Shape();heart.moveTo(0,-.45);heart.bezierCurveTo(-.9,.1,-.55,.8,0,.35);heart.bezierCurveTo(.55,.8,.9,.1,0,-.45);
  const heartGeometry=new T.ShapeGeometry(heart,10),heartMaterial=new T.MeshBasicMaterial({color:'#f4a4be',transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}),hearts=new T.InstancedMesh(heartGeometry,heartMaterial,3),heartPose=new T.Object3D();hearts.name='activity-hearts';hearts.frustumCulled=false;hearts.visible=false;scene.add(hearts);
  const particles=Array.from({length:limit},()=>({age:10,life:3,x:0,y:0,z:0,vx:0,vy:0,vz:0,r:0,phase:0})),matrix=new T.Matrix4();let cursor=0,emission=0,count=0,lastTime=0,seed=47;
  const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
  return {
    suspend(){bubbles.visible=hearts.visible=false;for(const p of particles)p.age=p.life;count=emission=0;},
    dispose(){scene.remove(bubbles,hearts);geometry.dispose();material.dispose();heartGeometry.dispose();heartMaterial.dispose();},
    get state(){return {count,capacity:limit};},
    update({gesture='',mode='',x=0,y=0,z=0,yaw=0,time=0,dt=0,still=false}={}){
      const happy=['bath','tea','sauna','lie','rest'].includes(mode)||['eat','warm','wave'].includes(gesture),pulse=still?.5:(time%5)/5;
      hearts.visible=happy&&(still||pulse<.42);heartMaterial.opacity=still?.55:Math.sin(Math.min(1,pulse/.42)*Math.PI)*.7;
      if(hearts.visible)for(let i=0;i<3;i++){heartPose.position.set(x+Math.cos(yaw)*((i%2?1:-1)*(1.05+i*.15)),y+.65+i*.3+(still?0:pulse*.8),z-Math.sin(yaw)*((i%2?1:-1)*(1.05+i*.15)));heartPose.rotation.set(0,yaw,(i-1)*.2);heartPose.scale.setScalar(.18+i*.015);heartPose.updateMatrix();hearts.setMatrixAt(i,heartPose.matrix);}hearts.instanceMatrix.needsUpdate=true;
      dt=Math.max(0,Math.min(.1,dt));if(time<lastTime)for(const p of particles)p.age=p.life;lastTime=time;
      const cycle=time%5.2,blowing=gesture==='bubble'&&!still&&!['ski','lift'].includes(mode)&&cycle>1.6&&cycle<3.3;
      if(blowing){emission+=dt*6;while(emission>=1){emission--;const p=particles[cursor];cursor=(cursor+1)%limit;const forwardX=Math.sin(yaw),forwardZ=Math.cos(yaw),rightX=Math.cos(yaw),rightZ=-Math.sin(yaw),side=.14+(random()-.5)*.05;p.age=0;p.life=2.3+random()*1.2;p.x=x+forwardX*.83+rightX*side;p.z=z+forwardZ*.83+rightZ*side;p.y=y-.1;p.vx=forwardX*(.15+random()*.16)+rightX*(random()-.5)*.2;p.vz=forwardZ*(.15+random()*.16)+rightZ*(random()-.5)*.2;p.vy=.13+random()*.09;p.r=.047+random()*.067;p.phase=random()*Math.PI*2;}}
      else emission=0;
      count=0;for(let i=0;i<limit;i++){const p=particles[i];p.age+=dt;if(p.age>=p.life){opacity.setX(i,0);continue;}const life=p.age/p.life;p.x+=p.vx*dt;p.z+=p.vz*dt;p.y+=p.vy*dt;const wobble=Math.sin(time*1.7+p.phase)*.025,radius=p.r*(.72+Math.min(1,p.age*3)*.28);matrix.makeScale(radius,radius,radius);matrix.setPosition(p.x+wobble,p.y,p.z);bubbles.setMatrixAt(i,matrix);opacity.setX(i,Math.min(1,p.age*5)*(1-T.MathUtils.smoothstep(life,.65,1)));phase.setX(i,p.phase+life*.8);count++;}
      bubbles.visible=count>0&&!still;bubbles.instanceMatrix.needsUpdate=true;opacity.needsUpdate=true;phase.needsUpdate=true;
    }
  };
}
