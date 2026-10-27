/* =====================================================================
   AUDIO - 100% original, procedurally generated with the Web Audio API.
   Buses: music / sfx / ambient (+master). Positional (3D) ambience via PannerNode.
   ===================================================================== */
let AC,mg,musG,sfxG,ambG,comp,noiseBuf,musicOn=true,nextT=0,idx=0,cur='menu',dayAlt=0;
const mtof=m=>440*2**((m-69)/12);
const lastSfx={};let voicesBusy=0;
const rnd=(a,b)=>a+Math.random()*(b-a),pickA=a=>a[Math.floor(Math.random()*a.length)];
const SONGS={
 menu:{bpm:84,drums:0,ch:[[60,64,67],[55,59,62],[57,60,64],[53,57,60]],
  mel:[[76,0,0,79,0,0,76,0],[74,0,0,79,0,0,83,0],[72,0,0,76,0,0,81,0],[77,0,0,81,0,0,72,0],[79,0,76,0,0,74,76,0],[83,0,79,0,0,74,0,0],[81,0,76,0,72,0,76,0],[77,0,0,72,0,0,0,0]]},
 game:{bpm:108,drums:1,ch:[[60,64,67],[55,59,62],[57,60,64],[53,57,60]],
  mel:[[76,0,79,0,84,0,79,76],[74,0,79,0,83,0,79,74],[72,0,76,0,81,0,76,72],[72,0,77,0,81,0,77,72],[79,0,76,79,84,0,88,84],[83,0,79,74,79,0,83,0],[81,0,76,0,72,76,81,0],[77,0,81,84,81,0,77,72]]},
 game2:{bpm:96,drums:1,ch:[[62,65,69],[58,62,65],[60,64,67],[57,60,64]],
  mel:[[74,0,0,77,0,81,0,77],[74,0,0,76,0,79,0,0],[72,0,76,0,79,0,76,0],[69,0,72,0,76,0,72,69],[77,0,74,0,81,0,77,0],[77,0,74,0,79,0,76,0],[76,0,72,0,79,0,84,0],[81,0,77,0,74,0,0,0]]},
 night:{bpm:66,drums:0,ch:[[57,60,64],[53,57,60],[55,59,62],[52,55,59]],
  mel:[[0,0,0,0,76,0,0,0],[0,0,0,0,72,0,0,0],[0,0,79,0,0,0,0,0],[0,0,0,0,76,0,72,0],[81,0,0,0,0,0,0,0],[77,0,0,0,0,0,76,0],[0,0,74,0,0,0,0,0],[0,0,0,0,71,0,0,0]]},
 home:{bpm:58,drums:0,ch:[[60,64,67],[57,60,64],[53,57,60],[55,59,62]],
  mel:[[0,0,0,0,0,0,0,0],[0,0,84,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,79,0,0,0],[0,0,0,0,0,0,0,0],[0,0,81,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,76,0,0,0]]}};
const volOf=id=>{const e=document.getElementById(id);return e?e.value/100:.6};
function setVol(){if(!AC)return;const t=AC.currentTime;mg.gain.setTargetAtTime(volOf('s1'),t,.05);musG.gain.setTargetAtTime(musicOn?volOf('s2')*.6:0,t,.1);sfxG.gain.setTargetAtTime(volOf('s3'),t,.05);ambG.gain.setTargetAtTime(volOf('s6')*.9,t,.1)}
function tone(f,t,d,type,v,dest,att){const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+(att||.02));g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(dest||sfxG);o.start(t);o.stop(t+d+.05)}
function nz(t,d,f,v,type,dest,q){const s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();s.buffer=noiseBuf;fl.type=type||'bandpass';fl.frequency.value=f;if(q)fl.Q.value=q;
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(fl);fl.connect(g);g.connect(dest||sfxG);s.start(t,Math.random()*.4);s.stop(t+d+.02)}
function sweep(f1,f2,t,d,type,v,dest){const o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(f2,t+d);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(dest||sfxG);o.start(t);o.stop(t+d+.02)}
function kick(t,v){sweep(140,42,t,.2,'sine',v,musG)}
function sched(){if(!AC||AC.state!='running')return;const s=SONGS[cur],e=60/s.bpm/2;if(nextT<AC.currentTime)nextT=AC.currentTime+.05;
  while(nextT<AC.currentTime+.4){const bar=Math.floor(idx/8)%8,st=idx%8,c=s.ch[bar%4];
    if(st==0)c.forEach(m=>tone(mtof(m),nextT,e*8,'triangle',cur=='home'?.03:.035,musG,.5));
    if(st%4==0||(s.drums&&st==6))tone(mtof(c[0]-12),nextT,e*3,'triangle',cur=='night'||cur=='home'?.12:.2,musG,.02);
    tone(mtof(c[[0,1,2,1,2,1,2,1][st]]+12),nextT,e*1.6,'sine',cur=='home'||cur=='night'?.03:.05,musG);
    const mn=s.mel[bar][st];if(mn)tone(mtof(mn),nextT,e*3,cur=='home'?'sine':'triangle',cur=='home'?.07:.1,musG,.03);
    if(s.drums){if(st%4==0)kick(nextT,.4);if(st==2||st==6)nz(nextT,.12,1800,.1,'bandpass',musG);if(st%2==1)nz(nextT,.04,7000,.04,'highpass',musG)}
    nextT+=e;idx++;
    if(idx%64==0&&(cur=='game'||cur=='game2')&&Math.random()<.7){cur=cur=='game'?'game2':'game'}}}
function setSong(s){if(cur==s)return;cur=s;idx=0}

/* ---------- init ---------- */
function mkPanner(x,y,z,ref,roll){const p=AC.createPanner();p.panningModel='equalpower';p.distanceModel='inverse';p.refDistance=ref||4;p.rolloffFactor=roll||1.3;p.maxDistance=300;setPos(p,x,y,z);return p}
function setPos(p,x,y,z){if(p.positionX){p.positionX.value=x;p.positionY.value=y;p.positionZ.value=z}else p.setPosition(x,y,z)}
function loopNoise(dest,type,f,q,v){const s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();s.buffer=noiseBuf;s.loop=true;fl.type=type;fl.frequency.value=f;fl.Q.value=q||.7;g.gain.value=v;s.connect(fl);fl.connect(g);g.connect(dest);s.start(0,Math.random());return {g,fl,s}}
function lfo(param,rate,depth){const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=rate;g.gain.value=depth;o.connect(g);g.connect(param);o.start();return o}
function murmur(dest,v){const a=loopNoise(dest,'bandpass',650,.9,v),b=loopNoise(dest,'bandpass',1500,1.2,v*.5);lfo(a.g.gain,rnd(.25,.5),v*.7);lfo(b.g.gain,rnd(.4,.8),v*.4);return a}
const Z={};let engT=null,drv=null,roadLP=null,windL=null;
function audioInit(){
  if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;try{AC=new C()}catch(e){return}
    mg=AC.createGain();musG=AC.createGain();sfxG=AC.createGain();ambG=AC.createGain();comp=AC.createDynamicsCompressor();
    comp.threshold.value=-18;comp.ratio.value=6;comp.attack.value=.005;comp.release.value=.25;
    musG.connect(mg);sfxG.connect(mg);ambG.connect(mg);mg.connect(comp);comp.connect(AC.destination);
    const dly=AC.createDelay(1);dly.delayTime.value=.33;const fb=AC.createGain();fb.gain.value=.25;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2400;
    const wet=AC.createGain();wet.gain.value=.25;musG.connect(dly);dly.connect(lp);lp.connect(fb);fb.connect(dly);lp.connect(wet);wet.connect(mg);
    noiseBuf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    setInterval(sched,100);setInterval(ambTick,150);buildAmbient()}
  if(AC.state!='running')AC.resume();setVol()}
['pointerdown','keydown','touchstart'].forEach(ev=>addEventListener(ev,audioInit,{passive:true}));
['s1','s2','s3','s6'].forEach(i=>{const e=document.getElementById(i);if(e)e.oninput=()=>{setVol();if(typeof saveSettings=='function')saveSettings()}});

/* ---------- ambient zones (positional) ---------- */
function zone(name,x,y,z,o){o=o||{};const inp=AC.createGain();inp.gain.value=0;const lpf=AC.createBiquadFilter();lpf.type='lowpass';lpf.frequency.value=o.lp||8000;
  const p=mkPanner(x,y,z,o.ref,o.roll);inp.connect(lpf);lpf.connect(p);p.connect(ambG);
  return Z[name]={name,x,y,z,inp,lpf,p,next:0,ev:o.ev||null,lvl:0,range:o.range||55}}
function buildAmbient(){
  // non-positional wind bed
  const wg=AC.createGain();wg.gain.value=0;wg.connect(ambG);const w=loopNoise(wg,'bandpass',420,.4,.5);lfo(w.g.gain,.07,.3);windL=wg;
  // road rumble + traffic (tracks the player along the road)
  zone('road',0,0,38,{ref:6,roll:1.1,ev:t=>{},lp:2500});const r=loopNoise(Z.road.inp,'lowpass',260,.5,.7);
  // courtyard / court
  zone('court',0,1,-6,{ref:5,ev:t=>{if(Z.court.on){const bt=AC.currentTime;if(Math.random()<.7)bounceSnd(Z.court.inp,bt,.5)}Z.court.next=t+rnd(.7,1.4)}});
  zone('canteen',-26.5,1.5,-6,{ref:3,roll:1.6,lp:3500,ev:t=>{const bt=AC.currentTime,r=Math.random();
    if(r<.45)tone(rnd(2200,3400),bt,.12,'sine',.05,Z.canteen.inp);else if(r<.7){nz(bt,.05,220,.25,'lowpass',Z.canteen.inp)}else{tone(rnd(1800,2600),bt,.08,'triangle',.04,Z.canteen.inp);tone(rnd(2600,3500),bt+.05,.08,'triangle',.03,Z.canteen.inp)}Z.canteen.next=t+rnd(.5,2)}});
  murmur(Z.canteen.inp,.5);loopNoise(Z.canteen.inp,'highpass',5000,.5,.04);
  zone('lab',0,13,-22,{ref:3,roll:1.6,ev:t=>{const bt=AC.currentTime,r=Math.random();
    if(r<.65){for(let i=0;i<Math.floor(rnd(3,9));i++)nz(bt+i*rnd(.06,.14),.025,rnd(2500,4500),.14,'highpass',Z.lab.inp)}
    else if(r<.85)nz(bt,.02,1800,.22,'bandpass',Z.lab.inp);else if(r<.93){tone(1320,bt,.12,'sine',.06,Z.lab.inp);tone(1760,bt+.1,.15,'sine',.05,Z.lab.inp)}
    else{for(let i=0;i<10;i++)nz(bt+i*.09,.06,rnd(900,1300),.1,'bandpass',Z.lab.inp,3);nz(bt+.95,.5,500,.06,'lowpass',Z.lab.inp)}
    Z.lab.next=t+rnd(.3,1.2)}});
  zone('class',0,2,0,{ref:2.5,roll:1.8,lp:3000,ev:t=>{const bt=AC.currentTime,r=Math.random();
    if(r<.4)voice(Z.class.inp,bt,rnd(1,2.6),Math.random()<.5?118:205,.07);
    else if(r<.55){nz(bt,.35,250,.25,'lowpass',Z.class.inp);}else if(r<.75)nz(bt,.18,3500,.1,'bandpass',Z.class.inp,.8);else if(r<.85){nz(bt,.04,900,.2,'bandpass',Z.class.inp,3)}
    Z.class.next=t+rnd(1.2,3.5)}});murmur(Z.class.inp,.22);
  zone('hall',0,2,0,{ref:3,roll:1.5,lp:3500,ev:t=>{if(Math.random()<.5)nz(AC.currentTime,.07,rnd(300,420),.18,'lowpass',Z.hall.inp);Z.hall.next=t+rnd(.4,.9)}});murmur(Z.hall.inp,.4);
  zone('library',-26.5,1.5,-12.7,{ref:2.5,roll:2,lp:2500,ev:t=>{const bt=AC.currentTime;if(Math.random()<.5)nz(bt,.25,3200,.08,'bandpass',Z.library.inp,.7);else if(Math.random()<.5)voice(Z.library.inp,bt,.5,150,.015);Z.library.next=t+rnd(2,5)}});
  zone('bedroom',6,1.5,58,{ref:4,roll:1,lp:1800,ev:t=>{const bt=AC.currentTime;nz(bt,.03,2000,.1,'bandpass',Z.bedroom.inp,5);tone(1000,bt+.5,.02,'square',.01,Z.bedroom.inp);Z.bedroom.next=t+1}});
  loopNoise(Z.bedroom.inp,'lowpass',180,.5,.18);
  // birds / crickets (positional near trees)
  zone('birds',-17,4,-12,{ref:8,roll:.8,ev:t=>{if(Z.birds.mode=='day'){chirp(Z.birds.inp);Z.birds.p&&setPos(Z.birds.p,pickA([-17,17,-24,24,0,-36,36]),rnd(3,8),pickA([-12,7,23,22,-5]))}else if(Z.birds.mode=='night'){cricket(Z.birds.inp)}Z.birds.next=t+rnd(1.2,4)}});
  // traffic engine (follows nearest real vehicle) + passing noise
  const el=AC.createBiquadFilter();el.type='lowpass';el.frequency.value=380;const eg=AC.createGain();eg.gain.value=0;const p=mkPanner(0,1,38,5,1.2);
  const o1=AC.createOscillator(),o2=AC.createOscillator();o1.type='sawtooth';o2.type='square';o1.frequency.value=48;o2.frequency.value=72;const g2=AC.createGain();g2.gain.value=.4;
  o1.connect(el);o2.connect(g2);g2.connect(el);el.connect(eg);eg.connect(p);p.connect(ambG);o1.start();o2.start();engT={o1,o2,eg,p,el};
  // player vehicle engine
  const dg=AC.createGain();dg.gain.value=0;const dl=AC.createBiquadFilter();dl.type='lowpass';dl.frequency.value=500;const d1=AC.createOscillator(),d2=AC.createOscillator(),d3=AC.createOscillator();
  d1.type='sawtooth';d2.type='square';d3.type='sawtooth';d1.frequency.value=40;d2.frequency.value=20;d3.frequency.value=80;const dgg=AC.createGain();dgg.gain.value=.4;
  d1.connect(dl);d2.connect(dl);d3.connect(dgg);dgg.connect(dl);dl.connect(dg);dg.connect(sfxG);d1.start();d2.start();d3.start();drv={d1,d2,d3,dg,dl};
  const tg=AC.createGain();tg.gain.value=0;const tn=loopNoise(tg,'bandpass',900,.8,.6);tg.connect(sfxG);drv.tire=tg}
function chirp(dest){const n=AC.currentTime,b=rnd(2200,3700),k=Math.floor(rnd(2,5));for(let i=0;i<k;i++){const t=n+i*.12;sweep(b,b*1.35,t,.08,'sine',.07,dest)}}
function cricket(dest){const n=AC.currentTime;for(let i=0;i<4;i++){const o=AC.createOscillator(),g=AC.createGain(),t=n+i*.1;o.frequency.value=4300;o.connect(g);g.connect(dest);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.025,t+.02);g.gain.linearRampToValueAtTime(0,t+.07);o.start(t);o.stop(t+.09)}}
function bounceSnd(dest,t,v){sweep(180,90,t,.12,'sine',v*.55,dest);nz(t,.05,500,v*.25,'lowpass',dest)}
function voice(dest,t,dur,f0,vol){let tt=t;const end=t+dur;
  while(tt<end){const sl=rnd(.07,.19),o=AC.createOscillator(),g=AC.createGain(),a=AC.createBiquadFilter(),b=AC.createBiquadFilter();
    o.type='sawtooth';o.frequency.setValueAtTime(f0*rnd(.9,1.15),tt);o.frequency.linearRampToValueAtTime(f0*rnd(.85,1.2),tt+sl);
    a.type='bandpass';a.frequency.value=pickA([450,600,750,400]);a.Q.value=5;b.type='bandpass';b.frequency.value=pickA([1100,1500,1900,2200]);b.Q.value=6;
    g.gain.setValueAtTime(0,tt);g.gain.linearRampToValueAtTime(vol,tt+.025);g.gain.linearRampToValueAtTime(vol*.7,tt+sl*.7);g.gain.linearRampToValueAtTime(0,tt+sl);
    o.connect(a);o.connect(b);a.connect(g);b.connect(g);g.connect(dest);o.start(tt);o.stop(tt+sl+.02);
    tt+=sl+(Math.random()<.18?rnd(.2,.45):rnd(.015,.07))}}
/* audio context supplied by the game each frame */
const AUC={x:0,y:0,z:0,fx:0,fz:-1,indoor:false,room:'',hour:9,night:false,classTime:false,floor:0,inHouse:false,vx:0,vz:38,vsp:0,vdist:99,driving:false};
let ambT=0;
function ambTick(){if(!AC||AC.state!='running'||typeof state=='undefined'||(state!='play'&&state!='dlg'&&state!='menu'&&state!='sit'))return;const t=AC.currentTime;
  for(const k in Z){const z=Z[k];if(z.ev&&z.on&&t>=z.next){try{z.ev(t)}catch(e){}if(z.next<t)z.next=t+1}}}
function audioFrame(dt){if(!AC||!AC.listener||typeof state=='undefined')return;const u=AUC,t=AC.currentTime;
  const L=AC.listener;if(L.positionX){L.positionX.value=u.x;L.positionY.value=u.y+1.5;L.positionZ.value=u.z;L.forwardX.value=u.fx;L.forwardY.value=0;L.forwardZ.value=u.fz;L.upX.value=0;L.upY.value=1;L.upZ.value=0}
  else if(L.setPosition){L.setPosition(u.x,u.y+1.5,u.z);L.setOrientation(u.fx,0,u.fz,0,1,0)}
  const g=(z,v)=>{if(Z[z])Z[z].inp.gain.setTargetAtTime(v,t,.35)},day=!u.night,out=!u.indoor;
  const inGame=state=='play'||state=='dlg'||state=='sit'||state=='menu'||state=='pause';
  if(!inGame){for(const k in Z)g(k,0);windL&&windL.gain.setTargetAtTime(0,t,.3);return}
  const n=Math.hypot;
  // road follows the player along x
  Z.road.p&&setPos(Z.road.p,Math.max(-60,Math.min(60,u.x)),0.5,38);g('road',(out?.5:.14)*(u.inHouse?.7:1));Z.road.lpf.frequency.setTargetAtTime(out?2600:500,t,.3);
  windL&&windL.gain.setTargetAtTime(out&&!u.inHouse?.22:.04,t,.5);
  // class / hall zones follow the nearest classroom door or corridor of the current floor
  const cz=u.classZ||{x:0,y:u.floor*4+2,z:-17.5};Z.class.p&&setPos(Z.class.p,cz.x,cz.y,cz.z);Z.hall.p&&setPos(Z.hall.p,cz.x,cz.y,cz.z);
  g('class',u.classTime&&u.floor>0?.9:0);g('hall',!u.classTime&&u.floor>=0&&!u.inHouse?.5:(u.floor>0?.2:0));
  g('canteen',.95);g('lab',.9);g('library',.8);g('court',day?.9:.3);g('bedroom',u.inHouse?.95:0);
  g('birds',day&&out?.85:(!day&&out?.4:.1));Z.birds.mode=day?'day':'night';
  for(const k in Z){const z=Z[k];z.on=(n(u.x-z.x,u.z-z.z)<z.range||k=='road'||k=='birds')&&(!(k=='bedroom')||u.inHouse)}
  // basketball court only audible/active when ball players play
  Z.court.on=Z.court.on&&!!u.courtPlay;
  // traffic engine from the nearest real vehicle
  if(engT){const near=u.vdist<45;engT.eg.gain.setTargetAtTime(near&&!u.indoor?Math.min(.35,.5/(1+u.vdist*.1)):near?.05:0,t,.12);engT.o1.frequency.setTargetAtTime(44+u.vsp*5,t,.2);engT.o2.frequency.setTargetAtTime(66+u.vsp*7,t,.2);setPos(engT.p,u.vx,1,u.vz)}
  drv&&drv.dg.gain.setTargetAtTime(u.driving?.14:0,t,.08)}
function engineStart(){if(!AC)return;const t=AC.currentTime;
  for(let i=0;i<5;i++)nz(t+i*.11,.08,300,.32,'lowpass');sweep(70,190,t,.55,'sawtooth',.12,sfxG);sweep(140,60,t+.55,.35,'sawtooth',.14,sfxG);setTimeout(()=>{},1)}
function engineUpdate(speed,thr,on){if(!AC||!drv)return;const t=AC.currentTime,a=Math.abs(speed);
  drv.d1.frequency.setTargetAtTime(38+a*6.5+thr*14,t,.08);drv.d2.frequency.setTargetAtTime(19+a*3.2,t,.08);drv.d3.frequency.setTargetAtTime(76+a*13,t,.08);
  drv.dl.frequency.setTargetAtTime(380+a*40+thr*250,t,.1);drv.dg.gain.setTargetAtTime(on?.1+thr*.06+Math.min(.05,a*.004):0,t,.08);
  drv.tire.gain.setTargetAtTime(on&&a>9?Math.min(.05,(a-9)*.01):0,t,.1)}

/* ---------- SFX ---------- */
function sfx(t,pos){if(!AC||AC.state!='running')return;const now=AC.currentTime,gap={step:.12,stepI:.12,stepW:.12,talk:.05,click:.04,type:.03}[t]||.06;
  if(lastSfx[t]&&now-lastSfx[t]<gap)return;lastSfx[t]=now;if(voicesBusy>16)return;voicesBusy++;setTimeout(()=>voicesBusy--,450);
  let d=sfxG,n=now;if(pos&&AC.createPanner){const p=mkPanner(pos.x,pos.y||1,pos.z,4,1.4);p.connect(sfxG);d=p;setTimeout(()=>{try{p.disconnect()}catch(e){}},3000)}
  const T=(f,tt,dd,ty,v,at)=>tone(f,tt,dd,ty,v,d,at),N=(tt,dd,f,v,ty,q)=>nz(tt,dd,f,v,ty,d,q);
  switch(t){
   case 'click':T(700,n,.08,'triangle',.2);T(1050,n+.04,.07,'triangle',.12);break;
   case 'door':N(n,.3,500,.28,'bandpass');T(130,n,.2,'square',.07);T(80,n+.05,.2,'sine',.22);break;
   case 'doorclose':N(n,.12,300,.3,'lowpass');T(70,n,.15,'sine',.3);N(n+.1,.05,1200,.1,'bandpass');break;
   case 'step':N(n,.07,380,.18,'lowpass');break;
   case 'stepI':N(n,.04,1800,.1,'bandpass');T(150+Math.random()*30,n,.05,'sine',.1,.005);break;
   case 'stepW':N(n,.06,700,.14,'lowpass');T(110,n,.06,'sine',.1,.004);break;
   case 'stepG':N(n,.09,2500,.1,'highpass');N(n,.06,500,.08,'lowpass');break;
   case 'talk':T(rnd(300,520),n,.08,'triangle',.06);break;
   case 'ok':[523,659,784,1047].forEach((f,i)=>T(f,n+i*.09,.25,'triangle',.2));break;
   case 'coin':T(1568,n,.12,'square',.07);T(2093,n+.07,.35,'square',.07);break;
   case 'notify':T(880,n,.15,'sine',.16);T(1175,n+.12,.22,'sine',.14);break;
   case 'levelup':[523,659,784,1047,1319,1568].forEach((f,i)=>T(f,n+i*.07,.3,'triangle',.16));break;
   case 'mission':[392,523,659,784,659,784,1047].forEach((f,i)=>{T(f,n+i*.11,.32,'triangle',.18);T(f*2,n+i*.11,.2,'sine',.05)});break;
   case 'err':T(200,n,.18,'square',.1);T(150,n+.12,.24,'square',.1);break;
   case 'jump':sweep(260,520,n,.15,'sine',.12,d);break;
   case 'land':N(n,.1,250,.28,'lowpass');break;
   case 'horn':T(420,n,.4,'square',.09,.01);T(530,n,.4,'square',.09,.01);break;
   case 'bell':[880,1109].forEach((f,i)=>{T(f,n+i*.5,1.2,'sine',.2);T(f*2.01,n+i*.5,.6,'sine',.06)});break;
   case 'chair':N(n,.28,260,.25,'lowpass');N(n+.05,.1,1200,.07,'bandpass',2);break;
   case 'page':N(n,.22,3200,.14,'bandpass',.7);N(n+.07,.14,2600,.1,'bandpass',.7);break;
   case 'type':for(let i=0;i<4;i++)N(n+i*.07,.02,rnd(2500,4000),.13,'highpass');break;
   case 'mouse':N(n,.015,1800,.2,'bandpass',3);break;
   case 'pc':T(660,n,.1,'sine',.1);T(990,n+.1,.2,'sine',.1);break;
   case 'bounce':bounceSnd(d,n,.8);break;
   case 'swish':N(n,.28,5200,.2,'bandpass',.6);N(n+.02,.2,3000,.12,'highpass');break;
   case 'rim':T(780,n,.35,'triangle',.14);T(1180,n,.3,'sine',.1);N(n,.05,2500,.15,'bandpass');break;
   case 'board':T(210,n,.12,'triangle',.18);N(n,.08,900,.12,'bandpass');break;
   case 'pass':N(n,.1,400,.2,'lowpass');break;
   case 'eat':for(let i=0;i<4;i++)N(n+i*.19,.07,rnd(900,1600),.14,'bandpass',2);break;
   case 'drink':for(let i=0;i<3;i++)N(n+i*.22,.12,rnd(500,800),.1,'lowpass');break;
   case 'pay':T(2500,n,.08,'sine',.08);T(3300,n+.05,.1,'sine',.06);N(n+.1,.1,1800,.1,'bandpass',3);break;
   case 'brake':N(n,.5,2000,.15,'bandpass',3);break;
   case 'bump':N(n,.2,200,.45,'lowpass');T(90,n,.2,'sine',.3);break;
   case 'bed':N(n,.4,300,.18,'lowpass');break;
   case 'rooster':sweep(500,900,n,.2,'sawtooth',.04,d);sweep(900,600,n+.25,.35,'sawtooth',.04,d);break;
   case 'wake':[392,494,587,784].forEach((f,i)=>T(f,n+i*.25,1.2,'sine',.08,.2));break;
   case 'sleep':[523,392,330,262].forEach((f,i)=>T(f,n+i*.4,1.6,'sine',.07,.4));break;
   case 'ride':for(let i=0;i<14;i++)N(n+i*.18,.1,rnd(180,260),.12,'lowpass');sweep(70,110,n,2.6,'sawtooth',.06,d);break;
   case 'start':engineStart();break;
   case 'print':for(let i=0;i<8;i++)N(n+i*.09,.06,rnd(900,1300),.1,'bandpass',3);break;
  }}
document.addEventListener('click',e=>{if(e.target.closest('button,.chip,.sw span,.tb'))sfx('click')});
function talkSound(female){if(!AC||AC.state!='running')return;voice(sfxG,AC.currentTime,rnd(.35,.8),female?210:120,.05)}
function sleepAudio(on){if(!AC)return;if(on){setSong('home');sfx('sleep')}}
