import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const nodes=[];
class Node { constructor(_context,options={}){Object.assign(this,options);this.gain={value:0,setTargetAtTime(value){this.value=value;}};this.pan={value:0};this.threshold={value:0};this.ratio={value:0};nodes.push(this);}connect(next){this.next=next;} }
class Context {currentTime=0;destination=new Node();createMediaElementSource(){return new Node();}createGain(){return new Node();}createStereoPanner(){return new Node();}createDynamicsCompressor(){return new Node();}resume(){return Promise.resolve();}}
const media=[{src:'https://music.test/song.mp3'},{src:'https://other.test/song.mp3'},{src:'https://music.test/drm',mediaKeys:{}}];
const sandbox={URL,location:{href:'https://music.test/',origin:'https://music.test'},document:{title:'Test music',querySelectorAll:()=>media,addEventListener(){}},AudioContext:Context,BiquadFilterNode:Node};
vm.createContext(sandbox);vm.runInContext(readFileSync('dist/engine.js','utf8'),sandbox);
const settings={enabled:true,bands:[6,0,0,0,0,0,0,0,0,-3],bass:4,treble:2,volume:80,balance:-50,limiter:true};
assert.equal(sandbox.__pulp.apply(settings).connected,1,'skip cross-origin and DRM media');
const filters=nodes.filter(n=>n.type==='peaking');assert.equal(filters.length,10);assert.equal(filters[0].gain.value,6);assert.equal(filters[9].gain.value,-3);
assert.equal(nodes.find(n=>n.type==='lowshelf').gain.value,4);
const count=nodes.length;sandbox.__pulp.apply({...settings,enabled:false});assert.equal(nodes.length,count,'reuse existing graph');assert.ok(filters.every(n=>n.gain.value===0),'bypass resets EQ');
console.log('PASS: safe media selection, ten bands, gain updates, graph reuse and bypass');
