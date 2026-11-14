export const rooms=[
{id:'curiosity',name:'호기심 전시실',subject:'일상에서 시작하는 과학',x:-8,z:-3,door:{x:-4.8,z:0},color:'#d6b381'},
{id:'perspective',name:'관점의 방',subject:'설명과 근거를 비교하는 곳',x:8.5,z:-4,door:{x:5,z:0},color:'#b8a2cc'},
{id:'logic',name:'논리 공방',subject:'조건을 맞추고 길을 찾는 곳',x:-7.5,z:-28,door:{x:-4,z:-23},color:'#a9c7bf'},
{id:'probability',name:'확률 실험실',subject:'예상하고 직접 실험하는 곳',x:7.5,z:-28,door:{x:4,z:-23},color:'#d3b58a'},
{id:'garden',name:'관찰의 정원',subject:'변화와 규칙을 발견하는 곳',x:-9,z:9,door:{x:-5,z:8},color:'#a8c4ae'},
{id:'memory',name:'기억 서재',subject:'다른 상황에서 다시 생각하기',x:9,z:9,door:{x:5,z:8},color:'#c8afc0'}
];
export const islands=rooms.map(r=>({...r,r:6,spawn:{...r.door}}));
export const bridges=[[{x:0,z:-12,r:1},{x:0,z:-21,r:1}]];
export function terrainAt(x,z){return (x*x/18.5**2+z*z/16**2<1)||(x*x/16**2+(z+28)**2/10**2<1)||(Math.abs(x)<2.05&&z<=-12&&z>=-22);}
export function islandAt(x,z){return rooms.find(r=>Math.hypot(x-r.x,z-r.z)<7);}
export function segmentDistance(x,z,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a.x-t*dx,z-a.z-t*dz);}
export const buildings=[{x:-9,z:-5,w:3.4,d:3.4},{x:9,z:-5.5,w:3.5,d:3.4},{x:-8,z:-29,w:3.5,d:3.5},{x:8,z:-29,w:3.5,d:3.5},{x:10,z:9,w:3,d:3},{x:-10,z:10,r:2.2},{x:-3.9,z:-12.8,r:1.45},{x:3.9,z:-12.8,r:1.45},...rooms.map(room=>{const dx=room.x-room.door.x,dz=room.z-room.door.z,length=Math.hypot(dx,dz);return{x:room.door.x+dx/length*1.15,z:room.door.z+dz/length*1.15,r:.5};})];
