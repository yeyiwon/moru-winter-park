// Educational apparent sky, not an astrometric pointing solution. UTC approximates
// UT1; refraction, nutation, aberration and proper motion are deliberately excluded.
const RAD=Math.PI/180,wrap=d=>((d%360)+360)%360;
export function julianDate(ms){return ms/86400000+2440587.5;}
export function siderealDegrees(ms,longitude=0){const d=julianDate(ms)-2451545,t=d/36525;return wrap(280.46061837+360.98564736629*d+.000387933*t*t-t*t*t/38710000+longitude);}
// IAU 1976 precession from epoch/equinox J2000, angles in arcseconds.
export function precessJ2000(ra,dec,ms){
 const t=(julianDate(ms)-2451545)/36525,zeta=(2306.2181*t+.30188*t*t+.017998*t*t*t)*RAD/3600,z=(2306.2181*t+1.09468*t*t+.018203*t*t*t)*RAD/3600,theta=(2004.3109*t-.42665*t*t-.041833*t*t*t)*RAD/3600,a=ra*RAD+zeta,d=dec*RAD;
 const A=Math.cos(d)*Math.sin(a),B=Math.cos(theta)*Math.cos(d)*Math.cos(a)-Math.sin(theta)*Math.sin(d),C=Math.sin(theta)*Math.cos(d)*Math.cos(a)+Math.cos(theta)*Math.sin(d);
 return [wrap((Math.atan2(A,B)+z)/RAD),Math.asin(Math.max(-1,Math.min(1,C)))/RAD];
}
export function equatorialVector(ra,dec){const a=ra*RAD,d=dec*RAD;return [Math.cos(d)*Math.cos(a),Math.sin(d),Math.cos(d)*Math.sin(a)];}
export function horizontalVector(ra,dec,ms,{latitude,longitude}){const h=(siderealDegrees(ms,longitude)-ra)*RAD,d=dec*RAD,p=latitude*RAD;return [-Math.cos(d)*Math.sin(h),Math.cos(d)*Math.cos(h)*Math.cos(p)+Math.sin(d)*Math.sin(p),Math.cos(d)*Math.cos(h)*Math.sin(p)-Math.sin(d)*Math.cos(p)];}
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453123;return x-Math.floor(x);};
// One possible meteor per 73 s slot, with empty slots and a 0.9 s lifetime.
// Nothing depends on frame rate, local entry time, Math.random or client state.
export function observatoryMeteor(ms){const seconds=ms/1000,slot=Math.floor(seconds/73),age=seconds-slot*73-8-hash(slot)*52;return {slot,active:hash(slot+8)>.3&&age>=0&&age<.9,age,azimuth:hash(slot+3)*Math.PI*2,altitude:.35+hash(slot+6)*.8,brightness:.5+hash(slot+7)*.5};}
