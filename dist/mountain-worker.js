import {tileGeometry} from './mountain-tile.js';
// The render thread only installs transferred buffers; course tessellation never
// interrupts steering or camera input while the next snow chunk is prepared.
self.onmessage=({data:{x,z,segments}})=>{const g=tileGeometry(x,z,segments),data={position:g.attributes.position.array,normal:g.attributes.normal.array,color:g.attributes.color.array,index:g.index.array};self.postMessage(data,Object.values(data).map(a=>a.buffer));g.dispose();};
