// Authored outlines and a tiny pixel alphabet keep silhouettes deterministic on
// every device. No fonts, textures, canvases or per-frame shape allocations.
// A single soft heart outline; animal silhouettes were deliberately removed.
const heart=Array.from({length:240},(_,i)=>{const a=i/240*Math.PI*2;return[Math.sin(a)**3,(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a))/16];});
const letters={
 H:['10001','10001','10001','11111','10001','10001','10001'],
 A:['01110','10001','10001','11111','10001','10001','10001'],
 V:['10001','10001','10001','10001','10001','01010','00100'],
 E:['11111','10000','10000','11110','10000','10000','11111'],
 G:['01111','10000','10000','10111','10001','10001','01111'],
 O:['01110','10001','10001','10001','10001','10001','01110'],
 D:['11110','10001','10001','10001','10001','10001','11110'],
 Y:['10001','10001','01010','00100','00100','00100','00100'],
};
export const fireworkMessage='HAVE A GOOD DAY';
const message=[];
// Two centered lines remain legible in a portrait sky, rather than a very long strip.
for(const [row,text] of ['HAVE A','GOOD DAY'].entries())for(const [i,letter] of [...text].entries())if(letters[letter])for(let y=0;y<7;y++)for(let x=0;x<5;x++)if(letters[letter][y][x]==='1')message.push([(i*6+x-(text.length*6-2)/2)*.105,(row?1-y:11-y)*.105]);
export const fireworkShapes=Object.freeze({heart,message});
