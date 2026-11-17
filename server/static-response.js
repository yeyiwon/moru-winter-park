const decoded=new WeakMap();
export function assetResponse(request,asset){
 if(!asset)return new Response('Not found',{status:404});
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 const headers={'Content-Type':asset.type,'Cache-Control':'public,max-age=0,must-revalidate','X-Content-Type-Options':'nosniff'};
 if(asset.etag){headers.ETag=asset.etag;const tags=(request.headers.get('if-none-match')||'').split(',').map(t=>t.trim().replace(/^W\//,''));if(tags.includes('*')||tags.includes(asset.etag))return new Response(null,{status:304,headers});}
 if(!asset.binary)return new Response(request.method==='HEAD'?null:asset.body,{headers});
 let bytes=decoded.get(asset);if(!bytes){bytes=Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0));decoded.set(asset,bytes);}headers['Accept-Ranges']='bytes';headers['Content-Length']=String(bytes.length);
 const range=request.headers.get('range');
 if(range){const m=/^bytes=(\d*)-(\d*)$/.exec(range);let start,end;if(m&&(m[1]||m[2])){start=m[1]?Number(m[1]):Math.max(0,bytes.length-Number(m[2]));end=m[1]?(m[2]?Math.min(bytes.length-1,Number(m[2])):bytes.length-1):bytes.length-1;}
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=bytes.length)return new Response(null,{status:416,headers:{...headers,'Content-Range':`bytes */${bytes.length}`,'Content-Length':'0'}});
  headers['Content-Range']=`bytes ${start}-${end}/${bytes.length}`;headers['Content-Length']=String(end-start+1);return new Response(request.method==='HEAD'?null:bytes.slice(start,end+1),{status:206,headers});
 }
 return new Response(request.method==='HEAD'?null:bytes,{headers});
}
