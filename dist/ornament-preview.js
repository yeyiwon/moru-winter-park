import * as T from './vendor/three.module.js';
import {decorationIcon,validDecorationColor} from './decorations.js';

const cache=new Map(),pending=new Map();
export function showOrnamentPreview(node,kind,color='#e5bb6b'){
 color=validDecorationColor(color)?color:'#e5bb6b';
 const key=kind+color;if(node.dataset.ornamentPreview===key)return;node.dataset.ornamentPreview=key;
 if(!node.querySelector('img'))node.innerHTML=decorationIcon(kind);node.style.color=color;
 const show=url=>{if(node.dataset.ornamentPreview!==key)return;const image=document.createElement('img');image.alt='';image.width=image.height=96;image.src=url;image.className='ornament-thumbnail';image.dataset.ornamentKey=key;node.replaceChildren(image);};
 if(cache.has(key)){show(cache.get(key));return;}
 if(!pending.has(key))pending.set(key,{kind,color,callbacks:[]});
 pending.get(key).callbacks.push({node,apply:show});
}

// Render only requested thumbnails, one per display frame, on the existing
// world renderer. Geometry is borrowed from the actual tree, never duplicated.
export function createOrnamentPreviews(renderer,ornaments){
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,1,.1,10);
 camera.position.set(0,.10,3.15);camera.lookAt(0,.03,0);
 scene.add(new T.HemisphereLight('#fff6e8','#617292',2.3));
 const light=new T.DirectionalLight('#fff4df',3.4);light.position.set(-2,3,4);scene.add(light);
 const jewel=ornaments.meshes.star.material.clone(),gold=ornaments.frames.star.material.clone();
 jewel.emissiveIntensity=.14;
 const body=new T.Mesh(ornaments.meshes.star.geometry,jewel),frame=new T.Mesh(ornaments.frames.star.geometry,gold),group=new T.Group();group.add(body,frame);group.rotation.y=.3;scene.add(group);
 const target=new T.WebGLRenderTarget(96,96,{depthBuffer:true}),pixels=new Uint8Array(96*96*4),canvas=document.createElement('canvas');canvas.width=canvas.height=96;
 target.texture.colorSpace=T.SRGBColorSpace;
 const ctx=canvas.getContext('2d'),rgba=ctx.createImageData(96,96),clear=new T.Color();let disposed=false;
 return {
  update(){
   if(disposed||!pending.size)return;
   let key,job;
   // Native colour pickers can emit dozens of drafts before the next frame.
   // Drop superseded requests before any synchronous GPU readback.
   while(pending.size){[key,job]=pending.entries().next().value;pending.delete(key);job.callbacks=job.callbacks.filter(({node})=>node.isConnected&&node.dataset.ornamentPreview===key);if(job.callbacks.length)break;job=null;}
   if(!job)return;
   if(!ornaments.meshes[job.kind])return;
   body.geometry=ornaments.meshes[job.kind].geometry;frame.geometry=ornaments.frames[job.kind].geometry;
   jewel.color.set(job.color);jewel.emissive.set(job.color);
   const previous=renderer.getRenderTarget(),alpha=renderer.getClearAlpha(),auto=renderer.autoClear;renderer.getClearColor(clear);
   try{
    renderer.setRenderTarget(target);renderer.setClearColor(0,0);renderer.autoClear=true;renderer.render(scene,camera);renderer.readRenderTargetPixels(target,0,0,96,96,pixels);
    for(let y=0;y<96;y++)rgba.data.set(pixels.subarray((95-y)*384,(96-y)*384),y*384);
    ctx.putImageData(rgba,0,0);const url=canvas.toDataURL('image/png');cache.set(key,url);if(cache.size>64)cache.delete(cache.keys().next().value);for(const {apply} of job.callbacks)apply(url);
   }finally{renderer.setRenderTarget(previous);renderer.setClearColor(clear,alpha);renderer.autoClear=auto;}
  },
  dispose(){disposed=true;pending.clear();cache.clear();target.dispose();jewel.dispose();gold.dispose();}
 };
}
