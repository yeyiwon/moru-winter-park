import {showTrack} from './show-tracks.js';
import {castleShowCues} from './castle-show-score.js';
// Original WINTERLIGHT score. All effects use the same server time and seed.
export const fireworkConfig=Object.freeze({duration:castleShowCues.at(-1).start+castleShowCues.at(-1).duration,leadMs:5000,cooldownMs:5*60000,auto:false,intervalMs:5*60000});
export const fireworkPatterns=['chrysanthemum','peony','willow','ring','glitter','star','comet','fountain','double','heart','message','wheel'];
export function fireworkRandom(seed){let state=seed>>>0||1;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
export function showEnvelope(age,duration=fireworkConfig.duration){return Math.max(0,Math.min(1,age/3,(duration-age)/4));}
export function createFireworkScore(seed=1,musicId){
 const random=fireworkRandom(seed),score=[];
 const add=(at,pattern,x,height,color,size=1)=>score.push({at,pattern,x,y:5,z:-68-random()*16,launchX:Math.sign(x)*23,launchZ:-32,height,flight:2.35+random()*.25,color,size,life:pattern==='willow'?5.1:pattern==='glitter'?3.7:4,tilt:(random()-.5)*1.2,wind:(random()-.5)*.7});
 const track=showTrack(musicId);
 if(track){
  let previous=-10,sequence=0,arcSequence=0,fanSequence=0;
  // The server seed selects one shared visual arrangement, never local randomness.
  const style=(seed>>>0)%3,patternOffset=style*2,colorOffset=style;
  const accents=[['#ff264e','#276dff','#a638ff'],['#2864ff','#dd35ff','#ff3b46'],['#a63aff','#ff285d','#24b9ff']][style];
  const burst=(at,pattern,x,height,color,size=1,flight=2.5)=>{
   add(at-flight,pattern,x,height,color,size);const shell=score.at(-1);shell.flight=flight;shell.life=Math.min(pattern==='comet'?.85:pattern==='fountain'?2.4:shell.life,track.duration-at-.25);
   if(pattern==='fountain'){shell.launchX=x;shell.launchZ=-33;shell.z=-33;shell.height=3;}
  };
  const coda=track.sections.find(s=>s.afterglow)?.start??track.duration-6;
  // One paired aerial wheel is reserved for the late highlight, with clear space around it.
  const wheelAt=track.accents.find(at=>at>=track.duration*.68&&at<coda-12);
  for(const side of [-1,1]){burst(wheelAt,'wheel',side*59,83,accents[side>0?1:0],1,2.5);Object.assign(score.at(-1),{life:5.6,wind:side,volleyAt:wheelAt});}
  for(const section of track.sections){
   if(section.afterglow)continue;
   // The five castle cues are the five acts of the show: a sparse silver opening, two acts that
   // add colour and shapes, one act that belongs to the golden willows, then the layered finale.
   const finale=section.cue===4,golden=section.cue===3,interval=finale?2.5:section.cue===0?5.2:golden?3.4:3.0;
   const vocabulary=[['glitter','star','peony'],['peony','ring','double','peony'],['chrysanthemum','double','glitter','ring','chrysanthemum'],['willow'],['chrysanthemum','peony','double','glitter']][section.cue];
   for(const at of track.accents){
    if(at<section.start||at>=section.end||at<3||at-previous<interval||at>coda-12||Math.abs(at-wheelAt)<4.5)continue;
    previous=at;const palette=castleShowCues[section.cue].palette.map((c,i)=>sequence%3===1?accents[(i+colorOffset)%3]:c);
    const pattern=vocabulary[(sequence+patternOffset)%vocabulary.length],wide=section.cue>0;
    // Curved shells carry the middle phrase; no isolated icon interrupts it.
    const curved=wide&&!golden&&sequence%3===0;
    if(curved){
     // One shell crosses above the roof and bursts at the far endpoint. The
     // next crossing reverses direction instead of making a simultaneous pair.
     const volley=arcSequence++,side=(volley%2?1:-1)*(style===1?-1:1),paired=volley%3===2;
     for(const direction of paired?[-1,1]:[side]){burst(at,['peony','chrysanthemum','double'][(volley+style)%3],direction*48,62,palette[(sequence+(direction>0?1:0))%3],1.05,3.1);
      Object.assign(score.at(-1),{y:18,launchX:-direction*46,launchZ:-36,z:-68,arcHeight:29,wind:0,paired});}
    }
    if(wide&&!golden&&sequence%4===1){
     const volley=fanSequence++,rays=6,stagger=volley%3!==0,reverse=volley%3===2;
     for(let n=0;n<rays;n++){
      const spread=(reverse?rays-1-n:n)/(rays-1)*2-1;
      const burstAt=at+(stagger?n*.16:0);
      burst(burstAt,'peony',spread*70,72-Math.abs(spread)*17,palette[(n+sequence)%3],.92,1.82);
      Object.assign(score.at(-1),{launchX:spread*19,launchZ:-34,z:-60,fan:true,volleyAt:at,staggered:stagger,reverse});
     }
    }
    if(wide&&!golden&&sequence%4===2){
     // Brief low pyrotechnic fans return between aerial accents, not a
     // continuously glowing stage. No extra lights or particle draw calls.
     for(const side of [-1,1])burst(at,'fountain',side*31,3,palette[(sequence+1)%3],.62,.3);
    }
    const count=curved?0:finale||golden?3:wide?2:1;
    for(let n=0;n<count;n++){
     const x=count===1?Math.sin(sequence)*22:count===3?(n-1)*48:(n?1:-1)*(34+sequence%3*6);
     // Golden willows open a quarter second apart so the canopy unfolds across the sky.
     burst(at+(golden?n*.24:0),pattern,x,82+sequence%3*14+(count===3&&n===1?36:0)+(golden?16:0),pattern==='willow'?'#ffd994':section.cue===0?['#d6e4ff','#ece6ff','#ffeccb'][(sequence+n)%3]:palette[(sequence+n)%3],finale?1.4:golden?(n===1?1.5:1.3):section.cue===0?.72:.8+section.cue*.11);if(golden)score.at(-1).volleyAt=at;
    }
    if(wide&&!golden&&!curved&&sequence%4===0){
     // Low coloured stars answer the high shells, with clear space above the roof.
     for(const side of [-1,1]){burst(at+.38,'star',side*62,47,palette[(sequence+1+(side>0?1:0))%3],.65,1.55);Object.assign(score.at(-1),{launchX:side*24,launchZ:-36,z:-62,accentLayer:true,volleyAt:at,life:3});}
    }
    sequence++;
   }
  }
  // Three rising phrases end on one layered crown. Keep the existing 24-shell
  // GPU pool: scale and depth supply the spectacle, not unbounded particles.
  const accentBefore=limit=>track.accents.findLast(at=>at<limit);
  const fanAt=accentBefore(coda-9.5),crownAt=accentBefore(coda-6.2),finalAt=accentBefore(coda-.65);
  const ending=(at,pattern,x,height,color,size,flight,life,volleyAt=at)=>{
   burst(at,pattern,x,height,color,size,flight);
   Object.assign(score.at(-1),{life,volleyAt,finale:true,wind:0});
  };
  for(let n=0;n<6;n++){
   const spread=n/5*2-1;
   ending(fanAt+n*.16,'peony',spread*76,82-Math.abs(spread)*20,accents[n%3],1.1,2.1,3.5,fanAt);
   Object.assign(score.at(-1),{launchX:spread*21,z:-62,fan:true,staggered:true,reverse:false});
  }
  for(const [n,x]of [-49,0,49].entries())ending(crownAt,'double',x,n===1?142:108,accents[n],1.5,2.7,4.4);
  for(const side of [-1,1])ending(crownAt,'fountain',side*33,3,'#f4e9d5',.8,.3,2.4);
  // A quick run of single shells walks across the sky between the crown and the last volley.
  const run=track.accents.filter(at=>at>crownAt+.9&&at<finalAt-1.1);
  for(let n=0;n<4&&run.length;n++){const pick=Math.floor(n*(run.length-1)/3);if(n&&pick===Math.floor((n-1)*(run.length-1)/3))continue;ending(run[pick],n%2?'chrysanthemum':'peony',[-62,24,-20,58][n],96+n%2*22,accents[(n+1)%3],1.15,1.9,3.2);}
  for(const [n,x]of [-76,-38,0,38,76].entries()){
   ending(finalAt,'chrysanthemum',x,170-Math.abs(x)*.7,accents[n%3],n===2?1.85:1.6,3,4.6);
  }
  for(const side of [-1,1])ending(finalAt,'willow',side*56,126,'#ffdb9a',1.5,2.9,5.6);
  for(const [n,x]of [-66,-22,22,66].entries())ending(finalAt+.2+n*.1,'glitter',x,82-Math.abs(x)*.2,'#e7edff',.95,2.1,4,finalAt);
  return score.sort((a,b)=>a.at-b.at);
 }
 for(const cue of castleShowCues)for(const burst of cue.fireworks.bursts)add(cue.start+burst.at,burst.pattern,burst.x,burst.height,burst.color,burst.size);
 return score.sort((a,b)=>a.at-b.at);
}
