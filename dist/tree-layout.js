import {regions} from './region-layout.js';
// The plaza, foliage, shared ornaments and map use the same origin and canopy profile.
export const treeLayout=Object.freeze({...regions.tree.center,height:32,radius:9.4,arrival:Object.freeze({...regions.tree.arrival})});
export const treeShift=regions.tree.center.x-108;
export function treeOrnamentPoint(angle,height){const t=Math.max(0,Math.min(1,(height-3)/(treeLayout.height*.79))),r=treeLayout.height*.286*(1-t*.94)+.65;return{x:Math.cos(angle)*r,y:height,z:Math.sin(angle)*r};}
