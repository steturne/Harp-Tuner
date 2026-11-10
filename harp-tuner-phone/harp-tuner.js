/* Mixtape 2 device: HARP TUNER 2000, a 1980s "tuning computer" for any harp (saved harps; Steve's Troubadour, 36 strings C2 to C7, comes ready), photo-real from
   Steve's picture (Skins\harp-tuner-2000.jpg; the body is harp-tuner-2000-body.jpg, tools\harptunerbody.ps1). Over the picture, in its
   own pixels: the lit segments and lamps (over the photo's unlit ones), the neon glow on the wires, the name tags, the arrows and OK, the
   LISTEN light; the flip switches' other position copied from a switch in the photo that stands that way, the knob turned. The listening is M2.tuner
   (tuner.js); in the program it hears the microphone through Mixtape's helper (desktop\mic.js), which lets the strings ring.
   MODE: AUTO follows, as harpists are taught to tune (pluck any string and it shows that string); MANUAL tunes the string chosen
   (click its tube or tag; click it again to hear it), knowing it by any of its overtones.
   - HARP: the harps are saved in Tuning\Harps.json (a name, how many strings, the lowest note; anything within a concert harp's C1 … G7),
     chosen and added in VIEW LOG. The wires show the harp chosen: a smaller one leaves the outer wires dark, a bigger one slides along
     to the string heard or chosen (scroll over the strings to slide it). It listens only for that harp's strings
   - NOTE: the string it hears, in big green segments (b = flat), with its number and its name (C2 … C7, as tuners write them; MIDDLE C)
   - ON TARGET: a row of lights, green in the middle, amber then red further out; while it waits, one light sweeps to and fro
   - CENTS: how far out, in red LED digits (100 cents = a half step); TUNE: ▲ tune it up, ▼ tune it down, OK in tune
   - the strings: 36 neon tubes, bass on the left (C pink-red, F blue, the wound bass violet, the rest cyan), each with an orange-on-black LCD tag
     naming it (lit for the string being tuned); the one heard blazes, and the light above its tag turns green once it was in tune this time, amber while it is out.
     Power off, the tubes are plain glass. In AUTO a click on a string plays its note (the concert harp's, M2.harpSound)
   - POWER: the microphone on / off. LOG TUNE: writes this tuning down for the harp chosen (Tuning\Harp.json in the Mixtape folder): how far out each string
     was before it was tuned and where it ended, with the weather (temperature and humidity move harp strings) when a town is set in
     the log. VIEW LOG: the log, which strings drift the most, and the town for the weather (Open-Meteo, free, no sign-up)
   - the A = knob (432 / 440 / 442 / 444: click to step on, scroll to turn it), and LEVERS: tuned with the E, A and B levers up (the key of C, Steve's way) or all down (E♭ major) */
(()=>{const M2=window.M2;
const HARPS='Tuning/Harps.json',TROUBADOUR={name:'Troubadour',strings:36,low:'C2'};   /* the saved harps; the one there is before any is saved */
const W=800,PW=1213,PH=880,BOX=[62,77,1090,729],K=W/BOX[2],H=Math.round(BOX[3]*K),TOL=3,SETTLE=.12,REFS=[432,440,442,444],LOG='Tuning/Harp.json';
const IMG='mixtape2/Skins/harp-tuner-2000-body.jpg',PARTS='mixtape2/Skins/harp-tuner-2000-parts.png';   /* Steve's photo, its red line on F4 and its knob taken out, and the parts laid over it (tools\harptunerbody.ps1); BOX: the case in it */
/* where the parts are in the photo (its own pixels, 1213 × 880) */
const WX=i=>141+26.686*i,WBOT=628,WTOP=[448,448,448,449,449,450,450,451,452,453,453,454,455,456,457,459,460,461,463,464,466,468,469,471,473,475,478,480,482,484,486,489,491,494,496,499];   /* the 36 wires (i 0 = the bass C) and where each leaves the rail */
const TX=i=>131+26.69*i,TAGY=[640,673];   /* their name tags (22 px wide) */
const KX=780,KY=758,KA=[-60,-20,20,60],K0=-20;   /* the A = knob: where it points for each pitch (the photo's points at 440) */
const TOG={power:{c:[150,750],nat:'down',i:0},mode:{c:[276,747],nat:'up',i:1},levers:{c:[948,750],nat:'up',i:2}};   /* the flip switches as the photo has them, and their other position in the parts (52 × 78 each; the knob after them) */
const LET='CDEFGAB',SEMI=[0,2,4,5,7,9,11],f1=v=>v.toFixed(1);
/* every harp's notes: a concert pedal harp's 47 strings, C1 … G7 (p 0 … 46); a saved harp is a stretch of them */
const posOf=nm=>{const m=/^([A-G])([1-7])$/.exec(nm||'');return m?LET.indexOf(m[1])+7*(+m[2]-1):-1;},noteAt=p=>LET[p%7]+(1+Math.floor(p/7));
const okHarp=h=>!!h&&!!h.name&&h.strings>=2&&posOf(h.low)>=0&&posOf(h.low)+h.strings<=47;
/* a harp's strings, string 1 the highest (as harpists count); levers 'up' = tuned to the key of C with the E, A and B levers raised */
function harp(h,levers){const N=h.strings,p0=posOf(h.low),s=[];for(let n=1;n<=N;n++){const p=p0+N-n,L=LET[p%7],o=1+Math.floor(p/7),flat=levers==='down'&&'EAB'.includes(L);
  s[n]={n,p,L,flat,o,mid:L==='C'&&o===4,midi:12*(o+1)+SEMI[p%7]-(flat?1:0),col:L==='C'?'c':L==='F'?'f':p<=11?'w':''};}s.N=N;return s;}   /* w: the wound bass, below A2 */
/* a string's name as tuners write it (C1 … G7, b = flat), middle C by name */
const nameOf=x=>x.mid?'MIDDLE C':x.L+(x.flat?'b':'')+x.o;
/* the words on a string's LCD tag (22 px wide: middle C on two lines) */
const tagText=(x,cx,cy)=>x.mid?`<text class="lcdt sm" x="${cx}" y="${cy-6}" text-anchor="middle" dominant-baseline="central">MID</text><text class="lcdt" x="${cx}" y="${cy+6.5}" text-anchor="middle" dominant-baseline="central">C</text>`
  :`<text class="lcdt${x.flat?' sm':''}" x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central">${x.L+(x.flat?'b':'')+x.o}</text>`;
/* the closeness lamps: 25, the middle one green; how many cents each step out stands for */
const NL=25,MID=12,STEPS=[3,5,7,10,13,16,20,25,30,35,42,50],LX=i=>450.5+25.65*i,LY=[229,264];
const lightOf=c=>{const a=Math.abs(c);let k=STEPS.findIndex(s=>a<=s);if(k<0)k=STEPS.length;return MID+Math.sign(c)*Math.min(MID,k);};

/* ---- seven-segment characters ---- */
const CH={'0':'abcdef','1':'bc','2':'abdeg','3':'abcdg','4':'bcfg','5':'acdfg','6':'acdefg','7':'abc','8':'abcdefg','9':'abcdfg','-':'g',' ':'',
  A:'abcefg',b:'cdefg',C:'adef',d:'bcdeg',E:'adefg',F:'aefg',G:'acdef',o:'cdeg'};
function digit(k,x,y,w,h,t){const g=t*.2,y0=y+t/2,y1=y+h/2,y2=y+h-t/2,xl=x+t/2,xr=x+w-t/2,Lh=xr-xl-2*g,Lv=y1-y0-2*g,
  hz=(cx,cy,L)=>`${f1(cx-L/2)},${f1(cy)} ${f1(cx-L/2+t/2)},${f1(cy-t/2)} ${f1(cx+L/2-t/2)},${f1(cy-t/2)} ${f1(cx+L/2)},${f1(cy)} ${f1(cx+L/2-t/2)},${f1(cy+t/2)} ${f1(cx-L/2+t/2)},${f1(cy+t/2)}`,
  vt=(cx,cy,L)=>`${f1(cx)},${f1(cy-L/2)} ${f1(cx+t/2)},${f1(cy-L/2+t/2)} ${f1(cx+t/2)},${f1(cy+L/2-t/2)} ${f1(cx)},${f1(cy+L/2)} ${f1(cx-t/2)},${f1(cy+L/2-t/2)} ${f1(cx-t/2)},${f1(cy-L/2+t/2)}`;
  const P={a:hz(x+w/2,y0,Lh),b:vt(xr,(y0+y1)/2,Lv),c:vt(xr,(y1+y2)/2,Lv),d:hz(x+w/2,y2,Lh),e:vt(xl,(y1+y2)/2,Lv),f:vt(xl,(y0+y1)/2,Lv),g:hz(x+w/2,y1,Lh)};
  return `<g class="dg" data-d="${k}" transform="translate(${f1(.105*(y+h/2))} 0) skewX(-6)">${Object.entries(P).map(([s,p])=>`<polygon class="sg" data-s="${s}" points="${p}"/>`).join('')}</g>`;}
const setDigit=(g,ch)=>{const on=CH[ch]||'';for(const p of g.children)p.classList.toggle('on',on.includes(p.dataset.s));};

const CSS=`
.ht{position:absolute;inset:0;overflow:hidden;border-radius:9px;user-select:none;font-family:"Arial Black",Arial,sans-serif;box-shadow:0 30px 50px rgba(0,0,0,.55),0 8px 14px rgba(0,0,0,.4)}
.ht .ph{position:absolute;left:0;top:0;width:${PW}px;height:${PH}px;transform-origin:0 0;transform:scale(${K}) translate(${-BOX[0]}px,${-BOX[1]}px)}
.ht .ph>img,.ht .ph>svg{position:absolute;left:0;top:0;width:${PW}px;height:${PH}px}.ht .ph>svg{pointer-events:none}.ht .pick{pointer-events:all}.ht .ph>div{position:absolute}
.ht svg text{font-family:"Arial Black",Arial,sans-serif}
/* the displays light over the photo's own unlit segments and lamps */
.ht .sg{fill:transparent}.ht .sg.on{fill:var(--c);filter:drop-shadow(0 0 4px var(--c))}
.ht .vf{--c:#7DFFC8}.ht .rd,.ht .rdm{--c:#FF3D2E}
.ht .lt{fill:transparent}.ht .lt.g{fill:#5CFF7A;filter:drop-shadow(0 0 6px #5CFF7A)}.ht .lt.y{fill:#D7FF3A;filter:drop-shadow(0 0 6px #D7FF3A)}
.ht .lt.a{fill:#FFB020;filter:drop-shadow(0 0 6px #FFB020)}.ht .lt.r{fill:#FF3D2E;filter:drop-shadow(0 0 6px #FF3D2E)}.ht .lt.dim{opacity:.35}
.ht .ar{fill:transparent}.ht .ar.on{fill:#FFB020;filter:drop-shadow(0 0 7px #FFB020)}
.ht .okl rect,.ht .okl text{fill:transparent}.ht .okl.on rect{fill:#5CFF7A;filter:drop-shadow(0 0 7px #5CFF7A)}.ht .okl.on text{fill:#0b1a0e}
.ht .vt{fill:#7DFFC8;font:700 15px "Courier New",monospace;letter-spacing:1.5px;filter:drop-shadow(0 0 3px #7DFFC8)}
.ht.off .vf .sg.on,.ht.off .rd .sg.on,.ht.off .vt{opacity:0}.ht.held .sg.on,.ht.held .lt,.ht.held .vt{opacity:.45}
.ht .led{fill:transparent}.ht .led.on{fill:#FF3D2E;filter:drop-shadow(0 0 5px #FF3D2E)}
/* the wires glow as neon while it listens: C pink-red, F blue, the wound bass violet, the rest cyan */
.ht .tube{--n:#3DF5FF}.ht .tube.c{--n:#FF2D6F}.ht .tube.f{--n:#2D8BFF}.ht .tube.w{--n:#C77DFF}.ht.off .tube{display:none}
.ht .tube .gl{stroke:var(--n);stroke-width:5;stroke-linecap:round;opacity:.6;filter:drop-shadow(0 0 5px var(--n))}.ht .tube .co{stroke:#fff;stroke-width:1.5;stroke-linecap:round;opacity:.85}
.ht .tube.hot .gl{stroke-width:8;opacity:1;filter:drop-shadow(0 0 11px var(--n))}.ht .tube.hot .co{stroke-width:2.4;opacity:1}
/* the name tags, orange on black over the photo's, lit for the string being tuned; their edge green once in tune, amber while out */
.ht .lcd{fill:#0b0703;stroke:#3a2a12;stroke-width:1.2}.ht .lcdt{fill:#7a4416;font:900 10px Arial,sans-serif}.ht .lcdt.sm{font-size:8px}
.ht .tag.lit .lcd{fill:#160c03;stroke:#FF9A1A}.ht .tag.lit .lcdt{fill:#FFB347;filter:drop-shadow(0 0 3px #FF9A1A)}
.ht .pin{fill:none;stroke:transparent;stroke-width:2}.ht .pin.off{stroke:#FFB020;filter:drop-shadow(0 0 3px #FFB020)}.ht .pin.ok{stroke:#5CFF7A;filter:drop-shadow(0 0 3px #5CFF7A)}
.ht .pick{fill:transparent;cursor:pointer}.ht .pick:hover{fill:rgba(125,255,200,.07)}
.ht .tube.none,.ht .pick.none{display:none}.ht .tag.none .lcd{fill:#050302;stroke:#1a140c}   /* wires the harp chosen has no string for */
/* the controls: the photo's own, pressed, flipped and turned */
.ht .bt{cursor:pointer}.ht .push:active{background:rgba(0,0,0,.2);box-shadow:inset 0 3px 7px rgba(0,0,0,.45)}
.ht .tg .alt{position:absolute;left:4px;top:-4px;width:52px;height:78px;display:none}.ht .pw.on .alt,.ht .md:not(.on) .alt,.ht .lv:not(.on) .alt{display:block}
.ht .knob{border-radius:50%;cursor:ns-resize;transition:transform .15s}
.ht .log{position:absolute;left:24px;top:40px;width:752px;height:${H-80}px;box-sizing:border-box;padding:12px 30px;overflow:auto;color:#1d2a1d;
  font:12px/1.5 "Courier New",monospace;border-radius:3px;box-shadow:0 12px 30px rgba(0,0,0,.6);
  background:radial-gradient(circle at 10px 18px,#3a3f45 4px,transparent 5px) 0 0/20px 36px repeat-y,radial-gradient(circle at 10px 18px,#3a3f45 4px,transparent 5px) 100% 0/20px 36px repeat-y,
    repeating-linear-gradient(#fbfdf8 0 18px,#dcefd8 18px 36px)}
.ht .log h3{margin:0;font:900 16px "Courier New",monospace;letter-spacing:2px}.ht .log .sub{margin:2px 0 6px}.ht .log b{font-weight:900}
.ht .log ol,.ht .log ul{margin:4px 0 0;padding-left:22px}.ht .log select{font:12px "Courier New",monospace;border:1px solid #5a6a5a;background:#fff}.ht .log input{font:12px "Courier New",monospace;width:180px;border:1px solid #5a6a5a;background:#fff;padding:1px 4px}
.ht .log button{font:700 11px "Courier New",monospace;cursor:pointer;border:1px solid #3a4a3a;background:#e8f0e4;padding:1px 6px}
.ht .log .x{position:absolute;right:28px;top:6px;font-size:18px;border:0;background:none}
`;
function style(){if(document.getElementById('ht-css'))return;const s=document.createElement('style');s.id='ht-css';s.textContent=CSS;document.head.appendChild(s);}

/* ---- the face: the photo, and everything that lights or moves laid over it in its own pixels ---- */
function art(){let tubes='',tags='',picks='',lamps='';
  for(let i=0;i<36;i++){const x=f1(WX(i)),t=WTOP[i]+9,tx=TX(i);
    tubes+=`<g class="tube" data-i="${i}"><line class="gl" x1="${x}" y1="${t}" x2="${x}" y2="${WBOT}"/><line class="co" x1="${x}" y1="${t+1}" x2="${x}" y2="${WBOT-1}"/></g>`;
    tags+=`<g class="tag" data-i="${i}"><rect class="lcd" x="${f1(tx)}" y="${TAGY[0]}" width="22" height="${TAGY[1]-TAGY[0]}" rx="2"/></g><rect class="pin" data-i="${i}" x="${f1(tx-1.5)}" y="${TAGY[0]-1.5}" width="25" height="${TAGY[1]-TAGY[0]+3}" rx="3"/>`;
    picks+=`<rect class="pick" data-i="${i}" data-ctl="1" x="${f1(WX(i)-13.3)}" y="440" width="26.7" height="${TAGY[1]+3-440}"><title></title></rect>`;}
  for(let i=0;i<NL;i++)lamps+=`<rect class="lt" data-i="${i}" x="${f1(LX(i))}" y="${LY[0]}" width="19" height="${LY[1]-LY[0]}" rx="2"/>`;
  return `<svg viewBox="0 0 ${PW} ${PH}"><g class="vf">${digit('n1',189,217,86,143,14)}${digit('n2',298,217,44,73,8)}</g><text class="vt nl" x="266" y="398" text-anchor="middle"></text>
   ${lamps}<g class="rd">${digit('c0',471,325,42,65,9)}${digit('c1',519,325,42,65,9)}${digit('c2',576,325,42,65,9)}<circle class="sg dp" cx="634" cy="388" r="4"/>${digit('c3',650,325,42,65,9)}</g>
   <polygon class="ar up" points="837,328 875,379 800,379"/><polygon class="ar dn" points="892,327 968,327 930,379"/>
   <g class="okl"><rect x="989" y="330" width="88" height="52" rx="8"/><text x="1033" y="365" text-anchor="middle" font-size="24">OK</text></g>
   <g>${tubes}</g>${tags}${picks}<circle class="led pl" cx="206" cy="749" r="6.5"/>
   <g class="rdm">${digit('r1',830,737,17,30,4)}${digit('r2',851,737,17,30,4)}${digit('r3',874,737,17,30,4)}</g></svg>`;}
/* a flip switch: its other position is a whole picture made beforehand (tools\harptunerbody.ps1), so flipping leaves nothing behind */
function toggle(k,cls,parts){const T=TOG[k],[cx,cy]=T.c;
  return `<div class="bt tg ${cls}" data-k="${k}" data-ctl="1" style="left:${cx-30}px;top:${cy-40}px;width:60px;height:76px"><div class="alt" style="background:url('${parts}') ${-52*T.i}px 0"></div></div>`;}
function face(S,url,parts){style();const m=document.createElement('div');m.className='ht off';
  m.innerHTML=`<div class="ph"><img src="${url}" alt="" draggable="false">${art()}${toggle('power','pw',parts)}${toggle('mode','md',parts)}${toggle('levers','lv',parts)}
    <div class="bt push" data-k="log" data-ctl="1" style="left:383px;top:713px;width:64px;height:64px;border-radius:50%" title="LOG TUNE: keep this tuning"></div>
    <div class="bt push" data-k="view" data-ctl="1" style="left:569px;top:718px;width:54px;height:51px;border-radius:6px" title="VIEW LOG"></div>
    <div class="bt knob" data-k="ref" data-ctl="1" style="left:${KX-27}px;top:${KY-27}px;width:54px;height:54px;background:url('${parts}') -156px 0" title="A =: click to step on, scroll to turn"></div></div>
    <div class="log" hidden></div>`;return m;}

M2.define({id:'harp-tuner',name:'HARP TUNER 2000',short:'Harp tuner',type:'utility',version:'2.0',format:1,w:W,h:H,
  blurb:'Pluck any string: it shows the note, how far out it is and which way to turn, and logs each tuning',
  sockets:[],
  settings:{ref:440,levers:'up',mode:'auto',harp:'Troubadour',town:'',place:'',lat:null,lon:null},
  preview(){const d=document.createElement('div');d.style.cssText='position:relative;width:'+W+'px;height:'+H+'px';const m=face(this.settings,M2.fileUrl(IMG),M2.fileUrl(PARTS));d.appendChild(m);
    const q=s=>m.querySelector(s);'440'.split('').forEach((c,i)=>setDigit(q(`[data-d="r${i+1}"]`),c));return d;},
  create(host){const S=host.settings,m=face(S,host.fileUrl(IMG),host.fileUrl(PARTS));host.el.appendChild(m);const $=s=>m.querySelector(s),T=M2.tuner;
    const D=k=>$(`[data-d="${k}"]`),lights=[...m.querySelectorAll('.lt')],logEl=$('.log');
    const wires=[...m.querySelectorAll('.tube')],tagEls=[...m.querySelectorAll('.tag')],pinEls=[...m.querySelectorAll('.pin')],pickEls=[...m.querySelectorAll('.pick')];
    let harps=[{...TROUBADOUR}],hp=harps[0],ws=0;   /* the saved harps, the one chosen, and which of its strings the first wire shows */
    let s=harp(hp,S.levers),cur=0,sel=0,ctx=null,stream=null,src=null,feed=null,ear=null,opening=false,dead=false;
    let lastOn=-1,reads=[],pv=null,cand=null,fresh=0,sweepT=0,sweep=0,sweepD=1;
    const hist=[];   /* this time: each finished pluck's reading {n: string, v: cents} */
    const marks={};   /* this time: string → 'ok' (was in tune) or 'off' */
    const newSess=()=>({start:null,harp:hp.name,ref:S.ref,levers:S.levers,strings:{}});
    let log={format:1,harp:'Lyon & Healy Troubadour',sessions:[]},sess=newSess(),loaded=false;
    const freq=n=>T.freq(s[n].midi,S.ref),name=n=>s[n].L+(s[n].flat?'♭':'');
    const nearest=f=>{let b=1,bd=1e9;for(let n=1;n<=s.N;n++){const d=Math.abs(T.cents(f,freq(n)));if(d<bd){bd=d;b=n;}}return b;};

    /* ---- the strings on the wires: the harp's lowest on the left; a bigger harp than 36 slides to keep the string tuned in sight ---- */
    const stringAt=i=>{const k=ws+i;return k>=0&&k<s.N?s.N-k:0;},wireOf=n=>s.N-n-ws;
    function fitWires(n){if(s.N<=36){ws=-Math.floor((36-s.N)/2);return;}const k=n?s.N-n:-1;if(n&&k<ws)ws=k;else if(n&&k>ws+35)ws=k-35;ws=Math.max(0,Math.min(s.N-36,ws));}
    function paintBank(){for(let i=0;i<36;i++){const n=stringAt(i),x=n&&s[n],tg=tagEls[i];
      wires[i].setAttribute('class','tube'+(x?' '+x.col+(n===cur&&ear?' hot':''):' none'));
      tg.querySelectorAll('text').forEach(e=>e.remove());tg.setAttribute('class','tag'+(x?n===cur&&(manual()||ear)?' lit':'':' none'));   /* the tag of the string being tuned lights up */
      if(x)tg.insertAdjacentHTML('beforeend',tagText(x,f1(TX(i)+11),(TAGY[0]+TAGY[1])/2));
      pinEls[i].setAttribute('class','pin'+(x&&marks[n]?' '+marks[n]:''));pickEls[i].setAttribute('class','pick'+(x?'':' none'));pickEls[i].firstChild.textContent=x?`String ${n}: ${nameOf(x)}`:'';}}
    m.addEventListener('wheel',e=>{if(!e.target.closest('.pick')||s.N<=36)return;e.preventDefault();e.stopPropagation();ws=Math.max(0,Math.min(s.N-36,ws+(e.deltaY>0?2:-2)));paintBank();},{passive:false});

    /* ---- the displays ---- */
    function showNote(){const n=cur;setDigit(D('n1'),n?(s[n].L==='D'?'d':s[n].L==='B'?'b':s[n].L):'-');setDigit(D('n2'),n&&s[n].flat?'b':' ');
      $('.nl').textContent=n?`STRING ${n} · ${nameOf(s[n])}`:manual()?'CHOOSE A STRING':ear?hp.name.toUpperCase().slice(0,14)+' · PLUCK':'';
      if(n)fitWires(n);paintBank();}
    function showCents(c){const t=c==null?'----':(Math.abs(c)>=99.95?(c<0?'-99.9':' 99.9'):(c<=-.05?'-':' ')+Math.abs(c).toFixed(1).padStart(4,'0'));   /* "-12.4", " 03.0" */
      const ch=c==null?['-','-','-','-']:[t[0],t[1],t[2],t[4]];['c0','c1','c2','c3'].forEach((k,i)=>setDigit(D(k),ch[i]));
      $('.dp').classList.toggle('on',c!=null);if(c!=null&&ch[1]==='0')setDigit(D('c1'),' ');}
    function showLights(c){const k=c==null?-1:lightOf(c);
      lights.forEach((e,i)=>{const d=Math.abs(i-MID),col=d===0?'g':d<=2?'y':d<=7?'a':'r';e.setAttribute('class','lt'+(i===k||(c!=null&&Math.abs(c)<=TOL&&d<=1)?' '+col:''));});}
    function showArrow(c,sure){const ok=c!=null&&Math.abs(c)<=TOL;$('.ar.up').classList.toggle('on',c!=null&&!ok&&c<0);$('.ar.dn').classList.toggle('on',c!=null&&!ok&&c>0);
      $('.okl').classList.toggle('on',ok&&sure);}
    function showRef(){String(S.ref).split('').forEach((c,i)=>setDigit(D('r'+(i+1)),c));$('.knob').style.transform=`rotate(${KA[Math.max(0,REFS.indexOf(S.ref))]-K0}deg)`;}
    const manual=()=>S.mode==='manual';
    function ui(){m.classList.toggle('off',!ear);$('.pw').classList.toggle('on',!!ear);$('.md').classList.toggle('on',!manual());$('.led.pl').classList.toggle('on',!!ear);$('.lv').classList.toggle('on',S.levers==='up');
      paintBank();showRef();}
    function blank(){cur=manual()?sel:0;if(ear){ear.hint=cur?freq(cur):0;ear.lock=manual();}showNote();showCents(null);showLights(null);showArrow(null);m.classList.remove('held');}
    /* waiting for a pluck: one light sweeps to and fro, slowly (only while listening, in sight and nothing is heard) */
    function idle(on){clearInterval(sweepT);sweepT=0;if(!on)return;sweepT=setInterval(()=>{if(!ear||!host.visible)return;if(fresh&&performance.now()-fresh<2500)return;
      sweep+=sweepD;if(sweep<=0||sweep>=NL-1)sweepD=-sweepD;lights.forEach((e,i)=>{const d=Math.abs(i-sweep);e.setAttribute('class','lt'+(d===0?' r':d===1?' r dim':''));});},70);}

    /* ---- each reading from the ear: it follows whatever string is plucked ---- */
    function heard(r){if(dead||!ear)return;
      $('.led.pl').style.opacity=r.level>r.gate?1:.55;
      if(r.onset!==lastOn){if(pv!=null&&cur){hist.push({n:cur,v:pv});if(hist.length>12)hist.shift();}lastOn=r.onset;reads=[];pv=null;cand=null;}
      if(fresh&&performance.now()-fresh>900){m.classList.add('held');$('.okl').classList.remove('on');}
      if(!r.f||r.clar<.7||r.f<30||r.f>3400)return;   /* outside any harp (C1 … G7): a knock, the room */
      if(manual()){if(!sel)return;const c=T.cents(r.f,freq(sel));   /* MANUAL: only the string chosen (heard by any of its overtones) */
        if(Math.abs(c)>70){const j=nearest(r.f);if(j!==sel&&Math.abs(T.cents(r.f,freq(j)))<35){$('.nl').textContent=`THAT'S STRING ${j} · ${nameOf(s[j])}`;return;}}
        if(Math.abs(c)>300)return;$('.nl').textContent=`STRING ${sel} · ${nameOf(s[sel])}`;}
      else{const j=nearest(r.f);   /* AUTO: whatever string is plucked */
        if(j!==cur){cand=cand&&cand.n===j?{n:j,k:cand.k+1}:{n:j,k:1};if(cand.k<(cur?3:2))return;   /* a few readings in a row say it is that string */
          cur=j;reads=[];pv=null;if(ear)ear.hint=freq(j);showNote();}
        cand=null;}
      if(r.t-r.onset<SETTLE)return;   /* a pluck starts sharp and sinks: the ring after its first moment is the string's own note */
      const ct=T.cents(r.f,freq(cur));reads.push(ct);if(reads.length>12)reads.shift();
      /* this pluck: its readings, the odd one out left out, the later ones counting for more (each has heard more of the pluck) */
      const srt=reads.slice().sort((a,b)=>a-b),mid=srt[srt.length>>1];let sw=0,sv=0;reads.forEach((c,i)=>{if(Math.abs(c-mid)<4){sw+=i+1;sv+=(i+1)*c;}});pv=sv/sw;
      /* the last few plucks of this string that agree with this one (within 5 cents: the key was not turned since) steady the reading */
      const prev=hist.filter(h=>h.n===cur).slice(-3).filter(h=>Math.abs(h.v-pv)<5),med=(2*pv+prev.reduce((a,h)=>a+h.v,0))/(2+prev.length);
      const sure=reads.length>=4||reads.length>=2&&prev.length>0;
      fresh=performance.now();m.classList.remove('held');showCents(med);showLights(med);showArrow(med,sure);
      if(!sure)return;if(reads.length>=4){const l4=reads.slice(-4);if(Math.max(...l4)-Math.min(...l4)>3)return;}   /* steady: worth noting */
      note(cur,med);}

    /* ---- the log: this tuning, kept until LOG TUNE writes it to the Mixtape folder ---- */
    function note(n,c){if(!sess.start)sess.start=new Date().toISOString();
      const e=sess.strings[n]||(sess.strings[n]={note:name(n),before:+c.toFixed(1)});e.after=+c.toFixed(1);sess.end=new Date().toISOString();
      const k=Math.abs(c)<=TOL?'ok':'off';if(marks[n]!==k){marks[n]=k;paintBank();}}
    (async()=>{try{const t=host.files&&await host.files.text(LOG),j=t&&JSON.parse(t);
      if(j&&Array.isArray(j.sessions))log.sessions=j.sessions.concat(log.sessions);}catch(e){console.warn('Harp tuner log',e);}loaded=true;})();
    async function loadHarps(){try{const t=host.files&&await host.files.text(HARPS),j=t&&JSON.parse(t);if(j&&Array.isArray(j.harps)){const ok=j.harps.filter(okHarp);if(ok.length)harps=ok;}}
      catch(e){console.warn('Harp tuner harps',e);}useHarp(S.harp,true);}
    async function saveHarps(){try{await host.files.write(HARPS,JSON.stringify({format:1,harps},null,1));}catch(e){host.toast('HARP TUNER 2000: the harps were not saved ('+e.message+')');}}
    function useHarp(nm,quiet){hp=harps.find(h=>h.name===nm)||harps[0];if(S.harp!==hp.name){S.harp=hp.name;if(!quiet)host.changed('harp');}
      s=harp(hp,S.levers);sel=0;ws=0;fitWires(0);hist.length=0;sess=newSess();for(const x in marks)delete marks[x];blank();ui();}
    loadHarps();
    async function weather(){if(S.lat==null)return null;const ac=new AbortController(),t=setTimeout(()=>ac.abort(),6000);
      try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${S.lat}&longitude=${S.lon}&current=temperature_2m,relative_humidity_2m`,{signal:ac.signal});
        const j=await r.json(),c=j&&j.current;return c?{tempC:c.temperature_2m,humidity:c.relative_humidity_2m,place:S.place}:null;}
      catch(e){return null;}finally{clearTimeout(t);}}
    const wtext=w=>w?`${Math.round(w.tempC*9/5+32)}°F (${Math.round(w.tempC)}°C), ${Math.round(w.humidity)}% humidity`:'';
    async function logTune(){const n=Object.keys(sess.strings).length;
      if(!n){host.toast('HARP TUNER 2000: nothing to log yet: POWER on and tune a string or two');return;}
      if(!loaded||!host.files){host.toast('HARP TUNER 2000: the log can\'t be saved here');return;}
      const w=await weather();if(w)sess.weather=w;log.sessions.push(sess);
      try{await host.files.write(LOG,JSON.stringify(log,null,1));}catch(e){log.sessions.pop();host.toast('HARP TUNER 2000: not logged ('+e.message+')');return;}
      const out=Object.values(sess.strings).filter(e=>Math.abs(e.before)>TOL).length;
      host.toast(`HARP TUNER 2000: logged ${n} string${n>1?'s':''}, ${out} of them out of tune`+(w?` · ${wtext(w)}`:''));
      sess=newSess();hist.length=0;for(const k in marks)delete marks[k];ui();if(!logEl.hidden)view(true);}
    async function setTown(t){t=t.trim();if(!t){S.town='';S.place='';S.lat=S.lon=null;host.changed('town');view(true);return;}
      try{const r=await fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&name='+encodeURIComponent(t)),j=await r.json(),p=j&&j.results&&j.results[0];
        if(!p){host.toast('HARP TUNER 2000: no town called "'+t+'" found');return;}
        S.town=t;S.lat=p.latitude;S.lon=p.longitude;S.place=p.name+(p.admin1?', '+p.admin1:'')+(p.country_code?' ('+p.country_code+')':'');host.changed('town');
        const w=await weather();host.toast('HARP TUNER 2000: weather for '+S.place+(w?': '+wtext(w):''));}
      catch(e){host.toast('HARP TUNER 2000: the weather service did not answer');}view(true);}
    function view(keep){if(!logEl.hidden&&!keep){logEl.hidden=true;return;}
      const ses=log.sessions.filter(x=>x.strings&&Object.keys(x.strings).length&&(x.harp||TROUBADOUR.name)===hp.name),per={},esc=M2.esc,N=s.N,bw=672/N;   /* this harp's (the first log was the Troubadour's) */
      for(const x of ses.slice(-30))for(const [n,e] of Object.entries(x.strings))if(e.before!=null)(per[n]=per[n]||[]).push(e.before);
      let h=`<button class="x" data-ctl="1" title="Close">✕</button><h3>HARP TUNER 2000 · TUNING LOG</h3>
        <div class="sub">HARP <select data-ctl="1" class="hsel">${harps.map(x=>`<option${x===hp?' selected':''}>${esc(x.name)}</option>`).join('')}</select> = ${N} STRINGS, ${noteAt(posOf(hp.low))} TO ${noteAt(posOf(hp.low)+N-1)}${harps.length>1?' <button data-ctl="1" class="hdel">FORGET THIS HARP</button>':''}</div>
        <div class="sub">ADD A HARP <input data-ctl="1" class="hn" placeholder="its name" style="width:110px"> <input data-ctl="1" class="hs" type="number" min="2" max="47" value="47" style="width:46px"> STRINGS FROM <select data-ctl="1" class="hl">${[...Array(40)].map((_,p)=>`<option${p===0?' selected':''}>${noteAt(p)}</option>`).join('')}</select> UP <button data-ctl="1" class="hadd">ADD</button></div>
        <div class="sub">WEATHER FOR <input data-ctl="1" class="town" placeholder="your town" value="${esc(S.town||'')}"> <button data-ctl="1" class="set">SET</button> ${S.place?'= '+esc(S.place):'(none: the log is kept without it)'}</div>`;
      if(!ses.length)h+=`<p>NOTHING LOGGED YET. POWER ON, TUNE, THEN PRESS LOG TUNE: HOW FAR OUT EACH STRING WAS IS KEPT HERE, SO YOU CAN SEE WHICH STRINGS DRIFT THE MOST.</p>`;
      else{const rows=[];let bars='';
        for(let i=0;i<N;i++){const n=N-i,v=per[n],x=8+i*bw,bwd=Math.min(12,bw-3);
          if(s[n].L==='C')bars+=`<text x="${x+bwd/2}" y="112" text-anchor="middle" font-size="9">${n}</text>`;   /* the C strings' numbers */
          if(!v){bars+=`<circle cx="${x+bwd/2}" cy="96" r="1.4" fill="#7a8a7a"/>`;continue;}
          const abs=v.reduce((a,b)=>a+Math.abs(b),0)/v.length,mean=v.reduce((a,b)=>a+b,0)/v.length,hh=Math.max(1.5,Math.min(abs,30)/30*82);
          bars+=`<rect x="${x}" y="${96-hh}" width="${bwd}" height="${hh}" fill="${mean>0?'#b02a1e':'#1e3a8a'}"><title>String ${n} (${esc(nameOf(s[n]))}): ${abs.toFixed(1)} cents out on average, ${v.length} time${v.length>1?'s':''}</title></rect>`;
          rows.push({n,abs,mean,count:v.length,out:v.filter(c=>Math.abs(c)>TOL).length});}
        h+=`<div>HOW FAR EACH STRING WAS OUT BEFORE TUNING, ON AVERAGE (CENTS; RED = SHARP, BLUE = FLAT):</div>
          <svg viewBox="0 0 680 116" width="680" height="116" font-family="Courier New,monospace">${[10,20,30].map(c=>`<line x1="0" x2="680" y1="${96-c/30*82}" y2="${96-c/30*82}" stroke="#8aa08a" stroke-width=".5" stroke-dasharray="2 3"/><text x="679" y="${93-c/30*82}" text-anchor="end" font-size="8">${c}</text>`).join('')}
          <line x1="0" x2="680" y1="96" y2="96" stroke="#1d2a1d"/>${bars}</svg>`;
        rows.sort((a,b)=>b.abs-a.abs);
        h+='<div><b>DRIFT THE MOST:</b></div><ol>'+rows.slice(0,5).map(r=>`<li>STRING ${r.n} · ${esc(nameOf(s[r.n]))}: ${r.abs.toFixed(1)} CENTS OUT ON AVERAGE${Math.abs(r.mean)>r.abs/2?' (USUALLY '+(r.mean<0?'FLAT':'SHARP')+')':''}, OUT IN ${r.out} OF ${r.count}</li>`).join('')+'</ol>';
        h+='<div><b>TUNINGS:</b></div><ul>'+ses.slice(-10).reverse().map(x=>{const v=Object.entries(x.strings),out=v.filter(([,e])=>Math.abs(e.before)>TOL).sort((a,b)=>Math.abs(b[1].before)-Math.abs(a[1].before));
          return `<li>${new Date(x.start).toLocaleString(undefined,{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'}).toUpperCase()} · ${v.length} STRINGS, ${out.length} OUT`+
            (out.length?` (WORST ${out.slice(0,3).map(([n,e])=>n+' '+(e.before>0?'+':'')+e.before).join(', ')})`:'')+(x.weather?` · ${wtext(x.weather).toUpperCase()}`:'')+`</li>`;}).join('')+'</ul>';}
      logEl.innerHTML=h;logEl.hidden=false;
      logEl.querySelector('.x').onclick=e=>{e.stopPropagation();logEl.hidden=true;};
      const inp=logEl.querySelector('.town');logEl.querySelector('.set').onclick=e=>{e.stopPropagation();setTown(inp.value);};
      inp.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')setTown(inp.value);});
      /* the harp setup: choose, add, forget */
      const q=c=>logEl.querySelector(c);q('.hsel').onchange=e=>{useHarp(e.target.value);view(true);};
      for(const c of ['.hn','.hs'])q(c).addEventListener('keydown',e=>e.stopPropagation());
      q('.hadd').onclick=e=>{e.stopPropagation();const h={name:q('.hn').value.trim(),strings:Math.round(+q('.hs').value),low:q('.hl').value};
        if(!h.name){host.toast('HARP TUNER 2000: give the harp a name');return;}
        if(harps.some(x=>x.name.toLowerCase()===h.name.toLowerCase())){host.toast('HARP TUNER 2000: there is a harp called that already');return;}
        if(!okHarp(h)){host.toast(`HARP TUNER 2000: ${h.strings} strings from ${h.low} go past G7, a concert harp's top string`);return;}
        harps.push(h);saveHarps();useHarp(h.name);view(true);host.toast(`HARP TUNER 2000: ${h.name}, ${h.strings} strings, ${h.low} to ${noteAt(posOf(h.low)+h.strings-1)}`);};
      const del=q('.hdel');if(del)del.onclick=e=>{e.stopPropagation();if(!confirm('Forget the harp "'+hp.name+'"? (its tunings stay in the log)'))return;
        harps=harps.filter(x=>x!==hp);saveHarps();useHarp(harps[0].name);view(true);};}

    /* ---- the microphone ---- */
    async function listen(on){if(on===!!ear||opening)return;if(!on){stopEar();return;}
      opening=true;$('.nl').textContent='WARMING UP…';m.classList.remove('off');
      try{ctx=host.engine.ctx;let source=null;
        /* in the program: the microphone through Mixtape's helper, which lets a laptop's microphone array pass a string's ring
           (tuner.helperMic); in a browser, or if the helper fails, the page's own microphone */
        if(window.mixtapeMic)try{feed=await T.helperMic();source=feed;feed.onend=m=>{if(!feed)return;feed=null;stopEar();host.toast('HARP TUNER 2000: the microphone stopped'+(m.err?' ('+m.err+')':''));};}
          catch(e){console.warn('Harp tuner: microphone helper',e);feed=null;}
        if(dead){if(feed){feed.stop();feed=null;}return;}
        if(!source){stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false,channelCount:1}});   /* a string, not a phone call: none of the voice cleaning */
          if(dead){stream.getTracks().forEach(t=>t.stop());return;}
          source=src=ctx.createMediaStreamSource(stream);stream.getAudioTracks()[0].onended=()=>{stopEar();host.toast('HARP TUNER 2000: the microphone went away');};}
        ear=T.ear(ctx,source,heard);ear.pause(!host.visible);fresh=0;lastOn=-1;}
      catch(e){host.toast('HARP TUNER 2000: no microphone ('+(e.message||e.name)+')');stopEar();}
      opening=false;blank();idle(!!ear);ui();}
    function stopEar(){if(ear)ear.stop();ear=null;if(src)try{src.disconnect();}catch(e){}src=null;if(feed){const f=feed;feed=null;f.stop();}
      if(stream)stream.getTracks().forEach(t=>{t.onended=null;t.stop();});stream=null;idle(false);blank();ui();
      if(Object.keys(sess.strings).length&&!dead)host.toast('HARP TUNER 2000: this tuning is not logged yet: press LOG TUNE to keep it');}
    function tone(n){const c=host.engine.ctx;M2.harpSound.play(c,host.engine.master,freq(n),{files:host.files,len:3,vel:1,bright:true});   /* the concert harp's own note (harp-sound.js), faded out after 3 s while the ear is deaf, so it never tunes to itself */
      if(ear)ear.deaf(3.6);host.engine.busy(host.uid,true);setTimeout(()=>host.engine.busy(host.uid,false),3000);   /* a little longer than the note: the first one has to load */
      const e=wires[wireOf(n)];if(e){e.classList.add('hot');setTimeout(()=>paintBank(),700);}}

    /* ---- the controls ---- */
    /* the A = knob: a click steps on (round again after 444), scrolling turns it either way */
    function turn(d){const i=Math.max(0,Math.min(REFS.length-1,REFS.indexOf(S.ref)+d));if(REFS[i]===S.ref)return;S.ref=REFS[i];host.changed('ref');fresh0();
      host.toast('HARP TUNER 2000: A = '+S.ref+' Hz'+(S.ref===440?' (the usual)':''));}
    $('.knob').addEventListener('wheel',e=>{e.preventDefault();e.stopPropagation();turn(e.deltaY<0?1:-1);},{passive:false});
    const fresh0=()=>{hist.length=0;sess=newSess();for(const x in marks)delete marks[x];blank();ui();};
    /* MANUAL: the string to tune (click it again to hear its note) */
    function choose(n){sel=n;reads=[];pv=null;hist.length=0;blank();ui();}
    function setMode(md){S.mode=md;host.changed('mode');if(md==='manual'&&!sel)sel=cur||(s.find(x=>x&&x.mid)||s[Math.ceil(s.N/2)]).n;   /* MANUAL starts on the string last heard, or middle C */reads=[];pv=null;cand=null;blank();ui();
      host.toast(md==='manual'?'HARP TUNER 2000: MANUAL: click a string to tune it':'HARP TUNER 2000: AUTO: pluck any string');}
    m.addEventListener('click',e=>{const b=e.target.closest('.bt'),pk=e.target.closest('.pick');
      if(pk){const n=stringAt(+pk.dataset.i);if(!n)return;if(manual()&&n!==sel)choose(n);else tone(n);return;}if(!b)return;const k=b.dataset.k;
      if(k==='power')listen(!ear);
      else if(k==='mode')setMode(manual()?'auto':'manual');
      else if(k==='log')logTune();
      else if(k==='view')view();
      else if(k==='ref')turn(REFS.indexOf(S.ref)+1>=REFS.length?-REFS.length+1:1);
      else if(k==='levers'){S.levers=S.levers==='up'?'down':'up';s=harp(hp,S.levers);host.changed('levers');fresh0();
        host.toast(S.levers==='up'?'HARP TUNER 2000: E, A and B levers up while tuning: the strings tuned to the key of C':'HARP TUNER 2000: all levers down while tuning: E, A and B tuned flat (E♭ major)');}});
    blank();ui();
    return {
      visible(on){if(ear)ear.pause(!on);},
      destroy(){dead=true;stopEar();idle(false);}};}});
})();
