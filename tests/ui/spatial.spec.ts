import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
import {resolve} from 'node:path';
test('offline spatial DSP preserves bypass and mono compatibility and adds headphone crossfeed',async({page})=>{
 await build({entryPoints:['extension/spatial.ts'],bundle:true,format:'iife',globalName:'PulpDSP',outfile:'artifacts/spatial-test.js'});
 await page.goto('file://'+resolve('dist/popup.html'));await page.addScriptTag({path:resolve('artifacts/spatial-test.js')});
 const result=await page.evaluate(async()=>{
  const run=async(enabled:boolean,width:number,headphones:boolean)=>{
   const context=new OfflineAudioContext(2,44100,44100),source=context.createBufferSource(),buffer=context.createBuffer(2,44100,44100);
   for(let i=0;i<44100;i++)buffer.getChannelData(0)[i]=Math.sin(i/44100*440*2*Math.PI)*.5;
   source.buffer=buffer;const spatial=(window as any).PulpDSP.createSpatial(context);source.connect(spatial.input);spatial.output.connect(context.destination);spatial.set(enabled,width,headphones);source.start();const rendered=await context.startRendering();const l=rendered.getChannelData(0),r=rendered.getChannelData(1);
   let error=0,right=0,difference=0;for(let i=22050;i<44100;i++){error=Math.max(error,Math.abs(l[i]-buffer.getChannelData(0)[i]));right=Math.max(right,Math.abs(r[i]));difference=Math.max(difference,Math.abs(l[i]-r[i]));}return {error,right,difference};
  };return {bypass:await run(false,100,true),original:await run(true,50,false),mono:await run(true,0,false),headphones:await run(true,50,true)};
 });
 expect(result.bypass.error).toBeLessThan(.00001);expect(result.bypass.right).toBeLessThan(.00001);expect(result.original.error).toBeLessThan(.00001);expect(result.mono.difference).toBeLessThan(.00001);expect(result.headphones.right).toBeGreaterThan(.01);
});
