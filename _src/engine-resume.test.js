'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {spawnSync} = require('node:child_process');
const text = fs.readFileSync(process.env.ENGINE_RESUME_PACKAGE || path.join(__dirname, 'engine.js'), 'utf8');
const fresh = text.slice(text.indexOf('function fresh() {'), text.indexOf('\nfunction load()', text.indexOf('function fresh() {')));
const restore = text.slice(text.indexOf('function restoreState(value) {'), text.indexOf('\nvar S = restoreState(load());'));
const right = text.slice(text.indexOf('function right(ctx, fb, resp) {'), text.indexOf('\nfunction markDone('));
const cx = vm.createContext({L: {slides: Array(22)}, showFb() {}});
vm.runInContext(fresh + '\n' + restore + '\n' + right, cx);
const plain = value => JSON.parse(JSON.stringify(value));
function state() {
  return {idx: 0, stars: 6, res: {
    0: {done: false, stars: 0, tries: 0, hints: 0, custom: {level: 'turn-right', solved: ['first-steps', 'turn-right'], progs: {'first-steps': {blocks: {blocks: [{type: 'start', next: {block: {type: 'move'}}}]}}}}},
    1: {done: true, stars: 3, tries: 0, hints: 0},
    2: {done: true, stars: 3, tries: 0, hints: 0}
  }, dwell: {0: 12}, self: {0: 'ok'}, stDone: {0: true}, tags: {0: 1}};
}
function check(s) {
  const r = plain(cx.restoreState(s));
  assert.equal(r.stars, 6);
  assert.equal(Object.keys(r.res).length, 3);
  assert.deepEqual(r.res[0].custom, state().res[0].custom);
  assert.equal(r.res[1].done, true);
  assert.equal(r.res[2].stars, 3);
  assert.equal(Array.isArray(r.res), false);
  assert.equal(r.dwell[0], 12);
  assert.equal(r.self[0], 'ok');
  assert.equal(r.stDone[0], true);
  assert.equal(r.tags[0], 1);
  return r;
}
test('restores numeric result maps and JSON list equivalents without losing custom work', () => {
  check(state());
  const s = state();
  for (const key of ['res', 'dwell', 'self', 'stDone', 'tags']) s[key] = Object.values(s[key]);
  check(s);
});
const php = spawnSync(process.env.PHP_BINARY || 'php', ['-r', '$v=json_decode(stream_get_contents(STDIN),true,512,JSON_THROW_ON_ERROR); echo json_encode($v,JSON_THROW_ON_ERROR);'], {input: JSON.stringify(state()), encoding: 'utf8'});
test('actual PHP associative JSON round-trip preserves programs, solved levels and stars', {skip: php.error?.code === 'ENOENT' ? 'PHP is unavailable in this engine-only environment' : false}, () => {
  assert.equal(php.status, 0, php.stderr);
  const s = JSON.parse(php.stdout);
  assert.equal(Array.isArray(s.res), true, 'the fixture really exercises PHP list conversion');
  const restored = check(s);
  assert.deepEqual(plain(cx.restoreState(restored)), restored);
});
test('a completed restored activity does not award its stars a second time', () => {
  const s = state(); s.res = Object.values(s.res);
  cx.S = cx.restoreState(s);
  cx.right({r: cx.S.res[1], s: {praise: 'ok'}}, 'ok');
  assert.equal(cx.S.stars, 6);
  assert.equal(cx.S.res[1].stars, 3);
});
test('malformed roots, result records and counters remain rejected or normalized', () => {
  for (const value of [null, 'bad', 3, []]) assert.equal(plain(cx.restoreState(value)).stars, 0);
  const s = cx.restoreState({res: [null, 'bad', [], {tries: -1, hints: 'bad', stars: -8, last: {bad: true}}], tags: 3, dwell: false, self: 'bad', stDone: null, badges: {}, idx: Infinity, stars: -1});
  assert.deepEqual(Object.keys(s.res), ['3']);
  assert.equal(s.res[3].tries, 0);
  assert.equal(s.res[3].stars, 0);
  assert.equal(s.res[3].last, undefined);
  assert.equal(s.stars, 0);
  for (const key of ['tags', 'dwell', 'self', 'stDone']) assert.deepEqual(plain(s[key]), {});
});
