import * as T from './vendor/three.module.js';
// A quiet destination glint with a dissolving ring; pooled to avoid click-time allocation.
export function createMoveMarker(scene){
 const geometry=new T.PlaneGeometry(2.6,2.6),markers=Array.from({length:3},()=>{
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,toneMapped:false,uniforms:{age:{value:2}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;uniform float age;void main(){vec2 p=(vUv-.5)*2.;float d=length(p),t=clamp(age/1.1,0.,1.),r=mix(.22,.8,1.-pow(1.-t,3.));float ring=exp(-pow((d-r)*90.,2.))*(1.-t)*.55;float cross=exp(-abs(p.x)*80.)*exp(-abs(p.y)*13.)+exp(-abs(p.y)*80.)*exp(-abs(p.x)*13.);float dotGlow=exp(-d*d*180.);float alpha=(ring+(cross*.32+dotGlow*.4)*pow(1.-t,2.));if(alpha<.008)discard;gl_FragColor=vec4(mix(vec3(.73,.9,1.),vec3(1.,.88,.64),t),alpha);}`});
  const mesh=new T.Mesh(geometry,material);mesh.rotation.x=-Math.PI/2;mesh.visible=false;mesh.name='destination-glint';scene.add(mesh);return{mesh,age:2};
 });let cursor=0;
 return{show(x,y,z){const m=markers[cursor++%markers.length];m.mesh.position.set(x,y+.035,z);m.age=0;},update(dt,still=false){for(const m of markers){m.age+=dt;m.mesh.visible=m.age<1.1;m.mesh.material.uniforms.age.value=still?Math.max(.25,m.age):m.age;}},dispose(){geometry.dispose();for(const m of markers){m.mesh.material.dispose();m.mesh.removeFromParent();}}};
}
