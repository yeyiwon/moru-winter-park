import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {showTracks,selectShowTrack} from '../dist/show-tracks.js';
import {createFireworkScore} from '../dist/firework-score.js';
import {createWinterFireworks} from '../dist/winter-fireworks.js';
import * as T from '../dist/vendor/three.module.js';
import {createFireworkMusic} from '../dist/firework-music.js';
import {sampleCastleCue} from '../dist/castle-show-score.js';
import {mockAudio} from './audio-context.mjs';
import {gondolaPoints,alpineHeight,skiRunHeight,skiRunCenter,mountainAprons} from '../dist/mountain-layout.js';

test('three full recordings have balanced server selections and independently measured cue times',()=>{
 assert.deepEqual(showTracks.map(t=>Array.from({length:256},(_,b)=>selectShowTrack(b)).filter(x=>x===t).length),[86,85,85]);
 for(const t of showTracks){
  assert.ok(fs.statSync('dist'+t.url).size>1500000);assert.ok(t.duration>70&&t.duration<140);
  const score=createFireworkScore(42,t.id);assert.deepEqual(score,createFireworkScore(42,t.id));assert.ok(score.length>45);
  for(const s of score){assert.ok(s.at>=0&&s.at+s.flight+s.life<t.duration);assert.ok(t.accents.some(a=>Math.abs(a-(s.volleyAt??s.at+s.flight))<1e-8));}
  assert.equal(t.sections.at(-1).end,t.duration);
  for(const section of t.sections)assert.equal(sampleCastleCue(section.start+.1,{},t.id).index,section.cue);
 }
 assert.notDeepEqual(showTracks[0].sections.map(s=>s.start),showTracks[1].sections.map(s=>s.start));
});
test('streamed music seeks late joins, resumes at server time, respects mute, stops and releases one element',async()=>{
 const mock=mockAudio(),context=new mock.Audio(),elements=[],states=[];
 const factory=()=>{const e={paused:true,readyState:1,currentTime:0,load(){},removeAttribute(){},pause(){this.paused=true;},async play(){this.paused=false;}};elements.push(e);return e;};
 const music=createFireworkMusic(context,context.destination,v=>states.push(v),factory),track=showTracks[0],show={id:'a',musicId:track.id,state:'scheduled',startsAt:10000};
 music.update(show,0);assert.equal(elements.length,1);assert.equal(elements[0].paused,true);
 music.update(show,42000);await Promise.resolve();assert.equal(elements[0].currentTime,32);assert.equal(elements[0].loop,false);assert.equal(states.at(-1),true);
 music.update(show,43000,false);assert.equal(elements[0].paused,true);assert.equal(states.at(-1),false);
 music.update(show,65000);await Promise.resolve();await Promise.resolve();assert.equal(elements[0].currentTime,55);assert.equal(elements.length,1);
 music.update({...show,state:'stopped'},66000);assert.equal(elements[0].paused,true);assert.equal(music.media,null);
 music.update({...show,musicId:showTracks[1].id},68000);await Promise.resolve();assert.equal(elements.length,2);
 music.update({...show,musicId:showTracks[1].id},10000+showTracks[1].duration*1000);assert.equal(music.media,null);music.dispose();
});
test('summit cable never overshoots and bottom grade eases continuously to flat snow',()=>{
 for(let i=1;i<gondolaPoints.length;i++){assert.ok(gondolaPoints[i][1]>=gondolaPoints[i-1][1]-1e-9);assert.ok(gondolaPoints[i][1]<=gondolaPoints.at(-1)[1]+1e-9);}
 let last=null,maxChange=0;for(let z=-465;z<-240;z+=.5){const slope=(skiRunHeight(z+.25,'main')-skiRunHeight(z-.25,'main'))/.5;if(last!==null)maxChange=Math.max(maxChange,Math.abs(slope-last));last=slope;}assert.ok(maxChange<.025);assert.ok(Math.abs(last)<.001);
 const a=mountainAprons[1];for(let x=0;x<=35;x+=5)for(let z=-20;z<=20;z+=5)assert.ok(Math.abs(alpineHeight(a.x+x,a.z+z)-a.height)<.001,'mid lift concourse cut into terrain');
});

// A blocked recording must recover on a later user gesture without changing
// the authoritative playhead or silently restarting from the beginning.
test('autoplay denial is exposed for the notice and clears after playback resumes',async()=>{
 const mock=mockAudio(),context=new mock.Audio();let denied=true;
 const element={paused:true,readyState:1,currentTime:0,load(){},removeAttribute(){},pause(){this.paused=true;},async play(){if(denied)throw Object.assign(Error('gesture required'),{name:'NotAllowedError'});this.paused=false;}};
 const music=createFireworkMusic(context,context.destination,()=>{},()=>element),show={id:'blocked',musicId:showTracks[0].id,state:'playing',startsAt:0};
 music.update(show,10000);await new Promise(resolve=>setImmediate(resolve));assert.equal(music.blocked,true);
 denied=false;music.update(show,12000);await new Promise(resolve=>setImmediate(resolve));assert.equal(music.blocked,false);assert.equal(element.currentTime,12);
 music.dispose();assert.equal(music.blocked,false);
});

test('single and paired arcs burst at the far side; seeded shows include fans and ground fountains',()=>{
 for(const track of showTracks)for(const seed of [42,43,44]){
  const score=createFireworkScore(seed,track.id),arcs=score.filter(s=>s.arcHeight);
  assert.ok(arcs.length>=4);assert.ok(arcs.some(s=>s.paired)&&arcs.some(s=>!s.paired));assert.deepEqual(score,createFireworkScore(seed,track.id));
  for(const [i,arc]of arcs.entries()){
   assert.notEqual(arc.pattern,'comet');assert.ok(arc.life>=3.7);assert.ok(arc.launchX*arc.x<0);
   const simultaneous=arcs.filter(s=>s.at===arc.at);assert.equal(simultaneous.length,arc.paired?2:1);if(arc.paired)assert.ok(simultaneous[0].x*simultaneous[1].x<0);
   assert.ok(arc.y+arc.height>75);assert.ok(arc.at+arc.flight+arc.life<track.duration);
  }
  const fans=score.filter(s=>s.fan);assert.ok(fans.length>=10);assert.ok(fans.some(s=>s.x<-60)&&fans.some(s=>s.x>60));
  assert.ok(score.some(s=>s.pattern==='fountain'));
  for(let age=0;age<track.duration;age+=.1)assert.ok(score.filter(s=>age>=s.at&&age<s.at+s.flight+Math.max(s.life,6)+.15).length<=24,'visible score exceeds pool');
 }
 const arrangement=seed=>createFireworkScore(seed,showTracks[0].id).map(({pattern,color,x,fan})=>({pattern,color,x,fan}));
 assert.notDeepEqual(arrangement(42),arrangement(43));assert.notDeepEqual(arrangement(43),arrangement(44));
});

test('fan volleys alternate simultaneous bursts and a stepped cadence without text or isolated icons',async()=>{
 const {fireworkShapes,fireworkMessage}=await import('../dist/firework-shapes.js');
 assert.equal(fireworkMessage,'HAVE A GOOD DAY');
 for(const points of Object.values(fireworkShapes)){assert.ok(points.length<=360);assert.ok(points.every(p=>p.every(Number.isFinite)));}
 for(const track of showTracks){
  const score=createFireworkScore(42,track.id),fans=score.filter(s=>s.fan),groups=[...new Set(fans.map(s=>s.volleyAt))].map(at=>fans.filter(s=>s.volleyAt===at));
  assert.ok(fans.some(s=>s.staggered)&&fans.some(s=>!s.staggered));assert.ok(fans.some(s=>s.reverse));
  for(const volley of groups){assert.equal(volley.length,6);assert.ok(volley.every(s=>s.pattern==='peony'&&s.size>=.9));
   const ordered=[...volley].sort((a,b)=>a.at-b.at);if(volley[0].staggered)assert.ok((ordered.at(-1).x-ordered[0].x)*(volley[0].reverse?-1:1)>0);
   const times=ordered.map(s=>s.at+s.flight);for(let i=1;i<times.length;i++)assert.ok(Math.abs(times[i]-times[i-1]-(volley[0].staggered?.16:0))<1e-7);
  }
  assert.ok(!score.some(s=>s.pattern==='heart'));assert.ok(!score.some(s=>['bear','cat','rabbit','dog'].includes(s.pattern)));
  assert.deepEqual(Object.keys(fireworkShapes),['heart','message']);
  assert.equal(score.filter(s=>s.pattern==='message').length,0);
 }
});

test('one late paired wheel and a layered finale stay inside the unchanged particle pool',()=>{
 for(const track of showTracks)for(let seed=0;seed<32;seed++){
  const score=createFireworkScore(seed,track.id);
  assert.ok(!score.some(s=>s.pattern==='mine'));
  const wheels=score.filter(s=>s.pattern==='wheel');assert.equal(wheels.length,2);assert.equal(wheels[0].at,wheels[1].at);assert.ok(wheels.every(s=>s.at+s.flight>=track.duration*.68&&s.height>75));assert.ok(!score.some(s=>s.pattern==='spiral'));assert.equal(wheels[0].x,-wheels[1].x);
  assert.equal(score.filter(s=>s.pattern==='heart').length,0);
  const finale=score.filter(s=>s.finale),coda=track.sections.find(s=>s.afterglow).start;
  assert.ok(finale.length>=20);assert.ok(finale.every(s=>s.at+s.flight<coda));
  assert.ok(finale.some(s=>s.pattern==='willow')&&finale.some(s=>s.pattern==='glitter'));
  assert.ok(Math.max(...finale.map(s=>s.height))>Math.max(...score.filter(s=>!s.finale).map(s=>s.height)));
  assert.ok(finale.every(s=>s.pattern!=='wheel'&&s.pattern!=='message'));
  assert.ok(finale.some(s=>s.x<-70)&&finale.some(s=>s.x>70));
  for(let age=0;age<track.duration;age+=.15)assert.ok(score.filter(s=>age>=s.at&&age<s.at+s.flight+Math.max(s.life,6)+.15).length<=24);
 }
});

test('finale retains its full layered layout on every quality and frees the existing draw range',()=>{
 for(const quality of ['high','medium','low']){
  const show=createWinterFireworks(new T.Scene()),track=showTracks[2],score=createFireworkScore(42,track.id),finale=score.filter(s=>s.finale);
  show.setQuality(quality);show.setShow({id:'finale',startsAt:0,endsAt:track.duration*1000,musicId:track.id,seed:42,state:'playing'});
  const age=Math.max(...finale.map(s=>s.at+s.flight))+.25;
  show.update(age*1000);
  const g=show.root.geometry,buffer=g.attributes.position.array,{design,timing}=g.attributes;
  const expected=score.filter(s=>age>=s.at&&age<s.at+s.flight+Math.max(s.life,6)+.15);
  const starts=new Set(Array.from({length:g.drawRange.count},(_,i)=>timing.getX(i)));
  for(const shell of expected)assert.ok([...starts].some(at=>Math.abs(at-shell.at)<.00001),'late finale shell was dropped');
  assert.ok(g.drawRange.count<=360*6*24);
  assert.ok(Array.from({length:g.drawRange.count},(_,i)=>design.getX(i)).every(kind=>kind!==10));
  show.update((age+.1)*1000);assert.equal(g.attributes.position.array,buffer);
  show.update(track.duration*1000);assert.equal(g.drawRange.count,0);show.dispose();
 }
});

test('slow mobile seeks finish rather than being restarted every frame',async()=>{
 const {Audio}=mockAudio(),context=new Audio();let time=0,clock=10000,readyAt=0,seeks=0,finished=0;
 const element={paused:true,readyState:4,seeking:false,load(){},removeAttribute(){},pause(){this.paused=true;},async play(){this.paused=false;},get currentTime(){return time;},set currentTime(v){time=v;this.seeking=true;readyAt=clock+300;seeks++;}};
 const music=createFireworkMusic(context,context.destination,()=>{},()=>element),show={id:'slow',musicId:showTracks[0].id,state:'playing',startsAt:0};
 for(let n=0;n<120;n++){clock=10000+n*1000/60;if(element.seeking&&clock>=readyAt){element.seeking=false;finished++;}if(!element.seeking&&!element.paused)time+=1/60;music.update(show,clock);await Promise.resolve();}
 assert.equal(seeks,1);assert.equal(finished,1);assert.equal(element.seeking,false);assert.ok(Math.abs(time-clock/1000)<.4);
 music.update(show,clock,false);music.update(show,clock+3000);assert.equal(seeks,2,'resume aligns once');music.dispose();
});
test('buffer starvation does not cause seeking and a real sustained drift is corrected once',async()=>{
 const {Audio}=mockAudio(),context=new Audio();let time=10,seeks=0;
 const element={paused:true,readyState:4,seeking:false,load(){},removeAttribute(){},pause(){this.paused=true;},async play(){this.paused=false;},get currentTime(){return time;},set currentTime(v){time=v;seeks++;}};
 const music=createFireworkMusic(context,context.destination,()=>{},()=>element),show={id:'stall',musicId:showTracks[0].id,state:'playing',startsAt:0};music.update(show,10000);await new Promise(r=>setImmediate(r));element.readyState=2;
 for(let now=13000;now<17000;now+=100)music.update(show,now);assert.equal(seeks,0,'buffering remains decoder-owned');element.readyState=4;
 for(let now=17000;now<19000;now+=100){music.update(show,now);time+=.1;}assert.equal(seeks,1);music.dispose();
});
test('blocked mobile media can play directly inside a gesture without losing mute',async()=>{
 const {Audio}=mockAudio(),context=new Audio();let gesture=false;
 const element={paused:true,readyState:4,currentTime:0,load(){},removeAttribute(){},pause(){this.paused=true;},play(){if(!gesture)return Promise.reject(Object.assign(Error('gesture'),{name:'NotAllowedError'}));this.paused=false;return Promise.resolve();}};
 const music=createFireworkMusic(context,context.destination,()=>{},()=>element),show={id:'gesture',musicId:showTracks[0].id,state:'playing',startsAt:0};music.update(show,10000);await new Promise(r=>setImmediate(r));assert.equal(music.blocked,true);
 gesture=true;music.resumeFromGesture();gesture=false;await new Promise(r=>setImmediate(r));assert.equal(element.paused,false);assert.equal(music.blocked,false);
 music.update(show,12000,false);gesture=true;music.resumeFromGesture();assert.equal(element.paused,true);music.dispose();
});
