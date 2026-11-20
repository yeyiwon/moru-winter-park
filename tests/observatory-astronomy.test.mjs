import test from 'node:test';
import assert from 'node:assert/strict';
import {julianDate,siderealDegrees,precessJ2000,horizontalVector,observatoryMeteor} from '../dist/observatory-astronomy.js';
import {starCatalog,constellationCatalog} from '../dist/observatory-catalog.js';
import {createCameraPolicy} from '../dist/camera-policy.js';
const near=(a,b,tolerance=1e-6)=>assert.ok(Math.abs(a-b)<tolerance,`${a} ≠ ${b}`);
test('J2000 noon and east-positive longitude follow the GMST reference',()=>{
 const epoch=Date.UTC(2000,0,1,12);near(julianDate(epoch),2451545);near(siderealDegrees(epoch),280.46061837);near(siderealDegrees(epoch,45),325.46061837);
 const p=precessJ2000(83.822,-5.391,epoch);near(p[0],83.822);near(p[1],-5.391);
});
test('horizontal projection is east/up/south with zenith, polar and horizon anchors',()=>{
 const epoch=Date.UTC(2026,10,20),site={latitude:37.5665,longitude:126.978},lst=siderealDegrees(epoch,site.longitude),zenith=horizontalVector(lst,site.latitude,epoch,site),pole=horizontalVector(0,90,epoch,site),east=horizontalVector(lst+90,0,epoch,site);
 near(zenith[0],0);near(zenith[1],1);near(zenith[2],0);near(Math.asin(pole[1])*180/Math.PI,site.latitude);near(east[0],1);near(east[1],0);assert.ok(pole[2]<0);
});
test('catalogue stars are distinct, sorted real HIP entries and every constellation edge resolves',()=>{
 assert.ok(starCatalog.length>=5000);const ids=new Set();let last=-Infinity;
 for(const [id,ra,dec,mag,bv]of starCatalog){assert.ok(!ids.has(id));ids.add(id);assert.ok(ra>=0&&ra<360&&Math.abs(dec)<=90);assert.ok(mag>=last&&mag<=6);last=mag;assert.ok(bv===null||Number.isFinite(bv));}
 assert.equal(constellationCatalog.length,6);for(const spec of constellationCatalog)for(const pair of spec.edges)for(const id of pair)assert.ok(ids.has(id));
});
test('meteor timing is deterministic, rare and shorter than a second',()=>{
 const start=Date.UTC(2026,10,20);let total=0,run=0,max=0;for(let t=0;t<3600000;t+=100){const a=observatoryMeteor(start+t);assert.deepEqual(a,observatoryMeteor(start+t));if(a.active){total++;run++;max=Math.max(max,run);}else run=0;}
 assert.ok(total>0&&total<500);assert.ok(max<=9);
});
test('observatory looks almost vertically up and preserves separate outdoor and indoor preferences',()=>{
 const policy=createCameraPolicy();policy.orbit(73,-35);const outside=policy.snapshot();policy.setContext('museum');policy.orbit(0,-1000);near(policy.snapshot().pitch,-1.42);policy.zoom(2);const inside=policy.snapshot();policy.setContext(null);for(const key of ['yaw','pitch','distance'])near(policy.snapshot()[key],outside[key]);policy.setContext('museum');for(const key of ['yaw','pitch','distance'])near(policy.snapshot()[key],inside[key]);
});
