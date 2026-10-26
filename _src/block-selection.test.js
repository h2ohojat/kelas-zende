'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const raw = fs.readFileSync(process.env.BLOCK_SELECTION_PACKAGE || path.join(__dirname, 'block-kit.js'), 'utf8');
const start = raw.indexOf('var BlockKit = (function () {');
const end = raw.indexOf('\n})();', start) + '\n})();'.length;
const cx = vm.createContext({LabKit: {fa: String}});
vm.runInContext(raw.slice(start, end), cx);
function fixture() {
  const blocks = new Map();
  const ws = {getBlockById: id => blocks.get(id) || null};
  let focused = null;
  const choose = cx.BlockKit.selection(ws, () => focused);
  const block = id => { const b = {id, type: id, workspace: ws}; blocks.set(id, b); return b; };
  return {blocks, ws, choose, block, focus: b => { focused = b; }};
}
test('remembers the main workspace selection when the toolbox takes focus', () => {
  const f = fixture(), repeat = f.block('repeat');
  f.focus(repeat); assert.equal(f.choose.current(), repeat);
  f.focus({id: 'flyout-move', type: 'move', workspace: {}});
  assert.equal(f.choose.current(), repeat);
});
test('selection events retain the intended middle or nested block before a toolbox click', () => {
  const f = fixture(), middle = f.block('middle'), nested = f.block('nested');
  f.choose.remember(middle.id); assert.equal(f.choose.current(), middle);
  f.choose.remember(nested.id); assert.equal(f.choose.current(), nested);
  f.choose.remember(null); assert.equal(f.choose.current(), nested, 'focus blur is not an explicit background deselection');
});
test('deleted blocks and stale IDs cannot be used as insertion targets', () => {
  const f = fixture(), old = f.block('old');
  f.choose.remember(old.id); f.blocks.delete(old.id); assert.equal(f.choose.current(), null);
  f.choose.remember('unknown'); assert.equal(f.choose.current(), null);
});
test('loading another level or rebuilding the editor starts with no retained selection', () => {
  const f = fixture(), b = f.block('previous');
  f.choose.remember(b.id); f.choose.clear(); assert.equal(f.choose.current(), null);
  const other = fixture(); assert.equal(other.choose.current(), null);
});
test('a newly inserted block becomes the target for the next quick toolbox click', () => {
  const f = fixture(), a = f.block('a'), b = f.block('b');
  f.choose.remember(a.id); f.choose.remember(b.id); assert.equal(f.choose.current(), b);
});
