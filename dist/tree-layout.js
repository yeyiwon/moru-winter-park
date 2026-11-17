// The plaza, foliage, shared ornaments and map use the same origin and canopy profile.
export const treeLayout=Object.freeze({x:78,z:35,height:32,radius:9.4,arrival:Object.freeze({x:66,z:38})});
export const treeShift=-30;
export function treeOrnamentPoint(angle,height){const t=Math.max(0,Math.min(1,(height-3)/(treeLayout.height*.79))),r=treeLayout.height*.286*(1-t*.94)+.65;return{x:Math.cos(angle)*r,y:height,z:Math.sin(angle)*r};}
