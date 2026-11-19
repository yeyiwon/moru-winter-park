// A task boundary after paint keeps the loading layer responsive during construction.
export function yieldForPaint(){return new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));}
export function finishSteps(steps){let step;do{step=steps.next();}while(!step.done);return step.value;}
export async function runStartupSteps(steps){let step;do{const until=performance.now()+8;do{step=steps.next();}while(!step.done&&performance.now()<until);if(!step.done)await yieldForPaint();}while(!step.done);return step.value;}
