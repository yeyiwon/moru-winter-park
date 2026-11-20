import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {showTracks,selectShowTrack} from '../dist/show-tracks.js';
import {createFireworkScore} from '../dist/firework-score.js';
import {createFireworkMusic} from '../dist/firework-music.js';
import {sampleCastleCue} from '../dist/castle-show-score.js';
import {mockAudio} from './audio-context.mjs';
import {gondolaPoints,alpineHeight,skiRunHeight,skiRunCenter,mountainAprons} from '../dist/mountain-layout.js';

test('two full recordings have equally sized server selections and independently measured cue times',()=>{
 assert.deepEqual(showTracks.map(t=>Array.from({length:256},(_,b)=>selectShowTrack(b)).filter(x=>x===t).length),[128,128]);
 for(const t of showTracks){
  assert.ok(fs.statSync('dist'+t.url).size>3000000);assert.ok(t.duration>110&&t.duration<140);
  const score=createFireworkScore(42,t.id);assert.deepEqual(score,createFireworkScore(42,t.id));assert.ok(score.length>45);
  for(const s of score){assert.ok(s.at>=0&&s.at+s.flight+s.life<t.duration);assert.ok(t.accents.some(a=>Math.abs(a-s.at-s.flight)<1e-8));}
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
