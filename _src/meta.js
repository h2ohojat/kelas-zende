// Compatibility API; there is one metadata implementation.
const KZ = require('./kz-meta');
const load = (source) => KZ.loadLesson([source]);
const build = (source, engine) => JSON.parse(JSON.stringify(KZ.metaFor(load(source), engine)));
const read = (html) => { const m = html.match(/<script type="application\/json" id="kz-meta">([\s\S]*?)<\/script>/); return m ? JSON.parse(m[1]) : null; };
module.exports = {...KZ, load, build, read};
