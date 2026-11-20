import {canStandAt} from '../dist/movement.js';
import {benches,benchAccess,benchPoseValid} from '../dist/bench-layout.js';
import {alpineShift,resortRides,liftLayout,ridgeLiftEntry,gondolaEntry} from '../dist/resort-layout.js';
import {gondolaSchedule} from '../dist/ride-seats.js';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
import {ferrisDimensions} from '../dist/ferris-layout.js';
import {rideAPI,listRideSeats} from '../server/ride-api.js';import {sharedSeatPose} from '../dist/ride-seats.js';import {buildFerrisWheel} from '../dist/ferris-model.js';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ride-seats-')),db=path.join(temp,'test.sqlite');
function q(sql,args=[]){const r=spawnSync('python3',['-c','import sqlite3,json,sys\np=json.load(sys.stdin);c=sqlite3.connect(p["db"]);c.row_factory=sqlite3.Row;r=c.execute(p["sql"],p["args"]);rows=[dict(v) for v in r.fetchall()];n=c.total_changes;c.commit();print(json.dumps({"results":rows,"meta":{"changes":n}}))'],{input:JSON.stringify({db,sql,args}),encoding:'utf8'});if(r.status)throw Error(r.stderr);return JSON.parse(r.stdout);}
q(fs.readFileSync('drizzle/0007_shared_ride_seats.sql','utf8'));const DB={prepare(sql){return{bind(...args){return{async run(){return q(sql,args)},async all(){return q(sql,args)},async first(){return q(sql,args).results[0]||null}}}}}};
for(const statement of fs.readFileSync('drizzle/0018_gondola_seats.sql','utf8').split('--> statement-breakpoint'))if(statement.trim())q(statement);
const now=1800000000000;const visitor=(id,room='test-room')=>({id,room,...ferrisDimensions.entrance});const req=(self,kind='ferris',time=now,method='POST')=>rideAPI(new Request('https://winter.test/api/ride',{method,body:method==='POST'?JSON.stringify({kind}):undefined}),DB,self,time);
test('simultaneous guests get independent seats, no duplicates; exit and expiry release seats',async()=>{const [a,b,c]=await Promise.all(['a','b','c'].map(id=>req(visitor(id))));assert.equal(a.status,200);assert.equal(b.status,200);assert.equal(c.status,409);const pa=(await a.json()).reservation,pb=(await b.json()).reservation;assert.equal(pa.cabin,pb.cabin);assert.notEqual(pa.seat,pb.seat);assert.equal((await req(visitor('d','other-room'))).status,200);assert.equal((await req(visitor('a'),'ferris',now,'DELETE')).status,200);assert.equal((await listRideSeats(DB,'test-room',now)).length,1);assert.equal((await req(visitor('c'))).status,200);assert.equal((await req(visitor('e'),'ferris',now+21000)).status,200);});
test('both lift seats share departure time and their positions remain separated',async()=>{const a={id:'lift-a',room:'lift-room',x:liftLayout.x,z:(-185+alpineShift)},b={...a,id:'lift-b'};const pa=await(await req(a,'lift')).json(),pb=await(await req(b,'lift',now+1000)).json();assert.equal(pa.reservation.startedAt,now);assert.equal(pa.reservation.startedAt,pb.reservation.startedAt);assert.ok(sharedSeatPose(pa.reservation,now+300).z<sharedSeatPose(pa.reservation,now).z);for(let elapsed=0;elapsed<=resortRides.lift.duration;elapsed+=.25){const p=sharedSeatPose(pa.reservation,now+elapsed*1000),q=sharedSeatPose(pb.reservation,now+elapsed*1000);assert.ok(Math.abs(Math.hypot(p.x-q.x,p.z-q.z)-1.9)<1e-8);assert.equal(p.y,q.y);}});
test('authoritative ferris coordinates match both actual model sockets throughout a full revolution',()=>{const model=buildFerrisWheel();for(let t=0;t<240;t+=7){model.update(t);for(let cabin=0;cabin<12;cabin++)for(const seat of [0,1]){const a=sharedSeatPose({kind:'ferris',cabin,seat},t*1000),b=model.seat(cabin,seat);assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<1e-7);assert.ok(Math.abs(Math.sin(a.yaw-b.yaw))<1e-8);assert.ok(Math.cos(a.yaw-b.yaw)>.999999);}}});
test('two bench places are authoritative, room-local, renewable and released independently',async()=>{
 const bench=benches.find(b=>b.id==='park-bench-0'),spot=benchAccess(bench);
 const claim=(id,changes={},seat=id==='sit-b'?1:0)=>rideAPI(new Request('https://winter.test/api/ride',{method:'POST',body:JSON.stringify({kind:'bench',benchId:bench.id,seat})}),DB,{id,room:'bench-room',region:'outdoors',...spot,...changes},now);
 const [a,b,c]=await Promise.all(['sit-a','sit-b','sit-c'].map(id=>claim(id)));assert.equal(a.status,200);assert.equal(b.status,200);assert.equal(c.status,409);
 const aa=(await a.json()).reservation,bb=(await b.json()).reservation;assert.notEqual(aa.seat,bb.seat);const pa=sharedSeatPose(aa,now),pb=sharedSeatPose(bb,now);assert.ok(Math.hypot(pa.x-pb.x,pa.z-pb.z)>1.8);assert.ok(benchPoseValid(aa,pa));assert.equal(benchPoseValid(aa,{...pa,x:pa.x+1}),false);
 assert.equal((await claim('far',{x:100,z:100})).status,400);assert.equal((await claim('wrong-room',{region:'museum'})).status,400);
 await rideAPI(new Request('https://winter.test/api/ride',{method:'DELETE'}),DB,{id:'sit-a'},now);assert.equal((await claim('sit-c')).status,200);assert.ok((await listRideSeats(DB,'bench-room',now)).some(p=>p.id==='sit-b'));
});
test.after(()=>fs.rmSync(temp,{recursive:true,force:true}));

test('every shared bench has a walkable approach outside furniture collisions',()=>{for(const b of benches){const p=benchAccess(b);assert.ok(canStandAt(p.x,p.z),b.id);}});

test('exact bench choice is atomic, retryable and never changes to the other seat',async()=>{
 const bench=benches.find(b=>b.id==='ryokan-tea-bench'),spot=benchAccess(bench),self=id=>({id,room:'exact-bench-room',region:'ryokan',...spot});
 const claim=(id,seat)=>rideAPI(new Request('https://winter.test/api/ride',{method:'POST',body:JSON.stringify({kind:'bench',benchId:bench.id,seat})}),DB,self(id),now);
 const responses=await Promise.all(['exact-a','exact-b','exact-c'].map(id=>claim(id,1)));assert.equal(responses.filter(r=>r.status===200).length,1);assert.equal(responses.filter(r=>r.status===409).length,2);
 const [winner]=await listRideSeats(DB,'exact-bench-room',now);assert.equal(winner.seat,1);assert.equal((await claim(winner.id,1)).status,200);assert.equal((await claim(winner.id,0)).status,409);
 const next=await claim('exact-other',0);assert.equal(next.status,200);assert.equal((await next.json()).reservation.seat,0);
 for(const seat of [null,-1,2,'0'])assert.equal((await claim('invalid-bench-'+seat,seat)).status,400);
});

test('automatic seats fill free places concurrently, retry idempotently and preserve the other guest',async()=>{
 const bench=benches.find(b=>b.id==='tree-bench-0')||benches[0],spot=benchAccess(bench),self=id=>({id,room:'auto-bench-room',region:bench.region,...spot});
 const claim=id=>rideAPI(new Request('https://winter.test/api/ride',{method:'POST',body:JSON.stringify({kind:'bench',benchId:bench.id})}),DB,self(id),now);
 const responses=await Promise.all(['auto-a','auto-b','auto-c'].map(claim));assert.equal(responses.filter(r=>r.status===200).length,2);assert.equal(responses.filter(r=>r.status===409).length,1);
 const rows=await listRideSeats(DB,'auto-bench-room',now);assert.equal(new Set(rows.map(s=>s.seat)).size,2);for(const row of rows){const retry=await claim(row.id);assert.equal((await retry.json()).reservation.seat,row.seat);}
 await rideAPI(new Request('https://winter.test/api/ride',{method:'DELETE'}),DB,self(rows[0].id),now);assert.equal((await claim('auto-new')).status,200);
 assert.ok((await listRideSeats(DB,'auto-bench-room',now)).some(s=>s.id===rows[1].id));
});

test('six gondola seats share a cabin atomically, reject the seventh and reopen on release',async()=>{
 const time=Math.floor(now/gondolaSchedule.interval)*gondolaSchedule.interval+3000,self=id=>({id,room:'gondola-room',region:'outdoors',...gondolaEntry});
 const responses=await Promise.all(Array.from({length:7},(_,i)=>req(self('gondola-'+i),'gondola',time)));
 assert.equal(responses.filter(r=>r.status===200).length,6);assert.equal(responses.filter(r=>r.status===409).length,1);
 const seats=await listRideSeats(DB,'gondola-room',time);assert.equal(new Set(seats.map(s=>s.seat)).size,6);assert.equal(new Set(seats.map(s=>s.startedAt)).size,1);
 for(let t=6;t<756;t+=2){const positions=seats.map(s=>sharedSeatPose(s,s.startedAt+t*1000));for(let i=0;i<6;i++)for(let j=0;j<i;j++)assert.ok(Math.hypot(positions[i].x-positions[j].x,positions[i].z-positions[j].z)>1);}
 await req(self(seats[0].id),'gondola',time,'DELETE');assert.equal((await req(self('gondola-new'),'gondola',time)).status,200);
 assert.equal((await req(self('gondola-closed'),'gondola',time+6000)).status,409);assert.equal((await req({...self('gondola-far'),x:0,z:0},'gondola',time)).status,400);
});

test('mid-mountain lift claims two seats at its own station and rejects base-station boarding',async()=>{const self={id:'ridge-a',room:'ridge-room',...ridgeLiftEntry};const a=await(await req(self,'ridgelift',now)).json(),b=await(await req({...self,id:'ridge-b'},'ridgelift',now+200)).json();assert.equal(a.reservation.startedAt,b.reservation.startedAt);assert.notEqual(a.reservation.seat,b.reservation.seat);const p=sharedSeatPose(a.reservation,now+50000);assert.ok(p.z<ridgeLiftEntry.z);assert.equal((await req({id:'ridge-far',room:'ridge-room',x:0,z:0},'ridgelift',now)).status,400);});

test('gondola exit requires an owned open-station seat and retries keep the same transition',async()=>{
 const cabin=Math.floor(now/gondolaSchedule.interval)*gondolaSchedule.interval,boardAt=cabin+3000,self={id:'exit-a',room:'exit-room',region:'outdoors',...gondolaEntry};
 const response=await req(self,'gondola',boardAt);assert.equal(response.status,200);
 const reservation=(await response.json()).reservation,arrival=cabin+(resortRides.gondola.boardingSeconds+resortRides.gondola.duration+2.1)*1000;
 q('UPDATE ride_seats SET expires_at=? WHERE visitor=?',[arrival+20000,self.id]);
 const exit=(who,time)=>rideAPI(new Request('https://winter.test/api/ride',{method:'POST',body:JSON.stringify({kind:'gondola',action:'exit'})}),DB,who,time);
 assert.equal((await exit(self,cabin+30000)).status,409);
 assert.equal((await exit({...self,id:'exit-stranger'},arrival)).status,409);
 assert.equal((await exit({...self,room:'other-room'},arrival)).status,409);
 const leaving=await exit(self,arrival);assert.equal(leaving.status,200);const pose=(await leaving.json()).reservation;
 assert.equal(pose.cabin,reservation.cabin);assert.equal(pose.seat,reservation.seat);assert.equal(pose.startedAt,arrival);
 const retry=await exit(self,arrival+500);assert.equal(retry.status,200);assert.equal((await retry.json()).reservation.startedAt,arrival);
 const start=sharedSeatPose(pose,arrival),end=sharedSeatPose(pose,arrival+5000);assert.equal(start.transition,'exiting');assert.equal(end.transitionDone,true);
});
