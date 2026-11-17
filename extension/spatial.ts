/** Stereo widening and optional headphone crossfeed. No Dolby processing. */
export function createSpatial(context:BaseAudioContext){
 const input=context.createGain();input.channelCount=2;input.channelCountMode='explicit';input.channelInterpretation='speakers';
 const output=context.createGain(),dry=context.createGain(),wet=context.createGain();
 const split=context.createChannelSplitter(2),merge=context.createChannelMerger(2);
 input.connect(dry);dry.connect(output);input.connect(split);merge.connect(wet);wet.connect(output);
 const matrix:GainNode[]=[];const feeds:GainNode[]=[];
 for(let from=0;from<2;from++){
  for(let to=0;to<2;to++){const gain=context.createGain();split.connect(gain,from);gain.connect(merge,0,to);matrix.push(gain);}
  const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=700;
  const delay=context.createDelay(.01);delay.delayTime.value=.0003;
  const feed=context.createGain();split.connect(filter,from);filter.connect(delay);delay.connect(feed);feed.connect(merge,0,1-from);feeds.push(feed);
 }
 dry.gain.value=1;wet.gain.value=0;
 return {input,output,set(enabled:boolean,width:number,headphones:boolean){
  const w=Math.max(0,Math.min(100,width))/50,normal=Math.max(1,w),direct=(1+w)/2/normal,cross=(1-w)/2/normal,scale=headphones?.85:1;
  matrix.forEach((gain,index)=>gain.gain.setTargetAtTime((index===0||index===3?direct:cross)*scale,context.currentTime,.02));
  feeds.forEach(gain=>gain.gain.setTargetAtTime(headphones?.15:0,context.currentTime,.02));
  dry.gain.setTargetAtTime(enabled?0:1,context.currentTime,.02);wet.gain.setTargetAtTime(enabled?1:0,context.currentTime,.02);
 }};
}
