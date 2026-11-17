import {build} from 'esbuild';
import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await build({entryPoints:['extension/engine.ts','extension/popup.ts'],outdir:'dist',bundle:true,target:['chrome128','firefox128']});
for(const name of ['manifest.json','popup.html','popup.css'])await copyFile(`extension/${name}`,`dist/${name}`);
