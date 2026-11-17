// Architecture, portals, navigation and map markers share these outdoor anchors.
export const museumLayout={x:52,z:27,rx:16,rz:17,height:23,door:{x:34.6,z:27},arrival:{x:33,z:25},yaw:-Math.PI/2};
export const conservatoryLayout={x:-142,z:0,rx:23,rz:20,height:22,door:{x:-117,z:0},arrival:{x:-115,z:0},yaw:Math.PI/2};
export const interiorDoors={ryokan:{id:'sauna',x:12,z:73.6,yaw:0,view:{x:12,y:3,z:77}},museum:{id:'quiz',...museumLayout.door,yaw:Math.PI/2,view:{x:52,y:5,z:27}},conservatory:{id:'conservatory',...conservatoryLayout.door,yaw:-Math.PI/2,view:{x:-142,y:5,z:0}}};
export const museumGalleries=[
 {id:'science',name:'과학 전시관',x:-14,z:-11,categories:['과학'],color:'#8ad8f4'},
 {id:'nature',name:'자연 전시관',x:14,z:-11,categories:['자연','동물'],color:'#b0e8c7'},
 {id:'history',name:'역사·문명 전시관',x:14,z:11,categories:['역사','지리','예술'],color:'#e8c58f'},
 {id:'logic',name:'논리·퍼즐 전시관',x:-14,z:11,categories:['일반'],color:'#bec7ed'},
];
export const districtObstacles=[{x:museumLayout.x,z:museumLayout.z,rx:museumLayout.rx,rz:museumLayout.rz},{x:conservatoryLayout.x,z:conservatoryLayout.z,rx:conservatoryLayout.rx,rz:conservatoryLayout.rz}];
