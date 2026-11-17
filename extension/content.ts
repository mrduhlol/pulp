import './engine';
declare const chrome:any;
const siteKey=`site:${location.origin}`;
const engine=()=> (globalThis as typeof globalThis & {__pulp?:{apply:(settings:any)=>unknown}}).__pulp;
chrome.storage.local.get(siteKey).then((stored:Record<string,unknown>)=>{if(stored[siteKey])engine()?.apply(stored[siteKey]);});
chrome.storage.onChanged.addListener((changes:Record<string,{newValue?:unknown}>,area:string)=>{
 if(area!=='local'||!changes[siteKey])return;
 const next=changes[siteKey].newValue;
 if(next)engine()?.apply(next);
 else engine()?.apply({enabled:false,bands:Array(10).fill(0),bass:0,treble:0,volume:100,balance:0,limiter:false});
});
