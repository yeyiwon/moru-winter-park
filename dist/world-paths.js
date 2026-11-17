import {treeLayout,treeShift} from './tree-layout.js';
import {spaShift,alpineShift} from './resort-layout.js';
import {skateRental,rinkEntry,postOffice} from './retreat-layout.js';
export const worldPathLinks=[
   [[0,24],[33,25],5.5],[[33,25],[34.6,27],5],[[33,25],[36,44],5.5],[[36,44],[54,48],5.5],[[54,48],[treeLayout.arrival.x,treeLayout.arrival.z],5.5],
   [[33,25],[postOffice.entry.x,postOffice.entry.z],4.5],
   [[-61,0],[-99,0],5.5],[[-99,0],[-115,0],6],[[0,24],[0,96+spaShift],5.5],[[0,96+spaShift],[-20,101+spaShift],6],[[-20,101+spaShift],[-29,98+spaShift],6],[[-29,98+spaShift],[-29,94+spaShift],5],
   [[-29,94+spaShift],[rinkEntry.x,rinkEntry.z],4.6],[[-29,94+spaShift],[skateRental.entry.x,skateRental.entry.z],4.2],
   [[0,-7],[0,-27],5.5],[[0,-27],[0,-43],6],[[0,-43],[-24,-160+alpineShift],6],[[-24,-160+alpineShift],[-36,-176+alpineShift],5],
   [[-36,-176+alpineShift],[-44,-181.8+alpineShift],4.2],[[-44,-181.8+alpineShift],[-36,-185+alpineShift],4.2],
   [[-10,-4],[-31,0],6],[[-31,0],[-37,4],6],[[-37,4],[-45,4],6],[[-45,4],[-61,0],6]
  ];
