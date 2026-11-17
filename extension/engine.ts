import {createSpatial} from './spatial';
type AudioSettings = {enabled:boolean;bands:number[];bass:number;treble:number;volume:number;balance:number;limiter:boolean;autoHeadroom?:boolean;spatialEnabled?:boolean;spatialWidth?:number;spatialHeadphones?:boolean};
type Graph = {spatial:ReturnType<typeof createSpatial>;preamp:GainNode;probe:BiquadFilterNode;filters:BiquadFilterNode[];bass:BiquadFilterNode;treble:BiquadFilterNode;gain:GainNode;pan:StereoPannerNode;compressor:DynamicsCompressorNode};
// Runs only in the selected tab after the user opens Pulp.
(() => {
  if ((globalThis as typeof globalThis & {__pulp?: {apply: (next: AudioSettings) => unknown}}).__pulp) return;
  const frequencies = [32,64,125,250,500,1000,2000,4000,8000,16000];
  const graphs = new Map<HTMLMediaElement,Graph>();
  let context: AudioContext | undefined;
  let settings:AudioSettings = {enabled:true, bands:Array(10).fill(0), bass:0, treble:0, volume:80, balance:0, limiter:true,autoHeadroom:true};
  function eligible(media: HTMLMediaElement) {
    if (media.mediaKeys || media.srcObject || media.error) return false;
    const src = media.currentSrc || media.src;
    if (!src) return false;
    try { return src.startsWith('blob:') || src.startsWith('data:audio/') || media.crossOrigin === 'anonymous' || media.crossOrigin === 'use-credentials' || new URL(src, location.href).origin === location.origin; }
    catch { return false; }
  }
  function update(graph: Graph) {
    const on = settings.enabled;
    graph.filters.forEach((f,i) => f.gain.setTargetAtTime(on ? settings.bands[i] : 0, context!.currentTime, .025));
    graph.bass.gain.value = on ? settings.bass : 0;
    graph.treble.gain.value = on ? settings.treble : 0;
    let peak=1;
    if(on && settings.autoHeadroom!==false){
      const frequency=new Float32Array(1024),total=new Float32Array(1024).fill(1),magnitude=new Float32Array(1024),phase=new Float32Array(1024);
      for(let i=0;i<1024;i++)frequency[i]=20*Math.pow((context!.sampleRate/2*.999)/20,i/1023);
      for(const filter of [...graph.filters,graph.bass,graph.treble]){graph.probe.type=filter.type;graph.probe.frequency.value=filter.frequency.value;graph.probe.Q.value=filter.Q.value;graph.probe.gain.value=filter===graph.bass?settings.bass:filter===graph.treble?settings.treble:settings.bands[graph.filters.indexOf(filter)];graph.probe.getFrequencyResponse(frequency,magnitude,phase);for(let i=0;i<1024;i++)total[i]*=magnitude[i];}
      peak=Math.max(1,...total);
    }
    graph.preamp.gain.setTargetAtTime(1/peak,context!.currentTime,.025);
    graph.spatial.set(on && settings.spatialEnabled===true,settings.spatialWidth??50,settings.spatialHeadphones===true);
    graph.gain.gain.value = on ? settings.volume / 100 : 1;
    graph.pan.pan.value = on ? settings.balance / 100 : 0;
    graph.compressor.threshold.value = on && settings.limiter ? -6 : 0;
    graph.compressor.ratio.value = on && settings.limiter ? 12 : 1;
  }
  function attach() {
    for (const media of document.querySelectorAll<HTMLMediaElement>('audio,video')) {
      if (graphs.has(media) || !eligible(media)) continue;
      try {
        context ||= new AudioContext();
        const source = context.createMediaElementSource(media);
        const filters = frequencies.map(frequency => new BiquadFilterNode(context!, {type:'peaking', frequency, Q:1.1}));
        const bass = new BiquadFilterNode(context!,{type:'lowshelf',frequency:120});
        const treble = new BiquadFilterNode(context!,{type:'highshelf',frequency:6000});
        const spatial=createSpatial(context);
        const preamp=context.createGain();
        const gain = context.createGain(), pan = context.createStereoPanner(), compressor = context.createDynamicsCompressor();
        const chain = [source,preamp,...filters,bass,treble,spatial.input];
        chain.slice(0,-1).forEach((node,i) => node.connect(chain[i+1]));
        spatial.output.connect(gain);gain.connect(pan);pan.connect(compressor);compressor.connect(context.destination);
        const graph = {spatial,probe:new BiquadFilterNode(context),preamp,filters,bass,treble,gain,pan,compressor};
        graphs.set(media,graph); update(graph);
      } catch { /* A site may already own this media element's source node. */ }
    }
    context?.resume().catch(() => {});
  }
  (globalThis as typeof globalThis & {__pulp?: {apply: (next: AudioSettings) => unknown}}).__pulp = {apply(next: AudioSettings) {
    settings = next; attach(); graphs.forEach(update);
    return {connected:graphs.size, media:document.querySelectorAll<HTMLMediaElement>('audio,video').length, title:document.title};
  }};
  document.addEventListener('play',attach,true);
  document.addEventListener('loadedmetadata',attach,true);
  if (typeof MutationObserver !== 'undefined') new MutationObserver(() => { if ([...document.querySelectorAll<HTMLMediaElement>('audio,video')].some(media => !media.paused)) attach(); }).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('pointerdown',() => context?.resume().catch(() => {}),true);
})();
