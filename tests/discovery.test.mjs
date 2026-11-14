import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../dist/discovery.js',import.meta.url),'utf8');
const {createDiscoveryGate}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('brief passes do not flash a card; staying nearby reveals it',()=>{const gate=createDiscoveryGate();assert.equal(gate.update('science',0),null);assert.equal(gate.update('science',200),null);assert.equal(gate.update('science',350),'science');assert.equal(gate.update(null,400),null)});
test('dismissed cards remain closed until leaving and re-entering',()=>{const g=createDiscoveryGate();g.update('science',0);g.update('science',400);g.dismiss();assert.equal(g.update('science',500),null);assert.equal(g.update('science',5000),null);g.update(null,5010);assert.equal(g.update('science',5100),null);assert.equal(g.update('science',5500),'science')});
test('moving to another book starts a new dwell',()=>{const g=createDiscoveryGate();g.update('science',0);assert.equal(g.update('art',400),null);assert.equal(g.update('art',600),null);assert.equal(g.update('art',750),'art')});
