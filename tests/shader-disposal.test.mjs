import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync('dist/vendor/three.module.js','utf8'),start=source.indexOf('this.compileAsync = function ('),end=source.indexOf('// Animation Loop',start);
function renderer(materials,states){const result={compile:()=>new Set(materials)};new Function('properties','extensions',source.slice(start,end)).call(result,{get:material=>states.get(material)||{}},{get:()=>({})});return result;}
test('a departing avatar cannot strand a parallel shader warmup',async()=>{
 const disposed={},surviving={},states=new Map([[disposed,{currentProgram:{isReady:()=>false}}],[surviving,{currentProgram:{isReady:()=>true}}]]),scene={};
 const ready=renderer([disposed,surviving],states).compileAsync(scene,{});states.delete(disposed);
 assert.equal(await ready,scene);
});
test('a live shader still waits until its compilation is ready',async()=>{
 const material={},scene={};let ready=false,settled=false;const states=new Map([[material,{currentProgram:{isReady:()=>ready}}]]);
 const completion=renderer([material],states).compileAsync(scene,{}).then(value=>{settled=true;return value});
 await new Promise(resolve=>setTimeout(resolve,15));assert.equal(settled,false);ready=true;assert.equal(await completion,scene);
});
