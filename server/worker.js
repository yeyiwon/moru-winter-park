import {assetResponse} from './static-response.js';
import {handleAPI} from './api.js';
import assets from '../.winter-build/assets.js';
export default {async fetch(request,env){const api=await handleAPI(request,env);if(api)return api;const path=new URL(request.url).pathname;const asset=assets[['/','/admin','/admin/'].includes(path)?'/index.html':path];return assetResponse(request,asset);}};
