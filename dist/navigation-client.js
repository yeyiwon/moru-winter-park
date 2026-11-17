// One worker and at most one queued destination. A late path must never replace
// keyboard input, a later click, a room transition or a newly boarded ride.
export function createNavigationClient(fallback,{WorkerClass=globalThis.Worker}={}){
 let worker=null,failed=!WorkerClass,current=null,queued=null,serial=0,disposed=false;
 function cancel(){serial++;current?.resolve(null);queued?.resolve(null);queued=null;}
 function finish(data){const task=current;if(!task||task.id!==data.id)return;current=null;task.resolve(task.id===serial&&!data.error?data.route:null);pump();}
 function pump(){if(disposed||current||!queued)return;const task=queued;queued=null;current=task;
  if(failed){try{finish({id:task.id,route:fallback(task.start,task.end)});}catch{finish({id:task.id,error:true});}return;}
  try{if(!worker){worker=new WorkerClass(new URL('./navigation-worker.js',import.meta.url),{type:'module'});worker.onmessage=e=>finish(e.data);worker.onerror=()=>{if(disposed)return;worker?.terminate();worker=null;failed=true;const pending=current;current=null;if(pending){if(pending.id===serial){queued=pending;pump();}else pending.resolve(null);}pump();};}worker.postMessage({id:task.id,start:task.start,end:task.end});}
  catch{failed=true;current=null;queued=task;pump();}
 }
 return{request(start,end){if(disposed)return Promise.resolve(null);cancel();return new Promise(resolve=>{queued={id:serial,start:{...start},end:{...end},resolve};pump();});},cancel,dispose(){cancel();disposed=true;worker?.terminate();worker=null;current=null;},get threaded(){return!failed;}};
}
