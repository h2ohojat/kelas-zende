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

function page(title, scripts, body = '<div id="app"></div>') {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
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
  '01-workshop.html': page('یک فایل، یک کلاس زنده — کارگاه', [toolkit, S('workshop.js'), engine]),
  '02-lesson-fractions.html': page('قنادی آقای کسری — مقایسهٔ کسرها', [S('lesson-fractions.js'), engine]),
  '03-lesson-density.html': page('راز شناوری — چگالی', [S('lesson-density.js'), engine]),
  '04-prompt-kit.html': page('جعبه‌ابزار کلاس زنده', [toolkit, S('kit-page.js')]),
  '05-template.html': page('قالب کلاس زنده', [S('template.js'), engine]),
  '07-bridge-demo.html': page('میزبان نمونهٔ کلاس زنده — پل و پنل یادگیری', [S('bridge-demo.js')], S('bridge-demo-body.html')),
};
// فایل‌های خصوصی (در مخزن عمومی نیستند): فقط اگر منبعشان موجود باشد ساخته می‌شوند
if (has('proposal.js')) files['06-proposal.html'] = page('فلسفه، تعاملی می‌شود — طرح پیشنهادی', [S('proposal.js'), engine]);
if (has('falsafe12/lesson01.js')) files['falsafe12/01-hast-va-chist.html'] = page('هست و چیست — فلسفهٔ دوازدهم، درس ۱', [S('falsafe12/lesson01.js'), engine]);
for (const [name, html] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(path.join(OUT, name)), { recursive: true });
  fs.writeFileSync(path.join(OUT, name), html, 'utf8');
  console.log(name, (Buffer.byteLength(html) / 1024).toFixed(1) + ' KB');
}
