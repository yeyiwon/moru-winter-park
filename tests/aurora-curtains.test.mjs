import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import * as T from '../dist/vendor/three.module.js';
import {createAuroraCurtainGeometry,createWinterSky,createDetailedMoon,createMoonSurfaceTexture} from '../dist/winter-sky.js';

test('remote curtains occupy a bounded part of the sky without doubled-back columns',()=>{
 for(let layer=0;layer<3;layer++){
  const geometry=createAuroraCurtainGeometry(layer),p=geometry.attributes.position,normal=geometry.attributes.normal,b=geometry.boundingBox;
  assert.ok(b.max.x-b.min.x>=390&&b.max.x-b.min.x<=590);assert.ok(b.max.y-b.min.y<200);assert.ok(b.max.z-b.min.z<120);
  for(let row=0;row<13;row++)for(let column=1;column<97;column++)assert.ok(p.getX(row*97+column)>p.getX(row*97+column-1),'all rows are monotonic, so adjacent faces cannot fold back in X');
  for(const attribute of [p,normal])for(const value of attribute.array)assert.ok(Number.isFinite(value));
  geometry.dispose();
 }
});

test('aurora layers respect night, interiors, quality and stopped animation',t=>{
 const dom=new JSDOM('<select id="vfx-quality"></select>',{url:'https://winter.test'}),w=dom.window;t.after(()=>w.close());
 Object.assign(globalThis,{window:w,document:w.document,localStorage:w.localStorage});w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{}});w.labWorldTime={hour:22};
 const scene=new T.Scene();scene.background=new T.Color();scene.fog=new T.Fog('#071329',100,400);const sky=createWinterSky(scene,new T.HemisphereLight(),new T.DirectionalLight(),new T.DirectionalLight(),{}),root=scene.getObjectByName('winter-auroral-curtains');
 sky.update(80,false,{x:12,y:1,z:-7});assert.equal(root.visible,true);assert.equal(root.position.x,12);assert.equal(root.position.z,-7);
 const material=root.children[0].material;assert.equal(material.blending,T.NormalBlending);assert.equal(material.depthWrite,false);assert.equal(material.uniforms.time.value,80);assert.equal(material.uniforms.night.value,1);
 sky.setQuality('low');assert.equal(root.children.filter(o=>o.visible).length,1);sky.setQuality('medium');assert.equal(root.children.filter(o=>o.visible).length,2);sky.setQuality('high');assert.equal(root.children.filter(o=>o.visible).length,3);
 sky.update(120,true,{x:0,y:1,z:0});assert.equal(material.uniforms.time.value,0);const snow=scene.getObjectByName('winter-snow-crystals'),before=snow.geometry.attributes.position.getY(0);sky.update(120.5,true,{x:0,y:1,z:0});assert.ok(snow.geometry.attributes.position.getY(0)<before,'gentle snowfall continues when decorative motion is reduced');assert.equal(snow.material.uniforms.time.value,0,'flakes do not spin with reduced motion');w.labInterior='ryokan';sky.update(121,false,{x:0,y:1,z:0});assert.equal(root.visible,false);w.labInterior='';
 w.dispatchEvent(new w.CustomEvent('lab:time',{detail:{hour:12}}));sky.update(122,false,{x:0,y:1,z:0});assert.equal(root.visible,false);assert.equal(material.uniforms.night.value,0);
 assert.equal(scene.getObjectByName('detailed-winter-moon').visible,false);
});

test('the moon has deterministic maria and crater relief with a shaded terminator',()=>{
 const a=createMoonSurfaceTexture(128,64),b=createMoonSurfaceTexture(128,64);assert.deepEqual(a.image.data,b.image.data);let min=255,max=0,lo=255,hi=0;for(let i=0;i<a.image.data.length;i+=4){min=Math.min(min,a.image.data[i]);max=Math.max(max,a.image.data[i]);lo=Math.min(lo,a.image.data[i+1]);hi=Math.max(hi,a.image.data[i+1]);}assert.ok(max-min>35);assert.ok(hi-lo>20);assert.ok(max<230,'lunar surface is not a white glowing disc');
 const moon=createDetailedMoon();assert.equal(moon.geometry.parameters.radius,6.8);assert.ok(moon.material.fragmentShader.includes('terminator'));assert.equal(moon.material.depthWrite,false);assert.ok(moon.material.uniforms.lightDirection.value.length()>.999);moon.userData.dispose();a.dispose();b.dispose();
});
