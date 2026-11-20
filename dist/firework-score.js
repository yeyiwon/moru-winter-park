import {showTrack} from './show-tracks.js';
import {castleShowCues} from './castle-show-score.js';
// Original WINTERLIGHT score. All effects use the same server time and seed.
export const fireworkConfig=Object.freeze({duration:castleShowCues.at(-1).start+castleShowCues.at(-1).duration,leadMs:10000,cooldownMs:15*60000,auto:false,intervalMs:15*60000});
export const fireworkPatterns=['chrysanthemum','peony','willow','ring','glitter','star','comet','fountain','double'];
export function fireworkRandom(seed){let state=seed>>>0||1;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
export function showEnvelope(age,duration=fireworkConfig.duration){return Math.max(0,Math.min(1,age/3,(duration-age)/4));}
export function createFireworkScore(seed=1,musicId){
 const random=fireworkRandom(seed),score=[];
 const add=(at,pattern,x,height,color,size=1)=>score.push({at,pattern,x,y:5,z:-68-random()*16,launchX:Math.sign(x)*23,launchZ:-32,height,flight:2.35+random()*.25,color,size,life:pattern==='willow'?5.1:pattern==='glitter'?3.7:4,tilt:(random()-.5)*1.2,wind:(random()-.5)*.7});
 const track=showTrack(musicId);
 if(track){
  let previous=-10,sequence=0;
  const burst=(at,pattern,x,height,color,size=1,flight=2.5)=>{
   add(at-flight,pattern,x,height,color,size);const shell=score.at(-1);shell.flight=flight;shell.life=Math.min(pattern==='comet'?.85:pattern==='fountain'?2.4:shell.life,track.duration-at-.25);
   if(pattern==='fountain'){shell.launchX=x;shell.launchZ=-33;shell.z=-33;shell.height=3;}
  };
  for(const section of track.sections){
   if(section.afterglow)continue;
   const finale=section.cue===4,interval=finale?2.5:section.cue===0?5.2:3.8;
   for(const at of track.accents){
    if(at<section.start||at>=section.end||at<3||at-previous<interval||at>track.duration-6)continue;
    previous=at;const palette=castleShowCues[section.cue].palette;
    const pattern=['peony','chrysanthemum','star','willow','double','ring','glitter'][sequence%7],wide=section.cue>0;
    if(wide&&sequence%3===0){
     // Low mirrored fans leave the higher central sky clear for the main shell.
     for(const side of [-1,1])for(let ray=0;ray<3;ray++)burst(at,'comet',side*(30+ray*17),29+ray*14,'#f3c985',.5,1.25+ray*.2);
    }else if(wide&&sequence%4===1){for(const side of [-1,1])burst(at,'fountain',side*28,3,'#efc27a',.7,.18);}
    const count=finale?3:wide?2:1;
    for(let n=0;n<count;n++){
     const x=count===1?Math.sin(sequence)*22:count===3?(n-1)*48:(n?1:-1)*(34+sequence%3*6);
     burst(at,pattern,x,82+sequence%3*14+(count===3&&n===1?36:0),palette[(sequence+n)%3],finale?1.25:.75+section.cue*.1);
    }sequence++;
   }
  }
  return score.sort((a,b)=>a.at-b.at);
 }
 for(const cue of castleShowCues)for(const burst of cue.fireworks.bursts)add(cue.start+burst.at,burst.pattern,burst.x,burst.height,burst.color,burst.size);
 return score.sort((a,b)=>a.at-b.at);
}
