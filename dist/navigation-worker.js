import {findPath} from './navigation.js';
self.onmessage=({data})=>{
 try{self.postMessage({id:data.id,route:findPath(data.start,data.end)});}
 catch{self.postMessage({id:data.id,error:true});}
};
