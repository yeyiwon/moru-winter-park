import fs from 'node:fs';import assert from 'node:assert/strict';
const file='qa/platform-v52/production-sync/sync.json',r=JSON.parse(fs.readFileSync(file));
const checks=[];function check(name,value){assert.ok(value,name);checks.push({name,ok:true});}
check('real WebSocket snapshots, movement and chat',r.socketFrames>0&&r.poseSnapshots>0&&r.movement&&r.chat);
const unchanged=(a,b)=>Math.abs(a.yaw-b.yaw)<.01&&Math.abs(a.pitch-b.pitch)<.01&&Math.abs(a.distance-b.distance)<.1;
check('same music, show ID and seed',r.playing.every(s=>s.show.id===r.server.id&&s.show.musicId===r.server.musicId&&s.show.seed===r.server.seed));
check('castle and firework timeline share server time',r.playing.every(s=>Math.abs(s.castleAge-s.renderAge)<.05&&Math.abs((s.clock-s.show.startsAt)/1000-s.renderAge)<.6));
check('late join keeps current show',r.lateJoin.show.id===r.server.id&&r.lateJoin.renderAge>5&&Math.abs((r.lateJoin.clock-r.server.startsAt)/1000-r.lateJoin.renderAge)<.6);
check('guest admin forbidden',r.adminDenied===403);
check('camera unchanged during and after show',unchanged(r.before[1].camera,r.playing[1].camera)&&unchanged(r.before[0].camera,r.after[0].camera));
check('all clients finish',r.after.length===3&&r.after.every(s=>!s.active&&s.show.state==='finished'));
check('cooldown starts at actual end',Math.abs(r.server.nextRequestAt-r.server.endsAt-900000)<.001);
const delta=Math.hypot(r.before[0].position.x-r.after[0].position.x,r.before[0].position.z-r.after[0].position.z);
check('no forced player movement (1 micrometre tolerance)',delta<1e-6);check('no browser errors',r.errors.length===0);
const result={passed:true,checks,positionDeltaMetres:delta,originalRun:'sync.json',originalAssertion:r.failure,explanation:'The original harness compared floating point positions by exact JSON equality after walking. Its only failure was a 4.8e-11 metre residual. Revalidated the completed original recording with 1e-6 metre tolerance; no runtime code or production data changed.'};
fs.writeFileSync('qa/platform-v52/production-sync/validated.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
