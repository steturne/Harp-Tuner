/* Mixtape 2: the harp's sound (M2.harpSound), from the Versilian Community Sample Library's concert harp (CC0), kept in the Mixtape
   folder's Instruments\VCSL Concert Harp: about every third note from E1 to F7, recorded mf and f. A note between recordings is the
   nearest one played a little faster or slower, as a sampler does. Loaded only when first played; the HARP TUNER 2000 plays a string
   with it, and a harp instrument can later. Without the recordings it plays a made-up pluck.
   The recordings are quiet (their peaks 9 to 47 dB under full scale, the low ones quietest), so each is brought to one strong level as
   it loads, judged by what a small speaker plays (above 250 Hz), and a limiter after each note keeps the lift from clipping; bright:true
   adds overtones under the lowest notes so a laptop speaker, which cannot play their own pitch, still lets you hear it.
   play(ctx, dest, freq, {vel 0…1, when, files, len: fade out after this many seconds, bright}) → when the sound ends. */
(()=>{const M2=window.M2=window.M2||{};
const DIR='Instruments/VCSL Concert Harp',SEMI={C:0,D:2,E:4,F:5,G:7,A:9,B:11},LEVEL=.1;   /* LEVEL: where a small speaker hears each note (-20 dB RMS) */
let listing=null;const bufs=new Map();
/* the recordings: KSHarp_<note>_<loudness><n>.wav, e.g. KSHarp_A2_mf1.wav (the notes as tuners write them, middle C = C4) */
const index=files=>listing||(listing=(async()=>{try{return (await files.list(DIR)).map(f=>{const m=!f.dir&&/_([A-G])(#?)(\d)_([a-z]+)\d*\.wav$/i.exec(f.name);
  return m&&{name:f.name,midi:12*(+m[3]+1)+SEMI[m[1].toUpperCase()]+(m[2]?1:0),dyn:m[4].toLowerCase()};}).filter(Boolean);}catch(e){return [];}})());
/* how loud a recording is where a small speaker plays: its first second and a half through a 250 Hz high-pass */
function presence(b){const x=b.getChannelData(0),n=Math.min(x.length,Math.round(b.sampleRate*1.5)),w=2*Math.PI*250/b.sampleRate,c=Math.cos(w),al=Math.sin(w)/1.414,
  b0=(1+c)/2/(1+al),b1=-(1+c)/(1+al),a1=-2*c/(1+al),a2=(1-al)/(1+al);let x1=0,x2=0,y1=0,y2=0,ss=0;
  for(let i=0;i<n;i++){const v=x[i],y=b0*v+b1*x1+b0*x2-a1*y1-a2*y2;x2=x1;x1=v;y2=y1;y1=y;ss+=y*y;}return Math.sqrt(ss/n)||1e-5;}
const load=(ctx,files,s)=>{let b=bufs.get(s.name);if(!b){b=files.read(DIR+'/'+s.name).then(u=>ctx.decodeAudioData(u.buffer.slice(u.byteOffset,u.byteOffset+u.byteLength)))
  .then(buf=>({buf,gain:Math.min(LEVEL/presence(buf),300)}));b.catch(()=>bufs.delete(s.name));bufs.set(s.name,b);}return b;};
function pluck(ctx,dest,f,vel,t){const g=ctx.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.3*vel,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+2.8);g.connect(dest);
  for(const [k,a] of [[1,1],[2,.3],[3,.45],[4,.1],[5,.18]]){if(f*k>9000)break;const o=ctx.createOscillator(),h=ctx.createGain();o.frequency.value=f*k;h.gain.value=a/2.1;o.connect(h);h.connect(g);o.start(t);o.stop(t+2.9);}   /* odd overtones strongest, like a harp's */
  setTimeout(()=>{try{g.disconnect();}catch(e){}},3200);return t+2.9;}
let curve=null;const shaper=()=>curve||(curve=Float32Array.from({length:1025},(_,i)=>Math.tanh(4*(i/512-1))));   /* a soft saturation: makes the overtones */
M2.harpSound={
  async play(ctx,dest,freq,o={}){const files=o.files||window.mixtapeFiles,vel=o.vel==null?.8:o.vel,t0=Math.max(o.when||0,ctx.currentTime+.01);
    const list=files?await index(files):[];if(!list.length)return pluck(ctx,dest,freq,vel,t0);
    const midi=69+12*Math.log2(freq/440),want=vel>.6?'f':'mf';let best=null;
    for(const s of list){const d=Math.abs(s.midi-midi)+(s.dyn===want?0:.4);if(!best||d<best.d)best={s,d};}   /* the nearest recording, the right loudness if there is one */
    let r;try{r=await load(ctx,files,best.s);}catch(e){return pluck(ctx,dest,freq,vel,t0);}
    const t=Math.max(t0,ctx.currentTime+.01),src=ctx.createBufferSource(),g=ctx.createGain(),lim=ctx.createDynamicsCompressor(),nodes=[src,g,lim];
    src.buffer=r.buf;src.playbackRate.value=freq/(440*Math.pow(2,(best.s.midi-69)/12));g.gain.value=r.gain*vel;
    lim.threshold.value=-8;lim.knee.value=4;lim.ratio.value=20;lim.attack.value=.002;lim.release.value=.2;   /* a limiter: the lift never clips */
    src.connect(g);g.connect(lim);lim.connect(dest);
    if(o.bright&&freq<140){const ws=ctx.createWaveShaper(),hp=ctx.createBiquadFilter(),eg=ctx.createGain();   /* below C3: overtones a small speaker can play */
      ws.curve=shaper();hp.type='highpass';hp.frequency.value=350;eg.gain.value=.5;g.connect(ws);ws.connect(hp);hp.connect(eg);eg.connect(lim);nodes.push(ws,hp,eg);}
    src.start(t);src.onended=()=>{for(const n of nodes)try{n.disconnect();}catch(e){}};
    if(o.len){g.gain.setValueAtTime(r.gain*vel,t+o.len*.6);g.gain.linearRampToValueAtTime(0,t+o.len);src.stop(t+o.len+.05);return t+o.len;}   /* a short note: faded out */
    return t+r.buf.duration/src.playbackRate.value;}};
})();
