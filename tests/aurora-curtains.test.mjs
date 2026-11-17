import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import * as T from '../dist/vendor/three.module.js';
import {createAuroraCurtainGeometry,createWinterSky} from '../dist/winter-sky.js';

test('curtains have a continuous horizontal span, deep folds and finite geometry without doubled-back columns',()=>{
 for(let layer=0;layer<3;layer++){
  const geometry=createAuroraCurtainGeometry(layer),p=geometry.attributes.position,normal=geometry.attributes.normal,b=geometry.boundingBox;
  assert.ok(b.max.x-b.min.x>900);assert.ok(b.max.y-b.min.y<140);assert.ok(b.max.z-b.min.z>85);
  for(let row=0;row<17;row++)for(let column=1;column<225;column++)assert.ok(p.getX(row*225+column)>p.getX(row*225+column-1),'all rows are monotonic, so adjacent faces cannot fold back in X');
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
 sky.update(120,true,{x:0,y:1,z:0});assert.equal(material.uniforms.time.value,0);w.labInterior='ryokan';sky.update(121,false,{x:0,y:1,z:0});assert.equal(root.visible,false);w.labInterior='';
 w.dispatchEvent(new w.CustomEvent('lab:time',{detail:{hour:12}}));sky.update(122,false,{x:0,y:1,z:0});assert.equal(root.visible,false);assert.equal(material.uniforms.night.value,0);
});
