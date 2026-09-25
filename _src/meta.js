/*
 * kz-meta (engine 1.2): the lesson sheet a host site reads from the HTML without running it.
 * Built from the LESSON object at build time, validated, and embedded as
 * <script type="application/json" id="kz-meta">…</script>. Format: docs/bridge.md, «kz-meta».
 */
const vm = require('vm');

const GATED = { mcq: 1, input: 1, sort: 1, order: 1, poll: 1, steps: 1, custom: 1 };
const SCORED = { mcq: 1, input: 1, sort: 1, order: 1, custom: 1 };
const MODES = ['syllabus', 'textbook-licensed'];
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;

function plain(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}
const tagsOf = (t) => (t ? (Array.isArray(t) ? t : [t]) : []);

/** Runs the lesson source (never the engine) with a bare stand-in for the page, and returns LESSON. */
function load(src) {
  const stub = () => new Proxy(function () {}, { get: (_, k) => (k === Symbol.toPrimitive ? () => '' : stub()), apply: () => stub() });
  const ctx = { console, document: stub(), navigator: stub(), localStorage: stub(), setTimeout() {}, clearTimeout() {} };
  ctx.window = ctx;
  vm.runInNewContext(src + '\n;this.__L = typeof LESSON !== "undefined" ? LESSON : window.LESSON;', ctx, { timeout: 2000 });
  if (!ctx.__L || !Array.isArray(ctx.__L.slides)) throw new Error('LESSON with slides not found');
  return ctx.__L;
}

function build(src, engine) {
  const L = load(src);
  const errors = [];
  if (!L.id || !ID.test(String(L.id))) errors.push('LESSON.id must be a short English id (a-z, 0-9, -): ' + L.id);
  const mode = L.contentMode || 'syllabus';
  if (!MODES.includes(mode)) errors.push('contentMode must be syllabus or textbook-licensed, not ' + mode);
  if (mode === 'textbook-licensed' && !L.licenseNumber) errors.push('textbook-licensed needs licenseNumber');

  const stages = L.stages || [];
  let last = stages[0] && stages[0].id;
  const seen = {};
  const items = L.slides.map((s, i) => {
    const stage = s.stage || last; last = stage;
    const gated = !!GATED[s.type] && s.gate !== false;
    const scored = !!SCORED[s.type] && s.stars !== false && s.gate !== false;
    if (s.id) {
      if (!ID.test(String(s.id))) errors.push(`slide ${i}: id «${s.id}» must be a short English id`);
      if (seen[s.id]) errors.push(`slide ${i}: duplicate id «${s.id}»`);
      seen[s.id] = true;
    } else if (gated) {
      errors.push(`slide ${i} (${s.type}): an interactive slide needs a stable id`);
    }
    const tags = [];
    (s.options || []).forEach((o) => tagsOf(o.tag).forEach((t) => tags.push(t)));
    (s.items || []).forEach((o) => o && typeof o === 'object' && tagsOf(o.tag).forEach((t) => tags.push(t)));
    (s.wrong || []).forEach((o) => tagsOf(o.tag).forEach((t) => tags.push(t)));
    return {
      id: s.id || 's' + i, idx: i, type: s.type, stage: stage || null, gated, scored,
      q: plain(s.q || s.title || '').slice(0, 200),
      tags: [...new Set(tags)],
    };
  });
  if (errors.length) throw new Error(`${L.id || L.title}:\n  - ` + errors.join('\n  - '));

  // Plain JSON (the LESSON came from another realm), so it compares and serializes the same everywhere.
  const maxStars = L.slides.reduce((t, s) => t + (SCORED[s.type] && s.stars !== false && s.gate !== false ? 3 : 0), 0);
  return JSON.parse(JSON.stringify({
    kz: 1,
    engine,
    id: L.id,
    version: L.version || 1,
    title: plain(L.title),
    subtitle: plain(L.subtitle),
    grade: plain(L.grade),
    subject: plain(L.subject),
    duration: plain(L.duration),
    durationMinutes: Number.isFinite(L.durationMinutes) ? L.durationMinutes : null,
    contentMode: mode,
    licenseNumber: L.licenseNumber || null,
    objectives: (L.objectives || []).map(plain),
    concepts: (L.concepts || []).map(plain),
    prerequisites: (L.prerequisites || []).map(plain),
    stages: stages.map((st) => ({ id: st.id, title: plain(st.title) })),
    maxStars,
    misconceptions: Object.keys(L.tags || {}).map((k) => ({ tag: k, title: plain(L.tags[k].t), review: plain(L.tags[k].review) })),
    items,
  }));
}

/** JSON inside <script>: «</» and U+2028/2029 are escaped so the block can never close early. */
function block(m) {
  const json = JSON.stringify(m).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `<script type="application/json" id="kz-meta">${json}</script>`;
}

/** Reads kz-meta back from a built HTML file (null when there is none). */
function read(html) {
  const m = String(html).match(/<script type="application\/json" id="kz-meta">([\s\S]*?)<\/script>/);
  return m ? JSON.parse(m[1]) : null;
}

module.exports = { build, block, read, plain, load };
