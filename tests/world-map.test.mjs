import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createWorldMap,mapOverview,mapFacilities,mapLabelPositions,projectMap,unprojectMap} from '../dist/world-map.js';
import {canStandAt} from '../dist/movement.js';

test('only five major districts are offered and every arrival is safe',()=>{
 assert.deepEqual(mapFacilities.map(p=>p.id).sort(),['onsen','park','quiz','ski','tree']);
 for(const p of mapFacilities)assert.ok(canStandAt(p.x,p.z),p.id);
});
test('mobile region labels remain separate while markers preserve real coordinates',()=>{
 for(const [width,height]of [[300,260],[300,350],[334,460],[560,200],[760,510]]){
  const view={...mapOverview},positions=mapLabelPositions(mapFacilities,view,width,height);assert.equal(positions.length,5);
  for(const p of positions){assert.ok(p.x>=55&&p.x<=width-55&&p.y>=22&&p.y<=height-22);const original=mapFacilities.find(q=>q.id===p.id),back=unprojectMap(p.anchor,view,width,height);assert.ok(Math.hypot(back.x-original.x,back.z-original.z)<1e-8);}
  for(let i=0;i<positions.length;i++)for(let j=0;j<i;j++)assert.ok(Math.abs(positions[i].x-positions[j].x)>=110||Math.abs(positions[i].y-positions[j].y)>=44,`${width}: ${positions[i].id}/${positions[j].id}`);
 }
});
test('one region tap travels immediately, dragging does not; no destination select exists',t=>{
 const dom=new JSDOM('<div id="map"></div>');t.after(()=>dom.window.close());const w=dom.window,d=w.document;
 Object.assign(globalThis,{window:w,document:d,requestAnimationFrame:fn=>fn(),devicePixelRatio:1});
 const gradient={addColorStop(){}};const context=new Proxy({measureText:s=>({width:s.length*6}),createRadialGradient:()=>gradient,createLinearGradient:()=>gradient},{get:(o,k)=>o[k]||(()=>{})});
 w.HTMLCanvasElement.prototype.getContext=()=>context;w.HTMLCanvasElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:334,height:460});
 const trips=[],root=d.querySelector('#map'),map=createWorldMap(root,id=>trips.push(id));map.resize();assert.equal(root.querySelector('select'),null);assert.equal(root.querySelectorAll('[data-region]').length,5);
 root.querySelector('[data-region=onsen]').click();assert.deepEqual(trips,['onsen']);
 const canvas=root.querySelector('canvas'),p=projectMap(mapFacilities.find(p=>p.id==='ski'),{...mapOverview},334,460),event=(x,y)=>({pointerId:1,clientX:x,clientY:y,preventDefault(){},stopPropagation(){}});
 canvas.onpointerdown(event(p.x,p.y));canvas.onpointerup(event(p.x,p.y));assert.equal(trips.at(-1),'ski');
 const before=trips.length;canvas.onpointerdown(event(p.x,p.y));canvas.onpointermove(event(p.x+55,p.y+12));canvas.onpointerup(event(p.x+55,p.y+12));assert.equal(trips.length,before);
});
