import {proxyRequest} from '../server/vercel-proxy.js';
export default {fetch(request){return proxyRequest(request);}};
