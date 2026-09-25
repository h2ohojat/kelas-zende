// ساخت فایل‌های تک‌فایلی از منابع: node _src/build.js
const fs = require('fs');
const path = require('path');
const S = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const has = (...fs_) => fs_.every((f) => fs.existsSync(path.join(__dirname, f)));
const OUT = path.join(__dirname, '..');

// فونت وزیرمتن (متغیر، همهٔ وزن‌ها) درون فایل جاسازی می‌شود تا بدون اینترنت و روی هر سیستمی یکسان دیده شود
const FONT = path.join(OUT, 'fonts', 'Vazirmatn-Variable.woff2');
const fontFace = fs.existsSync(FONT)
  ? `@font-face{font-family:Vazirmatn;src:url(data:font/woff2;base64,${fs.readFileSync(FONT).toString('base64')}) format("woff2");font-weight:100 900;font-style:normal;font-display:swap}\n`
  : '';

const css = fontFace + S('engine.css'), engine = S('engine.js'), toolkit = S('toolkit.js');
const meta = require('./meta');
const ENGINE_VERSION = (engine.match(/var ENGINE_VERSION = '([^']+)'/) || [])[1];

// امضای برند در زبانهٔ مرورگر: نشان «پ هوشمند»
const ICON = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="116" fill="#0E2C52"/><g transform="translate(0 -32)"><path d="M352 150Q372 150 372 170V244Q372 300 316 300H196Q140 300 140 244V216Q140 196 159 196Q178 196 178 216V238Q178 260 200 260H312Q332 260 332 238V170Q332 150 352 150Z" fill="#DDE7FF"/><circle cx="220" cy="350" r="22" fill="#BFD2FF"/><circle cx="292" cy="350" r="22" fill="#BFD2FF"/><circle cx="256" cy="406" r="26" fill="#F1CC59"/></g></svg>');

/*
 * A lesson page (engine + LESSON source) also carries <script type="application/json" id="kz-meta">:
 * what the lesson is, read by a host site without running any JavaScript (_src/meta.js).
 */
function page(title, scripts, body = '<div id="app"></div>', lessonSrc = null) {
  const kz = lessonSrc ? meta.block(meta.build(lessonSrc, ENGINE_VERSION)) + '\n' : '';
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="icon" href="${ICON}">
${kz}<style>
${css}
</style>
</head>
<body>
${body}
${scripts.map((s) => `<script>\n${s}\n</script>`).join('\n')}
</body>
</html>
`;
}

const files = {
  'index.html': page('کلاس زنده — موتور طرح درس تعاملی تک‌فایلی', [], S('index-page.html')),
  '01-workshop.html': page('یک فایل، یک کلاس زنده — کارگاه', [toolkit, S('workshop.js'), engine], undefined, S('workshop.js')),
  '02-lesson-fractions.html': page('قنادی آقای کسری — مقایسهٔ کسرها', [S('lesson-fractions.js'), engine], undefined, S('lesson-fractions.js')),
  '03-lesson-density.html': page('راز شناوری — چگالی', [S('lesson-density.js'), engine], undefined, S('lesson-density.js')),
  '04-prompt-kit.html': page('جعبه‌ابزار کلاس زنده', [toolkit, S('kit-page.js')]),
  '05-template.html': page('قالب کلاس زنده', [S('template.js'), engine], undefined, S('template.js')),
  '07-bridge-demo.html': page('میزبان نمونهٔ کلاس زنده — پل و پنل یادگیری', [S('bridge-demo.js')], S('bridge-demo-body.html')),
};
// فایل‌های خصوصی (در مخزن عمومی نیستند): فقط اگر منبعشان موجود باشد ساخته می‌شوند
if (has('proposal.js')) files['06-proposal.html'] = page('فلسفه، تعاملی می‌شود — طرح پیشنهادی', [S('proposal.js'), engine], undefined, S('proposal.js'));
if (has('planning/insights.js', 'planning/insights-body.html')) files['_planning/01-learning-insights.html'] = page('از داده به تصمیم — بارش فکری پنل یادگیری', [S('planning/insights.js')], S('planning/insights-body.html'));
if (has('planning/plan.js', 'planning/plan-body.html')) files['_planning/02-execution-plan.html'] = page('برنامهٔ اجرایی — پنل بینش یادگیری', [S('planning/plan.js')], S('planning/plan-body.html'));
if (has('planning/catalog.js', 'planning/catalog-body.html')) files['_planning/03-catalog-dashboard.html'] = page('ویترین و داشبورد — برنامهٔ نسخهٔ ۲', [S('planning/catalog.js')], S('planning/catalog-body.html'));
if (has('planning/wave1-issues.md')) { fs.mkdirSync(path.join(OUT, '_planning'), { recursive: true }); fs.copyFileSync(path.join(__dirname, 'planning/wave1-issues.md'), path.join(OUT, '_planning/wave1-issues.md')); }
if (has('falsafe12/lesson01.js')) files['falsafe12/01-hast-va-chist.html'] = page('هست و چیست — فلسفهٔ دوازدهم، درس ۱', [S('falsafe12/lesson01.js'), engine], undefined, S('falsafe12/lesson01.js'));
for (const [name, html] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(path.join(OUT, name)), { recursive: true });
  fs.writeFileSync(path.join(OUT, name), html, 'utf8');
  console.log(name, (Buffer.byteLength(html) / 1024).toFixed(1) + ' KB');
}
