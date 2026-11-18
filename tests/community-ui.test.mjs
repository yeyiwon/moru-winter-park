import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';

test('report and operation forms remain usable independently of an empty decoration list',async t=>{
 const root=path.resolve('dist'),dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://winter.test',runScripts:'outside-only'});
 t.after(()=>dom.window.close());const w=dom.window,context=dom.getInternalVMContext(),modules=new Map();
 w.matchMedia=()=>({matches:true});let fail=false;
 w.fetch=async()=>({ok:!fail,json:async()=>fail?{error:'재시도'}:{ok:true,notice:'',disabled:[]}});
 async function mod(file){if(modules.has(file))return modules.get(file);const m=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file});modules.set(file,m);await m.link(s=>mod(path.resolve(path.dirname(file),s)));return m;}
 await(await mod(path.join(root,'community-ui.js'))).evaluate();
 for(const selector of ['#report-panel form','[data-world-settings]']){
  const form=w.document.querySelector(selector),button=form.querySelector('button');
  for(fail of [false,true]){await form.onsubmit({preventDefault(){},target:form});assert.equal(button.disabled,false,selector+' must allow another action/retry');}
 }
});
