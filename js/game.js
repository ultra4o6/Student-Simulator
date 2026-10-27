/* =====================================================================
   GAME: start/reset, input, interaction, main loop, camera
   ===================================================================== */
let started=false,last=0,camYaw=0,camPitch=.35,grounded=true,stepT=0,hornT=0,shake=0,lastFloor=0,beacon=null,lockReqT=0,saveT=0,songT=0,collapsing=false;
const P={x:0,y:0,z:29,vy:0},keys={};
const dist=(ax,az,bx,bz)=>Math.hypot(ax-bx,az-bz);
const fl=()=>Math.max(0,Math.min(3,Math.floor((P.y+.5)/H)));
const curRoom=()=>{const f=fl();return rooms.find(r=>r.f==f&&P.x>r.x1&&P.x<r.x2&&P.z>r.z1&&P.z<r.z2)};
function locName(){const f=fl(),r=curRoom();if(r)return r.n+(r.house?'':' - '+FLN[f]);
  if(P.z>46)return 'Boarding House Street';if(P.z>30)return 'Main Road';if(P.z>26)return 'Sidewalk';if(P.z>20&&f==0)return 'School Gate / Yard';
  if(P.x>-20&&P.x<20&&P.z>-16&&P.z<10&&f==0)return 'School Courtyard';
  if(P.x>-30&&P.x<30&&P.z>-26&&P.z<20)return 'Main Building - '+FLN[f];return 'School Grounds'}
const wantLock=()=>{if(isTouch||!renderer||document.pointerLockElement===renderer.domElement)return;lockReqT=performance.now();try{const p=renderer.domElement.requestPointerLock();p&&p.catch&&p.catch(()=>{})}catch(e){}};
/* ---------- start / reset ---------- */
function resetWorldState(){if(beacon)beacon.visible=false;try{if(DRV.on){DRV.v=0;myTrike.remove(player);scene.add(player);DRV.on=false;document.body.classList.remove('driving');$('vc').classList.add('hid');AUC.driving=false}}catch(e){}
  if(seatCur){seatCur.taken=null;seatCur=null}lesson=null;SPORT.mode=null;$('timer').classList.add('hid');hideOvl();closeDlg();$('menu').classList.add('hid');$('pause').classList.add('hid');
  if(BALLS.player){BALLS.player.rest(-1.2,-5);hasBall=false;AIM.on=false;$('meter').classList.add('hid')}walletMesh&&(walletMesh.visible=false);fadeBusy=false;$('fade').classList.add('hid');$('fade').classList.remove('on');collapsing=false;
  doors.forEach(d=>{d.open=false;d.t=0;d.g.rotation.y=0;d.col.off=false});seats.forEach(s=>s.taken=null)}
function startGame(s){
  $('select').classList.add('hid');$('settings').classList.add('hid');
  if(!renderer){renderer=new THREE.WebGLRenderer({antialias:!isTouch});renderer.setSize(innerWidth,innerHeight);$('game').appendChild(renderer.domElement);camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,400);applyGraphics($('s5').value)}
  pname=($('nm').value||'Student').trim();applySave(s);
  if(!built){buildWorld();enableShadows($('s5').value)}else resetWorldState();
  S.flags.started=0;initMissions(!s||!Object.keys(S.miss).length);
  if(player)scene.remove(player);player=makeChar(playerOpts(),pname,scene);
  if(renderer.shadowMap.enabled)player.traverse(o=>{if(o.isMesh)o.castShadow=true});
  const sx=s&&isFinite(s.x)?s.x:0,sz=s&&isFinite(s.z)?s.z:29;P.x=sx;P.z=sz;P.y=s&&s.y?s.y:0;P.vy=0;camYaw=0;camPitch=.35;lastFloor=fl();grounded=true;
  if(blocked(P.x,P.z,P.y,.4)){const q=snapFree(Math.round(P.y/H),P.x,P.z);P.x=q[0];P.z=q[1]}
  player.position.set(P.x,P.y,P.z);snapNpcs();applyDayNight(S.clock,true);S.flags.started=1;
  $('hn').textContent=pname;$('cls').textContent='Class: '+COURSES[O.course].cls;drawAvatar($('av'),playerOpts());
  $('hud').classList.remove('hid');if(isTouch)$('touch').classList.remove('hid');document.body.classList.add('playing');document.body.classList.remove('driving');$('vc').classList.add('hid');
  state='play';audioInit();setSong(isNight()?'night':'game');setTimeout(()=>sfx('bell'),400);lockLandscape();wantLock();
  last=performance.now();onResize();hudT=1;hudUpdate(1);
  if(!started){started=true;loop()}
  setTimeout(()=>notify('👋 Welcome to NEMCO, '+pname+'!','gold',isTouch?'Joystick to move · E to interact':'WASD move · Shift run · E interact · J missions · P pause',5000),700);
  if(S.energy<=50)checkTired();saveGame()}
/* ---------- input ---------- */
const ACTIVE=()=>state=='play'||state=='sit'||state=='drive';
addEventListener('keydown',e=>{const c=e.code;if(state=='load'||state=='select'){return}
  if(e.target&&/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)&&c!='Escape')return;
  keys[c]=1;if(c=='Space'||c.startsWith('Arrow')||c=='Tab')e.preventDefault();if(e.repeat)return;
  if(c=='Escape'){if(!$('settings').classList.contains('hid')){$('sclose').onclick();return}
    if(state=='pause')return resume();if(state=='menu'&&!ovlOpen)return closeMenu();if(state=='dlg'&&!dlgChoices)return closeDlg();if(ACTIVE())return pause();return}
  if(state=='dlg'){if(c=='KeyE'||c=='Space'||c=='Enter')advanceDlg();else if(/^(Digit|Numpad)[1-6]$/.test(c))pickChoice(+c.slice(-1)-1);return}
  if(state=='menu'&&!ovlOpen){if(c=='KeyI'||c=='KeyJ'||c=='Tab'||c=='KeyP')closeMenu();return}
  if(!ACTIVE())return;
  if(c=='KeyE')interact();else if(c=='KeyJ')openMenu('missions');else if(c=='KeyI')openMenu('inventory');else if(c=='Tab')openMenu('status');else if(c=='KeyF')openMenu('friends');else if(c=='KeyP')pause();
  else if(c=='KeyM'&&typeof AC!='undefined'&&AC){musicOn=!musicOn;setVol();notify(musicOn?'🎵 Music ON':'🔇 Music OFF','')}
  else if(c=='KeyH'&&state=='drive')hornNow();else if(c=='Space'&&state=='sit')standUp();else if(c=='KeyQ'&&hasBall)dropBall();
  else if(/^(Digit|Numpad)[1-4]$/.test(c)){}});
addEventListener('keyup',e=>keys[e.code]=0);
addEventListener('blur',()=>{for(const k in keys)keys[k]=0;vin.gas=vin.brake=0});
addEventListener('mousemove',e=>{if(!ACTIVE()&&state!='dlg')return;if(locked||e.buttons){camYaw-=e.movementX*sens;camPitch=Math.max(.05,Math.min(1.25,camPitch+e.movementY*sens))}});
document.addEventListener('pointerlockchange',()=>{locked=!!renderer&&document.pointerLockElement===renderer.domElement;if(!locked&&ACTIVE()&&!isTouch&&performance.now()-lockReqT>600)pause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(ACTIVE())pause();saveGame()}});
addEventListener('beforeunload',()=>saveGame());
$('game').addEventListener('click',()=>{if(ACTIVE()&&!locked&&!isTouch)wantLock()});
function onResize(){pvSize();if(!renderer)return;renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.fov=camera.aspect<1?78:innerHeight<460?58:65;camera.updateProjectionMatrix()}
addEventListener('resize',onResize);addEventListener('orientationchange',()=>setTimeout(onResize,250));
$('pbtn').addEventListener('click',()=>{if(ACTIVE())pause()});
setInterval(()=>{if(ACTIVE())saveGame()},8000);
/* ---------- touch ---------- */
const J={x:0,y:0,id:null,ox:0,oy:0},TL={id:null,x:0,y:0};let runT=false,jumpT=false;
function setJ(t){const R=$('joy').offsetWidth/2,m=R*.85;let dx=t.clientX-J.ox,dy=t.clientY-J.oy;const l=Math.hypot(dx,dy);if(l>m){dx*=m/l;dy*=m/l}$('knob').style.transform='translate('+dx+'px,'+dy+'px)';J.x=dx/m;J.y=dy/m}
function endJ(){J.id=null;J.x=J.y=0;const j=$('joy');j.classList.remove('act');j.style.left=j.style.top=j.style.bottom='';$('knob').style.transform=''}
$('jz').addEventListener('touchstart',e=>{e.preventDefault();if(J.id!==null)return;const t=e.changedTouches[0],j=$('joy'),R=j.offsetWidth/2;
  J.id=t.identifier;J.ox=t.clientX;J.oy=t.clientY;j.style.left=(t.clientX-R)+'px';j.style.top=(t.clientY-R)+'px';j.style.bottom='auto';j.classList.add('act');setJ(t)},{passive:false});
$('game').addEventListener('touchstart',e=>{if(!ACTIVE()&&state!='dlg')return;for(const t of e.changedTouches)if(TL.id===null){TL.id=t.identifier;TL.x=t.clientX;TL.y=t.clientY}},{passive:true});
document.addEventListener('touchmove',e=>{for(const t of e.changedTouches){
  if(t.identifier===J.id)setJ(t);else if(t.identifier===TL.id){camYaw-=(t.clientX-TL.x)*sens*1.3;camPitch=Math.max(.05,Math.min(1.25,camPitch+(t.clientY-TL.y)*sens*1.3));TL.x=t.clientX;TL.y=t.clientY}}
  if(ACTIVE())e.preventDefault()},{passive:false});
const tEnd=e=>{for(const t of e.changedTouches){if(t.identifier===J.id)endJ();if(t.identifier===TL.id)TL.id=null}};
document.addEventListener('touchend',tEnd);document.addEventListener('touchcancel',tEnd);
function hold(id,on,off){const el=$(id),d=e=>{e.preventDefault();el.classList.add('on');on()},u=e=>{e.preventDefault();el.classList.remove('on');off&&off()};
  el.addEventListener('touchstart',d,{passive:false});el.addEventListener('touchend',u,{passive:false});el.addEventListener('touchcancel',u,{passive:false});
  el.addEventListener('mousedown',d);el.addEventListener('mouseup',u);el.addEventListener('mouseleave',u)}
hold('bE',()=>{if(state=='dlg'){if(!dlgChoices)advanceDlg()}else if(ACTIVE())interact()});
hold('bJ',()=>{if(state=='sit')standUp();else jumpT=true},()=>{jumpT=false});
const togR=e=>{e.preventDefault();runT=!runT;$('bR').classList.toggle('on',runT)};$('bR').addEventListener('touchstart',togR,{passive:false});$('bR').addEventListener('mousedown',togR);
hold('vG',()=>{vin.gas=1},()=>{vin.gas=0});hold('vB',()=>{vin.brake=1},()=>{vin.brake=0});hold('vH',()=>hornNow());hold('vX',()=>{if(state=='drive')exitTrike()});
/* ---------- interaction ---------- */
const AIM={on:false,t:0};let hasBall=false,ballIdle=0,dribPh=0;
function hoopNear(){let b=null,bd=12;HOOPS.forEach(h=>{const d=dist(P.x,P.z,h.x,h.z);if(d<bd){bd=d;b=h}});return b}
function dropBall(){const b=BALLS.player;if(!hasBall)return;hasBall=false;AIM.on=false;$('meter').classList.add('hid');b.x=P.x+Math.sin(player.rotation.y)*.8;b.z=P.z+Math.cos(player.rotation.y)*.8;b.y=.9;b.vx=b.vz=0;b.vy=0;b.st='fly';b.g=14;b.scored=true;b.shooter='drop';b.hoop=null}
function shootBall(){const h=hoopNear(),b=BALLS.player;if(!hasBall||!h){AIM.on=false;$('meter').classList.add('hid');return}
  const pos=.5+.5*Math.sin(AIM.t*3.4),half=.1+Math.min(.07,S.level*.006),make=Math.abs(pos-.5)<half||Math.random()<.08;
  AIM.on=false;$('meter').classList.add('hid');hasBall=false;useEnergy(1);const f=Math.atan2(h.x-P.x,h.z-P.z);player.rotation.y=f;
  b.shoot({x:P.x+Math.sin(f)*.3,y:P.y+2.0,z:P.z+Math.cos(f)*.3},h,make,'p');sfx('pass',{x:P.x,y:1,z:P.z});if(!make)notify('Missed!','',Math.abs(pos-.5)<.25?'Almost! Time it in the green zone.':'Aim for the green zone.',1400);S.flags.shot=(S.flags.shot||0)+1}
function onScore(h,b){if(b.shooter!='p')return;S.stat.baskets++;dailyEv('basket',1);ev('basket');if(SPORT.mode=='bb')SPORT.n++;giveXP(3);sfx('swish',{x:h.x,y:3,z:h.z});notify('🏀 Basket!','good',SPORT.mode=='bb'?SPORT.n+'/3':'',1400)}
function nearest(){const c=[];const add=(d,txt,go,k)=>c.push({d,txt,go,k});
  doors.forEach(d=>{if(Math.abs(d.r.f*H-P.y)>2.5)return;const k=dist(P.x,P.z,d.cx,d.cz);if(k<2.1)add(k+.35,(d.open?'Close door':'Open door')+(d.r.n?' · '+d.r.n:''),()=>toggleDoor(d),'door')});
  npcs.forEach(n=>{if(n.gone||!n.g.visible||Math.abs(n.g.position.y-P.y)>2.5)return;const k=dist(P.x,P.z,n.g.position.x,n.g.position.z);if(k<2.3)add(k,'Talk · '+(n.name||'Pedestrian'),()=>talkTo(n),'npc')});
  acts.forEach(a=>{if(a.when&&!a.when())return;if(Math.abs(a.y-P.y)>2.5)return;const k=dist(P.x,P.z,a.x,a.z);if(k<a.r)add(k+.5,a.t,()=>a.fn(),'act')});
  seats.forEach(s=>{if(s.taken||s.type=='teacher'||s.type=='conf'||Math.abs(s.y-P.y)>1.3)return;const k=dist(P.x,P.z,s.x,s.z);if(k<1.35)add(k+.4,'Sit down',()=>trySit(s),'sit')});
  if(walletMesh&&walletMesh.visible&&dist(P.x,P.z,WALLET.x,WALLET.z)<2)add(.1,'Pick up wallet',()=>pickWallet(),'item');
  const b=BALLS.player;if(b){if(!hasBall&&b.st=='floor'&&P.y<1&&dist(P.x,P.z,b.x,b.z)<1.8)add(.2,'Pick up basketball',()=>{hasBall=true;b.st='held';sfx('pass',{x:b.x,y:.5,z:b.z});ev('ball')},'ball');
    else if(hasBall){const h=hoopNear();add(.05,h?(AIM.on?'SHOOT now!':'Shoot the ball'):'Drop the ball',()=>{if(!h)return dropBall();if(!AIM.on){AIM.on=true;AIM.t=0;$('meter').classList.remove('hid')}else shootBall()},'ball')}}
  if(!c.length)return null;c.sort((a,b)=>a.d-b.d);return c[0]}
function interact(){
  if(state=='dlg'){if(!dlgChoices)advanceDlg();return}if(state=='drive')return exitTrike();
  if(state=='sit'){const pc=pcs.find(p=>p.seat==seatCur);if(pc&&seatCur.type=='lab')return usePC(pc);return standUp()}
  if(state!='play')return;const n=nearest();if(n)n.go()}
/* ---------- main loop ---------- */
let errT=0;
function loop(){requestAnimationFrame(loop);const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;
  try{tick(dt,now)}catch(e){if(now-errT>3000){errT=now;console.error('tick error',e)}}
  if(renderer&&scene&&camera)renderer.render(scene,camera)}
function tick(dt,now){
  const live=ACTIVE(),worldOn=live||state=='dlg'||state=='fade';
  if(state=='select'||state=='load'||state=='pause'||(state=='menu'&&!worldOn)){if(state=='menu'||state=='pause'){hudUpdate(dt)}return}
  clouds.forEach(c=>{c.position.x+=dt*2;if(c.position.x>170)c.position.x=-170});flags.forEach(f=>{f.rotation.y=Math.sin(now/400)*.2});
  let moving=false,run=false;
  if(state=='play'){
    let f=((keys.KeyW||keys.ArrowUp)?1:0)-((keys.KeyS||keys.ArrowDown)?1:0),r=((keys.KeyD||keys.ArrowRight)?1:0)-((keys.KeyA||keys.ArrowLeft)?1:0),a=1;
    const jm=Math.hypot(J.x,J.y);if(jm>.12){f=-J.y;r=J.x;a=Math.min(1,jm)}
    let mx=-Math.sin(camYaw)*f+Math.cos(camYaw)*r,mz=-Math.cos(camYaw)*f-Math.sin(camYaw)*r;const l=Math.hypot(mx,mz);
    if(l>0){mx/=l;mz/=l;run=(keys.ShiftLeft||keys.ShiftRight||runT||jm>.92)&&S.energy>0;const sp=(run?6.8:3.6)*a*dt;moving=true;
      const stepTo=(dx,dz)=>{if(!blocked(P.x+dx,P.z+dz,P.y+.35)){P.x+=dx;P.z+=dz;return true}return false};
      if(!stepTo(mx*sp,mz*sp)){if(!stepTo(mx*sp,0))stepTo(0,mz*sp)}
      player.rotation.y=Math.atan2(mx,mz)}
    if((keys.Space||jumpT)&&grounded&&S.energy>0&&!hasBall){P.vy=6.3;grounded=false;sfx('jump');useEnergy(.3);jumpT=false}
    else if((keys.Space||jumpT)&&grounded&&hasBall){P.vy=6.3;grounded=false;jumpT=false;sfx('jump')}
  }else if(state=='sit'){
    const mv=keys.KeyW||keys.KeyS||keys.KeyA||keys.KeyD||keys.ArrowUp||keys.ArrowDown||Math.hypot(J.x,J.y)>.5;if(mv&&!lesson&&now-(seatCur&&seatCur.t0||0)>600)standUp()}
  // physics (on foot)
  if(state=='play'||state=='sit'||state=='fade'||state=='dlg'){
    if(state=='play'||state=='dlg'||state=='fade'){const wasG=grounded,sup=support(P.x,P.z,P.y);
      if(P.vy<=0&&(P.y<=sup+.12||(grounded&&P.y-sup<=.5))){if(grounded&&P.y-sup>.02&&!wasG)sfx('land');P.y=sup;P.vy=0;grounded=true}
      else{P.vy-=18*dt;P.y+=P.vy*dt;grounded=false;if(P.y<sup){P.y=sup;P.vy=0;grounded=true}}
      if(grounded&&!wasG)sfx('land');
      P.x=Math.max(-58,Math.min(58,P.x));P.z=Math.max(-40,Math.min(62,P.z))}
    if(state!='sit')player.position.set(P.x,P.y,P.z);else player.position.set(P.x,P.y-.36,P.z)
  }
  if(state=='drive')driveUpdate(dt,now);
  // walking animation / footsteps
  if(state=='play'||state=='dlg'||state=='fade'){
    if(moving&&grounded){anim(player,now/(run?85:120),run?.9:.6);stepT+=dt;if(stepT>(run?.26:.4)){stepT=0;sfx('step')}if(run&&S.energy>0)useEnergy(.45*dt),S.stat.run+=dt}else if(!(hasBall&&false))rest(player)}
  if(state=='sit')sitAnim(now);
  // world
  if(worldOn||state=='menu'){updateNpcs(dt,now);updateTraffic(dt);animDoors(dt);netWobble(dt)}
  const bp=BALLS.player;if(bp){if(hasBall){const fr=player.rotation.y;dribPh+=dt*7.5;const hp=Math.abs(Math.sin(dribPh));bp.x=P.x+Math.sin(fr)*.5+Math.cos(fr)*.25;bp.z=P.z+Math.cos(fr)*.5-Math.sin(fr)*.25;bp.y=P.y+.14+hp*.75;bp.m.rotation.x+=dt*6;bp.sync();
      if(Math.cos(dribPh)>0&&Math.abs(Math.sin(dribPh))<.12&&now-(bp.bt||0)>300&&moving){bp.bt=now;sfx('bounce',{x:bp.x,y:.2,z:bp.z})}
      if(curRoom()||P.y>1||hoopNear()==null&&dist(P.x,P.z,0,-5.5)>16){dropBall()}
      if(AIM.on){AIM.t+=dt;$('mk').style.left='calc('+(.5+.5*Math.sin(AIM.t*3.4))*100+'% - 3px)';const h=hoopNear();if(!h){AIM.on=false;$('meter').classList.add('hid')}}}
    else{bp.step(dt,onScore);if(bp.st=='floor'){ballIdle+=dt;if(ballIdle>45&&dist(P.x,P.z,bp.x,bp.z)>8&&!SPORT.mode){bp.rest(-1.2,-5);ballIdle=0}}else ballIdle=0}}
  // game systems
  if(live){
    if(!lesson)S.clock+=dt*CLK;const run2=run&&S.energy>0;
    addHunger(-dt*(.065+(run2?.04:0)+(SPORT.mode?.04:0)));if(S.hunger<=0)useEnergy(.08*dt);
    if(SPORT.mode=='run'&&moving)useEnergy(.2*dt);
    if(state=='sit'&&seatCur&&(seatCur.type=='bench'||seatCur.type=='cafe'||seatCur.type=='lib'||seatCur.type=='home')){S.flags.restT=(S.flags.restT||0)+dt;if(S.flags.restT>4)addEnergy(.12*dt)}
    checkTired();classTick(dt);lessonTick(dt);missionTick(dt);sportTick(dt);randomEventTick(dt);
    if(S.clock>=1440&&!collapsing&&!fadeBusy){collapsing=true;if(DRV.on){DRV.v=0;exitTrike()}if(seatCur){lesson=null;standUp()}dropBall&&hasBall&&dropBall();sleepNow('night',true);setTimeout(()=>{collapsing=false},7000)}
    S.flags.restT=state=='sit'?S.flags.restT:0;
    if(S.clock>=1380&&!S.flags.lateWarn){S.flags.lateWarn=1;notify('🌙 It is getting late','warn','Head home and sleep before midnight.',4000)}if(S.clock<1380)S.flags.lateWarn=0;
    // floor toast
    const nf=Math.round(P.y/H);if(grounded&&Math.abs(P.y-nf*H)<.3&&nf!=lastFloor){lastFloor=nf;notify(FLN[nf],'',null,1300);ev('floor',nf)}
  }
  applyDayNight(S.clock);
  const room=curRoom(),night=S.clock>=1080||S.clock<360;
  if(LT.pt){LT.pt.position.set(P.x,P.y+2.6,P.z);indoorLight(!!room||P.y>1,night)}
  if(LT.dir&&renderer.shadowMap.enabled){LT.dir.position.set(P.x+40,80,P.z+50);LT.dir.target.position.set(P.x,0,P.z);LT.dir.target.updateMatrixWorld()}
  labels.forEach(l=>{l.s.visible=Math.abs(l.y-3.25-P.y)<2.5&&Math.abs(l.x-P.x)<24&&Math.abs(l.z-P.z)<24});
  // prompt
  const n=state=='play'?nearest():null;const pr=$('prompt');
  if(state=='sit'){pr.classList.remove('hid');const pc=seatCur&&seatCur.type=='lab';pr.innerHTML=(isTouch?'':'<span class="k">E</span> ')+(pc?'Use computer · ':'Stand up')+(pc?(isTouch?'Jump = stand up':'<span class="k">Space</span> stand up'):'')}
  else{pr.classList.toggle('hid',!n);if(n)pr.innerHTML=(isTouch?'':'<span class="k">E</span> ')+n.txt}
  $('bE').classList.toggle('hot',!!n||state=='sit');
  // audio
  const u=AUC;u.x=P.x;u.y=P.y;u.z=P.z;u.fx=-Math.sin(camYaw);u.fz=-Math.cos(camYaw);u.indoor=!!room||P.y>1.5;u.inHouse=!!(room&&room.house);u.room=room?room.n:'';u.hour=(S.clock/60)%24;u.night=night;
  u.classTime=CLASSES.some(k=>S.clock>=k.start&&S.clock<k.start+CLS_LEN);u.floor=fl();
  if(u.floor>0){let bd=1e9,bz=null;for(const d of doors){if(d.r.f!=u.floor||!d.r.cls)continue;const k=dist(P.x,P.z,d.cx,d.cz);if(k<bd){bd=k;bz={x:d.cx,y:d.r.f*H+2,z:d.cz}}}u.classZ=bz}else u.classZ=null;
  songT+=dt;if(songT>2){songT=0;if(S.flags.started)setSong(u.inHouse?'home':night?'night':(S.day%2?'game':'game2'))}
  audioFrame(dt);if(S.flags.started){/* engine handled in driveUpdate/traffic */}
  // beacon for tracked mission marker
  beaconUpdate(now,dt);
  hudUpdate(dt);drawMap(now);
  cameraUpdate(dt,room);
}
function sitAnim(now){const u=player.userData;if(!seatCur)return;if(seatCur.type=='lab'){const t=now/1000;u.a1.rotation.x=-1.15+Math.sin(t*14)*.05;u.a2.rotation.x=-1.15+Math.sin(t*11+1)*.05}}
function beaconUpdate(now,dt){if(!beacon){beacon=new THREE.Group();const m=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,14,16,1,true),new THREE.MeshBasicMaterial({color:0xffd35c,transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide}));m.position.y=7;
    const d=new THREE.Mesh(new THREE.OctahedronGeometry(.35),new THREE.MeshBasicMaterial({color:0xffe27a}));beacon.add(m,d);beacon.userData.d=d;beacon.userData.m=m;beacon.visible=false;scene.add(beacon)}
  const m=MISSIONS.find(x=>x.id==S.track&&mst(x.id).st=='active');const mk=m&&stepMarkers(m)[0];
  if(!mk||state=='sit'&&false){beacon.visible=false;return}
  const py=mk.y!=null?mk.y:0;if(Math.abs(py-P.y)>6&&!mk.npc&&fl()!=Math.round(py/H)){beacon.visible=true}else beacon.visible=true;
  const near=dist(P.x,P.z,mk.x,mk.z)<3.2&&Math.abs(py-P.y)<2.5;beacon.visible=!near;beacon.position.set(mk.x,py,mk.z);beacon.userData.m.material.opacity=.2+Math.sin(now/300)*.08;beacon.userData.d.position.y=2.4+Math.abs(Math.sin(now/400))*.7;beacon.userData.d.rotation.y+=dt*2;
  // fade the beam when the player is close
  beacon.userData.m.scale.set(1,1,1)}
function cameraUpdate(dt,room){const dr=state=='drive';const D=dr?7.5:room?3.4:6.5,cp=Math.cos(camPitch),ty=P.y+(dr?1.5:1.5)-(state=='sit'?.3:0),tgt=new THREE.Vector3(P.x,ty,P.z);
  const want=new THREE.Vector3(P.x+Math.sin(camYaw)*cp*D,ty+Math.sin(camPitch)*D,P.z+Math.cos(camYaw)*cp*D);
  let t=1;for(;t>.2;t-=.1){if(!hitPt(tgt.x+(want.x-tgt.x)*t,tgt.y+(want.y-tgt.y)*t,tgt.z+(want.z-tgt.z)*t))break}
  const cpos=new THREE.Vector3().lerpVectors(tgt,want,t);cpos.y=Math.max(cpos.y,.5);
  if(shake>0){cpos.x+=(Math.random()-.5)*shake;cpos.y+=(Math.random()-.5)*shake;shake=Math.max(0,shake-dt*1.2)}
  camera.position.lerp(cpos,1-Math.exp(-12*dt));camera.lookAt(P.x,ty,P.z)}
try{if(typeof THREE=='undefined')throw 0;pvInit();loadSettings()}catch(e){$('pct').textContent='3D engine could not load. Reload the page.'}
