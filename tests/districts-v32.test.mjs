import {aquariumBounds as bounds} from '../dist/ryokan-aquarium-layout.js';
import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {createFishSchool} from '../dist/ryokan-aquarium.js';
import {createOrbitPuzzle} from '../dist/museum-puzzle.js';
import {interiorRooms,interiorCanStandAt,interiorSurfaceHeight} from '../dist/interior-layout.js';
import {findPath} from '../dist/navigation.js';
import {buildInteriors} from '../dist/interior-world.js';
import {createInteractionExitControl} from '../dist/interaction-exit-control.js';
import {JSDOM} from 'jsdom';

test('freshwater fish remain inside glass and move with finite bounded steering',()=>{
 const school=createFishSchool();for(let i=0;i<900;i++)school.step(1/30);for(const f of school.fish){assert.ok(Number.isFinite(f.x+f.y+f.z+f.vx+f.vy+f.vz));assert.ok(Math.abs(f.x)<=bounds.x-f.size*.55);assert.ok(Math.abs(f.y)<=bounds.y-f.size*.55);assert.ok(Math.abs(f.z)<=bounds.z-f.size*.55);assert.ok(Math.hypot(f.vx,f.vy,f.vz)<=1.151);}
});
test('the orbit puzzle changes real quarter turns and solves only all aligned rings',()=>{
 const p=createOrbitPuzzle();assert.equal(p.turn(99),false);for(let i=0;i<3;i++)for(let turn=0;turn<3-i;turn++){const complete=p.turn(i);assert.equal(complete,i===2&&turn===0);}assert.deepEqual(p.steps,[0,0,0]);p.reset();assert.deepEqual(p.steps,[1,2,3]);
});
test('aquarium and museum gallery have a complete walkable route',()=>{
 for(const [id,destination]of [['ryokan',{x:388,z:11.8}],['museum',{x:587,z:-7.7}]]){const route=findPath(interiorRooms[id].entry,destination);assert.ok(route.length,id);assert.ok(Math.hypot(route.at(-1).x-destination.x,route.at(-1).z-destination.z)<.02);for(const p of route)assert.ok(interiorCanStandAt(p.x,p.z));}
 assert.equal(interiorSurfaceHeight(800,-19),null);
});
test('lazy rooms have bounded geometry and camera stays inside solid room boundaries',()=>{
 const interiors=buildInteriors(new T.Scene(),{lazy:true});assert.equal(Object.keys(interiors.rooms).length,0);
 for(const id of ['museum','ryokan']){interiors.setActive(id);const room=interiors.rooms[id];let count=0;room.root.traverse(o=>{if(o.isMesh){count++;for(const value of o.geometry.attributes.position.array)assert.ok(Number.isFinite(value));}});assert.ok(count<110,id+': '+count);const camera=new T.Vector3(room.layout.x+70,35,70);interiors.setCamera(camera);assert.ok(Math.abs(camera.x-room.layout.x)<room.layout.rx);assert.ok(Math.abs(camera.z)<room.layout.rz);assert.ok(camera.y<room.layout.ceiling);}
 interiors.setActive(null);interiors.dispose();assert.equal(Object.keys(interiors.rooms).length,0);
});
test('one exit control invokes only the active action and fully disables after leaving',()=>{
 const dom=new JSDOM('<div hidden><button></button></div>'),root=dom.window.document.querySelector('div'),button=root.firstChild;let calls=0;const control=createInteractionExitControl({root,button,onExit(){calls++;control.hide();}});
 for(const mode of ['carousel','ferris','lift','bath','footbath','skate','aquarium']){control.show(mode);assert.ok(button.querySelector('svg'));assert.ok(button.textContent.trim());button.click();button.click();assert.ok(root.hidden);assert.ok(button.disabled);}assert.equal(calls,7);control.dispose();dom.window.close();
});
