import {interiorAt,interiorSurfaceHeight} from './interior-layout.js';
import {conservatorySurfaceAt} from './conservatory-layout.js';
import {alpineHeight,resortGround} from './resort-layout.js';
export const islands=[
  {id:'park',name:'별빛 놀이공원',subject:'관람차 · 회전목마',x:0,z:0,r:32,color:'#c9adff',spawn:{x:0,z:30}},
  {id:'science',hidden:true,name:'유리별 관측소',subject:'망원경 · 별빛',x:0,z:-53,r:16,color:'#97d6f2',spawn:{x:0,z:-44}},
  {id:'law',hidden:true,name:'달빛 기록원',subject:'법과 사회 · 생명윤리',x:46,z:-27,r:16,color:'#eac795',spawn:{x:40,z:-22}},
  {id:'philosophy',name:'별빛 퀴즈',subject:'가볍게 맞히는 잡지식',x:46,z:27,r:16,color:'#c3aff1',spawn:{x:39,z:23}},
  {id:'nature',name:'오로라 온실',subject:'빛과 꽃',x:0,z:53,r:17,color:'#a0dfbd',spawn:{x:0,z:40.8}},
  {id:'art',hidden:true,name:'진주빛 음악당',subject:'음악과 반짝임',x:-46,z:27,r:16,color:'#e9afc8',spawn:{x:-39,z:23}},
  {id:'history',hidden:true,name:'기억의 산책길',subject:'역사와 문화 · 세상과 언어',x:-46,z:-27,r:16,color:'#edc88d',spawn:{x:-39,z:-23}},
  {id:'alpine',name:'설빛 산악 리조트',subject:'스키 · 리프트 · 눈썰매',x:0,z:-260,r:144,color:'#a8c8d7',spawn:{x:8,z:-172}},
  {id:'wish',name:'트리 광장',subject:'크리스마스 · 산책',x:108,z:35,r:27,color:'#d7be91',spawn:{x:108,z:53}},
  {id:'spa',name:'설림 온천 마을',subject:'노천 온천 · 편백 휴양관',x:0,z:119,r:31,color:'#b5cdc0',spawn:{x:0,z:96}}
];
islands.push({id:'festival',name:'놀이공원 서쪽',subject:'회전 컵 · 범퍼카',x:-63,z:0,r:25,color:'#e0b7d2',spawn:{x:-42,z:0}});
islands.push({id:'rink',name:'아이스링크',subject:'스케이트 · 겨울 라운지',x:-58,z:94,r:29,color:'#b4dcdf',spawn:{x:-34,z:94}});
export const bridges=[[islands[0],islands[3]],[islands[0],islands[4]],[islands[4],islands[9]]];
export function bridgeHeight(x,z){for(const [a,b] of bridges){const length=Math.hypot(b.x-a.x,b.z-a.z),d=((x-a.x)*(b.x-a.x)+(z-a.z)*(b.z-a.z))/length,start=a.r-1,end=length-b.r+1;if(d>=start&&d<=end&&segmentDistance(x,z,a,b)<2.7)return .09+Math.sin((d-start)/(end-start)*Math.PI)*.35;}return .09;}
export function segmentDistance(x,z,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a.x-t*dx,z-a.z-t*dz);}
// A single connected snowfield; districts are labels, never isolated walkable discs.
export const snowfields=[
 {a:{x:0,z:0},b:{x:-63,z:0},r:39},
 {a:{x:0,z:5},b:{x:46,z:27},r:28},
 {a:{x:46,z:27},b:{x:108,z:35},r:29},
 {a:{x:0,z:25},b:{x:0,z:119},r:36},
 {a:{x:0,z:105},b:{x:-58,z:94},r:31},
 {a:{x:0,z:-10},b:{x:-9,z:-156},r:24}
];
export function snowfieldDistance(x,z){return Math.min(...snowfields.map(p=>segmentDistance(x,z,p.a,p.b)-p.r),Math.hypot(x,z+260)-144);}
export function terrainAt(x,z){return Number.isFinite(x+z)&&(!!interiorAt(x,z)||snowfieldDistance(x,z)<-.65);}
export function islandAt(x,z){return islands.filter(i=>!i.hidden).sort((a,b)=>Math.hypot(x-a.x,z-a.z)-Math.hypot(x-b.x,z-b.z)).find(i=>Math.hypot(x-i.x,z-i.z)<i.r+15);}

// Learning functions remain independent of the seven visual island identities.
export const rooms=[
{id:'curiosity',name:'호기심 전시실',door:{x:-5,z:-46}},
{id:'perspective',name:'관점의 방',door:{x:40,z:-24}},
{id:'logic',name:'논리 공방',door:{x:44,z:24}},
{id:'probability',name:'확률 실험실',door:{x:2.6,z:5.1}},
{id:'garden',name:'관찰의 정원',door:{x:-6,z:49}},
{id:'memory',name:'기억 서재',door:{x:-40,z:-24}}
];
export const exhibits=[
{id:'park-choices',room:'probability',island:'park',name:'별빛 놀이공원',x:2.6,z:5.1,color:'#cfb9eb',fields:['확률','경제']},
{id:'observatory',room:'curiosity',island:'science',name:'유리별 관측소',x:-5,z:-46,color:'#a7cedd',fields:['과학','기술']},
{id:'logic-device',room:'logic',island:'science',name:'관측소 · 논리 공방',x:6,z:-49,color:'#b2bfd9',fields:['논리']},
{id:'archive-law',room:'perspective',island:'law',name:'달빛 기록원',x:40,z:-24,color:'#ddc69d',fields:['법','미디어']},
{id:'archive-ethics',room:'perspective',island:'law',name:'기록원 · 생명윤리',x:52,z:-22,color:'#d9bbb5',fields:['윤리','생명']},
{id:'mirror-ideas',room:'perspective',island:'philosophy',name:'고요한 숲',x:44,z:24,color:'#c2b2db',fields:['철학','윤리']},
{id:'garden-watch',room:'garden',island:'nature',name:'숨쉬는 정원',x:-6,z:49,color:'#a7cbb6',fields:['생명','과학']},
{id:'lyre-listen',room:'garden',island:'art',name:'눈빛 음악 정원',x:-39,z:26,color:'#d5b1c4',fields:['예술','언어']},
{id:'harbour-history',room:'memory',island:'history',name:'기억의 산책길',x:-40,z:-24,color:'#ddc497',fields:['역사','경제']},
{id:'harbour-memory',room:'memory',island:'history',name:'항구 · 기억 서재',x:-52,z:-23,color:'#aac9d0',review:true}
];

export function surfaceHeight(x,z){const interior=interiorSurfaceHeight(x,z);if(interior!==null)return interior;let h=Math.max(bridgeHeight(x,z),resortGround(x,z),conservatorySurfaceAt(x,z)??0);for(const [cx,cz,r]of [[47,-30,5.5],[0,53,4.7],[-46,25,6]]){const d=Math.hypot(x-cx,z-cz),t=Math.max(0,Math.min(1,(r+.2-d)/.6));h=Math.max(h,.09+.13*t);}return h;}
