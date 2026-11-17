import test from 'node:test';import assert from 'node:assert/strict';
import {createNavigationClient} from '../dist/navigation-client.js';
import {createStaticColliderIndex} from '../dist/collision-grid.js';
test('only the newest click is queued and movement cancellation rejects stale worker results',async()=>{
 let worker;class Worker{constructor(){worker=this;this.sent=[];}postMessage(value){this.sent.push(value);}terminate(){this.stopped=true;}}
 const client=createNavigationClient(()=>assert.fail('should use worker'),{WorkerClass:Worker});const a=client.request({x:0,z:0},{x:1,z:1}),b=client.request({x:0,z:0},{x:2,z:2}),c=client.request({x:0,z:0},{x:3,z:3});assert.equal(worker.sent.length,1);assert.equal(await a,null);assert.equal(await b,null);worker.onmessage({data:{id:worker.sent[0].id,route:[{x:1,z:1}]}});assert.equal(worker.sent.length,2);assert.equal(worker.sent[1].end.x,3);client.cancel();worker.onmessage({data:{id:worker.sent[1].id,route:[{x:3,z:3}]}});assert.equal(await c,null);client.dispose();assert.ok(worker.stopped);
});
test('unsupported or failed workers retain navigation with a single fallback',async()=>{
 const expected=[{x:2,z:4}],fallback=()=>expected;assert.deepEqual(await createNavigationClient(fallback,{WorkerClass:null}).request({x:0,z:0},expected[0]),expected);
 let worker;class Broken{constructor(){worker=this;}postMessage(){}terminate(){}}
 const client=createNavigationClient(fallback,{WorkerClass:Broken}),pending=client.request({x:0,z:0},expected[0]);worker.onerror();assert.deepEqual(await pending,expected);assert.equal(client.threaded,false);client.dispose();assert.doesNotThrow(()=>worker.onerror());
});
test('broad phase covers boundary cells, large rectangles and ellipses without losing an exact hit',()=>{
 const obstacles=[{x:-12,z:0,r:4},{x:2,z:20,rx:9,rz:2},{x:0,z:0,w:18,d:4}],index=createStaticColliderIndex(obstacles,{padding:.35});
 for(let x=-30;x<=30;x+=.4)for(let z=-12;z<=25;z+=.4){const hits=obstacles.filter(o=>o.rx?((x-o.x)/(o.rx+.35))**2+((z-o.z)/(o.rz+.35))**2<1:o.r?Math.hypot(x-o.x,z-o.z)<o.r+.35:Math.abs(x-o.x)<o.w+.35&&Math.abs(z-o.z)<o.d+.35);for(const hit of hits)assert.ok(index.query(x,z).includes(hit));}
});
