import {showTrack} from './show-tracks.js';
import {castleShowCues} from './castle-show-score.js';
// Original WINTERLIGHT score. All effects use the same server time and seed.
export const fireworkConfig=Object.freeze({duration:castleShowCues.at(-1).start+castleShowCues.at(-1).duration,leadMs:10000,cooldownMs:15*60000,auto:false,intervalMs:15*60000});
export const fireworkPatterns=['chrysanthemum','peony','willow','ring','glitter','star'];
export function fireworkRandom(seed){let state=seed>>>0||1;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
export function showEnvelope(age,duration=fireworkConfig.duration){return Math.max(0,Math.min(1,age/3,(duration-age)/4));}
export function createFireworkScore(seed=1,musicId){
 const random=fireworkRandom(seed),score=[];
 const add=(at,pattern,x,height,color,size=1)=>score.push({at,pattern,x,y:5,z:-68-random()*16,launchX:Math.sign(x)*23,launchZ:-32,height,flight:2.35+random()*.25,color,size,life:pattern==='willow'?5.1:pattern==='glitter'?3.7:4,tilt:(random()-.5)*1.2,wind:(random()-.5)*.7});
 const track=showTrack(musicId);
 if(track){
  let previous=-10,sequence=0;
  for(const section of track.sections){
   if(section.afterglow)continue;
   const finale=section.cue===4,interval=finale?1.65:section.cue===0?4.2:3.1;
   for(const at of track.accents){
    if(at<section.start||at>=section.end||at<3||at-previous<interval||at>track.duration-5.6)continue;
    previous=at;const palette=castleShowCues[section.cue].palette,pattern=fireworkPatterns[(sequence+section.cue)%fireworkPatterns.length],count=finale?3:section.cue===0?1:2;
    for(let n=0;n<count;n++){
     const x=count===1?Math.sin(sequence)*26:count===3?(n-1)*46:(n?1:-1)*(32+sequence%3*7);
     add(at-2.5,pattern,x,95+(sequence%3)*12+(count===3&&n===1?34:0),palette[(sequence+n)%3],finale?1.25:.9+section.cue*.07);
     const shell=score.at(-1);shell.flight=2.5;shell.life=Math.min(shell.life,track.duration-at-.25);
    }sequence++;
   }
  }
  return score.sort((a,b)=>a.at-b.at);
 }
 for(const cue of castleShowCues)for(const burst of cue.fireworks.bursts)add(cue.start+burst.at,burst.pattern,burst.x,burst.height,burst.color,burst.size);
 return score.sort((a,b)=>a.at-b.at);
}
