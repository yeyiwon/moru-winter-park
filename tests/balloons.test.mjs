import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {balloonColors,balloonStyles,pickBalloonTone,pickBalloonStyle} from '../dist/balloon-design.js';
import {encodeActivity,decodeActivity,activityGestures} from '../dist/activity-state.js';
import {createHeldBalloon} from '../dist/held-balloon.js';
test('every balloon design and colour round trips through validated multiplayer activity',()=>{for(const balloonStyle of balloonStyles)for(let balloonTone=0;balloonTone<balloonColors.length;balloonTone++){const state={heldItem:'balloon',gesture:'',balloonTone,balloonStyle},value=encodeActivity(state);assert.ok(activityGestures.includes(value));assert.deepEqual(decodeActivity(value),state);for(const random of[0,.1,.99])assert.notEqual(pickBalloonTone(balloonTone,()=>random),balloonTone);}assert.equal(decodeActivity('balloon-carry').heldItem,'balloon');assert.deepEqual([0,.4,.99].map(v=>pickBalloonStyle(()=>v)),balloonStyles);});
test('carried balloon has bounded inertial lag, a reusable curved string and clean teleport/reduced-motion reset',()=>{
 const root=new T.Group(),b=createHeldBalloon(root),position=new T.Vector3(),line=root.getObjectByName('flexible-balloon-string'),buffer=line.geometry.attributes.position.array;
 for(let i=0;i<120;i++){position.x=i*.06;b.update({time:i/60,position,active:true,style:'star',tone:2});}assert.ok(buffer.some((v,i)=>i%3===0&&v<-.5));assert.ok([...buffer].every(Number.isFinite));assert.ok(buffer[73]>2,'string lifts balloon well above the head');assert.equal(root.getObjectByName('clear-balloon-shell').visible,true);assert.equal(root.getObjectByName('balloon-inner-star').visible,true);
 position.x=100;b.update({time:3,position,active:true,style:'snow',tone:3});assert.ok(Math.abs(buffer[72])<.01);assert.equal(root.getObjectByName('balloon-inner-star').visible,false);assert.equal(root.getObjectByName('balloon-inner-snowflake').visible,true);
 b.update({time:3.02,position,active:true,still:true});assert.equal(buffer[72],0);assert.equal(line.geometry.attributes.position.array,buffer);b.update({active:false});assert.equal(b.root.visible,false);
});
