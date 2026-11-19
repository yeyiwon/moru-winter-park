// Bound the stream even when Content-Length is missing or forged.
export async function boundedRequest(request,maxBytes=8192){
 if(['GET','HEAD'].includes(request.method)||!request.body)return request;
 if(Number(request.headers.get('content-length')||0)>maxBytes)throw new RangeError('Request body too large');
 const reader=request.body.getReader(),chunks=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();throw new RangeError('Request body too large');}chunks.push(value);}}finally{reader.releaseLock();}
 const body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.byteLength;}
 return new Request(request.url,{method:request.method,headers:request.headers,body});
}
