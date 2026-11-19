import {execFileSync} from 'node:child_process';
export function buildRevision({env=process.env,cwd=process.cwd()}={}){
 // Vercel Git builds provide a source archive without the .git directory.
 if(env.VERCEL_GIT_COMMIT_SHA){
  if(!/^[a-f0-9]{40}$/.test(env.VERCEL_GIT_COMMIT_SHA))throw Error('Invalid deployment source revision');
  return env.VERCEL_GIT_COMMIT_SHA;
 }
 const git=args=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 return git(['rev-parse','HEAD'])+(git(['status','--porcelain'])?'-dirty':'');
}
