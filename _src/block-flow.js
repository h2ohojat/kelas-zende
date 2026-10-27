/* Optional bounded event programs for BlockKit. No generated JavaScript, network or dynamic execution. */
var BlockFlow = (function () {
  'use strict';
  var MAX_BLOCKS = 60, MAX_DEPTH = 8, MAX_STEPS = 240;
  function record(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function integer(v, min, max) {
    if (['string', 'number'].indexOf(typeof v) < 0 || typeof v === 'string' && !/^-?\d{1,4}$/.test(v)) throw Error('عدد بلوک معتبر نیست.');
    var n = Number(v);
    if (!Number.isInteger(n) || n < min || n > max) throw Error('عدد بلوک بیرون از دامنه است.');
    return n;
  }
  function variables(def, raw) {
    var defaults = def.flow.variables, out = {};
    if (raw !== undefined && !record(raw)) return null;
    for (var k of Object.keys(defaults)) {
      if (!/^[a-z][a-z0-9_]{0,24}$/.test(k) || ['constructor', 'prototype', '__proto__'].indexOf(k) >= 0) throw Error('نام داده معتبر نیست.');
      var n = raw === undefined ? defaults[k] : raw[k];
      if (!Number.isInteger(n) || n < -999 || n > 999) return null;
      out[k] = n;
    }
    return out;
  }
  function ruleFor(def, key) {
    var type = Object.keys(def.flow.rules).find(function (t) { return def.flow.rules[t].key === key; });
    if (!type) throw Error('بلوک ناشناخته است: ' + key);
    return {type: type, rule: def.flow.rules[type]};
  }
  function program(def, list) {
    function chain(items, depth) {
      if (depth > MAX_DEPTH) throw Error('برنامه بیش از اندازه تودرتو است.');
      var head = null, tail = null;
      (items || []).forEach(function (it) {
        var key = typeof it === 'string' ? it : it.key, spec = ruleFor(def, key), b = {type: spec.type};
        if (spec.rule.field) { b.fields = {}; b.fields[spec.rule.field] = String(it.value == null ? spec.rule.initial || 0 : it.value); }
        if (spec.rule.input) { var body = chain(it.body || [], depth + 1); if (body) { b.inputs = {}; b.inputs[spec.rule.input] = {block: body}; } }
        if (tail) tail.next = {block: b}; else head = b;
        tail = b;
      });
      return head;
    }
    var root = {type: def.hat, x: 24, y: 24, deletable: false};
    var body = chain(list, 0); if (body) root.next = {block: body};
    return {blocks: {languageVersion: 0, blocks: [root]}};
  }
  function toolbox(def, level) {
    return {kind: 'flyoutToolbox', contents: level.palette.map(function (key) {
      var spec = ruleFor(def, key), b = {kind: 'block', type: spec.type};
      if (spec.rule.field) { b.fields = {}; b.fields[spec.rule.field] = String(spec.rule.initial || 0); }
      return b;
    })};
  }
  function workspace(def, raw) {
    if (!record(raw)) return false;
    var bytes; try { bytes = JSON.stringify(raw); } catch (_) { return false; }
    if (bytes.length > 20000) return false;
    var blocks = 0, seen = 0;
    function visit(v, depth) {
      if (depth > 45 || ++seen > 900) return false;
      if (Array.isArray(v)) return v.length <= MAX_BLOCKS && v.every(function (x) { return visit(x, depth + 1); });
      if (!record(v)) return v === null || ['string', 'number', 'boolean'].indexOf(typeof v) >= 0;
      if (typeof v.type === 'string' && (!Object.prototype.hasOwnProperty.call(def.flow.rules, v.type) && v.type !== def.hat || ++blocks > MAX_BLOCKS)) return false;
      return Object.keys(v).every(function (k) { return ['__proto__', 'prototype', 'constructor'].indexOf(k) < 0 && visit(v[k], depth + 1); });
    }
    return visit(raw, 0) && record(raw.blocks) && Array.isArray(raw.blocks.blocks) && raw.blocks.blocks.filter(function (b) { return b.type === def.hat; }).length === 1;
  }
  function compile(def, ws) {
    var roots = ws.getBlocksByType(def.hat, false), seen = new Set(), count = 0;
    if (roots.length !== 1) throw Error('برنامه باید یک بلوک شروع داشته باشد.');
    function walk(block, depth) {
      if (depth > MAX_DEPTH) throw Error('برنامه بیش از اندازه تودرتو است.');
      var nodes = [];
      for (var b = block; b; b = b.getNextBlock()) {
        if (seen.has(b.id) || ++count > MAX_BLOCKS) throw Error('برنامه بزرگ یا چرخه‌ای است.');
        seen.add(b.id);
        var rule = def.flow.rules[b.type];
        if (!rule) throw Error('بلوک ناشناخته در برنامه است.');
        var node = {kind: rule.kind, id: b.id};
        if (rule.kind === 'action') node.op = rule.op;
        else if (rule.kind === 'if') node.condition = rule.condition;
        else if (rule.kind === 'set' || rule.kind === 'change') {
          if (!Object.prototype.hasOwnProperty.call(def.flow.variables, rule.variable)) throw Error('دادهٔ ناشناخته است.');
          node.variable = rule.variable; node.value = integer(b.getFieldValue(rule.field), rule.kind === 'set' ? -999 : -9, rule.kind === 'set' ? 999 : 9);
        } else if (rule.kind === 'repeat') node.times = integer(b.getFieldValue(rule.field), 0, 8);
        else throw Error('نوع بلوک پشتیبانی نمی‌شود.');
        if (rule.input) node.body = walk(b.getInputTargetBlock(rule.input), depth + 1);
        nodes.push(node);
      }
      return nodes;
    }
    return {nodes: walk(roots[0].getNextBlock(), 0), blocks: count};
  }
  function runner(nodes, ctx, maxSteps) {
    var stack = [{nodes: nodes, index: 0, left: 1}], steps = 0, stopped = false;
    var budget = maxSteps == null ? MAX_STEPS : integer(maxSteps, 1, MAX_STEPS);
    function charge() { if (++steps > budget) { stack = []; throw Error('برنامه طولانی شد؛ تعداد تکرارها را کم کن.'); } }
    return {
      stop: function () { stopped = true; stack = []; },
      next: function () {
        while (!stopped && stack.length) {
          var frame = stack[stack.length - 1];
          if (frame.index >= frame.nodes.length) {
            charge();
            if (--frame.left > 0) frame.index = 0; else stack.pop();
            continue;
          }
          charge();
          var n = frame.nodes[frame.index++];
          if (n.kind === 'action') ctx.act(n.op, ctx.vars, ctx.event);
          else if (n.kind === 'set' || n.kind === 'change') {
            if (!Object.prototype.hasOwnProperty.call(ctx.vars, n.variable)) throw Error('دادهٔ ناشناخته است.');
            ctx.vars[n.variable] = integer(n.kind === 'set' ? n.value : ctx.vars[n.variable] + n.value, -999, 999);
          } else if (n.kind === 'if' || n.kind === 'repeat') {
            var times = n.kind === 'if' ? (ctx.test(n.condition, ctx.vars, ctx.event) === true ? 1 : 0) : integer(n.times, 0, 8);
            if (times && n.body.length) { if (stack.length >= MAX_DEPTH + 1) throw Error('برنامه بیش از اندازه تودرتو است.'); stack.push({nodes: n.body, index: 0, left: times}); }
          } else throw Error('دستور ناشناخته است.');
          return n;
        }
        return null;
      }
    };
  }
  return {VERSION: '0.1.0', program: program, toolbox: toolbox, workspace: workspace, compile: compile, runner: runner, variables: variables};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BlockFlow;
