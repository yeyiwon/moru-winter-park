import {showTrack} from './show-tracks.js';
// Show timing is independent of the selected audio asset. Seconds are measured
// from the authoritative server start, including when a visitor joins late.
export const castleRegions=Object.freeze(['center','left','right','roof','wall','window','column','arch','gate','detail']);
export const castleShowQuality=Object.freeze({
 low:{beams:12,particles:180},medium:{beams:18,particles:420},high:{beams:24,particles:720},
});
const cue=(id,start,duration,palette,regions,projection,beams,particles,fireworks)=>({
 id,start,duration,palette,regions,projection,beams,particles,fireworks:{section:fireworks,bursts:[]},
 beat:{bpm:120,offset:0},framing:{automatic:false,distance:96,lookHeight:38},
 quality:castleShowQuality,
});
export const castleShowCues=Object.freeze([
 cue('winter-awakens',0,10,['#72b7ef','#cceafa','#f0d4a5'],[.6,.18,.18,.3,.16,.55,.35,.6,.5,.3],'frost',
  {sweep:.25,laser:0,groups:['gate','plaza']},{density:.3,size:.8,rise:.6},'opening'),
 cue('starlight-waltz',10,16,['#9acfea','#b6a1dd','#eed1a2'],[.5,.65,.38,.35,.23,.7,.5,.85,.5,.5],'arch',
  {sweep:.48,laser:.2,groups:['plaza','wall','window']},{density:.55,size:1,rise:.8},'development'),
 cue('aurora-night',26,20,['#87d7c6','#7dabe1','#cab3e4'],[.7,.4,.75,.65,.2,.48,.6,.5,.4,.5],'aurora',
  {sweep:.65,laser:.4,groups:['plaza','wall','rear','tower']},{density:.65,size:1.12,rise:1},'main'),
 cue('golden-moment',46,14,['#f0d1a0','#96bfe0','#f6ead0'],[.7,.45,.45,.38,.16,.65,.45,.7,.65,.65],'spiral',
  {sweep:.42,laser:0,groups:['gate','rear','wall']},{density:.42,size:1.2,rise:.65},'golden'),
 cue('luminous-finale',60,14,['#9fcbf5','#c6b3e7','#f5dfb4'],[.8,.7,.7,.6,.26,.85,.65,.9,.8,.75],'stars',
  {sweep:.8,laser:.8,groups:['plaza','wall','gate','window','rear','tower']},{density:1,size:1.25,rise:1.1},'finale'),
]);
const bursts=castleShowCues.map(c=>c.fireworks.bursts);
const shell=(section,at,pattern,x,height,color,size=1)=>bursts[section].push({at,pattern,x,height,color,size});
const pair=(section,at,pattern,x,height,color,size=1)=>{shell(section,at,pattern,-x,height,color,size);shell(section,at,pattern,x,height,color,size);};
for(const [i,x]of [-24,24,0].entries())shell(0,i*3,'chrysanthemum',x,76+i*9,'#d5eaff',.72);
for(let i=0;i<4;i++)pair(1,i*4,i%2?'peony':'ring',38+i*4,88+i*6,['#aedfff','#d7c3f8','#94dfcb','#dddfff'][i],.95);
for(let i=0;i<5;i++){pair(2,i*4,i%2?'chrysanthemum':'star',49,94+i*4,i%2?'#c1dfff':'#d8b7ee',1.08);shell(2,1+i*4,'peony',0,133+i*2,'#e0edff',1.18);}
for(let i=0;i<3;i++){pair(3,i*4,i===1?'willow':'chrysanthemum',44,112,'#c7ddff',1.2);shell(3,1+i*4,i===1?'willow':'peony',0,145,i===1?'#f2d5a1':'#dcc9f5',1.32);}
for(let i=0;i<4;i++){pair(4,i*2,i%2?'glitter':'ring',55,94+i*5,i%2?'#ebd5f7':'#c8eaff',1.12);pair(4,.5+i*2,'peony',26,125+i*3,i%2?'#f2d8ad':'#a5dcca',1.05);}
shell(4,7,'chrysanthemum',0,149,'#e8f1ff',1.5);
export const castleProjectionModes=Object.freeze(['frost','arch','aurora','spiral','stars']);
export const castleBeamGroups=Object.freeze(['plaza','wall','gate','window','rear','tower']);
// Position, direction, width and length are authored per fixture, not on tower tips alone.
export const castleBeamEmitters=Object.freeze(Array.from({length:24},(_,i)=>{
 const pair=Math.floor(i/2)%6,side=i%2?-1:1,laser=i>=12;
 const group=castleBeamGroups[pair];
 const placement={plaza:[side*22,.35,8],wall:[side*20,1,-20],gate:[side*4.9,1.2,-7.4],window:[side*9.8,8.3,-11.9],rear:[side*20,.5,-34],tower:[side*7.7,30.5,-20.5]}[group];
 return {group,position:placement,phase:pair,kind:laser?'laser':pair===2?'wash':[1,3].includes(pair)?'fan':'search',direction:[side*.3,1,pair===4?-.65:.6],width:laser?.12:[1,3].includes(pair)?10:6,length:laser?105:pair===2?12:pair===3?45:75,laser};
}));
export function sampleCastleCue(age,out={},musicId){
 const track=showTrack(musicId);
 if(track){
  let section=0;while(section<track.sections.length-1&&age>=track.sections[section+1].start)section++;
  const current=track.sections[section],previous=track.sections[Math.max(0,section-1)],t=section?Math.max(0,Math.min(1,(age-current.start)/1.4)):1;
  out.cue=castleShowCues[current.cue];out.previous=castleShowCues[previous.cue];out.index=current.cue;out.previousIndex=previous.cue;out.mix=t*t*(3-2*t);return out;
 }
 let index=0;while(index<castleShowCues.length-1&&age>=castleShowCues[index+1].start)index++;
 const cue=castleShowCues[index],previous=castleShowCues[Math.max(0,index-1)],t=index?Math.max(0,Math.min(1,(age-cue.start)/1.4)):1;
 out.cue=cue;out.previous=previous;out.previousIndex=Math.max(0,index-1);out.mix=t*t*(3-2*t);out.index=index;
 return out;
}
