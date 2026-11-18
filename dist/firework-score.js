// Shared score, independent of rendering. Only id/start/seed/state travel over the network.
export const fireworkConfig=Object.freeze({duration:74,leadMs:3000,cooldownMs:12000,auto:false,intervalMs:15*60000});
export const fireworkPatterns=['chrysanthemum','peony','willow','ring','glitter'];
export function fireworkRandom(seed){let state=seed>>>0||1;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
export function createFireworkScore(seed=1){
 const random=fireworkRandom(seed),score=[];
 const add=(at,pattern,x,height,color,size=1)=>score.push({at,pattern,x:x+(random()-.5)*7,y:4,z:-80-random()*6,height,flight:2.35+random()*.5,color,size,life:pattern==='willow'?10:pattern==='glitter'?7.4:6.3,tilt:(random()-.5)*1.2,wind:(random()-.5)*.7});
 // Opening, colour development, overlapping main show, willow interlude and finale.
 [0,2.8,5.7].forEach((t,i)=>add(t,'chrysanthemum',[-33,30,0][i],82+i*8,'#f5d495',.65));
 [[12,'peony',-35,'#f777b2'],[14.5,'ring',30,'#7cd7ff'],[17,'peony',-12,'#78edc0'],[20,'ring',12,'#b896f2']].forEach(([t,p,x,c])=>add(t,p,x,96+random()*15,c,.9));
 for(let i=0;i<6;i++)add(26+(i%3)*.65+Math.floor(i/3)*4.7,i%2?'peony':'chrysanthemum',(i%3-1)*39,99+(i%3)*12,['#c6a5ff','#8ce3ff','#f7dfaf'][i%3],1.1);
 for(let i=0;i<3;i++)add(39+i*1.7,'willow',(i-1)*34,115+i*5,'#efcb88',1.2);
 for(let i=0;i<10;i++)add(53+i*.75,i%3===0?'ring':'glitter',(i%5-2)*23,92+(i%4)*12,['#f5d9a4','#b8e7fc','#ddc4f7','#f58fbc','#8de4c2'][i%5],1+(i%3)*.12);
 return score;
}
