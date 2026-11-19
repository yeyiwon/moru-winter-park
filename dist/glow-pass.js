import * as T from './vendor/three.module.js';
export function glowCapabilities(renderer){
 const gl=renderer.getContext();
 if(!renderer.extensions.has('EXT_color_buffer_float'))return{hdr:false,samples:0};
 // MAX_SAMPLES describes the context, not support for this HDR pixel format.
 const supported=gl.getInternalformatParameter(gl.RENDERBUFFER,gl.RGBA16F,gl.SAMPLES)||[];
 return{hdr:true,samples:Array.from(supported).filter(n=>n<=2).sort((a,b)=>b-a)[0]||0};
}
// Thresholded HDR highlights only; the scene's original depth and sharpness are preserved.
export function createGlowPass(renderer){
 const capability=glowCapabilities(renderer);
 const size=new T.Vector2(),scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,0,1),geometry=new T.PlaneGeometry(2,2),quad=new T.Mesh(geometry);scene.add(quad);
 const target=new T.WebGLRenderTarget(1,1,{type:capability.hdr?T.HalfFloatType:T.UnsignedByteType,depthBuffer:true,samples:capability.samples}),blur=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:false});let quality='medium',width=0,height=0;
 const vertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
 const highlight=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{source:{value:target.texture},texel:{value:new T.Vector2()}},vertexShader:vertex,fragmentShader:`varying vec2 vUv;uniform sampler2D source;uniform vec2 texel;void main(){vec3 sum=vec3(0.);float total=0.;for(int x=-2;x<=2;x++)for(int y=-2;y<=2;y++){vec3 c=texture2D(source,vUv+vec2(float(x),float(y))*texel*3.).rgb;float bright=max(c.r,max(c.g,c.b));float w=exp(-float(x*x+y*y)*.35);sum+=c*smoothstep(1.25,2.5,bright)*w;total+=w;}gl_FragColor=vec4(sum/total,1.);}`});
 const compose=new T.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:true,uniforms:{source:{value:target.texture},glow:{value:blur.texture},strength:{value:capability.hdr?.18:0}},vertexShader:vertex,fragmentShader:`varying vec2 vUv;uniform sampler2D source;uniform sampler2D glow;uniform float strength;void main(){vec3 color=texture2D(source,vUv).rgb;if(strength>0.)color+=texture2D(glow,vUv).rgb*strength;gl_FragColor=vec4(color,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 async function prepare(world,view){
  const previous=renderer.getRenderTarget();
  try{
   renderer.setRenderTarget(target);await renderer.compileAsync?.(world,view);
   if(capability.hdr&&quality!=='low'){quad.material=highlight;renderer.setRenderTarget(blur);await renderer.compileAsync?.(scene,camera);}
   quad.material=compose;renderer.setRenderTarget(null);await renderer.compileAsync?.(scene,camera);
  }finally{renderer.setRenderTarget(previous);}
 }
 // Both quality paths composite linear scene colour once. Rendering low quality
 // straight to the canvas changes fog/unlit colours because Three applies fog
 // after per-material tone mapping. Low omits the expensive glow sampling pass.

 return{prepare,setQuality(value,{samples=value==='low'?0:2}={}){if(value==='low'&&quality!=='low')blur.dispose();const unchanged=quality===value;quality=value;compose.uniforms.strength.value=capability.hdr&&value!=='low'?(value==='high'?.28:.18):0;const next=Math.min(samples,capability.samples);if(target.samples!==next){target.samples=next;target.dispose();}if(!unchanged)width=0;},get capabilities(){return capability;},render(world,view){renderer.getDrawingBufferSize(size);if(size.x!==width||size.y!==height){width=size.x;height=size.y;target.setSize(width,height);if(capability.hdr&&quality!=='low'){blur.setSize(Math.max(1,Math.round(width/4)),Math.max(1,Math.round(height/4)));highlight.uniforms.texel.value.set(1/width,1/height);}}renderer.setRenderTarget(target);renderer.render(world,view);if(capability.hdr&&quality!=='low'){quad.material=highlight;renderer.setRenderTarget(blur);renderer.render(scene,camera);}quad.material=compose;renderer.setRenderTarget(null);renderer.render(scene,camera);},dispose(){target.dispose();blur.dispose();geometry.dispose();highlight.dispose();compose.dispose();}};
}
