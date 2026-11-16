// Routes describe the same surfaces and cable used by the visible models.
export function sampleRide(route,progress){
 const p=Math.max(0,Math.min(1,progress))*(route.points.length-1),i=Math.min(route.points.length-2,Math.floor(p)),t=p-i,a=route.points[i],b=route.points[i+1];
 return {x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t+(route.bodyOffset??(route.heightMode==='seat'?.55:.86)),z:a[2]+(b[2]-a[2])*t,yaw:Math.atan2(b[0]-a[0],b[2]-a[2])};
}
export function createRideController(routes){
 let mode='',elapsed=0,last=null;
 return{get mode(){return mode;},start(kind){if(!routes[kind]||kind==='ski'&&mode!=='summit')return false;mode=kind;elapsed=0;last=sampleRide(routes[kind],0);return true;},stop(){const was=mode;mode='';last=null;return was;},update(dt){if(!mode)return null;if(mode==='summit')return{...last,mode};elapsed+=Math.max(0,dt);const route=routes[mode];last=sampleRide(route,elapsed/route.duration);if(elapsed>=route.duration){if(mode==='lift'){mode='summit';const [x,y,z]=route.exit;last={x,y:y+.86,z,yaw:0};}else{mode='';return{...last,mode:'',finished:true};}}return{...last,mode};}};
}
