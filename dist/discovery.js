// Dwell and dismissal avoid flashing the same preview repeatedly.
export function createDiscoveryGate(delay=350){let candidate=null,enteredAt=0,dismissed=null;return {update(id,now){if(id!==candidate){candidate=id;enteredAt=now;dismissed=null;}return candidate&&candidate!==dismissed&&now-enteredAt>=delay?candidate:null;},dismiss(){dismissed=candidate;}};}
