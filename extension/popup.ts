declare const chrome: any;
type Settings = {enabled:boolean;bands:number[];bass:number;treble:number;volume:number;balance:number;limiter:boolean;autoHeadroom:boolean;preset:string};
const defaults:Settings = {enabled:true,bands:Array(10).fill(0),bass:0,treble:0,volume:80,balance:0,limiter:true,autoHeadroom:true,preset:'Flat'};
const profiles:Record<string,number[]> = {'Flat':[0,0,0,0,0,0,0,0,0,0],'Warm':[3,4,3,1,0,-1,-2,-2,-1,0],'Bass boost':[7,6,4,2,0,0,0,1,1,0],'Vocal':[-3,-2,-1,0,2,4,4,2,0,-1],'Electronic':[5,4,1,-2,-2,1,2,3,4,4],'Rock':[4,3,1,-1,-2,1,3,4,3,2],'Jazz':[3,2,1,2,-1,-1,0,2,3,3],'Acoustic':[2,2,1,0,1,2,3,3,2,1]};
let state:Settings = structuredClone(defaults);
type UserPreset={id:string;name:string;settings:Settings};
let library:UserPreset[]=[];let selectedPreset='';
let custom:Settings | undefined;
let siteOrigin='';let rememberSite=false;
function savedSettings(snapshot:Settings){return rememberSite&&siteOrigin?{settings:snapshot,[`site:${siteOrigin}`]:snapshot}:{settings:snapshot};}
const el = <T extends HTMLElement>(id:string) => document.getElementById(id) as T;
const preset = el<HTMLSelectElement>('preset');
const installed = typeof chrome !== 'undefined' && !!chrome.storage?.local;
const clamp = (value:unknown,min:number,max:number,fallback=0) => typeof value==='number' && Number.isFinite(value) ? Math.max(min,Math.min(max,value)) : fallback;
function normalize(value:Partial<Settings> | null | undefined):Settings {
 const next=value || {};
 return {autoHeadroom:next.autoHeadroom!==false,enabled:typeof next.enabled==='boolean'?next.enabled:true,limiter:typeof next.limiter==='boolean'?next.limiter:true,bands:defaults.bands.map((_,i)=>clamp(next.bands?.[i],-12,12)),bass:clamp(next.bass,0,12),treble:clamp(next.treble,0,12),volume:clamp(next.volume,0,100,80),balance:clamp(next.balance,-100,100),preset:typeof next.preset==='string' && (profiles[next.preset] || next.preset.startsWith('user:') || ['Custom','Saved profile'].includes(next.preset))?next.preset:'Custom'};
}
function curve(bands:number[],width=400,height=64){return bands.map((gain,i)=>`${i?'L':'M'}${i*width/9} ${height/2-gain*(height/28)}`).join(' ');}
['32','64','125','250','500','1k','2k','4k','8k','16k'].forEach((frequency,i) => {
 const label=document.createElement('label');label.className='band';
 const output=document.createElement('output'),input=document.createElement('input'),caption=document.createElement('span');
 input.type='range';input.min='-12';input.max='12';input.value='0';input.id=`frequency-${i}`;input.setAttribute('aria-label',`${[32,64,125,250,500,1000,2000,4000,8000,16000][i]} hertz gain`);input.dataset.band=String(i);output.id=`band-${i}`;output.htmlFor=input.id;caption.textContent=frequency;
 const feedback=()=>{el('fader-feedback').textContent=`${frequency} Hz · ${Number(input.value)>0?'+':''}${input.value} dB`;};
 input.title=`${frequency} Hz. Double-click to reset.`;
 input.addEventListener('focus',feedback);input.addEventListener('pointerdown',feedback);
 input.addEventListener('dblclick',()=>{state.bands[i]=0;state.preset='Custom';changed();feedback();});
 input.addEventListener('input',()=>{state.bands[i]=Number(input.value);state.preset='Custom';changed();feedback();});label.append(output,input,caption);el('bands').append(label);
});
for(const [name,bands] of Object.entries(profiles)){
 const button=document.createElement('button');button.className='profile-card';button.dataset.profile=name;button.setAttribute('aria-pressed','false');
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 90 35');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',curve(bands,90,35));svg.append(path);const title=document.createElement('span');title.textContent=name;button.append(svg,title);el('profile-grid').append(button);
}
function render(){
 el('remember-site').setAttribute('aria-pressed',String(rememberSite));el<HTMLButtonElement>('remember-site').disabled=!siteOrigin;
 el('power').setAttribute('aria-pressed',String(state.enabled));el('power').setAttribute('aria-label',state.enabled?'Bypass equalizer':'Enable equalizer');el('power-label').textContent=state.enabled?'On':'Off';document.querySelector('main')!.dataset.bypassed=String(!state.enabled);
 el('headroom').setAttribute('aria-checked',String(state.autoHeadroom));
 el('limiter').setAttribute('aria-checked',String(state.limiter));preset.value=state.preset;
 document.querySelectorAll<HTMLInputElement>('[data-band]').forEach((input,i)=>{input.value=String(state.bands[i]);el(`band-${i}`).textContent=state.bands[i]>0?`+${state.bands[i]}`:String(state.bands[i]);input.setAttribute('aria-valuetext',`${state.bands[i]} decibels`);});
 for(const key of ['bass','treble','volume','balance'] as const){const input=el<HTMLInputElement>(key);input.value=String(state[key]);input.style.setProperty('--fill',`${(state[key]-Number(input.min))/(Number(input.max)-Number(input.min))*100}%`);const text=key==='volume'?`${state[key]}%`:key==='balance'?(state[key]===0?'Center':`${Math.abs(state[key])}% ${state[key]<0?'left':'right'}`):`${state[key]} dB`;el(`${key}-value`).textContent=text;input.setAttribute('aria-valuetext',text);}
 for(const key of ['bass','treble'] as const){el(`${key}-dial`).style.setProperty('--angle',`${-135+state[key]/12*270}deg`);el(`${key}-dial`).setAttribute('aria-valuenow',String(state[key]));el(`${key}-dial`).setAttribute('aria-valuetext',`${state[key]} decibels`);}
 const path=curve(state.bands);el('curve').setAttribute('d',path);el('curve-area').setAttribute('d',`${path} L400 64 L0 64 Z`);
 document.querySelectorAll<HTMLElement>('[data-profile]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.profile===state.preset)));
 el<HTMLButtonElement>('load-custom').disabled=!custom;el('load-custom').textContent=custom?'Load saved profile':'Bookmark your settings to save a profile';
}
let saveTimer:ReturnType<typeof setTimeout>;
let connectedTab:number | undefined;
let queue=Promise.resolve();
function changed(){
 render();el('message').textContent='';
 if(!installed)return;
 if(connectedTab!==undefined)void sendAudio(state);
 el('save-status').textContent='SAVING';clearTimeout(saveTimer);
 saveTimer=setTimeout(()=>{const snapshot=structuredClone(state);queue=queue.then(async()=>{try{await chrome.storage.local.set(savedSettings(snapshot));el('save-status').textContent='LOCAL ONLY';}catch{el('save-status').textContent='NOT SAVED';el('message').textContent='Settings could not be saved. Reopen Pulp to retry.';}});},90);
}
function connectionError(){el('status').textContent='Cannot connect to this page';el('source').textContent='Open a music website, then reopen Pulp.';el('dot').style.background='#777';}
function dispatchAudio(settings:Settings){
 return chrome.scripting.executeScript({target:{tabId:connectedTab},func:(next:Settings)=>(globalThis as any).__pulp.apply(next),args:[structuredClone(settings)]});
}
async function sendAudio(settings:Settings){
 try{
  const [result]=await dispatchAudio(settings);
  const data=result.result;
  el('status').textContent=data.connected?(settings.enabled?'Connected to this tab':'Equalizer bypassed'):data.media?'Player not supported':'No music detected';
  el('source').textContent=data.connected?data.title:data.media?'Protected or cross-origin audio. Try another player.':'Start playback, then reopen Pulp.';
  el('dot').style.background=data.connected&&settings.enabled?'#d5fa7d':'#777';
 }catch{connectionError();}
}
async function connect(){
 try{
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!tab?.id)throw Error();
  try{const url=new URL(tab.url);if(['https:','http:'].includes(url.protocol))siteOrigin=url.origin;}catch{}
  if(siteOrigin){const key=`site:${siteOrigin}`,stored=await chrome.storage.local.get(key);rememberSite=!!stored[key];if(rememberSite)state=normalize(stored[key]);render();}
  await chrome.scripting.executeScript({target:{tabId:tab.id},files:['engine.js']});
  connectedTab=tab.id;
  await sendAudio(state);
 }catch{connectionError();}
}
for(const key of ['bass','treble','volume','balance'] as const)el<HTMLInputElement>(key).addEventListener('input',event=>{state[key]=Number((event.target as HTMLInputElement).value);changed();});
el('power').onclick=()=>{state.enabled=!state.enabled;changed();};el('headroom').onclick=()=>{state.autoHeadroom=!state.autoHeadroom;changed();};el('limiter').onclick=()=>{state.limiter=!state.limiter;changed();};
function chooseProfile(name:string){if(name.startsWith('user:')){const saved=library.find(item=>`user:${item.id}`===name);if(saved){selectedPreset=saved.id;state=structuredClone(saved.settings);state.preset=name;el<HTMLInputElement>('preset-name').value=saved.name;el<HTMLSelectElement>('custom-presets').value=saved.id;changed();}return;}if(profiles[name]){state.bands=[...profiles[name]];state.preset=name;changed();}else if(name==='Saved profile'&&custom){state=structuredClone(custom);state.preset=name;changed();}}
preset.onchange=()=>chooseProfile(preset.value);
document.querySelectorAll<HTMLElement>('[data-profile]').forEach(button=>button.onclick=()=>chooseProfile(button.dataset.profile!));
el('reset').onclick=()=>{state=structuredClone(defaults);changed();};
el('load-custom').onclick=()=>chooseProfile('Saved profile');
function addCustomOption(){if(!Array.from(preset.options).some(option=>option.value==='Saved profile'))preset.add(new Option('Saved profile'));}
async function persistLibrary(){if(installed)await chrome.storage.local.set({presets:library});refreshLibrary();}
function refreshLibrary(){
 preset.querySelectorAll('[data-user]').forEach(option=>option.remove());const list=el<HTMLSelectElement>('custom-presets');list.replaceChildren(new Option('Choose saved profile',''));
 for(const item of library){const option=new Option(item.name,`user:${item.id}`);option.dataset.user='true';preset.add(option);list.add(new Option(item.name,item.id));}
 list.value=selectedPreset;render();
}
async function saveNew(){
 try{if(library.length>=50)throw Error('limit');const name=el<HTMLInputElement>('preset-name').value.trim()||`My profile ${library.length+1}`;const item={id:crypto.randomUUID(),name:name.slice(0,40),settings:structuredClone(state)};library.push(item);selectedPreset=item.id;custom=structuredClone(state);if(installed)await chrome.storage.local.set({custom,presets:library});addCustomOption();refreshLibrary();state.preset=`user:${item.id}`;changed();el('message').textContent=installed?'Custom profile saved.':'Preview only. Install Pulp to save your profile.';}
 catch{el('message').textContent='Could not save profile. Keep fewer than 50 presets and retry.';}
}
el('save-preset').onclick=saveNew;el('save-new').onclick=saveNew;
el<HTMLSelectElement>('custom-presets').onchange=event=>{const id=(event.target as HTMLSelectElement).value;if(id)chooseProfile(`user:${id}`);};
el('rename-preset').onclick=async()=>{const item=library.find(item=>item.id===selectedPreset),name=el<HTMLInputElement>('preset-name').value.trim();if(!item||!name){el('message').textContent='Choose a saved profile and enter its new name.';return;}try{item.name=name.slice(0,40);await persistLibrary();el('message').textContent='Profile renamed.';}catch{el('message').textContent='Rename could not be saved. Try again.';}};
el('delete-preset').onclick=async()=>{if(!selectedPreset)return;try{library=library.filter(item=>item.id!==selectedPreset);selectedPreset='';if(state.preset.startsWith('user:'))state.preset='Custom';await persistLibrary();changed();el('message').textContent='Profile deleted.';}catch{el('message').textContent='Deletion could not be saved. Try again.';}};
el('export-presets').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,presets:library},null,2)],{type:'application/json'}));const anchor=document.createElement('a');anchor.href=url;anchor.download='pulp-presets.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
el('import-presets').onclick=()=>el<HTMLInputElement>('preset-file').click();
el<HTMLInputElement>('preset-file').onchange=async event=>{
 const input=event.target as HTMLInputElement,file=input.files?.[0];if(!file)return;
 try{
  if(file.size>262144)throw Error();const parsed=JSON.parse(await file.text());
  if(parsed.version!==1||!Array.isArray(parsed.presets)||parsed.presets.length+library.length>50)throw Error();
  const incoming:UserPreset[]=parsed.presets.map((item:any)=>{if(typeof item.name!=='string'||!item.name.trim()||item.name.length>40||!item.settings||!Array.isArray(item.settings.bands)||item.settings.bands.length!==10||item.settings.bands.some((gain:unknown)=>typeof gain!=='number'||!Number.isFinite(gain)||Math.abs(gain)>12))throw Error();return {id:crypto.randomUUID(),name:item.name.trim(),settings:normalize(item.settings)};});
  library.push(...incoming);await persistLibrary();el('message').textContent=`Imported ${incoming.length} profiles.`;
 }catch{el('message').textContent='Import failed. Use a Pulp export under 256 KB, with at most 50 total profiles.';}
 input.value='';
};
const tabs=Array.from(document.querySelectorAll<HTMLButtonElement>('[role=tab]'));
function selectTab(tab:HTMLButtonElement){tabs.forEach(button=>{const selected=button===tab;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;el(button.getAttribute('aria-controls')!).hidden=!selected;});el('message').textContent='';}
tabs.forEach((tab,index)=>{tab.onclick=()=>selectTab(tab);tab.onkeydown=event=>{let next=index;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();selectTab(tabs[next]);tabs[next].focus();};});
window.addEventListener('pagehide',()=>{if(installed){clearTimeout(saveTimer);void chrome.storage.local.set(savedSettings(state));if(connectedTab!==undefined)void dispatchAudio(state).catch(()=>{});}});
(async()=>{
 if(!installed){render();el('status').textContent='Interface preview';el('source').textContent='Install Pulp to connect to your music tab.';return;}
 try{const stored=await chrome.storage.local.get(['settings','custom','presets']);if(stored.custom){custom=normalize(stored.custom);addCustomOption();}
 if(Array.isArray(stored.presets))library=stored.presets.slice(0,50).filter((item:any)=>typeof item.id==='string'&&typeof item.name==='string').map((item:any)=>({id:item.id,name:item.name.slice(0,40),settings:normalize(item.settings)}));
 else if(custom){library=[{id:crypto.randomUUID(),name:'Saved profile',settings:custom}];await chrome.storage.local.set({presets:library});}
 refreshLibrary();state=stored.settings?normalize(stored.settings):structuredClone(defaults);render();await connect();}
 catch{render();el('status').textContent='Settings unavailable';el('source').textContent='Close and reopen Pulp to retry.';}
})();

el('remember-site').onclick=async()=>{
 if(!installed||!siteOrigin)return;
 const url=new URL(siteOrigin),pattern=`${url.protocol}//${url.hostname}/*`,id=`pulp-${Array.from(siteOrigin).map(c=>c.charCodeAt(0).toString(16)).join('')}`;
 try{
  if(rememberSite){await chrome.storage.local.remove(`site:${siteOrigin}`);await chrome.scripting.unregisterContentScripts({ids:[id]});rememberSite=false;await sendAudio(state);}
  else{
   if(!await chrome.permissions.request({origins:[pattern]})){el('message').textContent='Site permission declined. Settings remain available in the popup.';return;}
   const registered=await chrome.scripting.getRegisteredContentScripts({ids:[id]});
   if(!registered.length)await chrome.scripting.registerContentScripts([{id,matches:[pattern],js:['content.js'],runAt:'document_idle',persistAcrossSessions:true}]);
   await chrome.storage.local.set({[`site:${siteOrigin}`]:state});rememberSite=true;
  }
  render();el('message').textContent=rememberSite?'Settings will load automatically on this site.':'Automatic settings removed for this site.';
 }catch{el('message').textContent='Could not update site settings. Try again.';}
};

for(const key of ['bass','treble'] as const){
 const dial=el(`${key}-dial`);dial.removeAttribute('aria-hidden');dial.setAttribute('role','slider');dial.tabIndex=0;dial.setAttribute('aria-label',key==='bass'?'Bass boost knob':'Treble knob');dial.setAttribute('aria-valuemin','0');dial.setAttribute('aria-valuemax','12');
 let startY=0,startValue=0,active:number|undefined;
 dial.onpointerdown=event=>{if(event.button!==0)return;event.preventDefault();dial.focus();startY=event.clientY;startValue=state[key];active=event.pointerId;dial.setPointerCapture(active);};
 dial.onpointermove=event=>{if(active!==event.pointerId)return;state[key]=Math.round(clamp(startValue+(startY-event.clientY)/8,0,12));changed();};
 const end=()=>{active=undefined;};dial.onpointerup=end;dial.onpointercancel=end;dial.onlostpointercapture=end;
 dial.onclick=event=>event.preventDefault();dial.ondblclick=event=>{event.preventDefault();state[key]=0;changed();};
 dial.onkeydown=event=>{const delta=event.key==='ArrowUp'||event.key==='ArrowRight'?1:event.key==='ArrowDown'||event.key==='ArrowLeft'?-1:event.key==='PageUp'?3:event.key==='PageDown'?-3:0;if(delta||event.key==='Home'||event.key==='End'){event.preventDefault();state[key]=event.key==='Home'?0:event.key==='End'?12:clamp(state[key]+delta,0,12);changed();}};
}
