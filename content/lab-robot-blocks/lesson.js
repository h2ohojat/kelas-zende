/* کارگاه ربات بلوکی — بیست مرحلهٔ برنامه‌نویسی بلوکی برای ۱۰ تا ۱۲ سال روی بلوک‌کیت.
   این فایل فقط بلوک‌ها و صحنهٔ ربات را تعریف می‌کند؛ مرحله‌ها در levels.js و مدل در model.js هستند.
   شناسهٔ درس و مرحله‌ها را پس از انتشار تغییر ندهید. */
var RLAB = (function () {
  var M = RobotModel, K = LabKit, CELL = 100, PAD = 10;
  var C = {start: '#FFBF00', move: '#4C97FF', turn: '#5CB1D6', loop: '#FFAB19'};

  var def = {
    id: 'robot', title: 'کارگاه ربات بلوکی', icon: '🤖',
    levels: ROBOT_LEVELS,
    hat: 'robot_start',
    ops: {robot_move: 'move', robot_right: 'right', robot_left: 'left'},
    loop: {type: 'robot_repeat', input: 'DO', field: 'N', initial: 4},
    blocks: [
      {type: 'robot_start', message0: 'وقتی ▶ زده شد', nextStatement: null, colour: C.start, hat: 'cap', tooltip: 'برنامه از این‌جا شروع می‌شود.'},
      {type: 'robot_move', message0: '⬆ یک خانه جلو برو', previousStatement: null, nextStatement: null, colour: C.move, tooltip: 'ربات یک خانه به سمتی که رویش است می‌رود.'},
      {type: 'robot_right', message0: '↻ به راست بچرخ', previousStatement: null, nextStatement: null, colour: C.turn, tooltip: 'ربات سر جایش ربع دور به راست می‌چرخد.'},
      {type: 'robot_left', message0: '↺ به چپ بچرخ', previousStatement: null, nextStatement: null, colour: C.turn, tooltip: 'ربات سر جایش ربع دور به چپ می‌چرخد.'},
      {type: 'robot_repeat', message0: '🔁 %1 بار تکرار کن', args0: [{type: 'field_dropdown', name: 'N', options: [2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { return [K.fa(n), String(n)]; })}],
        message1: '%1', args1: [{type: 'input_statement', name: 'DO'}], previousStatement: null, nextStatement: null, colour: C.loop, tooltip: 'بلوک‌های داخل را چند بار پشت سر هم اجرا می‌کند.'}
    ],
    results: {bump: '💥 دیوار'},
    scene: function (lab) {
      var svg = lab.svgRoot(700, 500, 'جدول ربات');
      svg.classList.add('rb-svg');
      var lv = null, world = null, angle = 0, layer = {}, robot, starEls = {};
      var cx = function (x) { return PAD + x * CELL + CELL / 2; }, cy = function (y) { return PAD + y * CELL + CELL / 2; };
      function g(cls) { var e = K.svg('g', {class: cls}); svg.appendChild(e); return e; }
      function clear(e) { while (e.firstChild) e.removeChild(e.firstChild); }

      function draw() {
        clear(svg);
        svg.setAttribute('viewBox', '0 0 ' + (lv.cols * CELL + 2 * PAD) + ' ' + (lv.rows * CELL + 2 * PAD));
        svg.setAttribute('aria-label', 'جدول ' + K.fa(lv.cols) + ' در ' + K.fa(lv.rows) + '؛ ' + lv.title);
        layer.grid = g('rb-grid'); layer.ghost = g('rb-ghost'); layer.trail = g('rb-trail'); layer.items = g('rb-items');
        for (var y = 0; y < lv.rows; y++) for (var x = 0; x < lv.cols; x++) {
          var wall = M.has(lv.walls, x, y);
          layer.grid.appendChild(K.svg('rect', {x: PAD + x * CELL + 3, y: PAD + y * CELL + 3, width: CELL - 6, height: CELL - 6, rx: 14, class: wall ? 'rb-wall' : (x + y) % 2 ? 'rb-cell rb-cell-b' : 'rb-cell'}));
          if (wall) { var t = K.svg('text', {x: cx(x), y: cy(y) + 4, class: 'rb-emoji', 'text-anchor': 'middle', 'dominant-baseline': 'middle'}); t.textContent = '🧱'; layer.grid.appendChild(t); }
        }
        layer.grid.appendChild(K.svg('circle', {cx: cx(lv.start.x), cy: cy(lv.start.y), r: 36, class: 'rb-home'}));
        if (lv.goal.type === 'shape') { // طرح کم‌رنگ شکل هدف: از خانهٔ شروع، بالا و راست
          var x0 = cx(lv.start.x), y0 = cy(lv.start.y), x1 = x0 + lv.goal.w * CELL, y1 = y0 - lv.goal.h * CELL;
          layer.ghost.appendChild(K.svg('rect', {x: x0, y: y1, width: x1 - x0, height: y0 - y1, class: 'rb-ghost-shape'}));
        }
        starEls = {};
        lv.stars.forEach(function (s) {
          var t = K.svg('text', {x: cx(s[0]), y: cy(s[1]) + 4, class: 'rb-emoji rb-star', 'text-anchor': 'middle', 'dominant-baseline': 'middle'});
          t.textContent = '⭐';
          layer.items.appendChild(t);
          starEls[s[0] + ',' + s[1]] = t;
        });
        robot = K.svg('g', {class: 'rb-robot'});
        var body = K.svg('g', {class: 'rb-body'});
        body.appendChild(K.svg('rect', {x: -30, y: -28, width: 60, height: 58, rx: 16, class: 'rb-shell'}));
        body.appendChild(K.svg('circle', {cx: -12, cy: -4, r: 7, class: 'rb-eye'}));
        body.appendChild(K.svg('circle', {cx: 12, cy: -4, r: 7, class: 'rb-eye'}));
        body.appendChild(K.svg('rect', {x: -12, y: 12, width: 24, height: 6, rx: 3, class: 'rb-mouth'}));
        body.appendChild(K.svg('path', {d: 'M-14 -34 L0 -50 L14 -34 Z', class: 'rb-nose'}));
        robot.appendChild(body);
        svg.appendChild(robot);
      }
      function place(animate, ms) {
        robot.classList.toggle('rb-still', !animate);
        robot.style.transitionDuration = animate ? Math.max(120, Math.round(ms * 0.85)) + 'ms' : '';
        robot.style.transform = 'translate(' + cx(world.x) + 'px,' + cy(world.y) + 'px) rotate(' + angle + 'deg)';
      }
      return {
        level: function (l) { lv = l; draw(); },
        home: function () {
          world = M.fresh(lv); angle = [0, 90, 180, 270][lv.start.d];
          clear(layer.trail);
          Object.keys(starEls).forEach(function (k) { starEls[k].classList.remove('got'); });
          robot.classList.remove('rb-bump', 'rb-happy');
          place(false);
        },
        step: function (op, ms) {
          var from = {x: world.x, y: world.y}, ok = M.step(lv, world, op);
          if (op === 'left') angle -= 90;
          if (op === 'right') angle += 90;
          if (op === 'move' && ok) {
            layer.trail.appendChild(K.svg('line', {x1: cx(from.x), y1: cy(from.y), x2: cx(world.x), y2: cy(world.y), class: 'rb-line'}));
            var s = starEls[world.x + ',' + world.y];
            if (s) s.classList.add('got');
          }
          place(true, ms);
          if (!ok) robot.classList.add('rb-bump');
          return ok;
        },
        finish: function () {
          var r = M.judge(lv, world), f = K.fa;
          if (r.ok) robot.classList.add('rb-happy');
          if (r.bump) return {ok: false, label: 'bump', text: '💥 ربات به دیوار خورد! کدام بلوک او را به دیوار برد؟ همان را درست کن.'};
          if (r.ok) return {ok: true, text: lv.goal.type === 'shape' ? '🟦 آفرین! شکل درست کشیده شد.' : '🎉 ' + (r.total > 1 ? 'همهٔ ستاره‌ها جمع شد!' : 'ربات به ستاره رسید!')};
          if (lv.goal.type === 'shape') return {ok: false, text: r.shape ? 'این شکل ' + f(r.shape.w) + ' در ' + f(r.shape.h) + ' است؛ هدف ' + f(lv.goal.w) + ' در ' + f(lv.goal.h) + ' است.' : 'شکل هنوز کامل نیست؛ ربات باید روی خط‌چین بچرخد و به دایرهٔ سبز برگردد.'};
          return {ok: false, text: r.stars ? '⭐ ' + f(r.stars) + ' از ' + f(r.total) + ' ستاره جمع شد. برنامه را کامل کن.' : 'برنامه تمام شد، اما ربات به ستاره نرسید. بلوک‌ها را تغییر بده و دوباره ▶ بزن.'};
        }
      };
    }
  };
  return {def: def, app: BlockKit.app(def)};
})();

var LESSON = {
  id: 'lab-robot-blocks',
  version: 3,
  contentMode: 'syllabus',
  layout: 'worksheet',            // لب‌کیت/بلوک‌کیت: برنامهٔ تمام‌صفحه و چالش‌ها در کشو؛ noStart ممنوع است
  durationMinutes: 60,
  concepts: ['برنامه‌نویسی بلوکی', 'دنباله', 'اشکال‌زدایی', 'تکرار', 'تکرار تودرتو'],
  title: 'کارگاه ربات بلوکی',
  subtitle: 'بیست مرحلهٔ برنامه‌نویسی بلوکی',
  grade: '۱۰ تا ۱۲ سال',
  subject: 'برنامه‌نویسی',
  duration: '۴۵ تا ۷۰ دقیقه (در چند جلسه هم می‌شود)',
  mascot: '🤖',
  theme: {p: '#4C97FF', pSoft: '#e6f0ff', pInk: '#1b3f7a', a: '#FFAB19', aSoft: '#fff3dd', bg: '#f2f7fd'},
  objectives: [
    'با چیدن بلوک‌ها به ترتیب درست، ربات را به هدف برسانم.',
    'وقتی ربات اشتباه می‌رود، بلوک مشکل‌دار را پیدا و درست کنم.',
    'با بلوک تکرار (و تکرارِ تودرتو) برنامهٔ کوتاه‌تری برای کشیدن شکل و جمع‌کردن ستاره بسازم.'
  ],
  stages: [
    {id: 'lab', title: 'کارگاه', icon: '🤖'},
    {id: 'e', title: 'گزارش', icon: '📋'}
  ],
  slides: [{id: 'lab', stage: 'lab', type: 'custom', gate: false, q: 'کارگاه ربات بلوکی', noType: true, render: RLAB.app}]
    .concat(BlockKit.slides(RLAB.def))
    .concat([{id: 'end', stage: 'e', type: 'end', prompt: 'وقتی ربات اشتباه رفت، چطور فهمیدم کدام بلوک را باید عوض کنم؟',
      html: '<div class="callout">🤖 <b>جمع‌بندی:</b> برنامه، دستورهایی است که <b>به ترتیب</b> اجرا می‌شوند. اگر نتیجه درست نبود، قدم‌به‌قدم دنبالش کن تا بلوک مشکل‌دار را پیدا کنی. بلوک <b>تکرار</b> کارهای تکراری را کوتاه می‌کند و می‌شود تکرار را داخل تکرار گذاشت.</div>'}])
};
