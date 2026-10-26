// آماده‌سازی کپی قفل‌شدهٔ Blockly برای درس: node _src/vendor/blockly/prepare.cjs <پوشهٔ package از npm pack blockly@13.4.0>
// فقط یک تغییر داده می‌شود: بارگذاری صدا با fetch حذف می‌شود، چون محتوا اجازهٔ درخواست شبکه ندارد و صدا در این درس خاموش است.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const LOCK = {
  version: '13.4.0',
  files: {
    'blockly_compressed.js': 'cc761aa447e0d4990e6f7a22a5e173d3a67d7d2775960ef10f80d647e6fe4841',
    'msg/fa.js': '05bfd2af763d3cce9431020b1f84b1f66c23d036ac4ade103579ce6ff843cb49',
    'LICENSE': 'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30'
  },
  patch: {
    from: 'if(a.length){var d=yield(yield fetch(a[0])).arrayBuffer(),e;(e=c.context)==null||e.decodeAudioData(d,f=>{c.sounds.set(b,f)})}',
    to: 'if(a.length){}'
  }
};

const source = process.argv[2];
if (!source) throw Error('مسیر پوشهٔ package بلاکلی را بده.');
const read = (name) => {
  const data = fs.readFileSync(path.join(source, name));
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  if (hash !== LOCK.files[name]) throw Error(name + ': hash با نسخهٔ قفل‌شده یکی نیست.');
  return data.toString('utf8');
};
const pkg = JSON.parse(fs.readFileSync(path.join(source, 'package.json'), 'utf8'));
if (pkg.version !== LOCK.version) throw Error('نسخهٔ Blockly باید ' + LOCK.version + ' باشد.');

let core = read('blockly_compressed.js');
if (core.split(LOCK.patch.from).length !== 2) throw Error('محل وصله دقیقاً یک بار پیدا نشد.');
core = core.replace(LOCK.patch.from, LOCK.patch.to);
if (/\bfetch\s*\(|XMLHttpRequest|\beval\s*\(|new\s+Function\s*\(/.test(core)) throw Error('پس از وصله هنوز فراخوانی ممنوع باقی است.');

const out = __dirname;
fs.writeFileSync(path.join(out, 'blockly.js'), '/* Blockly ' + LOCK.version + ' — Apache-2.0، کپی قفل‌شده؛ تغییر: حذف بارگذاری شبکه‌ای صدا؛ جزئیات در prepare.cjs. */\n' + core);
fs.writeFileSync(path.join(out, 'blockly-fa.js'), read('msg/fa.js'));
fs.writeFileSync(path.join(out, 'LICENSE-blockly.txt'), read('LICENSE'));
const hash = (name) => crypto.createHash('sha256').update(fs.readFileSync(path.join(out, name))).digest('hex');
fs.writeFileSync(path.join(out, 'source-lock.json'), JSON.stringify({package: 'blockly', version: LOCK.version, license: 'Apache-2.0',
  upstream: LOCK.files, patch: 'audio fetch removed', output: {'blockly.js': hash('blockly.js'), 'blockly-fa.js': hash('blockly-fa.js')}}, null, 2) + '\n');
console.log('Blockly ' + LOCK.version + ' آماده شد.');
