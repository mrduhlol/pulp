import {test,expect} from '@playwright/test';
import {resolve} from 'node:path';
test('real Chromium Web Audio processes a playing media element without silence',async({page})=>{
 await page.goto('file://'+resolve('dist/popup.html'));
 await page.evaluate(()=>{
  const Native=window.AudioContext;
  (window as any).AudioContext=class extends Native{
   constructor(){super({sinkId:{type:'none'}} as any);}
   createDynamicsCompressor(){const node=super.createDynamicsCompressor();const analyser=this.createAnalyser();node.connect(analyser);(window as any).meter=analyser;return node;}
  };
  const rate=44100,length=rate*3,bytes=new ArrayBuffer(44+length*2),v=new DataView(bytes);
  const text=(offset:number,value:string)=>[...value].forEach((c,i)=>v.setUint8(offset+i,c.charCodeAt(0)));
  text(0,'RIFF');v.setUint32(4,36+length*2,true);text(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,length*2,true);
  for(let i=0;i<length;i++)v.setInt16(44+i*2,Math.sin(i/rate*440*2*Math.PI)*8000,true);
  const audio=document.createElement('audio');audio.src=URL.createObjectURL(new Blob([bytes],{type:'audio/wav'}));audio.loop=true;document.body.append(audio);
  const button=document.createElement('button');button.id='play-test';button.textContent='Play test';button.onclick=()=>void audio.play();document.body.prepend(button);
 });
 await page.addScriptTag({path:resolve('dist/engine.js')});
 await page.evaluate(()=>(window as any).__pulp.apply({enabled:true,bands:Array(10).fill(0),bass:0,treble:0,volume:80,balance:0,limiter:true}));
 await page.locator('#play-test').click();
 await expect.poll(()=>page.evaluate(()=>{const meter=(window as any).meter;if(!meter)return 0;const data=new Float32Array(meter.fftSize);meter.getFloatTimeDomainData(data);return Math.max(...data.map(Math.abs));})).toBeGreaterThan(.01);
 await expect.poll(()=>page.locator('audio').evaluate((audio:HTMLAudioElement)=>audio.currentTime)).toBeGreaterThan(.1);
});
