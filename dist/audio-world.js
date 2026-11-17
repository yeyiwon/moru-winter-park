import {conservatoryLayout} from './conservatory-layout.js';
import {ferrisDimensions} from './ferris-layout.js';
import {interiorAt} from './interior-layout.js';
import {withinRink} from './retreat-layout.js';
import {bridges,segmentDistance} from './world-layout.js';
export const ambientSources=[
 {id:'tree-wind',kind:'wind',x:108,y:5,z:35,radius:33,level:.28},
 {id:'mountain-wind',kind:'wind',x:0,y:66,z:-334,radius:110,level:.65},
 {id:'lift',kind:'motor',x:-42,y:15,z:-230,radius:65,level:.32},
 {id:'spa-water',kind:'water',x:-10,y:.3,z:116,radius:22,level:.42},
 {id:'spa-falls',kind:'waterfall',x:-18.7,y:2,z:135.1,radius:16,level:.48},
 {id:'spa-room',kind:'room',x:12,y:1,z:126,radius:13,level:.12},
 {id:'carousel',kind:'motor',x:16,y:2,z:3.8,radius:16,level:.18},
 {id:'ferris',kind:'motor',x:ferrisDimensions.center.x,y:10,z:ferrisDimensions.center.z,radius:20,level:.16},
 {id:'festival',kind:'festival',x:0,y:2,z:5,radius:32,level:.13},
 {id:'greenhouse-falls',kind:'waterfall',x:-1.2,y:5,z:conservatoryLayout.z+2.7,radius:14,level:.38},
 {id:'greenhouse-leaves',kind:'leaves',x:5,y:4,z:conservatoryLayout.z+1,radius:12,level:.17},
 {id:'ryokan-room',kind:'room',x:400,y:2,z:0,radius:28,level:.16},
 {id:'ryokan-water',kind:'water',x:400,y:.3,z:-11,radius:14,level:.25},
 {id:'conservatory-waterfall',kind:'waterfall',x:496,y:5,z:-3,radius:25,level:.35},
 {id:'conservatory-leaves',kind:'leaves',x:508,y:3,z:2,radius:26,level:.2},
 {id:'quiz-room',kind:'room',x:46,y:2,z:27,radius:15,level:.1}
];
export function sourceLevel(source,position){const d=Math.hypot(position.x-source.x,(position.y-source.y)*.35,position.z-source.z),n=Math.max(0,1-d/source.radius);return n*n*source.level;}
export function nearestSources(position,limit=4){return ambientSources.map(s=>({...s,gain:sourceLevel(s,position)})).filter(s=>s.gain>.002).sort((a,b)=>b.gain-a.gain).slice(0,limit);}
export function surfaceAt(x,z,mode=''){
 if(interiorAt(x,z))return mode==='bath'?'water':'indoor';
 if(withinRink(x,z))return'ice';
 if(mode==='bath'||mode==='footbath')return'water';if(x>1&&x<24&&z>118&&z<136)return'indoor';
 if(bridges.some(([a,b])=>segmentDistance(x,z,a,b)<2.7&&Math.hypot(x-a.x,z-a.z)>a.r-1&&Math.hypot(x-b.x,z-b.z)>b.r-1))return'wood';
 if(Math.hypot(x-conservatoryLayout.x,z-conservatoryLayout.z)<11.3||Math.hypot(x-46,z-27)<12)return'stone';return'snow';
}
