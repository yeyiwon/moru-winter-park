import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {buildRevision} from '../scripts/build-revision.mjs';
test('a deployment source archive without Git retains its verified provider revision',t=>{
 const cwd=fs.mkdtempSync(path.join(os.tmpdir(),'winter-build-revision-'));t.after(()=>fs.rmSync(cwd,{recursive:true,force:true}));
 const sha='b28e6e7197af95b58bb33a96196009d0a9adc7d4';assert.equal(buildRevision({cwd,env:{VERCEL_GIT_COMMIT_SHA:sha}}),sha);
 assert.throws(()=>buildRevision({cwd,env:{}}));assert.throws(()=>buildRevision({cwd,env:{VERCEL_GIT_COMMIT_SHA:'unknown'}}),/Invalid/);
});
