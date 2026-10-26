/* مدل جهان ربات برای مرحله‌های کارگاه: جدول، دیوار، ستاره‌ها، ردّ قلم و داوری هدف.
   بدون DOM تا در Node آزموده شود. هر مرحله: {cols, rows, start:{x,y,d}, walls:[[x,y]], stars:[[x,y]], goal:{type:'stars'|'shape', w, h}}.
   d: ۰ بالا، ۱ راست، ۲ پایین، ۳ چپ. */
var RobotModel = (function () {
  var DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  var MAX_OPS = 400;

  function key(x, y) { return x + ',' + y; }
  function has(list, x, y) { return (list || []).some(function (p) { return p[0] === x && p[1] === y; }); }

  function fresh(lv) { return {x: lv.start.x, y: lv.start.y, d: lv.start.d, trail: [], got: {}, bump: false, steps: 0}; }

  function edge(a, b, c, d) {
    return (a < c || (a === c && b < d)) ? a + ',' + b + '-' + c + ',' + d : c + ',' + d + '-' + a + ',' + b;
  }

  /* یک دستور؛ برخورد با لبه یا دیوار ربات را سر جایش نگه می‌دارد و false برمی‌گرداند. */
  function step(lv, w, op) {
    w.steps++;
    if (op === 'left') w.d = (w.d + 3) % 4;
    else if (op === 'right') w.d = (w.d + 1) % 4;
    else if (op === 'move') {
      var nx = w.x + DX[w.d], ny = w.y + DY[w.d];
      if (nx < 0 || ny < 0 || nx >= lv.cols || ny >= lv.rows || has(lv.walls, nx, ny)) { w.bump = true; return false; }
      w.trail.push(edge(w.x, w.y, nx, ny));
      w.x = nx; w.y = ny;
      if (has(lv.stars, nx, ny)) w.got[key(nx, ny)] = true;
    }
    return true;
  }

  /* اندازهٔ مستطیلی که ردّ قلم کشیده و ربات به خانهٔ شروع برگشته؛ null یعنی شکل بسته نیست. */
  function shape(lv, w) {
    if (w.bump || w.x !== lv.start.x || w.y !== lv.start.y) return null;
    var seen = {}, edges = [];
    w.trail.forEach(function (e) { if (!seen[e]) { seen[e] = 1; edges.push(e); } });
    if (!edges.length) return null;
    var pts = edges.map(function (e) { return e.split('-').map(function (p) { return p.split(',').map(Number); }); });
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    pts.forEach(function (pq) { pq.forEach(function (p) { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }); });
    var sw = maxX - minX, sh = maxY - minY;
    if (sw < 1 || sh < 1 || edges.length !== 2 * (sw + sh)) return null;
    var border = pts.every(function (pq) {
      var a = pq[0], b = pq[1];
      return a[1] === b[1] ? (a[1] === minY || a[1] === maxY) : (a[0] === minX || a[0] === maxX);
    });
    return border ? {w: sw, h: sh} : null;
  }

  function collected(lv, w) { return (lv.stars || []).filter(function (p) { return w.got[key(p[0], p[1])]; }).length; }

  /* نتیجهٔ داوری؛ ok یعنی هدف مرحله برآورده شد (محدودیت تعداد بلوک جدا بررسی می‌شود). */
  function judge(lv, w) {
    var g = lv.goal || {type: 'stars'}, r = {bump: w.bump, stars: collected(lv, w), total: (lv.stars || []).length, shape: shape(lv, w)};
    if (g.type === 'shape') r.ok = !!r.shape && ((r.shape.w === g.w && r.shape.h === g.h) || (r.shape.w === g.h && r.shape.h === g.w));
    else r.ok = !w.bump && r.total > 0 && r.stars === r.total;
    return r;
  }

  function run(lv, ops) {
    var w = fresh(lv);
    for (var i = 0; i < ops.length && i < MAX_OPS; i++) if (!step(lv, w, ops[i])) break;
    var r = judge(lv, w); r.world = w;
    return r;
  }

  return {DX: DX, DY: DY, MAX_OPS: MAX_OPS, has: has, fresh: fresh, step: step, shape: shape, judge: judge, run: run};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = RobotModel;
