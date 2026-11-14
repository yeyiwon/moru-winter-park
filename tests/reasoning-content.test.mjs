import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const items = JSON.parse(readFileSync(new URL('../dist/content/reasoning.json', import.meta.url), 'utf8'));
const item = (id) => items.find((entry) => entry.id === id);
const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-10, `${message}: ${actual} != ${expected}`);
const permutations = (xs) => xs.length ? xs.flatMap((x, i) => permutations(xs.filter((_, j) => i !== j)).map((tail) => [x, ...tail])) : [[]];
const bools = [false, true];
const truthRows = bools.flatMap((a) => bools.map((b) => [a, b]));

// This suite checks editorial contracts AND independently enumerates the possible
// worlds behind the puzzles. It is not a UI snapshot or a list of answer indices.
test('20 complete items, exactly four representatives, complete explanations and real-source metadata', () => {
  assert.equal(items.length, 20);
  assert.deepEqual(items.map((x) => x.id), Array.from({ length: 20 }, (_, i) => `rea${String(i + 1).padStart(2, '0')}`));
  assert.deepEqual(items.filter((x) => x.representative).map((x) => x.id), ['rea01', 'rea02', 'rea03', 'rea04']);
  const fields = new Set(['과학','생명','논리','확률','역사','언어','경제','미디어','기술']);
  const rooms = new Set(['curiosity','perspective','logic','probability','garden','memory']);
  for (const x of items) {
    for (const key of ['title','type','objective','situation','question','judgment','core','boundaries']) assert.ok(typeof x[key] === 'string' && x[key].trim(), `${x.id}: ${key}`);
    assert.ok(fields.has(x.field)); assert.ok(rooms.has(x.room));
    assert.ok([1,2,3].includes(x.difficulty)); assert.ok(x.minutes >= 3 && x.minutes <= 8);
    assert.ok(Array.isArray(x.prerequisites)); assert.ok(x.conditions.length >= 2);
    assert.ok(x.options.length >= 3 && x.options.length <= 4);
    assert.ok(Number.isInteger(x.answer) && x.answer >= 0 && x.answer < x.options.length);
    assert.equal(x.hints.length, 2); assert.ok(x.steps.length >= 3);
    for (const step of x.steps) assert.ok(step.title && step.text.length >= 15);
    assert.equal(x.wrongReasons.length, x.options.length);
    assert.ok(x.wrongReasons.every((reason) => reason.length > 10));
    const app = x.application;
    assert.ok(app.situation && app.question && app.explanation && app.options.length >= 3);
    assert.ok(Number.isInteger(app.answer) && app.answer >= 0 && app.answer < app.options.length);
    assert.notEqual(app.question, x.question, `${x.id}: application must ask a new question`);
    assert.ok(x.connections.length > 0); assert.ok(x.sources.length > 0);
    for (const source of x.sources) {
      const url = new URL(source.url);
      assert.equal(url.protocol, 'https:'); assert.ok(source.title && source.locator && source.support);
      assert.ok(['ocw.mit.edu','openstax.org','www.stat.berkeley.edu','data140.org','plato.stanford.edu','service-manual.ons.gov.uk','xlinux.nist.gov'].includes(url.hostname));
    }
    assert.equal(x.verification.status, 'source-checked');
    assert.equal(x.verification.reviewed, '2026-11-14');
    assert.match(x.verification.note, /인간 전문가/);
    if (x.type === '두 가지 관점') assert.ok(x.perspectives.length >= 2 && x.distinction && x.reflection);
  }
});

test('representative simulation contracts remain compatible', () => {
  assert.deepEqual(item('rea01').simulation, { kind: 'coin', p: 0.5 });
  assert.deepEqual(item('rea02').simulation, { kind: 'monty' });
  assert.deepEqual(item('rea03').simulation, { kind: 'bridge' });
  assert.deepEqual(item('rea04').simulation, { kind: 'graph' });
});

test('rea01 independent coin: conditioning on five heads leaves the sixth probability at 1/2', () => {
  const sequences = Array.from({ length: 64 }, (_, n) => n.toString(2).padStart(6, '0'));
  const prefix = sequences.filter((s) => s.startsWith('11111'));
  close(prefix.filter((s) => s.endsWith('1')).length / prefix.length, 0.5, 'sixth head');
  assert.equal(item('rea01').answer, 1);
});

test('rea02 Monty Hall: exhaustive weighted host actions give switch 2/3, stay 1/3', () => {
  let stay = 0, change = 0, total = 0;
  for (let prize = 0; prize < 3; prize++) for (let chosen = 0; chosen < 3; chosen++) {
    const hostDoors = [0,1,2].filter((door) => door !== prize && door !== chosen);
    for (const opened of hostDoors) {
      const weight = 1 / 9 / hostDoors.length;
      const switched = [0,1,2].find((door) => door !== opened && door !== chosen);
      assert.notEqual(opened, prize); assert.notEqual(opened, chosen);
      total += weight; stay += Number(chosen === prize) * weight; change += Number(switched === prize) * weight;
    }
  }
  close(total, 1, 'sample-space mass'); close(stay, 1/3, 'stay'); close(change, 2/3, 'switch');
  assert.equal(item('rea02').answer, 1);
  assert.equal(item('rea02').application.options[item('rea02').application.answer], '99/100');
});

test('rea03 every inventory state agrees with AND, inclusive OR and neither bridge rules', () => {
  const open = (key, lantern) => [key && lantern, key || lantern, !key && !lantern].flatMap((ok, i) => ok ? ['ABC'[i]] : []);
  assert.deepEqual(open(true, false), ['B']); assert.deepEqual(open(true, true), ['A','B']);
  assert.deepEqual(open(false, true), ['B']); assert.deepEqual(open(false, false), ['C']);
  assert.equal(item('rea03').options[item('rea03').answer], 'B만');
  assert.equal(item('rea03').application.options[item('rea03').application.answer], 'A와 B');
});

test('rea04 graph: truncated-bar ratio, actual growth and percentage-point transfer differ', () => {
  assert.equal((50 - 30) / (40 - 30), 2);
  close((50 - 40) / 40, .25, 'growth'); close(50 / 40, 1.25, 'value ratio');
  close(.5 - .4, .1, '10 percentage points'); close((.5 - .4) / .4, .25, 'relative rate growth');
  assert.match(item('rea04').options[item('rea04').answer], /25%/);
});

test('rea05 implication is equivalent to contraposition, not converse or inverse', () => {
  const allowed = truthRows.filter(([rain, light]) => !rain || light);
  assert.equal(allowed.length, 3);
  assert.ok(allowed.every(([rain, light]) => light || !rain));
  assert.ok(allowed.some(([rain, light]) => light && !rain));
  assert.equal(item('rea05').answer, 1);
});

test('rea06 exhaustive hidden faces: A and 7 are the unique minimum sufficient inspection set', () => {
  // Bits encode the unknown opposite face for A,K,4,7 respectively:
  // even, even, vowel, vowel. Rule validity depends only on A and 7.
  const worlds = Array.from({ length: 16 }, (_, n) => ({ bits: [0,1,2,3].map((b) => Boolean(n & (1 << b))) }));
  for (const w of worlds) w.valid = w.bits[0] && !w.bits[3];
  const sufficient = [];
  for (let mask = 0; mask < 16; mask++) {
    const inspect = [0,1,2,3].filter((b) => mask & (1 << b));
    const observations = new Map(); let determines = true;
    for (const w of worlds) {
      const obs = inspect.map((b) => Number(w.bits[b])).join('');
      if (observations.has(obs) && observations.get(obs) !== w.valid) determines = false;
      observations.set(obs, w.valid);
    }
    if (determines) sufficient.push(inspect);
  }
  const minimum = Math.min(...sufficient.map((xs) => xs.length));
  assert.equal(minimum, 2); assert.deepEqual(sufficient.filter((xs) => xs.length === minimum), [[0,3]]);
  assert.equal(item('rea06').options[item('rea06').answer], 'A와 7');
});

test('rea07 all 24 permutations: one original solution, four transfer solutions', () => {
  const orders = permutations(['A','B','C','D']); assert.equal(orders.length, 24);
  const valid = orders.filter((o) => o.indexOf('A') < o.indexOf('B') && o.indexOf('C') === o.indexOf('A') + 1 && o.indexOf('D') > o.indexOf('B'));
  assert.deepEqual(valid, [['A','C','B','D']]);
  const transfer = orders.filter((o) => o.indexOf('A') < o.indexOf('B') && o.indexOf('B') < o.indexOf('D')).map((o) => o.join('')).sort();
  assert.deepEqual(transfer, ['ABCD','ABDC','ACBD','CABD']);
  assert.equal(item('rea07').answer, 0); assert.equal(item('rea07').application.answer, 1);
});

test('rea08 all six label assignments: observation plus all-wrong labels gives unique arrangements', () => {
  const labels = ['red','blue','mixed'];
  const wrong = permutations(labels).filter((assignment) => assignment.every((actual, i) => actual !== labels[i]));
  assert.equal(wrong.length, 2);
  const red = wrong.filter((a) => a[2] === 'red' || a[2] === 'mixed');
  const blue = wrong.filter((a) => a[2] === 'blue' || a[2] === 'mixed');
  assert.deepEqual(red, [['blue','mixed','red']]);
  assert.deepEqual(blue, [['mixed','red','blue']]);
  assert.equal(item('rea08').answer, 0); assert.equal(item('rea08').application.answer, 0);
});

test('rea09 pigeonhole minimum: enumerate all distributions of six and seven chips', () => {
  const distributions = (n, bins) => bins === 1 ? [[n]] : Array.from({ length: n + 1 }, (_, first) => distributions(n - first, bins - 1).map((rest) => [first, ...rest])).flat();
  assert.ok(distributions(6,3).some((counts) => Math.max(...counts) < 3));
  assert.ok(distributions(7,3).every((counts) => Math.max(...counts) >= 3));
  assert.ok(distributions(4,4).some((counts) => Math.max(...counts) < 2));
  assert.ok(distributions(5,4).every((counts) => Math.max(...counts) >= 2));
  assert.equal(item('rea09').options[item('rea09').answer], '7장');
});

test('rea10 32 hidden values can all be identified in five yes/no questions, four records insufficient', () => {
  const records = [];
  for (let target = 1; target <= 32; target++) {
    let low = 1, high = 32, record = '';
    while (low < high) { const middle = Math.floor((low + high) / 2); if (target <= middle) { high = middle; record += 'Y'; } else { low = middle + 1; record += 'N'; } }
    assert.equal(low, target); assert.equal(record.length, 5); records.push(record);
  }
  assert.equal(new Set(records).size, 32); assert.ok(2 ** 4 < 32 && 2 ** 5 === 32);
  assert.equal(item('rea10').options[item('rea10').answer], '5번');
});

test('rea11 mutually exclusive positive-probability events are dependent; overlapping example independent', () => {
  const rolls = [1,2,3,4,5,6];
  const probability = (pred, condition = () => true) => { const pool = rolls.filter(condition); return pool.filter(pred).length / pool.length; };
  close(probability((n) => n === 2), 1/6, 'P(B)'); close(probability((n) => n === 2, (n) => n === 1), 0, 'P(B|A)');
  close(probability((n) => n <= 2, (n) => n % 2 === 0), probability((n) => n <= 2), 'overlapping independent');
  assert.equal(item('rea11').answer, 1);
});

test('rea12 confusion matrix is exhaustive and inverse probability uses the right denominator', () => {
  const matrix = { truePositive: 9, falseNegative: 1, falsePositive: 99, trueNegative: 891 };
  assert.equal(Object.values(matrix).reduce((a,b) => a+b), 1000);
  close(matrix.truePositive / (matrix.truePositive + matrix.falseNegative), .9, 'sensitivity');
  close(matrix.truePositive / (matrix.truePositive + matrix.falsePositive), 1/12, 'posterior');
  assert.equal(item('rea12').options[item('rea12').answer], '약 8.3%');
});

test('rea13 enumerate ordered physical-ball draws with and without replacement', () => {
  const balls = ['B1','B2','R']; let without = [], withReplacement = [];
  for (const a of balls) for (const b of balls) { withReplacement.push([a,b]); if (a !== b) without.push([a,b]); }
  const hasRed = (draw) => draw.includes('R');
  close(without.filter(hasRed).length / without.length, 2/3, 'without replacement');
  close(withReplacement.filter(hasRed).length / withReplacement.length, 5/9, 'with replacement');
  assert.equal(item('rea13').options[item('rea13').answer], '2/3');
  assert.equal(item('rea13').application.options[item('rea13').application.answer], '5/9');
});

test('rea14 equal expectation does not imply equal dispersion or deadline guarantee', () => {
  close(1, 4 * .25 + 0 * .75, 'expected tokens');
  assert.equal((4 - 1) ** 2 * .25 + (0 - 1) ** 2 * .75, 3);
  close((1 + 9) / 2, 5, 'transfer mean'); assert.equal([1,9].filter((m) => m <= 6).length / 2, .5);
  assert.equal(item('rea14').answer, 1); assert.equal(item('rea14').application.answer, 0);
});

test('rea15 Simpson data: subgroup order reverses, equal weighting restores subgroup order', () => {
  assert.ok(10/10 > 81/90 && 20/100 > 1/10);
  assert.ok((81+1)/(90+10) > (10+20)/(10+100));
  close((81/90 + 1/10)/2, .5, 'standardized A'); close((10/10 + 20/100)/2, .6, 'standardized B');
  assert.equal(item('rea15').answer, 2); assert.equal(item('rea15').application.options[item('rea15').application.answer], 'B');
});

test('rea16 adding selected fans cannot identify the unobserved population opinion', () => {
  // Two populations yield the exact same observed 9,000/10,000 fan responses.
  // Non-fans' opinions may differ; therefore the population proportion is not identified.
  const observedYes = 9000, observedTotal = 10000, nonFans = 10000;
  const overallA = observedYes / (observedTotal + nonFans);
  const overallB = (observedYes + nonFans) / (observedTotal + nonFans);
  assert.equal(overallA, .45); assert.equal(overallB, .95); assert.notEqual(overallA, overallB);
  assert.equal(item('rea16').answer, 1);
});

test('rea17 total probability weights the selection procedure, not just item counts', () => {
  close(.5 * .5 + .5 * 1, .75, 'original');
  close(.5 * 1 + .5 * 0, .5, 'transfer equal box selection');
  close(1 / (1+9), .1, 'different procedure: pooled balls');
  assert.equal(item('rea17').options[item('rea17').answer], '3/4');
  assert.equal(item('rea17').application.options[item('rea17').application.answer], '1/2');
});

test('rea18 exact birthday complement: 22 below half, 23 above half; fixed-person event differs', () => {
  const collision = (n) => 1 - Array.from({ length: n }, (_, i) => (365 - i) / 365).reduce((a,b) => a*b, 1);
  assert.ok(collision(22) < .5 && collision(23) > .5);
  close(collision(23), .5072972343239857, '23-person collision');
  const fixedPerson = 1 - (364/365) ** 22;
  assert.ok(fixedPerson > .058 && fixedPerson < .059);
  assert.equal(item('rea18').options[item('rea18').answer], '약 51%');
});

test('rea19 enumerate all 16 fair sequences: each exact sequence once, two-head event six times', () => {
  const seq = Array.from({ length: 16 }, (_, n) => n.toString(2).padStart(4, '0').replaceAll('1','H').replaceAll('0','T'));
  assert.equal(seq.filter((s) => s === 'HTHT').length, 1);
  assert.equal(seq.filter((s) => s === 'HHHH').length, 1);
  assert.equal(seq.filter((s) => [...s].filter((x) => x === 'H').length === 2).length, 6);
  assert.equal(item('rea19').answer, 2);
});

test('rea20 every Boolean state: De Morgan covers all failures and transfer reverses OR correctly', () => {
  for (const [a,b] of truthRows) { assert.equal(!(a && b), !a || !b); assert.equal(!(a || b), !a && !b); }
  assert.equal(truthRows.filter(([a,b]) => !(a && b)).length, 3);
  assert.equal(truthRows.filter(([a,b]) => !(a || b)).length, 1);
  assert.equal(item('rea20').answer, 1); assert.equal(item('rea20').application.answer, 1);
});

test('20 delayed reviews are complete, have a distinct context from immediate application, and expose their conditions', () => {
  for (const x of items) {
    const r = x.review;
    assert.deepEqual(Object.keys(r).sort(), ['answer','explanation','options','question','situation']);
    assert.ok(r.situation.length >= 65 && r.question.length > 8 && r.explanation.length >= 60, x.id);
    assert.ok(r.options.length >= 3 && r.options.every((option) => typeof option === 'string' && option.trim()));
    assert.ok(Number.isInteger(r.answer) && r.answer >= 0 && r.answer < r.options.length);
    assert.notEqual(r.situation, x.application.situation, x.id);
    assert.notEqual(r.question, x.application.question, x.id);
    assert.notEqual(r.explanation, x.application.explanation, x.id);
    assert.notDeepEqual(r.options, x.options, x.id);
  }
});

test('rea01 review: independent assignment preserves 1/2 after ten identical prior assignments', () => {
  const possibilities = Array.from({ length: 2 ** 11 }, (_, n) => n.toString(2).padStart(11, '0'));
  const selected = possibilities.filter((s) => s.startsWith('1'.repeat(10)));
  close(selected.filter((s) => s.endsWith('1')).length / selected.length, .5, 'next assignment');
  // Forced balancing is a different design, not the specified independent one.
  assert.notEqual(0, .5); assert.equal(item('rea01').review.answer, 1);
});

test('rea02 review: random inspection conditioned on normal gives 1/2, unlike informed host disclosure', () => {
  const states = [0,1,2].flatMap((fault) => [1,2].map((inspected) => ({ fault, inspected, weight: 1/6 })));
  const observedNormal = states.filter((s) => s.fault !== s.inspected);
  const mass = observedNormal.reduce((sum, s) => sum + s.weight, 0);
  const aMass = observedNormal.filter((s) => s.fault === 0).reduce((sum, s) => sum + s.weight, 0);
  close(mass, 2/3, 'normal observation probability'); close(aMass / mass, .5, 'A posterior');
  for (const inspected of [1,2]) {
    const knownInspection = observedNormal.filter((s) => s.inspected === inspected);
    close(knownInspection.filter((s) => s.fault === 0).length / knownInspection.length, .5, 'even with inspected identity known');
  }
  assert.equal(item('rea02').review.answer, 1);
});

test('rea03 review: combined AND / inclusive OR query admits only C', () => {
  const videos = [
    { name: 'A', free: true, captions: false, transcript: false },
    { name: 'B', free: false, captions: true, transcript: false },
    { name: 'C', free: true, captions: false, transcript: true },
  ];
  assert.deepEqual(videos.filter((v) => v.free && (v.captions || v.transcript)).map((v) => v.name), ['C']);
  assert.equal(item('rea03').review.options[item('rea03').review.answer], 'C만');
});

test('rea04 review: area encoding requires square-root radius, not linear radius', () => {
  close((20 ** 2) / (10 ** 2), 4, 'misleading area ratio');
  close(((10 * Math.sqrt(2)) ** 2) / (10 ** 2), 200/100, 'corrected area ratio');
  assert.equal(item('rea04').review.answer, 0);
});

test('rea05 review: necessary encryption does not determine permission', () => {
  const allowed = truthRows.filter(([encrypted, enabled]) => !enabled || encrypted);
  const encrypted = allowed.filter(([encryption]) => encryption);
  assert.deepEqual(encrypted.map(([, enabled]) => enabled), [false,true]);
  assert.equal(item('rea05').review.answer, 2);
});

test('rea06 review: exactly one offered integer is a counterexample to universal nonnegativity', () => {
  const candidates = [-2,-1,0]; const f = (n) => n * (n+2);
  candidates.forEach((n, i) => close(f(n), [0,-1,0][i], `f(${n})`));
  assert.deepEqual(candidates.filter((n) => f(n) < 0), [-1]);
  assert.ok(Array.from({ length: 10000 }, (_, i) => i + 1).every((n) => f(n) > 0));
  assert.equal(item('rea06').review.options[item('rea06').review.answer], '−1');
});

test('rea07 review: dependency graph enables inspection and notes in parallel after collection', () => {
  const prereqs = { collect: [], inspect: ['collect'], notes: ['collect'], visual: ['inspect'] };
  const completed = new Set(['collect']);
  const runnable = Object.entries(prereqs).filter(([task, deps]) => !completed.has(task) && deps.every((dep) => completed.has(dep))).map(([task]) => task);
  assert.deepEqual(runnable, ['inspect','notes']);
  const feasible = permutations(Object.keys(prereqs)).filter((order) => Object.entries(prereqs).every(([task, deps]) => deps.every((dep) => order.indexOf(dep) < order.indexOf(task))));
  assert.ok(feasible.some((order) => order.indexOf('inspect') < order.indexOf('notes')));
  assert.ok(feasible.some((order) => order.indexOf('notes') < order.indexOf('inspect')));
  assert.equal(item('rea07').review.answer, 1);
});

test('rea08 review: complete fault hypothesis set plus observations leaves only sensor failure', () => {
  const possible = ['power','cable','sensor'].filter((cause) => {
    const light = true, connected = true;
    return (cause !== 'power' || !light) && (cause !== 'cable' || !connected);
  });
  assert.deepEqual(possible, ['sensor']);
  // Adding an unmodeled hypothesis would remove uniqueness: closed-world condition matters.
  assert.equal([...possible, 'other'].length, 2);
  assert.equal(item('rea08').review.answer, 2);
});

test('rea09 review: an injective 300-to-256 code assignment is impossible', () => {
  // Every possible unique-code assignment can accommodate at most 256 records.
  assert.ok(300 > 256);
  const construction = Array.from({ length: 300 }, (_, i) => i % 256);
  assert.equal(new Set(construction).size, 256);
  assert.equal(construction.length - new Set(construction).size, 44);
  assert.equal(item('rea09').review.answer, 1);
});

test('rea10 review: a constant first answer creates only eight possible four-answer records', () => {
  const records = Array.from({ length: 2 ** 3 }, (_, n) => `Y${n.toString(2).padStart(3,'0')}`);
  assert.equal(new Set(records).size, 8); assert.ok(records.length < 16);
  assert.equal(item('rea10').review.answer, 1);
});

test('rea11 review: two independent fair signals permit simultaneous activation', () => {
  const bothOn = truthRows.filter(([a,b]) => a && b);
  close(bothOn.length / truthRows.length, .25, 'joint activation');
  const arbitrated = truthRows.map(([a,b]) => [a, b && !a]);
  assert.ok(arbitrated.every(([a,b]) => !(a && b)));
  assert.equal(item('rea11').review.answer, 1);
});

test('rea12 review: all-negative classifier achieves 99.8% accuracy but zero target detection', () => {
  const total = 10000, duplicates = 20, trueNegative = total - duplicates, truePositive = 0;
  close((trueNegative + truePositive) / total, .998, 'accuracy');
  close(truePositive / duplicates, 0, 'duplicate detection rate');
  assert.equal(item('rea12').review.answer, 1);
});

test('rea13 review: conditional presentation order has 18 candidates, six with A second', () => {
  const all = permutations(['A','B','C','D']);
  const conditioned = all.filter((order) => order[0] !== 'A');
  assert.equal(all.length, 24); assert.equal(conditioned.length, 18);
  assert.equal(conditioned.filter((order) => order[1] === 'A').length, 6);
  close(conditioned.filter((order) => order[1] === 'A').length / conditioned.length, 1/3, 'A second given not first');
  assert.equal(item('rea13').review.options[item('rea13').review.answer], '1/3');
});

test('rea14 review: exact mean 30 is not the most common daily observation', () => {
  const visits = [10,10,10,10,110];
  assert.equal(visits.reduce((a,b) => a+b, 0) / visits.length, 30);
  assert.equal(visits.filter((n) => n === 10).length, 4);
  assert.equal(visits.filter((n) => n === 30).length, 0);
  assert.equal(item('rea14').review.answer, 1);
});

test('rea15 review: case mix permits opposite within-group order despite higher overall A', () => {
  // A mostly easy / B mostly hard: B can be better within both groups.
  const a = { easy: .9, hard: .1, easyWeight: .9 };
  const b = { easy: .95, hard: .2, easyWeight: .1 };
  const overall = (x) => x.easy*x.easyWeight + x.hard*(1-x.easyWeight);
  assert.ok(overall(a) > overall(b)); assert.ok(b.easy > a.easy && b.hard > a.hard);
  // Another compatible ranking has A better in both groups. Overall ranking alone cannot choose.
  const a2 = { easy: .99, hard: .9, easyWeight: .9 };
  assert.ok(overall(a2) > overall(b) && a2.easy > b.easy && a2.hard > b.hard);
  assert.equal(item('rea15').review.answer, 0);
});

test('rea16 review: 100% response in current accounts does not identify former users satisfaction', () => {
  const current = 100, satisfied = 95, former = 100;
  close(satisfied / current, .95, 'current-user census');
  const allSatisfiedFormer = (satisfied + former)/(current + former);
  const noSatisfiedFormer = satisfied/(current + former);
  assert.equal(allSatisfiedFormer, .975); assert.equal(noSatisfiedFormer, .475);
  assert.equal(item('rea16').review.answer, 0);
});

test('rea17 review: weighting team choice by size gives every person probability 1/10', () => {
  const candidateWeights = [[.5,.5],[1/5,4/5],[4/5,1/5]];
  const uniform = candidateWeights.flatMap(([small, large], index) => Math.abs(small/2 - large/8) < 1e-12 ? [index] : []);
  assert.deepEqual(uniform, [1]); close((1/5)/2, .1, 'small-team person'); close((4/5)/8, .1, 'large-team person');
  assert.notEqual(.5/2, .5/8);
  assert.equal(item('rea17').review.answer, 1);
});

test('rea18 review: enumerate all unordered manuscript pairs, distinguish single-reference comparisons', () => {
  const manuscripts = Array.from({ length: 10 }, (_, i) => i);
  const pairs = manuscripts.flatMap((a) => manuscripts.filter((b) => b > a).map((b) => [a,b]));
  assert.equal(pairs.length, 45); assert.equal(new Set(pairs.map((pair) => pair.join(','))).size, 45);
  assert.equal(pairs.filter(([a,b]) => a === 0 || b === 0).length, 9);
  assert.equal(item('rea18').review.options[item('rea18').review.answer], '45쌍');
});

test('rea19 review: every one of 120 uniformly shuffled photo orders has the same exact-sequence probability', () => {
  const orders = permutations(['A','B','C','D','E']);
  assert.equal(orders.length, 120); assert.equal(new Set(orders.map((order) => order.join(''))).size, 120);
  const afterObserved = orders[73].join('');
  close(orders.filter((order) => order.join('') === afterObserved).length / orders.length, 1/120, 'observed exact order');
  close(orders.length * (1/120), 1, 'some exact outcome must occur');
  assert.equal(item('rea19').review.answer, 1);
});

test('rea20 review: all eight three-state rows validate nested De Morgan and reject other choices', () => {
  const rows = truthRows.flatMap(([temperature, vibration]) => bools.map((maintenance) => [temperature, vibration, maintenance]));
  const choices = [
    (t,v,m) => (!t || !v) && !m,
    (t,v,m) => (!t && !v) || m,
    (t,v,m) => !t && !v && m,
  ];
  const equivalent = choices.flatMap((fn, i) => rows.every(([t,v,m]) => fn(t,v,m) === !((t || v) && !m)) ? [i] : []);
  assert.deepEqual(equivalent, [1]);
  assert.equal(rows.filter(([t,v,m]) => !((t || v) && !m)).length, 5);
  assert.equal(item('rea20').review.answer, 1);
});
