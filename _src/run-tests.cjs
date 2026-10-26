// Test every available source module; optional local course drafts are not dependencies of the engine.
const fs=require('node:fs'),path=require('node:path'),child=require('node:child_process');
const files=fs.readdirSync(__dirname).filter(name=>name.endsWith('.test.js')).map(name=>path.join(__dirname,name));
const result=child.spawnSync(process.execPath,['--test','--test-reporter=dot',...files],{stdio:'inherit'});
if(result.status!==0)process.exit(result.status||1);
const regression=child.spawnSync(process.execPath,[path.join(__dirname,'test.js')],{stdio:'inherit'});
process.exit(regression.status||0);
