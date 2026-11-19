import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildCastle} from '../dist/castle-model.js';
import {createCastleShow} from '../dist/castle-show.js';
import {createFireworkMusic,createShowNotes} from '../dist/firework-music.js';
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
 const scene=new T.Scene();scene.add(castle.root);const show=createCastleShow(scene),beam=show.root.children[0],geometry=beam.geometry,buffer=geometry.attributes.design.array,context={};
 for(let age=0;age<74;age+=.25){const state=sampleCastleCue(age,context);show.update(age,{active:true,quality:'low'});assert.equal(state,context);assert.equal(beam.geometry,geometry);assert.equal(geometry.attributes.design.array,buffer);assert.equal(beam.material.uniforms.count.value,12);assert.ok(state.mix>=0&&state.mix<=1);}
 assert.equal(show.root.getObjectByName('castle-starlight-orbs'),undefined);
 const counts=[];for(const object of show.root.children)object.geometry.addEventListener('dispose',()=>counts.push(object.name));show.dispose();assert.equal(counts.length,1);castle.dispose();
});

test('projection shares a clock across existing surfaces and preserves geometry and materials on cleanup',()=>{
 const scene=new T.Scene(),castle=buildCastle();scene.add(castle.root);const original=[];
 castle.root.traverse(o=>{if(/^winter-palace-(stone|roof|metal|light)$/.test(o.name))original.push({o,g:o.geometry,m:o.material,on:o.material.onBeforeCompile,vs:o.material.vertexShader,fs:o.material.fragmentShader});});
 const show=createCastleShow(scene);show.update(34,{active:true});assert.equal(show.uniforms.showPower.value,1);
 for(const {o,g,m} of original){assert.equal(o.geometry,g);assert.equal(o.material,m);if(m.isShaderMaterial){assert.equal(m.uniforms.showTime,show.uniforms.showTime);}else{const shader={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader,uniforms:{}};m.onBeforeCompile(shader);assert.equal(shader.uniforms.showPower,show.uniforms.showPower);assert.match(shader.fragmentShader,/totalEmissiveRadiance\+=castleProjection/);}}
 const lasers=show.root.children[0];for(const quality of ['low','medium','high']){show.update(55,{active:true,quality});assert.ok(lasers.material.uniforms.count.value>=6);}
 show.update(74,{active:false});assert.equal(show.root.visible,false);assert.equal(show.uniforms.showPower.value,0);show.dispose();
 for(const {m,on,vs,fs}of original){assert.equal(m.onBeforeCompile,on);if(vs){assert.equal(m.vertexShader,vs);assert.equal(m.fragmentShader,fs);}}
 castle.dispose();assert.equal(scene.children.length,0);
});

test('original music follows server time, skips old cues, respects mute and releases voices',()=>{
 const notes=createShowNotes();assert.ok(notes.length>200);assert.ok(notes.every(n=>n.at+n.duration<74));assert.ok(notes.every(n=>Math.abs(n.at*2-Math.round(n.at*2))<1e-6));
 const mock=mockAudio(),context=new mock.Audio(),nodes=[],states=[];
 const create=context.createOscillator.bind(context);context.createOscillator=()=>{const n=create();n.start=at=>n.started=at;n.stop=at=>{n.stops=at;if(at===undefined)n.onended?.();};nodes.push(n);return n;};
 const music=createFireworkMusic(context,context.destination,active=>states.push(active)),show={id:'music',startsAt:1000};
 music.update(show,1000+34000);assert.ok(music.voices>0&&music.voices<=48);assert.ok(nodes.every(n=>n.started>=context.currentTime&&n.started<context.currentTime+.18));
 const count=nodes.length;music.update(show,1000+34001);assert.equal(nodes.length,count,'same look-ahead never schedules twice');
 context.currentTime=5;music.update(show,1000+64000);assert.ok(nodes.slice(count).every(n=>n.started>=5));assert.ok(music.voices<=48);
 music.update(show,1000+64500,false);assert.equal(music.voices,0);assert.equal(states.at(-1),false);
 music.update(show,1000+74000);assert.equal(music.voices,0);
 const shortened={id:'short-score',startsAt:100000,endsAt:100500};music.update(shortened,100000);assert.ok(music.voices>0);music.update(shortened,100500);assert.equal(music.voices,0,'server end time releases sound even when score notes remain');music.dispose();
});
