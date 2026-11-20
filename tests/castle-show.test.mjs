import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildCastle} from '../dist/castle-model.js';
import {createCastleShow} from '../dist/castle-show.js';
import {createFireworkMusic} from '../dist/firework-music.js';
import {mockAudio} from './audio-context.mjs';
import {castleShowCues,castleRegions,castleBeamEmitters,sampleCastleCue} from '../dist/castle-show-score.js';

test('show cues address actual architectural regions and all six emitter locations without new geometry batches',()=>{
 const castle=buildCastle(),regions=new Set();
 for(const object of castle.root.children.filter(o=>/^winter-palace-(stone|roof|metal|light)$/.test(o.name))){
  assert.equal(object.geometry.attributes.showRegion.count,object.geometry.attributes.position.count);
  for(const region of object.geometry.attributes.showRegion.array)regions.add(region);
 }
 assert.deepEqual([...regions].sort((a,b)=>a-b),castleRegions.map((_,i)=>i));
 assert.equal(new Set(castleBeamEmitters.map(e=>e.group)).size,6);
 assert.ok(castleBeamEmitters.filter(e=>!e.laser&&e.position[1]<2).length>=8);
 for(const cue of castleShowCues){assert.equal(cue.regions.length,10);assert.ok(new Set(cue.regions).size>=4);assert.equal(cue.framing.automatic,false);assert.ok(cue.fireworks.bursts.length>0);}
 const scene=new T.Scene();scene.add(castle.root);const show=createCastleShow(scene),beam=show.root.getObjectByName('castle-laser-fan'),geometry=beam.geometry,buffer=geometry.attributes.design.array,context={};
 for(let age=0;age<74;age+=.25){const state=sampleCastleCue(age,context);show.update(age,{active:true,quality:'low'});assert.equal(state,context);assert.equal(beam.geometry,geometry);assert.equal(geometry.attributes.design.array,buffer);assert.equal(beam.material.uniforms.count.value,12);assert.ok(state.mix>=0&&state.mix<=1);}
 assert.equal(show.root.getObjectByName('castle-starlight-orbs'),undefined);
 const counts=[];for(const object of show.root.children)object.geometry.addEventListener('dispose',()=>counts.push(object.name));show.dispose();assert.equal(counts.length,2);castle.dispose();
});

test('projection shares a clock across existing surfaces and preserves geometry and materials on cleanup',()=>{
 const scene=new T.Scene(),castle=buildCastle();scene.add(castle.root);const original=[];
 castle.root.traverse(o=>{if(/^winter-palace-(stone|roof|metal|light)$/.test(o.name))original.push({o,g:o.geometry,m:o.material,on:o.material.onBeforeCompile,vs:o.material.vertexShader,fs:o.material.fragmentShader});});
 const show=createCastleShow(scene);show.update(34,{active:true});assert.equal(show.uniforms.showPower.value,1);
 for(const {o,g,m} of original){assert.equal(o.geometry,g);assert.equal(o.material,m);if(m.isShaderMaterial){assert.equal(m.uniforms.showTime,show.uniforms.showTime);}else{const shader={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader,uniforms:{}};m.onBeforeCompile(shader);assert.equal(shader.uniforms.showPower,show.uniforms.showPower);assert.match(shader.fragmentShader,/totalEmissiveRadiance\+=castleProjection/);}}
 const lasers=show.root.getObjectByName('castle-laser-fan');for(const quality of ['low','medium','high']){show.update(55,{active:true,quality});assert.ok(lasers.material.uniforms.count.value>=6);}
 show.update(74,{active:false});assert.equal(show.root.visible,false);assert.equal(show.uniforms.showPower.value,0);show.dispose();
 for(const {m,on,vs,fs}of original){assert.equal(m.onBeforeCompile,on);if(vs){assert.equal(m.vertexShader,vs);assert.equal(m.fragmentShader,fs);}}
 castle.dispose();assert.equal(scene.children.length,0);
});

test('removed original score and unknown music IDs never start fallback audio',()=>{
 const mock=mockAudio(),context=new mock.Audio();let oscillators=0,elements=0;
 context.createOscillator=()=>{oscillators++;throw Error('Legacy score must not play');};
 const music=createFireworkMusic(context,context.destination,()=>{},()=>{elements++;throw Error('Unknown recording must not load');});
 for(const musicId of [undefined,'happy-and-magical-dynamic','joyful-piano-orchestra','magic-wedding','unknown']){
  music.update({id:'old-show',musicId,state:'playing',startsAt:1000,endsAt:75000},35000);
  assert.equal(music.voices,0);assert.equal(music.media,null);
 }
 music.dispose();assert.equal(oscillators,0);assert.equal(elements,0);
});
