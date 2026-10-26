// آزمون مدل و مرحله‌های کارگاه ربات بلوکی: node --test _src/lab-robot-blocks.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const M = require('../content/lab-robot-blocks/model.js');
const LEVELS = require('../content/lab-robot-blocks/levels.js');

/* راه‌حل مرجع هر مرحله؛ فقط برای اثبات حل‌پذیری با محدودیت بلوک. */
const SOLUTIONS = {
  'first-steps': ['move', 'move'],
  'turn-right': ['move', 'right', 'move', 'move'],
  'turn-left': ['move', 'move', 'left', 'move', 'move'],
  'around-wall': ['move', 'left', 'move', 'right', 'move', 'move', 'right', 'move', 'left', 'move'],
  'small-stairs': ['move', 'left', 'move', 'right', 'move', 'left', 'move'],
  'bug-extra': ['move', 'move', 'right', 'move', 'move', 'move'],
  'bug-turn': ['move', 'move', 'right', 'move', 'move'],
  'bug-missing': ['move', 'left', 'move', 'right', 'move', 'move', 'right', 'move', 'left', 'move'],
  'loop-line': [{repeat: 6, body: ['move']}],
  'loop-stairs': [{repeat: 4, body: ['move', 'left', 'move', 'right']}],
  'draw-square': ['move', 'move', 'right', 'move', 'move', 'right', 'move', 'move', 'right', 'move', 'move', 'right'],
  'square-loop': [{repeat: 4, body: ['move', 'move', 'right']}],
  'big-square': [{repeat: 4, body: ['move', 'move', 'move', 'right']}],
  'bug-loop': [{repeat: 4, body: ['move', 'move', 'right']}],
  'two-stars': ['move', 'move', 'right', 'move', 'move'],
  'star-stairs': [{repeat: 3, body: ['move', 'left', 'move', 'right']}],
  'rectangle': [{repeat: 2, body: ['move', 'move', 'right', 'move', 'move', 'move', 'right']}],
  'maze': ['move', 'move', 'move', 'right', 'move', 'move', 'right', 'move', 'move', 'move', 'left', 'move', 'move'],
  'nested': [{repeat: 4, body: [{repeat: 3, body: ['move']}, 'right']}],
  'snake': [{repeat: 6, body: ['move']}, 'right', 'move', 'right', {repeat: 6, body: ['move']}, 'left', 'move', 'left', {repeat: 6, body: ['move']}]
};
const expand = (p) => p.flatMap((x) => typeof x === 'string' ? [x] : Array.from({length: x.repeat}, () => expand(x.body)).flat());
const count = (p) => p.reduce((n, x) => n + (typeof x === 'string' ? 1 : 1 + count(x.body)), 0);
const uses = (p, op) => p.some((x) => x === op || (typeof x === 'object' && (op === 'repeat' || uses(x.body, op))));

test('بیست مرحله با شناسهٔ یکتا و داده‌های معتبر', () => {
  assert.equal(LEVELS.length, 20);
  assert.equal(new Set(LEVELS.map((l) => l.id)).size, 20);
  for (const l of LEVELS) {
    assert.match(l.id, /^[a-z][a-z0-9-]{1,30}$/);
    assert.ok(l.title && l.text && l.hints.length === 3, l.id);
    const inside = ([x, y]) => x >= 0 && y >= 0 && x < l.cols && y < l.rows;
    assert.ok(inside([l.start.x, l.start.y]) && !M.has(l.walls, l.start.x, l.start.y), l.id + ' start');
    for (const s of l.stars) assert.ok(inside(s) && !M.has(l.walls, s[0], s[1]), l.id + ' star');
    assert.ok(l.goal.type === 'shape' || l.stars.length > 0, l.id + ' goal');
  }
});

test('هر مرحله با راه‌حل مرجع و در حد بلوک مجاز حل می‌شود', () => {
  for (const l of LEVELS) {
    const sol = SOLUTIONS[l.id];
    assert.ok(sol, 'راه‌حل ' + l.id);
    const r = M.run(l, expand(sol));
    assert.ok(r.ok, l.id + ' حل نشد: ' + JSON.stringify({bump: r.bump, stars: r.stars, shape: r.shape}));
    if (l.maxBlocks) assert.ok(count(sol) <= l.maxBlocks, l.id + ' بلوک بیش از حد');
    for (const x of sol.flatMap((x) => typeof x === 'string' ? [x] : ['repeat'])) assert.ok(l.palette.includes(x), l.id + ' بلوک ' + x + ' در جعبه نیست');
    assert.ok(!uses(sol, 'repeat') || l.palette.includes('repeat'));
  }
});

test('برنامهٔ آغازین مرحله‌های اشکال‌یابی واقعاً اشکال دارد', () => {
  const bugs = LEVELS.filter((l) => l.program);
  assert.equal(bugs.length, 4);
  for (const l of bugs) assert.ok(!M.run(l, expand(l.program)).ok, l.id);
  assert.ok(M.run(LEVELS.find((l) => l.id === 'bug-turn'), expand(LEVELS.find((l) => l.id === 'bug-turn').program)).bump);
});

test('محدودیت بلوک بدون تکرار حل‌شدنی نیست', () => {
  for (const id of ['loop-line', 'loop-stairs', 'square-loop', 'big-square', 'star-stairs', 'rectangle', 'snake']) {
    const l = LEVELS.find((x) => x.id === id);
    assert.ok(expand(SOLUTIONS[id]).length > l.maxBlocks, id + ' بدون تکرار هم در حد مجاز است');
  }
  const nested = LEVELS.find((x) => x.id === 'nested');
  assert.ok(count([{repeat: 4, body: ['move', 'move', 'move', 'right']}]) > nested.maxBlocks, 'تکرار ساده نباید مرحلهٔ تودرتو را حل کند');
});

test('شکل و دیوار و لبه درست داوری می‌شوند', () => {
  const sq = LEVELS.find((l) => l.id === 'draw-square');
  assert.ok(!M.run(sq, ['move', 'right', 'move', 'right', 'move', 'right', 'move']).ok, 'مربع ۱×۱ هدف ۲×۲ نیست');
  assert.ok(!M.run(sq, ['move', 'move', 'right', 'move', 'move', 'right', 'move', 'move', 'right', 'move']).ok, 'شکل باز');
  const rect = LEVELS.find((l) => l.id === 'rectangle');
  assert.ok(M.run(rect, expand([{repeat: 2, body: ['move', 'move', 'move', 'right', 'move', 'move', 'right']}])).ok, 'مستطیل ۲×۳ هم پذیرفته است');
  const wall = LEVELS.find((l) => l.id === 'around-wall');
  const r = M.run(wall, ['move', 'move', 'move']);
  assert.ok(r.bump && r.world.x === 2, 'دیوار ربات را نگه می‌دارد');
  assert.ok(M.run(LEVELS[0], ['left', 'move', 'move']).bump, 'لبه');
});
