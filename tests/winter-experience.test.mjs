import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {createWinterExperience} from '../dist/winter-experience.js';
import {resortRides,resortDestinations,summitFacilities} from '../dist/resort-layout.js';

test('summit facilities use nearby actions, preserve equipment, and cancel gestures on movement',t=>{
 const dom=new JSDOM(fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),{url:'https://winter.test'}),w=dom.window;t.after(()=>w.close());
 Object.assign(globalThis,{window:w,document:w.document,Event:w.Event,localStorage:w.localStorage});
 let doors=0,equipped='ski';
 const winter={rides:resortRides,destinations:resortDestinations,rideChair:{visible:false,position:{set(){}},rotation:{set(){}}},toggleRestroom(){doors++;}};
 const companion={gear:'ski',winterReady:true,equip(gear){if(gear)equipped=gear;}};
 const e=createWinterExperience(winter,companion,()=>{}),card=document.querySelector('#place-card');
 e.show('ski');document.querySelector('#place-actions button').click();assert.equal(e.rides.mode,'lift');
 const arrival=e.update(45,{});e.proximity(arrival.x,arrival.z);assert.equal(e.rides.mode,'summit');assert.equal(card.hidden,true,'the arrival does not force a ski action');
 for(const facility of summitFacilities){
  e.proximity(facility.x,facility.z);assert.equal(card.hidden,false);assert.equal(document.querySelector('#place-name').textContent,facility.name);
  document.querySelector('#place-actions button').click();const p=e.update(.05,{});
  if(facility.id==='restroom')assert.equal(doors,1);
  else{assert.equal(p.mode,'summit');assert.equal(p.gesture,facility.id==='campfire'?'warm':'snack');assert.equal(equipped,'ski');assert.equal(e.update(.05,{x:1}).gesture,undefined);}
 }
 e.proximity(-8,-333);assert.equal(document.querySelectorAll('#place-actions button').length,3);
 document.querySelector('#place-actions button:nth-child(2)').click();const ski=e.update(.05,{});assert.equal(ski.runId,'easy');assert.equal(ski.speed,0);
});
