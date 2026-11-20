// Local coordinates: shared by the model, pathfinding and proximity prompts.
export const observatoryLayout=Object.freeze({
 radius:22,domeBase:6,telescope:{x:0,z:0,r:3.6},
 console:{x:0,z:6.4,rx:1.55,rz:.65},quiz:{x:0,z:8.1,r:2},
 guide:{x:-19.8,z:3.8,r:.85},
 piers:Array.from({length:16},(_,index)=>{const angle=index/16*Math.PI*2;return {index,angle,x:Math.sin(angle)*21,z:Math.cos(angle)*21,r:.55};}).filter(p=>p.index!==12),
 site:{latitude:37.5665,longitude:126.978},
});
export function canStartObservatoryQuiz(position){return !!position&&Number.isFinite(position.x+position.z)&&Math.hypot(position.x-600-observatoryLayout.quiz.x,position.z-observatoryLayout.quiz.z)<=observatoryLayout.quiz.r;}
