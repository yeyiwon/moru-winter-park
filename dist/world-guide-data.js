import {treeLayout,treeShift} from './tree-layout.js';
import {postOffice} from './retreat-layout.js';
import {alpineShift} from './resort-layout.js';
import {spaX,spaShift} from './resort-layout.js';
// Shared allowlist: generated guidance can only name places the live world actually has.
export const guidePlaces=[
 {id:'ski',name:'스키장',x:-36,z:-185+alpineShift,aliases:['스키','리프트','설산']},
 {id:'onsen',name:'온천',x:spaX+-10,z:116+spaShift,aliases:['온천','탕','쉬기']},
 {id:'sauna',name:'찜질방',x:spaX+12,z:113.6+spaShift,aliases:['찜질','실내','차']},
 {id:'tree',name:'소원 트리',...treeLayout.arrival,aliases:['트리','장식','나무']},
 {id:'post-office',name:'소원 우체국',...postOffice.entry,aliases:['우체국','편지','소원']},
 {id:'quiz',name:'지식 연구소',x:44,z:24,aliases:['퀴즈','문제','지식']},
 {id:'festival-photo',name:'겨울 포토존',x:-65,z:8,aliases:['사진','포토존','정원']},
];
export {decorationKinds,decorationColors} from './decorations.js';
