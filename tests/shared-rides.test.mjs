import {diningFacility,diningSeats} from '../dist/dining-seats.js';
import {sharedRestPoseValid} from '../dist/ride-seats.js';
import {canStandAt} from '../dist/movement.js';
import {benches,benchAccess,benchPoseValid} from '../dist/bench-layout.js';
import {alpineShift,resortRides,liftLayout} from '../dist/resort-layout.js';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
import {ferrisDimensions} from '../dist/ferris-layout.js';
import {rideAPI,listRideSeats} from '../server/ride-api.js';import {sharedSeatPose} from '../dist/ride-seats.js';import {buildFerrisWheel} from '../dist/ferris-model.js';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ride-seats-')),db=path.join(temp,'test.sqlite');
function q(sql,args=[]){const r=spawnSync('python3',['-c','import sqlite3,json,sys\np=json.load(sys.stdin);c=sqlite3.connect(p["db"]);c.row_factory=sqlite3.Row;r=c.execute(p["sql"],p["args"]);rows=[dict(v) for v in r.fetchall()];n=c.total_changes;c.commit();print(json.dumps({"results":rows,"meta":{"changes":n}}))'],{input:JSON.stringify({db,sql,args}),encoding:'utf8'});if(r.status)throw Error(r.stderr);return JSON.parse(r.stdout);}
q(fs.readFileSync('drizzle/0007_shared_ride_seats.sql','utf8'));const DB={prepare(sql){return{bind(...args){return{async run(){return q(sql,args)},async all(){return q(sql,args)},async first(){return q(sql,args).results[0]||null}}}}}};
const now=1800000000000;const visitor=(id,room='test-room')=>({id,room,...ferrisDimensions.entrance});const req=(self,kind='ferris',time=now,method='POST')=>rideAPI(new Request('https://winter.test/api/ride',{method,body:method==='POST'?JSON.stringify({kind}):undefined}),DB,self,time);
test('simultaneous guests get independent seats, no duplicates; exit and expiry release seats',async()=>{const [a,b,c]=await Promise.all(['a','b','c'].map(id=>req(visitor(id))));assert.equal(a.status,200);assert.equal(b.status,200);assert.equal(c.status,409);const pa=(await a.json()).reservation,pb=(await b.json()).reservation;assert.equal(pa.cabin,pb.cabin);assert.notEqual(pa.seat,pb.seat);assert.equal((await req(visitor('d','other-room'))).status,200);assert.equal((await req(visitor('a'),'ferris',now,'DELETE')).status,200);assert.equal((await listRideSeats(DB,'test-room',now)).length,1);assert.equal((await req(visitor('c'))).status,200);assert.equal((await req(visitor('e'),'ferris',now+21000)).status,200);});
test('both lift seats share departure time and their positions remain separated',async()=>{const a={id:'lift-a',room:'lift-room',x:liftLayout.x,z:(-185+alpineShift)},b={...a,id:'lift-b'};const pa=await(await req(a,'lift')).json(),pb=await(await req(b,'lift',now+1000)).json();assert.equal(pa.reservation.startedAt,now);assert.equal(pa.reservation.startedAt,pb.reservation.startedAt);assert.ok(sharedSeatPose(pa.reservation,now+300).z<sharedSeatPose(pa.reservation,now).z);for(let elapsed=0;elapsed<=resortRides.lift.duration;elapsed+=.25){const p=sharedSeatPose(pa.reservation,now+elapsed*1000),q=sharedSeatPose(pb.reservation,now+elapsed*1000);assert.ok(Math.abs(Math.hypot(p.x-q.x,p.z-q.z)-1.9)<1e-8);assert.equal(p.y,q.y);}});
test('authoritative ferris coordinates match both actual model sockets throughout a full revolution',()=>{const model=buildFerrisWheel();for(let t=0;t<240;t+=7){model.update(t);for(let cabin=0;cabin<12;cabin++)for(const seat of [0,1]){const a=sharedSeatPose({kind:'ferris',cabin,seat},t*1000),b=model.seat(cabin,seat);assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<1e-7);assert.ok(Math.abs(Math.sin(a.yaw-b.yaw))<1e-8);assert.ok(Math.cos(a.yaw-b.yaw)>.999999);}}});
test('two bench places are authoritative, room-local, renewable and released independently',async()=>{
 const bench=benches.find(b=>b.id==='park-bench-0'),spot=benchAccess(bench);
 const claim=(id,changes={})=>rideAPI(new Request('https://winter.test/api/ride',{method:'POST',body:JSON.stringify({kind:'bench',benchId:bench.id})}),DB,{id,room:'bench-room',region:'outdoors',...spot,...changes},now);
 const ids=['sit-a','sit-b','sit-c'],responses=await Promise.all(ids.map(id=>claim(id))),accepted=responses.map((r,i)=>({r,id:ids[i]})).filter(v=>v.r.status===200),rejected=ids[responses.findIndex(r=>r.status===409)];assert.equal(accepted.length,2);assert.ok(rejected);const [a,b]=accepted.map(v=>v.r);
 const aa=(await a.json()).reservation,bb=(await b.json()).reservation;assert.notEqual(aa.seat,bb.seat);const pa=sharedSeatPose(aa,now),pb=sharedSeatPose(bb,now);assert.ok(Math.hypot(pa.x-pb.x,pa.z-pb.z)>1.8);assert.ok(benchPoseValid(aa,pa));assert.equal(benchPoseValid(aa,{...pa,x:pa.x+1}),false);
 assert.equal((await claim('far',{x:100,z:100})).status,400);assert.equal((await claim('wrong-room',{region:'museum'})).status,400);
 await rideAPI(new Request('https://winter.test/api/ride',{method:'DELETE'}),DB,{id:accepted[0].id},now);assert.equal((await claim(rejected)).status,200);assert.ok((await listRideSeats(DB,'bench-room',now)).some(p=>p.id===accepted[1].id));
});
test.after(()=>fs.rmSync(temp,{recursive:true,force:true}));

test('every shared bench has a walkable approach outside furniture collisions',()=>{for(const b of benches){const p=benchAccess(b);assert.ok(canStandAt(p.x,p.z),b.id);}});

test('omakase assigns only its three free stools atomically, preserves positions and releases',async()=>{
 const claim=(id,changes={},time=now)=>rideAPI(new Request('https://winter.test/api/ride',{method:'POST',body:JSON.stringify({kind:'dining',benchId:diningFacility.id})}),DB,{...diningFacility,id,room:'dining-room',...changes},time);
 const guests=['dining-a','dining-b','dining-c','dining-d'];const responses=await Promise.all(guests.map(id=>claim(id)));
 assert.deepEqual(responses.map(r=>r.status).sort(),[200,200,200,409]);const loser=guests[responses.findIndex(r=>r.status===409)],winner=guests[responses.findIndex(r=>r.status===200)];const seats=await Promise.all(responses.filter(r=>r.status===200).map(async r=>(await r.json()).reservation));assert.equal(new Set(seats.map(s=>s.cabin)).size,3);
 for(const seat of seats){const pose=sharedSeatPose(seat,now);assert.ok(diningSeats.some(s=>s.x===pose.x&&s.z===pose.z));assert.ok(sharedRestPoseValid(seat,pose));assert.equal(sharedRestPoseValid(seat,{...pose,x:pose.x+2}),false);assert.equal(sharedRestPoseValid(seat,{...pose,mode:'rest'}),false);}
 assert.equal((await claim('wrong-dining',{region:'museum'})).status,400);assert.equal((await claim('far-dining',{x:400,z:10})).status,400);
 await rideAPI(new Request('https://winter.test/api/ride',{method:'DELETE'}),DB,{id:winner},now);assert.equal((await claim(loser)).status,200);assert.equal((await claim('expired-dining',{},now+21000)).status,200);
});
