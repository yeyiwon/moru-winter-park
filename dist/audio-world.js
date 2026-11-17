import {treeLayout,treeShift} from './tree-layout.js';
import {alpineShift} from './resort-layout.js';
import {spaShift} from './resort-layout.js';
import {ferrisDimensions} from './ferris-layout.js';
import {interiorAt} from './interior-layout.js';
import {withinRink} from './retreat-layout.js';
import {bridges,segmentDistance} from './world-layout.js';
export const ambientSources=[
 {id:'tree-wind',kind:'wind',x:treeLayout.x,y:5,z:treeLayout.z,radius:33,level:.28},
 {id:'mountain-wind',kind:'wind',x:0,y:66,z:-334+alpineShift,radius:110,level:.65},
 {id:'lift',kind:'motor',x:-42,y:15,z:-230+alpineShift,radius:65,level:.32},
 {id:'spa-water',kind:'water',x:-10,y:.3,z:116+spaShift,radius:22,level:.42},
 {id:'spa-falls',kind:'waterfall',x:-18.7,y:2,z:135.1+spaShift,radius:16,level:.48},
 {id:'spa-room',kind:'room',x:12,y:1,z:126+spaShift,radius:13,level:.12},
 {id:'carousel',kind:'motor',x:16,y:2,z:3.8,radius:16,level:.18},
 {id:'ferris',kind:'motor',x:ferrisDimensions.center.x,y:10,z:ferrisDimensions.center.z,radius:20,level:.16},
 {id:'festival',kind:'festival',x:0,y:2,z:5,radius:32,level:.13},
 {id:'ryokan-room',kind:'room',x:400,y:2,z:0,radius:28,level:.16},
 {id:'ryokan-water',kind:'water',x:400,y:.3,z:-11,radius:14,level:.25},
 {id:'quiz-room',kind:'room',x:600,y:2,z:0,radius:28,level:.1},
 {id:'aquarium-water',kind:'water',x:388,y:2,z:15.1,radius:13,level:.12},
 {id:'botanical-falls',kind:'waterfall',x:800,y:3,z:-6.7,radius:24,level:.22}
];
export function sourceLevel(source,position){const d=Math.hypot(position.x-source.x,(position.y-source.y)*.35,position.z-source.z),n=Math.max(0,1-d/source.radius);return n*n*source.level;}
export function nearestSources(position,limit=4){return ambientSources.map(s=>({...s,gain:sourceLevel(s,position)})).filter(s=>s.gain>.002).sort((a,b)=>b.gain-a.gain).slice(0,limit);}
export function surfaceAt(x,z,mode=''){
 if(interiorAt(x,z))return mode==='bath'?'water':'indoor';
 if(withinRink(x,z))return'ice';
 if(mode==='bath'||mode==='footbath')return'water';if(x>1&&x<24&&z>118+spaShift&&z<136+spaShift)return'indoor';
 if(bridges.some(([a,b])=>segmentDistance(x,z,a,b)<2.7&&Math.hypot(x-a.x,z-a.z)>a.r-1&&Math.hypot(x-b.x,z-b.z)>b.r-1))return'wood';
 if(Math.hypot(x-46,z-27)<12)return'stone';return'snow';
}
