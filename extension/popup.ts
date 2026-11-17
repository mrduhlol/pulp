declare const chrome: any;
type Settings = {enabled:boolean;bands:number[];bass:number;treble:number;volume:number;balance:number;limiter:boolean;preset:string};
const defaults:Settings = {enabled:true,bands:Array(10).fill(0),bass:0,treble:0,volume:80,balance:0,limiter:true,preset:'Flat'};
let state:Settings = structuredClone(defaults);
const profiles:Record<string,number[]> = {'Flat':[0,0,0,0,0,0,0,0,0,0],'Warm':[3,4,3,1,0,-1,-2,-2,-1,0],'Bass boost':[7,6,4,2,0,0,0,1,1,0],'Vocal':[-3,-2,-1,0,2,4,4,2,0,-1],'Electronic':[5,4,1,-2,-2,1,2,3,4,4],'Rock':[4,3,1,-1,-2,1,3,4,3,2],'Jazz':[3,2,1,2,-1,-1,0,2,3,3],'Acoustic':[2,2,1,0,1,2,3,3,2,1]};
const el = <T extends HTMLElement>(id:string) => document.getElementById(id) as T;
const preset = el<HTMLSelectElement>('preset');
['32','64','125','250','500','1k','2k','4k','8k','16k'].forEach((frequency,i) => {
 const label = document.createElement('label'); label.className='band';
 const output=document.createElement('output'); const input=document.createElement('input'); const caption=document.createElement('span');
 input.type='range';input.min='-12';input.max='12';input.value='0';input.setAttribute('aria-label',`${frequency} hertz gain`);input.dataset.band=String(i);output.id=`band-${i}`;caption.textContent=frequency;
 input.addEventListener('input',()=>{state.bands[i]=Number(input.value);state.preset='Custom';changed();});label.append(output,input,caption);el('bands').append(label);
});
function render(){
 el('power').setAttribute('aria-pressed',String(state.enabled));el('limiter').setAttribute('aria-checked',String(state.limiter));preset.value=state.preset;
 document.querySelectorAll<HTMLInputElement>('[data-band]').forEach((input,i)=>{input.value=String(state.bands[i]);el(`band-${i}`).textContent=state.bands[i]>0?`+${state.bands[i]}`:String(state.bands[i]);});
 for(const key of ['bass','treble','volume','balance'] as const){el<HTMLInputElement>(key).value=String(state[key]);el(`${key}-value`).textContent=key==='volume'?`${state[key]}%`:key==='balance'?(state[key]===0?'Center':`${Math.abs(state[key])}% ${state[key]<0?'L':'R'}`):`${state[key]} dB`;}
 el('curve').setAttribute('d',state.bands.map((gain,i)=>`${i?'L':'M'}${i*400/9} ${31-gain*2.2}`).join(' '));
}
let queue=Promise.resolve();
function changed(){render();queue=queue.then(async()=>{try{await chrome.storage.local.set({settings:state});await apply();}catch{el('message').textContent='Could not save settings. Try reopening Pulp.';}});}
async function apply(){
 try{
 const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
 if(!tab?.id)throw Error();
 await chrome.scripting.executeScript({target:{tabId:tab.id},files:['engine.js']});
 const [result]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:(settings:Settings)=>(globalThis as any).__pulp.apply(settings),args:[state]});
 const data=result.result;
 el('status').textContent=data.connected?(state.enabled?'Your sound, tuned.':'Equalizer bypassed'):data.media?'This player is unsupported':'Waiting for your music';
 el('source').textContent=data.connected?data.title:data.media?'Protected or cross-origin audio cannot be adjusted.':'Start playback, then reopen Pulp.';
 el('dot').style.background=data.connected?'#ffc144':'#aaa99b';
 }catch{el('status').textContent='Open a music website';el('source').textContent='Pulp cannot run on browser settings or store pages.';}
}
for(const key of ['bass','treble','volume','balance'] as const)el<HTMLInputElement>(key).addEventListener('input',event=>{state[key]=Number((event.target as HTMLInputElement).value);changed();});
el('power').onclick=()=>{state.enabled=!state.enabled;changed();};el('limiter').onclick=()=>{state.limiter=!state.limiter;changed();};
preset.onchange=()=>{if(profiles[preset.value]){state.bands=[...profiles[preset.value]];state.preset=preset.value;changed();}else if(preset.value==='Saved profile'){chrome.storage.local.get('custom').then(({custom}:any)=>{if(custom){state={...custom};state.preset='Saved profile';changed();}});}};
el('reset').onclick=()=>{state=structuredClone(defaults);changed();};
el('save-preset').onclick=async()=>{try{await chrome.storage.local.set({custom:state});if(!Array.from(preset.options).some(o=>o.value==='Saved profile'))preset.add(new Option('Saved profile'));state.preset='Saved profile';changed();el('message').textContent='Your profile is saved. Find it in Sound profile.';}catch{el('message').textContent='Profile could not be saved.';}};
(async()=>{try{const stored=await chrome.storage.local.get(['settings','custom']);if(stored.custom)preset.add(new Option('Saved profile'));if(stored.settings)state={...defaults,...stored.settings};render();await apply();}catch{render();el('status').textContent='Extension preview';el('source').textContent='Install Pulp to connect to your music tab.';}})();
