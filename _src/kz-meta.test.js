// Run with node --test _src/kz-meta.test.js. No additional dependencies.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const KZ = require('./kz-meta');
const read = (name) => fs.readFileSync(path.join(__dirname, name), 'utf8');

test('density lesson: stable ids, stars and copyright mode', () => {
  const m = KZ.metaFor(KZ.loadLesson([read('lesson-density.js')]), '1.2.0');
  assert.equal(m.kz, 1);
  assert.equal(m.engine, '1.2.0');
  assert.match(m.id, KZ.ID_RE);
  assert.equal(m.contentMode, 'syllabus');
  assert.equal(m.licenseNumber, null);
  assert.equal(m.maxStars, m.items.filter((i) => i.scored).length * 3);
  assert.deepEqual(m.items.map((i) => i.idx), m.items.map((_, k) => k));
  assert.equal(m.items.filter((i) => i.gated && /^s\d+$/.test(i.id)).length, 0);
  assert.equal(new Set(m.items.map((i) => i.id)).size, m.items.length);
  assert.ok(m.items.every((i) => !/[<>]/.test(i.q)));
  assert.equal(m.items[m.items.length - 1].type, 'end');
});

test('items inherit the previous stage and collect wrong-answer tags', () => {
  const m = KZ.metaFor({ id: 'x-1', title: 'T', stages: [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }],
    slides: [
      { type: 'content', title: '<b>سلام</b>' },
      { id: 'q1', type: 'mcq', q: 'یک؟', options: [{ t: '1', ok: true }, { t: '2', tag: 'm1' }] },
      { id: 'q2', stage: 'b', type: 'input', q: 'دو', wrong: [{ tag: ['m2', 'm1'] }] },
      { id: 'p', type: 'poll', q: 'نظر' },
      { id: 'free', type: 'custom', gate: false, q: 'آزاد' },
      { id: 'end', type: 'end' }] }, '1.2.0');
  assert.deepEqual(m.items.map((i) => i.stage), ['a', 'a', 'b', 'b', 'b', 'b']);
  assert.deepEqual(m.items.map((i) => i.gated), [false, true, true, true, false, false]);
  assert.deepEqual(m.items.map((i) => i.scored), [false, true, true, false, false, false]);
  assert.deepEqual(m.items[2].tags, ['m2', 'm1']);
  assert.equal(m.items[0].id, 's0');
  assert.equal(m.items[0].q, 'سلام');
  assert.equal(m.maxStars, 6);
});

test('academic profile carries no stars', () => {
  const m = KZ.metaFor({ id: 'ac', title: 'T', profile: 'academic', slides: [{ id: 'q', type: 'mcq', q: 'x', options: [] }] }, '1.2.0');
  assert.equal(m.maxStars, 0);
  assert.equal(m.items[0].scored, false);
});

test('licensed mode keeps the license number; syllabus drops it', () => {
  const base = { id: 'lic', title: 'T', slides: [], licenseNumber: '123' };
  assert.equal(KZ.metaFor(Object.assign({ contentMode: 'textbook-licensed' }, base), '1.2.0').licenseNumber, '123');
  assert.equal(KZ.metaFor(base, '1.2.0').licenseNumber, null);
  assert.throws(() => KZ.metaFor(Object.assign({}, base, {contentMode: 'anything'}), '1.2.0'), /contentMode/);
  assert.throws(() => KZ.metaFor({id: 'lic', slides: [], contentMode: 'textbook-licensed'}, '1.2.0'), /licenseNumber/);
});

test('invalid lesson identity stops the build', () => {
  assert.throws(() => KZ.metaFor({title: 'T', slides: []}, '1.2.0'), /LESSON.id/);
  assert.throws(() => KZ.metaFor({id: 'Bad Id', title: 'T', slides: []}, '1.2.0'), /LESSON.id/);
});

test('duplicate slide ids fail the build', () => {
  assert.throws(() => KZ.metaFor({ id: 'd', title: 'T', slides: [{ id: 'a', type: 'content' }, { id: 'a', type: 'content' }] }, '1.2.0'), /duplicate slide id/);
});

test('lesson text cannot close the meta script tag', () => {
  const html = KZ.block(KZ.metaFor({ id: 'esc', title: '</script><b>x</b>', slides: [{ id: 'a', type: 'content', q: 'a &lt;/script&gt; b' }] }, '1.2.0'));
  assert.equal((html.match(/<\/script>/g) || []).length, 1);
  const json = JSON.parse(html.match(/id="kz-meta">(.*)<\/script>$/)[1]);
  assert.equal(json.items[0].q, 'a </script> b');
});
