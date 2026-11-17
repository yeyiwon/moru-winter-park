import {conservatoryLayout as glasshouse,conservatoryEntry} from './conservatory-layout.js';
import {skateRental,rinkEntry} from './retreat-layout.js';
export const worldPathLinks=[
   [[0,24],[39,23],5.5],[[39,23],[84,36],5.5],[[84,36],[90,46],4.5],[[90,46],[108,53],4.5],
   [[0,24],[conservatoryEntry.x,conservatoryEntry.z],5.5],[[conservatoryEntry.x,conservatoryEntry.z],[14,glasshouse.z],4.5],[[14,glasshouse.z],[0,glasshouse.z+13],4.5],[[0,glasshouse.z+13],[0,96],5.5],[[0,96],[-28,104],6],[[-28,104],[-35,101],6],[[-35,101],[-31,94],5],
   [[-31,94],[rinkEntry.x,rinkEntry.z],4.6],[[-31,94],[skateRental.entry.x,skateRental.entry.z],4],
   [[0,-7],[0,-35],5.5],[[0,-35],[0,-64],6],[[0,-64],[0,-112],6],[[0,-112],[-24,-160],6],[[-24,-160],[-36,-176],5],
   [[-36,-176],[-44,-181.8],4.2],[[-44,-181.8],[-36,-185],4.2],
   [[-10,-4],[-31,0],6],[[-31,0],[-37,4],6],[[-37,4],[-45,4],6],[[-45,4],[-61,0],6]
  ];
