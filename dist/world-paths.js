import {regions,regionBridges} from './region-layout.js';
import {alpineShift,spaX,spaShift} from './resort-layout.js';
import {postOffice} from './retreat-layout.js';
const p=point=>[point.x,point.z],anchor=(id,other)=>{const bridge=regionBridges.find(b=>b.from===id&&b.to===other||b.to===id&&b.from===other);return p(bridge.from===id?bridge.approachStart:bridge.approachEnd);};
// The bridge deck and its approach paths consume the same endpoints.
export const worldPathLinks=[
 ...regionBridges.flatMap(b=>[[p(b.approachStart),p(b.start),6],[p(b.start),p(b.end),6],[p(b.end),p(b.approachEnd),6]]),
 [[0,24],anchor('park','tree'),6],[[0,24],[0,13],6],[[0,-7],anchor('park','ski'),5.5],
 [anchor('ski','park'),[-24,-160+alpineShift],6],[[-24,-160+alpineShift],[-36,-176+alpineShift],5],
 [[-36,-176+alpineShift],[-44,-181.8+alpineShift],4.2],[[-44,-181.8+alpineShift],[-38,-90],4.2],[[-38,-90],p(regions.ski.arrival),4.2],
 [anchor('ski','spa'),[56,-90],6],[[56,-90],[8,-82],6],[[8,-82],[-24,-70],6],
 [[0,24],[32,19],6],[[32,19],[36,-4],6],[[36,-4],[38,-14],6],[[38,-14],anchor('park','spa'),6],
 [anchor('spa','park'),p(regions.spa.arrival),5.5],[anchor('spa','ski'),p(regions.spa.arrival),5.5],
 [p(regions.spa.arrival),[spaX+12,113.6+spaShift],5],
 [anchor('tree','park'),[-8,62],5],[[-8,62],p(postOffice.entry),5],[p(postOffice.entry),p(regions.tree.arrival),5],
 [anchor('tree','park'),[12,68],5],[[12,68],[15,86],5],[[15,86],[0,99],5],[[0,99],[-16,89],5],[[-16,89],p(regions.tree.arrival),5],
 [[-31,0],[-32,-10],5.5],[[-32,-10],anchor('park','museum'),5.5],
 [anchor('museum','park'),p(regions.museum.arrival),5.5],
];
