import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import * as T from '../dist/vendor/three.module.js';
import {createOrnamentPreviews,showOrnamentPreview} from '../dist/ornament-preview.js';
test('rapid custom colours discard obsolete GPU thumbnails, retain the visible image and reuse the final result',t=>{
 const dom=new JSDOM('<span id="preview"></span>'),previous=globalThis.document;globalThis.document=dom.window.document;
 dom.window.HTMLCanvasElement.prototype.getContext=()=>({createImageData:()=>({data:new Uint8ClampedArray(96*96*4)}),putImageData(){}});
 dom.window.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/png;base64,preview';
 let renders=0;const renderer={autoClear:true,getRenderTarget:()=>null,getClearAlpha:()=>0,getClearColor:c=>c.set(0),setRenderTarget(){},setClearColor(){},render(){renders++;},readRenderTargetPixels(){}};
 const shape=new T.Mesh(new T.SphereGeometry(.5),new T.MeshStandardMaterial()),previews=createOrnamentPreviews(renderer,{meshes:{star:shape},frames:{star:shape}}),node=document.querySelector('#preview');
 t.after(()=>{previews.dispose();shape.geometry.dispose();shape.material.dispose();dom.window.close();globalThis.document=previous;});
 showOrnamentPreview(node,'star','#e5bb6b');previews.update();assert.equal(renders,1);const first=node.querySelector('img');assert.ok(first);
 for(let i=0;i<100;i++)showOrnamentPreview(node,'star','#'+(0x662233+i*500).toString(16));
 showOrnamentPreview(node,'star','#2255cc');assert.equal(node.querySelector('img'),first,'keep the 3D image while recolouring');previews.update();assert.equal(renders,2,'only the final draft reaches the GPU');assert.equal(node.querySelector('img').dataset.ornamentKey,'star#2255cc');
 for(let i=0;i<100;i++)previews.update();assert.equal(renders,2,'no stale colour backlog');showOrnamentPreview(node,'star','#e5bb6b');previews.update();assert.equal(renders,2,'reuse cached colours');
});
