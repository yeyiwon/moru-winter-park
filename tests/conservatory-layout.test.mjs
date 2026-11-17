import {spaShift} from '../dist/resort-layout.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {landforms,islands,bridges,surfaceHeight} from '../dist/world-layout.js';
import {interiorRooms,interiorPositionValid} from '../dist/interior-layout.js';
import {findPath,clearSegment} from '../dist/navigation.js';
import {moveOnGround} from '../dist/movement.js';
import {mapFacilities} from '../dist/world-map.js';
test('greenhouse and interior are removed; park connects directly to spa',()=>{
 assert.ok(!islands.some(i=>i.id==='nature'));assert.ok(!landforms.some(i=>i.id==='nature'));assert.equal(interiorRooms.conservatory,undefined);assert.equal(interiorPositionValid(500,.95,0),false);assert.ok(!mapFacilities.some(p=>p.id==='greenhouse'));
 const a={x:0,z:24},b={x:0,z:96+spaShift};assert.equal(findPath(a,b).length,1);assert.ok(clearSegment(a,b));assert.ok(bridges.some(([a,b])=>a.z===30&&b.z===91+spaShift));
 for(const x of [-2.7,0,2.7]){let p={x,z:24};for(let i=0;i<360;i++)p=moveOnGround(p,{x:0,z:6},1/60);assert.ok(p.z>55);assert.ok(surfaceHeight(x,44)<1);}
});
