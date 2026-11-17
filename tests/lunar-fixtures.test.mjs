import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {lunarPhase} from '../dist/lunar-phase.js';
import {createDetailedMoon} from '../dist/winter-sky.js';
import {createFixtureGlow} from '../dist/fixture-glow.js';

test('approximate lunar illumination follows USNO November 2026 phase dates',()=>{
 // https://aa.usno.navy.mil/calculated/moon/phases?date=2026-11-01&format=p&nump=8
 for(const [date,fraction,phase]of [['2026-11-09T07:02Z',0,0],['2026-11-17T11:48Z',.5,.25],['2026-11-24T14:53Z',1,.5],['2026-12-01T06:08Z',.5,.75]]){
  const value=lunarPhase(new Date(date));assert.ok(Math.abs(value.fraction-fraction)<.055,date);assert.ok(Math.min(Math.abs(value.phase-phase),1-Math.abs(value.phase-phase))<.025,date);
 }
 assert.throws(()=>lunarPhase(NaN),RangeError);
 const moon=createDetailedMoon({loadTexture:false,date:new Date('2026-11-17T11:48Z')});assert.equal(moon.userData.surfaceSource,'procedural-fallback');assert.ok(moon.material.uniforms.lightDirection.value.x>.95);
 moon.userData.setDate(new Date('2026-12-01T06:08Z'));assert.ok(moon.material.uniforms.lightDirection.value.x<-.95);moon.userData.dispose();
});
test('lamp halos and ground reflections follow their translated district in two draw calls',()=>{
 const scene=new T.Scene(),district=new T.Group();district.position.set(20,2,-40);district.userData.lampGlow=[{x:3,y:4,z:5,floor:.15,radius:2}];scene.add(district);
 const fx=createFixtureGlow(scene),halos=fx.root.children[0],wash=fx.root.children[1];assert.equal(fx.count,1);assert.equal(fx.root.children.length,2);assert.deepEqual(Array.from(halos.geometry.attributes.position.array),[23,6,-35]);
 const matrix=new T.Matrix4(),position=new T.Vector3();wash.getMatrixAt(0,matrix);position.setFromMatrixPosition(matrix);assert.ok(position.distanceTo(new T.Vector3(23,2.15,-35))<1e-5);
 fx.update(12);fx.update(50,true);assert.equal(halos.material.uniforms.time.value,12);fx.setQuality('low');assert.equal(wash.material.uniforms.gain.value,.8);fx.dispose();assert.deepEqual(scene.children,[district]);
});
