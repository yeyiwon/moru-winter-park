const clamp=v=>Math.max(0,Math.min(1,v)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
// Six authored sectors stay in front of, behind, or outside the actual castle.
// Shared music time drives a 16-beat phrase with a quiet interval; lasers only
// pulse every two beats (at most 1.25Hz for the current recordings).
export function sampleCastleLight(age,e,{bpm=120,offset=0,sweep=.5,laser=0,calm=false,finale=false,afterglow=false}={},out={}){
 const t=calm?5:Math.max(0,age),side=Math.sign(e.position[0])||1,phase=e.phase||0,beat=Math.max(0,(age-offset)*bpm/60),phrase=(beat%16)/16;
 let x=0,y=1,z=0;
 if(e.group==='plaza'){x=side*(.15+Math.sin(t*.26)*sweep*.72);z=.58+Math.cos(t*.17)*.12;}
 else if(e.group==='wall'){x=side*(.85+Math.sin(t*.22)*sweep*.24);z=Math.sin(t*.18)*.16;}
 else if(e.group==='gate'){x=side*(.12+Math.sin(t*.29)*sweep*.2);z=.8;}
 else if(e.group==='window'){x=side*(.16+Math.sin(t*.19)*sweep*.18);z=.75;}
 else if(e.group==='rear'){x=side*(.42+Math.sin(t*.2)*sweep*.28);z=-.65;}
 else{x=side*(.52+Math.sin(t*.16)*sweep*.24);z=.26;}
 const length=Math.hypot(x,y,z);out.x=x/length;out.y=y/length;out.z=z/length;
 const quiet=calm?1:1-smooth(.65,.72,phrase)*(1-smooth(.88,.96,phrase)),sequence=.5+.5*Math.sin(t*.42-phase*.7),pulsePhase=((beat-phase*.32)%2+2)%2/2;
 const pulse=smooth(0,.18,pulsePhase)*(1-smooth(.44,.7,pulsePhase));
 out.level=afterglow?0:e.kind==='wash'?0:e.laser?(calm?0:laser*pulse*quiet):calm?.2:(.18+.5*sequence)*(finale?.82:quiet);
 // A wide moving sheet creates a fan; searchlights remain broad soft cones.
 out.spread=e.kind==='fan'?1+.22*Math.sin(t*.2+phase):1;
 return out;
}
