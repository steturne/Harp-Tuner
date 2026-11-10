/* Mixtape 2: the tuner's ear (M2.tuner), shared by every tuner device (the harp tuner now, a guitar tuner later).
   A plucked string is hard for an ordinary tuner: it goes a little sharp for a moment when plucked, its lowest notes barely reach a
   laptop's microphone (only their overtones do), and the strings around it ring along. So the ear:
   - waits for each pluck's first instant to pass and reads the ring after it
   - finds the note by how the sound repeats (its period), which works even when the lowest overtone (the note itself) is missing
   - then measures it finely from the overtones it can hear, each one timed by how far its phase turns between two halves of the
     sound, so a reading is good to a fraction of a cent
   - only listens when something is louder than the room, and costs nothing while it is quiet
   measure(x, rate, hint) is plain maths (used by the ear, and by tests outside the page); ear(ctx, source, onRead) does the listening. */
(()=>{const M2=window.M2=window.M2||{};
const tuner=M2.tuner={};
tuner.freq=(midi,ref)=>(ref||440)*Math.pow(2,(midi-69)/12);
tuner.cents=(f,g)=>1200*Math.log2(f/g);

/* ---- FFT (in place, length a power of two) ---- */
const tw=new Map();
function fft(re,im){const n=re.length;let t=tw.get(n);
  if(!t){t={c:new Float64Array(n/2),s:new Float64Array(n/2)};for(let i=0;i<n/2;i++){t.c[i]=Math.cos(2*Math.PI*i/n);t.s[i]=-Math.sin(2*Math.PI*i/n);}tw.set(n,t);}
  for(let i=1,j=0;i<n;i++){let b=n>>1;for(;j&b;b>>=1)j^=b;j|=b;if(i<j){let x=re[i];re[i]=re[j];re[j]=x;x=im[i];im[i]=im[j];im[j]=x;}}
  for(let len=2;len<=n;len<<=1){const h=len>>1,st=n/len;
    for(let i=0;i<n;i+=len)for(let k=0;k<h;k++){const c=t.c[k*st],s=t.s[k*st],a=i+k,b=a+h,xr=re[b]*c-im[b]*s,xi=re[b]*s+im[b]*c;re[b]=re[a]-xr;im[b]=im[a]-xi;re[a]+=xr;im[a]+=xi;}}}
const bufs=new Map(),buf=n=>{let b=bufs.get(n);if(!b){b={re:new Float64Array(n),im:new Float64Array(n),y:new Float64Array(n)};bufs.set(n,b);}return b;};

/* ---- the rough note: how the sound repeats (McLeod's normalised square difference). The shortest strong repeat is the note, so
   the sound repeating every second or third period never reads as a lower note, and a weak lowest overtone does not matter. ---- */
function period(a,rate,hint){const N=a.length;let n=1;while(n<2*N)n<<=1;const {re,im,y}=buf(n);
  let mean=0;for(let i=0;i<N;i++)mean+=a[i];mean/=N;
  for(let i=0;i<n;i++){re[i]=i<N?a[i]-mean:0;im[i]=0;}
  fft(re,im);for(let i=0;i<n;i++){re[i]=re[i]*re[i]+im[i]*im[i];im[i]=0;}fft(re,im);   /* power spectrum back again = how alike the sound is with itself shifted */
  const lo=Math.max(2,Math.floor(rate/3600)),hi=Math.min(Math.floor(rate/30),N>>1);   /* a concert harp: C1 (32.7 Hz) to G7 (3136 Hz) */
  let m=0;for(let i=0;i<N;i++){const v=a[i]-mean;m+=2*v*v;}
  for(let t=0;t<=hi+1;t++){y[t]=m>0?2*re[t]/n/m:0;if(t<N){const u=a[t]-mean,v=a[N-1-t]-mean;m-=u*u+v*v;}}
  const peaks=[];let neg=false,best=-1,bt=0;   /* the highest point of each stretch above zero, once the first one (no shift) has passed */
  for(let t=1;t<=hi;t++){if(!neg){if(y[t]<0)neg=true;continue;}
    if(y[t]>0){if(y[t]>best&&t>=lo){best=y[t];bt=t;}}else if(best>0){peaks.push([bt,best]);best=-1;}}
  if(best>0)peaks.push([bt,best]);if(!peaks.length)return null;
  const top=Math.max(...peaks.map(p=>p[1]));let p=peaks.find(q=>q[1]>=.9*top);
  if(hint){const h=rate/hint;   /* the string we are tuning: a strong repeat at its period (shorter than the one found) wins */
    const q=peaks.find(q=>q[0]<p[0]&&Math.abs(Math.log2(q[0]/h))<.06&&q[1]>=.8*top);if(q)p=q;}
  const t=p[0],a1=y[t-1],b=y[t],c1=y[t+1],d=a1-2*b+c1,off=d<0?.5*(a1-c1)/d:0;
  return {f:rate/(t+off),clar:Math.min(1,b-.25*(a1-c1)*off)};}

/* ---- the fine reading: each overtone's frequency from how far its phase turns from the first half of the sound to the second ---- */
const hanns=new Map(),hann=L=>{let w=hanns.get(L);if(!w){w=new Float64Array(L);for(let i=0;i<L;i++)w[i]=.5-.5*Math.cos(2*Math.PI*(i+.5)/L);hanns.set(L,w);}return w;};
function dft(x,off,L,f,rate,w){const c=Math.cos(2*Math.PI*f/rate),s=-Math.sin(2*Math.PI*f/rate);let pr=1,pi=0,re=0,im=0;
  for(let i=0;i<L;i++){const v=x[off+i]*w[i];re+=v*pr;im+=v*pi;const r=pr*c-pi*s;pi=pr*s+pi*c;pr=r;}return [re,im];}
function fine(x,rate,f,B0,kmax){const L=x.length>>1,w=hann(L),top=Math.min(.45*rate,7000),parts=[],noise=[];
  for(let k=1;k<=kmax&&k*f<top;k++){const fk=k*f*Math.sqrt(1+B0*k*k),A=dft(x,0,L,fk,rate,w),B=dft(x,L,L,fk,rate,w),amp=Math.hypot(...A)+Math.hypot(...B);
    const Z=dft(x,0,L,fk+.5*f,rate,w);noise.push(Math.hypot(...Z));   /* between overtones: what the room sounds like */
    let d=Math.atan2(B[1],B[0])-Math.atan2(A[1],A[0])-2*Math.PI*fk*L/rate;d-=2*Math.PI*Math.round(d/(2*Math.PI));
    parts.push({k,amp,f:fk+d*rate/(2*Math.PI*L)});}
  noise.sort((a,b)=>a-b);const fl=noise[noise.length>>1]||0,mx=Math.max(...parts.map(p=>p.amp));
  let good=parts.filter(p=>p.amp>5*fl&&p.amp>.03*mx);if(!good.length)return null;
  /* wound strings are stiff: their overtones run a little sharp, more so the higher they are (f_k = k·f·√(1+B·k²)). With three or more
     overtones the stretch B is worked out and taken off, so a bass string whose lowest overtone the microphone barely hears still reads
     its own note, not its overtones' */
  for(let round=0;round<2&&good.length>=4;round++){let sw=0,sx=0,sy=0,sxx=0,sxy=0;
    for(const p of good){const X=p.k*p.k,Y=(p.f/p.k)**2,w=p.amp;sw+=w;sx+=w*X;sy+=w*Y;sxx+=w*X*X;sxy+=w*X*Y;}
    const det=sw*sxx-sx*sx;if(!(det>0))break;const b=(sw*sxy-sx*sy)/det,a=(sy-b*sx)/sw,B=b/a;
    if(!(a>0)||B<-1e-4||B>1e-3)break;   /* a harp's long wound strings stretch far less than this: a wild fit is noise */
    const fit=k=>Math.sqrt(a)*k*Math.sqrt(1+B*k*k),keep=good.filter(p=>Math.abs(tuner.cents(p.f,fit(p.k)))<1.5);
    if(round===1||keep.length===good.length||keep.length<3)return {f:Math.sqrt(a),B,parts:good.length,snr:mx/(fl||1e-9)};
    good=keep;}
  const est=good.map(p=>({e:p.f/p.k,w:p.amp/Math.sqrt(p.k)})).sort((a,b)=>a.e-b.e);
  let acc=0,tot=est.reduce((s,q)=>s+q.w,0),med=est[0].e;for(const q of est){acc+=q.w;if(acc>=tot/2){med=q.e;break;}}   /* the weighted middle one, then the mean of those near it */
  const near=est.filter(q=>Math.abs(tuner.cents(q.e,med))<4);let sw=0,sf=0;for(const q of near){sw+=q.w;sf+=q.w*q.e;}
  return {f:sf/sw,parts:near.length,snr:mx/(fl||1e-9)};}

/* is the sound really a note m times lower (one or two octaves, or a twelfth)? A wound bass string can ring loudest on one overtone
   for its first half second (Steve's low F read as the F two octaves up); the lower note's other overtones, the ones this one's do not
   explain, give it away */
function lower(x,rate,f,m){const L=x.length,w=hann(L),g=f/m,amp=q=>Math.hypot(...dft(x,0,L,q,rate,w));
  const main=amp(f),noise=[];for(let j=1;j<=2*m+1;j++)noise.push(amp((j+.5)*g));noise.sort((a,b)=>a-b);const fl=noise[noise.length>>1];
  let n=0;for(let j=1;j<=2*m+1;j++)if(j%m&&amp(j*g)>Math.max(5*fl,.03*main))n++;return n>=2;}

/* x: the newest sound (oldest first), rate: samples a second, hint: the frequency of the string being tuned (or 0).
   lock: the player is tuning that one string, so a sound at one of its overtones (2 to 6 times its note) IS that string: through a
   laptop's microphone a bass string's short pluck can come through as nothing but one overtone.
   Returns {f, clar (0…1, how clearly it repeats), parts (overtones that agreed), B (the stretch), m (which overtone it was read from)} or null. */
tuner.measure=(x,rate,hint,lock)=>{if(x.length<2048)return null;
  const r=period(x.subarray(Math.max(0,x.length-8192)),rate,hint);if(!r||r.clar<.5)return r&&{clar:r.clar};
  const run=f0=>{const want=f0<160?16384:f0<600?8192:4096,b=x.subarray(Math.max(0,x.length-want));   /* a longer piece for low strings: finer, and they ring on longer */
    if(b.length<Math.min(want,Math.max(2048,8*rate/f0)))return 'early';   /* too short yet for a fine reading (under 8 periods): its overtones would blur into each other */
    let f=f0,q=null;for(let pass=0;pass<3;pass++){const z=fine(b,rate,f,q&&q.B||0,pass?10:5);if(!z)break;q=z;f=z.f;}   /* the low overtones first, then all of them placed by the stretch found */
    return q&&Math.abs(tuner.cents(f,f0))<=40?q:null;};
  let f0=r.f,q,known=false,mm=1;const subs=[4,3,2].filter(m=>r.f/m>=58);
  if(hint)for(const m of lock?[1,2,3,4,5,6]:subs)if(Math.abs(tuner.cents(r.f,hint*m))<60&&(lock||lower(x,rate,r.f,m))){f0=r.f/m;known=true;mm=m;break;}   /* the string being tuned, heard as itself or its overtone */
  q=run(f0);
  if(q&&q!=='early'&&q.parts===1&&!known)for(const m of subs)if(lower(x,rate,r.f,m)){const z=run(r.f/m);if(z&&z!=='early'&&z.parts>=2){q=z;mm=m;}break;}   /* one lone overtone: perhaps of a lower string */
  if(q==='early')return {clar:r.clar,early:true};if(!q)return {clar:r.clar};
  return {f:q.f,clar:r.clar,parts:q.parts,B:q.B,snr:q.snr,m:mm};};

/* ---- the ear: listens to a sound node, about 20 times a second, and hands each reading to onRead:
   {t, level, gate, onset (when the last pluck began), wait (the pluck's first instant: no reading yet), f, clar, parts} ---- */
tuner.ear=(ctx,src,onRead)=>{const fed=!!src.getFloatTimeDomainData,an=fed?src:ctx.createAnalyser();   /* src: a sound node, or tuner.helperMic()'s feed */
  if(!fed){an.fftSize=16384;src.connect(an);}
  const x=new Float32Array(16384),rate=fed?src.rate:ctx.sampleRate,blk=Math.round(rate*.03);
  let floor=.003,prev=0,onset=-9,deaf=0,T=0,paused=false;
  const ear={hint:0,lock:false,
    deaf(sec){deaf=ctx.currentTime+sec;},   /* not listening while Mixtape plays a note itself */
    pause(on){paused=on;},
    stop(){clearInterval(T);if(!fed)try{src.disconnect(an);}catch(e){}}};
  T=setInterval(()=>{if(paused)return;an.getFloatTimeDomainData(x);const t=ctx.currentTime;
    let s=0;for(let i=x.length-blk;i<x.length;i++)s+=x[i]*x[i];const rms=Math.sqrt(s/blk);
    floor=rms<floor?floor*.7+rms*.3:Math.min(floor*1.004,.05);   /* the room: follows quiet straight away, noise only slowly */
    const gate=Math.max(floor*3,.0006);   /* a laptop microphone hears a quiet room at about -75 dB: a soft pluck that rings on is well above that */
    if(rms>gate&&rms>prev*1.6&&t-onset>.12)onset=t;prev=rms;   /* a pluck: the sound jumps up */
    const r={t,level:rms,gate,onset};
    if(t<deaf||rms<gate){onRead(r);return;}
    const n=Math.floor((t-onset-.1)*rate);   /* only the sound after the pluck's first 100 ms */
    if(n<2048){r.wait=true;onRead(r);return;}
    Object.assign(r,tuner.measure(n<x.length?x.subarray(x.length-n):x,rate,ear.hint,ear.lock)||{});onRead(r);},50);
  return ear;};

/* ---- the microphone through Mixtape's helper (desktop\mic.js, in the program only), opened the way Windows' Sound Recorder opens it:
   a laptop's microphone array lets a string ring on that way, where a page's own microphone gets half a second of it. Resolves to a
   feed for tuner.ear: {rate, getFloatTimeDomainData(x) (the newest sound), stop(), onend (set it: the helper stopped by itself)};
   rejects when there is no helper or it does not start. ---- */
tuner.helperMic=()=>new Promise((ok,no)=>{const H=window.mixtapeMic;if(!H)return no(new Error('no microphone helper here'));
  const N=1<<17,ring=new Float32Array(N);let w=0,rest=null,state='starting';
  const feed={rate:48000,onend:null,tap:null,
    getFloatTimeDomainData(d){const n=d.length;for(let i=0;i<n;i++)d[i]=ring[(w-n+i)&(N-1)];},
    stop(){if(state==='stopped')return;state='stopped';H.stop();}};
  const T=setTimeout(()=>{if(state==='starting'){feed.stop();no(new Error('the microphone helper did not start'));}},15000);
  H.on(m=>{if(state==='stopped'&&m.t!=='end')return;
    if(m.t==='ready'){feed.rate=m.rate;state='on';clearTimeout(T);ok(feed);}
    else if(m.t==='data'){let b=m.b;if(rest){const c=new Uint8Array(rest.length+b.length);c.set(rest);c.set(b,rest.length);b=c;}
      const n=b.length>>2,v=new DataView(b.buffer,b.byteOffset,n*4);for(let i=0;i<n;i++)ring[(w+i)&(N-1)]=v.getFloat32(i*4,true);
      if(feed.tap){const a=new Float32Array(n);for(let i=0;i<n;i++)a[i]=ring[(w+i)&(N-1)];feed.tap(a);}w+=n;   /* tap: anyone who wants the sound as it comes (a test recording) */
      rest=b.length&3?b.slice(n*4):null;}
    else if(m.t==='end'){clearTimeout(T);const was=state;state='stopped';
      if(was==='starting')no(new Error(m.err||'the microphone helper stopped'));else if(was==='on'&&feed.onend)feed.onend(m);}});
  H.start();});
})();
