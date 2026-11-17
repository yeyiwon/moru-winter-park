const mean=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
const percentile=(values,p)=>values.length?[...values].sort((a,b)=>a-b)[Math.min(values.length-1,Math.floor(values.length*p))]:null;
export function summarizeFrames(samples,gpu=[]){
 const times=samples.map(s=>s.ms),average=mean(times);
 return{frames:samples.length,fps:average?1000/average:null,frameMeanMs:average,p95Ms:percentile(times,.95),p99Ms:percentile(times,.99),cpuMeanMs:mean(samples.map(s=>s.cpu)),gpuMeanMs:mean(gpu),drawCalls:mean(samples.map(s=>s.calls)),triangles:mean(samples.map(s=>s.triangles))};
}
// Opt-in diagnostics. Queries are asynchronous and bounded; never gl.finish()
// or synchronous pixel readback inside the game loop.
export function createFrameMetrics(renderer){
 const gl=renderer.getContext?.(),ext=gl?.getExtension('EXT_disjoint_timer_query_webgl2'),pending=[];
 let active=false,elapsed=0,frameStart=0,query=null,samples=[],gpu=[],last=null,observer=null,longTasks=0,serial=0;
 function poll(){if(!ext||!pending.length)return;if(gl.getParameter(ext.GPU_DISJOINT_EXT)){for(const q of pending)gl.deleteQuery(q);pending.length=0;return;}while(pending.length&&gl.getQueryParameter(pending[0],gl.QUERY_RESULT_AVAILABLE)){const q=pending.shift();gpu.push(gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);gl.deleteQuery(q);}}
 function snapshot(){return{...summarizeFrames(samples,gpu),gpuTimerAvailable:!!ext,memory:{...renderer.info.memory},heapBytes:performance.memory?.usedJSHeapSize??null,pixelRatio:renderer.getPixelRatio(),longTaskMs:longTasks};}
 function stop(){active=false;observer?.disconnect();observer=null;poll();last=snapshot();return last;}
 return{
  start(){stop();for(const q of pending)gl.deleteQuery(q);pending.length=0;samples=[];gpu=[];elapsed=0;longTasks=0;active=true;if(typeof PerformanceObserver!=='undefined'){try{observer=new PerformanceObserver(list=>{for(const e of list.getEntries())longTasks+=e.duration;});observer.observe({type:'longtask'});}catch{}}},
  begin(){poll();if(!active)return;frameStart=performance.now();if(ext&&pending.length<4&&serial++%4===0){query=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,query);}},
  end(milliseconds){if(query){gl.endQuery(ext.TIME_ELAPSED_EXT);pending.push(query);query=null;}if(!active)return null;if(milliseconds>0)elapsed+=milliseconds;if(milliseconds>0&&samples.length<1800)samples.push({ms:milliseconds,cpu:performance.now()-frameStart,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles});return elapsed>=10000?stop():null;},
  stop,read(){return active?snapshot():last;},
  dispose(){stop();for(const q of pending)gl.deleteQuery(q);pending.length=0;}
 };
}
