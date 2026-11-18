import {regions,regionBridges} from './region-layout.js';
import {spaToWorld} from './spa-transform.js';
import {alpineShift} from './resort-layout.js';
import {postOffice} from './retreat-layout.js';
import {museumLayout} from './district-layout.js';
const spa=(x,z)=>p(spaToWorld({x,z}));
const p=point=>[point.x,point.z],anchor=(id,other)=>{const bridge=regionBridges.find(b=>b.from===id&&b.to===other||b.to===id&&b.from===other);return p(bridge.from===id?bridge.approachStart:bridge.approachEnd);};
// The bridge deck and its approach paths consume the same endpoints.
export const worldPathLinks=[
 ...regionBridges.flatMap(b=>[[p(b.approachStart),p(b.start),6],[p(b.start),p(b.end),6],[p(b.end),p(b.approachEnd),6]]),
 [[0,26],anchor('park','tree'),6],[[0,-7],anchor('park','ski'),5.5],
 [anchor('ski','park'),[-24,-160+alpineShift],6],[[-24,-160+alpineShift],[-36,-176+alpineShift],5],
 [[-36,-176+alpineShift],[-44,-181.8+alpineShift],4.2],[[-44,-181.8+alpineShift],[-38,-90],4.2],[[-38,-90],p(regions.ski.arrival),4.2],
 [anchor('ski','spa'),[56,-90],6],[[56,-90],[8,-82],6],[[8,-82],[-24,-70],6],
 [[26,14],[34,12],6],[[34,12],anchor('park','spa'),6],
 [anchor('spa','park'),p(regions.spa.arrival),5.5],[anchor('spa','ski'),spa(16,108),4.4],[spa(16,108),spa(12,108),4.4],[spa(12,108),p(regions.spa.arrival),4.4],
 [spa(12,108),spa(12,113.6),5],
 [anchor('tree','park'),[-8,62],5],[[-8,62],p(postOffice.entry),5],[p(postOffice.entry),p(regions.tree.arrival),5],
 [anchor('tree','park'),[12,68],5],[[12,68],[15,86],5],[[15,86],[0,99],5],[[0,99],[-16,89],5],[[-16,89],p(regions.tree.arrival),5],
 [[-27,25],anchor('park','museum'),5.5],
 [anchor('museum','park'),p(regions.museum.arrival),5.5],[p(regions.museum.arrival),p(museumLayout.door),5],
];
