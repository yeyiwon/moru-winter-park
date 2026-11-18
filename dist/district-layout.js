import {spaToWorld} from './spa-transform.js';
import {regions} from './region-layout.js';
// Architecture, portals, navigation and map markers share these outdoor anchors.
export const museumLayout={...regions.museum.center,rx:16.5,rz:16.5,height:19.3,door:regions.museum.landmarks.door,arrival:regions.museum.arrival,yaw:regions.museum.yaw};
export function museumPoint(x,z){return{x:museumLayout.x+x*Math.cos(museumLayout.yaw)+z*Math.sin(museumLayout.yaw),z:museumLayout.z-x*Math.sin(museumLayout.yaw)+z*Math.cos(museumLayout.yaw)};}
export const interiorDoors={ryokan:{id:'sauna',...spaToWorld({x:12,z:113.6,yaw:0})},museum:{id:'quiz',...museumLayout.door,yaw:museumLayout.yaw}};
export const museumGalleries=[
 {id:'science',name:'과학 전시관',x:-14,z:-11,categories:['과학'],color:'#8ad8f4'},
 {id:'nature',name:'자연 전시관',x:14,z:-11,categories:['자연','동물'],color:'#b0e8c7'},
 {id:'history',name:'역사·문명 전시관',x:14,z:11,categories:['역사','지리','예술'],color:'#e8c58f'},
 {id:'logic',name:'논리·퍼즐 전시관',x:-14,z:11,categories:['일반'],color:'#bec7ed'},
];
export const districtObstacles=[{x:museumLayout.x,z:museumLayout.z,rx:museumLayout.rx,rz:museumLayout.rz}];
