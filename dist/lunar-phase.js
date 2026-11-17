// Adapted from SunCalc 1.9.0 (BSD-2-Clause), Vladimir Agafonkin.
// See textures/ATTRIBUTION.txt. This is an approximate phase, not a local sky ephemeris.
const rad=Math.PI/180,e=23.4397*rad;
function coords(l,b){return{ra:Math.atan2(Math.sin(l)*Math.cos(e)-Math.tan(b)*Math.sin(e),Math.cos(l)),dec:Math.asin(Math.sin(b)*Math.cos(e)+Math.cos(b)*Math.sin(e)*Math.sin(l))};}
export function lunarPhase(date=Date.now()){
 const timestamp=Number(date);if(!Number.isFinite(timestamp))throw new RangeError('Invalid lunar date');
 const d=timestamp/86400000-.5+2440588-2451545,M=(357.5291+.98560028*d)*rad;
 const sun=coords(M+rad*(1.9148*Math.sin(M)+.02*Math.sin(2*M)+.0003*Math.sin(3*M)+102.9372)+Math.PI,0);
 const anomaly=(134.963+13.064993*d)*rad,moon=coords((218.316+13.176396*d)*rad+6.289*rad*Math.sin(anomaly),5.128*rad*Math.sin((93.272+13.229350*d)*rad));
 const distance=385001-20905*Math.cos(anomaly),delta=sun.ra-moon.ra;
 const separation=Math.acos(Math.max(-1,Math.min(1,Math.sin(sun.dec)*Math.sin(moon.dec)+Math.cos(sun.dec)*Math.cos(moon.dec)*Math.cos(delta))));
 const incidence=Math.atan2(149598000*Math.sin(separation),distance-149598000*Math.cos(separation));
 const angle=Math.atan2(Math.cos(sun.dec)*Math.sin(delta),Math.sin(sun.dec)*Math.cos(moon.dec)-Math.cos(sun.dec)*Math.sin(moon.dec)*Math.cos(delta));
 return{fraction:(1+Math.cos(incidence))/2,phase:.5+.5*incidence*(angle<0?-1:1)/Math.PI};
}
