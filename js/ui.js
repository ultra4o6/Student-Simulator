/* =====================================================================
   UI: HUD (desktop + mobile), minimap, menus, fade transitions, settings
   ===================================================================== */
function playerOpts(){const o=eff(gender),base=Object.assign({},o);const out=S.outfit;
  if(out=='pe'){base.shirt=0xf4f4f4;base.pants=0x1c2f6b;base.noTie=1}else if(out=='casual'){base.shirt=[0xe67e22,0x16a085,0x8e44ad,0xc0392b][O.sk%4];base.pants=0x3a3f4a;base.noTie=1}
  else if(out=='formal'){base.shirt=0xffffff;base.pants=0x151515;base.tie=0xc0392b}
  base.acc=S.acc.slice();base.lite=0;return base}
function rebuildPlayer(){const old=player,wasVis=old?old.visible:true;if(old)scene.remove(old);player=makeChar(playerOpts(),pname,scene);player.position.set(P.x,P.y,P.z);player.visible=wasVis;
  if(renderer&&renderer.shadowMap.enabled)player.traverse(o=>{if(o.isMesh)o.castShadow=true});drawAvatar($('av'),playerOpts())}
/* ---------- fade ---------- */
let fadeBusy=false;
function fadeTo(text,hold,mid,after){if(fadeBusy)return;fadeBusy=true;const f=$('fade'),prev=state==='fade'?'play':state;state='fade';f.classList.remove('hid');$('fadet').textContent=text||'';void f.offsetHeight;f.classList.add('on');
  setTimeout(()=>{try{mid&&mid()}catch(e){console.error(e)}setTimeout(()=>{f.classList.remove('on');setTimeout(()=>{f.classList.add('hid');fadeBusy=false;state=(seatCur&&prev=='sit'&&seatCur.type!='home')?'sit':'play';if(prev=='dlg')state='play';
    if(!seatCur)state='play';try{after&&after()}catch(e){console.error(e)}},700)},Math.max(600,hold-1400))},800)}
/* ---------- HUD ---------- */
let hudT=0,lastLvlTxt='';
function hudUpdate(dt){hudT+=dt;if(hudT<.15)return;hudT=0;
  const e=Math.round(S.energy),h=Math.round(S.hunger);const bar=$('ebf');bar.style.width=e+'%';bar.className=e<=30?'low':e<=50?'mid':'';$('ept').textContent=e+'%';
  $('hbf').style.width=h+'%';$('hpt').textContent=h+'%';$('coin').textContent='₱'+S.coins;$('lvl').textContent='Lv '+S.level;$('xpf').style.width=Math.round(S.xp/xpNeed(S.level)*100)+'%';
  $('tired').classList.toggle('hid',S.energy>50);$('tired').textContent=S.energy<=0?'😵 Exhausted! Ride a tricycle home and sleep.':'😴 Tired ('+e+'%) - go home to your boarding house to rest.';
  $('tm').textContent=fmtTime(S.clock);$('dayl').textContent='Day '+S.day;$('sch').textContent=schedText();$('loc').textContent=locName();
  const m=MISSIONS.find(x=>x.id==S.track&&mst(x.id).st=='active');const mt=$('mtr');
  if(m){mt.classList.remove('hid');$('mtT').textContent=(m.side?'◆ ':'🎯 ')+m.title;$('mtO').textContent=stepText(m);
    const mk=stepMarkers(m)[0];let d='';if(mk){const fl=Math.round((mk.y||0)/H);const cf=fl0();d=fl!=cf&&mk.y!=null&&!mk.npc?'➜ '+FLN[fl]:fl!=cf&&mk.npc?'➜ '+FLN[Math.max(0,Math.min(3,fl))]:'➜ '+Math.round(dist(P.x,P.z,mk.x,mk.z))+' m'}$('od').textContent=d}
  else{$('mtT').textContent='🎯 No active mission';$('mtO').textContent='Open the mission list (J) for more';$('od').textContent=''}
  if(S.energy<=50&&!S.flags.homeHint)S.flags.homeHint=1}
const fl0=()=>Math.max(0,Math.min(3,Math.floor((P.y+.5)/H)));
/* ---------- minimap (player-centred) ---------- */
const mm=$('mm').getContext('2d'),MR=38,MS=180/(MR*2);let mmT=0;
function drawMap(now){mmT++;if(mmT%2)return;const cx=90,cy=90,X=x=>cx+(x-P.x)*MS,Z=z=>cy+(z-P.z)*MS;
  mm.save();mm.fillStyle='#16351f';mm.fillRect(0,0,180,180);
  const R=(a,b,c,d,col)=>{mm.fillStyle=col;mm.fillRect(X(a),Z(b),(c-a)*MS,(d-b)*MS)};
  R(-80,26,80,30,'#9a9a90');R(-80,30,80,46,'#44474c');R(-80,46,80,53,'#9a9a90');R(-34,20,34,26,'#8a8576');R(-20,-16,20,10,'#3a3d42');R(COURT.x1,COURT.z1,COURT.x2,COURT.z2,'#5a5d63');
  [[-30,-26,30,-16],[-30,-16,-20,10],[20,-16,30,10],[-30,10,30,20]].forEach(f=>R(f[0],f[1],f[2],f[3],'#6fd0b8'));
  R(8,-16,14,-6,'#ffb400');R(-14,0,-8,8,'#ffb400');R(-2,53,14,63,'#a8c98f');R(-60,53,-10,63,'#c8a487');R(16,53,60,63,'#c8a487');
  const f=fl0();mm.font='13px Arial';mm.textAlign='center';mm.textBaseline='middle';
  const icon=(x,z,t,col)=>{const px=X(x),py=Z(z);if(px<8||py<8||px>172||py>172)return;mm.fillStyle=col||'#fff';mm.fillText(t,px,py)};
  if(f==0){[['Library','📖'],['Canteen','🍴'],['School Store','🏪'],['Comfort Room (M)','🚻'],["Principal's Office",'🏛']].forEach(([n,t])=>{const d=doors.find(d=>d.r.n==n);if(d)icon(d.cx,d.cz,t)})}
  if(f==3){const d=doors.find(d=>d.r.n=='Computer Lab 1');if(d)icon(d.cx,d.cz,'💻')}
  const my=doors.find(d=>d.r.n==myRoom());if(my&&my.r.f==f){mm.strokeStyle='#ffd35c';mm.lineWidth=1.5;mm.strokeRect(X(my.r.x1),Z(my.r.z1),(my.r.x2-my.r.x1)*MS,(my.r.z2-my.r.z1)*MS)}
  icon(6,50,'🏠');icon(TERMINAL.school?TERMINAL.school.x:0,TERMINAL.school?TERMINAL.school.z:0,'🛺');icon(TERMINAL.house?TERMINAL.house.x:0,TERMINAL.house?TERMINAL.house.z:0,'🛺');
  if(myTrike&&!DRV.on)icon(DRV.x,DRV.z,'🟡');
  mm.fillStyle='#ffd23f';vehicles.forEach(v=>mm.fillRect(X(v.g.position.x)-2,Z(v.g.position.z)-1.5,4,3));
  npcs.forEach(n=>{if(n.civ||n.gone||!n.g.visible&&!n.fixed)return;const gp=n.g.position;if(Math.abs(gp.y-P.y)>2.5)return;const key=n.staff&&n.staff!='guard'&&n.staff!='streetvendor'||MATES.includes(n.name)||n.name=='Carlo'||n.name=='Renz';
    mm.fillStyle=key?'#6fd0ff':'#ffffff99';const s=key?4:2.5;mm.fillRect(X(gp.x)-s/2,Z(gp.z)-s/2,s,s)});
  // mission markers
  const t=now/250;allMarkers().forEach(k=>{const same=Math.abs((k.y||0)-P.y)<2.6||k.y==null;let px=X(k.x),py=Z(k.z),off=px<10||py<10||px>170||py>170;
    const col=k.main?'#ffd35c':'#7fe0ff';
    if(off){const a=Math.atan2(py-cy,px-cx);px=cx+Math.cos(a)*78;py=cy+Math.sin(a)*78;mm.fillStyle=col;mm.save();mm.translate(px,py);mm.rotate(a);mm.beginPath();mm.moveTo(7,0);mm.lineTo(-5,5);mm.lineTo(-5,-5);mm.fill();mm.restore()}
    else{mm.strokeStyle=col;mm.lineWidth=2;mm.beginPath();mm.arc(px,py,5+Math.sin(t)*1.5,0,7);mm.stroke();mm.fillStyle=col;mm.beginPath();mm.arc(px,py,2.5,0,7);mm.fill();if(!same){mm.fillStyle='#fff';mm.fillText(k.y>P.y?'▲':'▼',px,py-10)}}});
  if(S.energy<=50){const px=X(6),py=Z(56),a=Math.atan2(py-cy,px-cx);if(px<10||py<10||px>170||py>170){mm.fillStyle='#ff6b5a';mm.save();mm.translate(cx+Math.cos(a)*78,cy+Math.sin(a)*78);mm.rotate(a);mm.beginPath();mm.moveTo(7,0);mm.lineTo(-5,5);mm.lineTo(-5,-5);mm.fill();mm.restore()}else{mm.strokeStyle='#ff6b5a';mm.lineWidth=2;mm.beginPath();mm.arc(px,py,8+Math.sin(t*1.4)*2,0,7);mm.stroke()}}
  mm.translate(cx,cy);mm.rotate(-camYaw+Math.PI);mm.fillStyle='#ff3b3b';mm.strokeStyle='#fff';mm.lineWidth=1.5;mm.beginPath();mm.moveTo(0,-8);mm.lineTo(6,6);mm.lineTo(-6,6);mm.closePath();mm.fill();mm.stroke();mm.restore()}
/* ---------- menus ---------- */
let menuTab='missions',menuPrev='play';
function openMenu(tab){if(state=='dlg'||state=='fade'||state=='load'||state=='select')return;if(state!='menu'&&state!='pause'){menuPrev=state}
  if(tab=='settings'){state='menu';$('settings').classList.remove('hid');if(document.pointerLockElement)document.exitPointerLock();return}
  state='menu';menuTab=tab||menuTab;$('menu').classList.remove('hid');if(document.pointerLockElement)document.exitPointerLock();endJ();renderMenu()}
function closeMenu(){$('menu').classList.add('hid');if(state=='menu'){state=menuPrev=='menu'?'play':menuPrev;if(state=='fade')state='play'}if(!isTouch&&state=='play'&&!ovlOpen){try{renderer.domElement.requestPointerLock()}catch(e){}}last=performance.now()}
document.querySelectorAll('#mtabs button').forEach(b=>b.onclick=()=>{if(b.dataset.t=='settings'){$('menu').classList.add('hid');$('settings').classList.remove('hid');return}menuTab=b.dataset.t;renderMenu()});
$('mclose').onclick=closeMenu;
document.querySelectorAll('#qb button[data-m]').forEach(b=>b.onclick=()=>openMenu(b.dataset.m));
$('bI').addEventListener('touchstart',e=>{e.preventDefault();openMenu('inventory')},{passive:false});$('bI').addEventListener('mousedown',e=>openMenu('inventory'));
function renderMenu(){document.querySelectorAll('#mtabs button').forEach(b=>b.classList.toggle('sel',b.dataset.t==menuTab));const B=$('mbody');
  if(menuTab=='missions'){const act=MISSIONS.filter(m=>!m.side&&mst(m.id).st=='active'),sd=MISSIONS.filter(m=>m.side&&mst(m.id).st=='active'),dn=MISSIONS.filter(m=>mst(m.id).st=='done');
    const card=(m,cls)=>'<div class="mi '+cls+'"><b>'+(m.id==S.track?'🎯 ':'')+m.title+'</b><small>'+m.desc+'</small>'+(cls=='act'?'<small>➡ '+stepText(m)+'</small><div class="pbar"><i style="width:'+Math.round(mst(m.id).i/m.steps.length*100)+'%"></i></div><button data-tr="'+m.id+'">'+(m.id==S.track?'Tracking':'Track on map')+'</button>':'<small>✔ Completed</small>')+'</div>';
    B.innerHTML='<h3>Daily challenges · Day '+S.day+'</h3>'+S.daily.list.map(d=>'<div class="mi '+(d.done?'done':'act')+'"><b>'+(d.done?'✔ ':'')+d.t+'</b><small>'+d.have+'/'+d.need+' · reward ₱'+d.rw.coins+' + '+d.rw.xp+' XP</small></div>').join('')+
      '<h3>Main missions</h3>'+(act.map(m=>card(m,'act')).join('')||'<small>No active missions.</small>')+(sd.length?'<h3>Side quests</h3>'+sd.map(m=>card(m,'act')).join(''):'')+
      '<h3>Completed ('+dn.length+'/'+MISSIONS.filter(m=>!m.locked2||S.flags.stage2).length+')</h3>'+dn.map(m=>card(m,'done')).join('')+'<small>Tip: talk to Bea, Jun, Paolo and Coach Dan for side quests.</small>';
    B.querySelectorAll('[data-tr]').forEach(b=>b.onclick=()=>{S.track=b.dataset.tr;renderMenu()})}
  else if(menuTab=='inventory'){const ids=Object.keys(S.inv);B.innerHTML='<h3>Inventory · ₱'+S.coins+'</h3><div class="grid2">'+(ids.map(id=>{const it=ITEMS[id];return '<div class="mi"><b>'+it.i+' '+it.n+' ×'+S.inv[id]+'</b><small>'+(it.t=='food'?'+'+it.h+' hunger'+(it.e?' · +'+it.e+' energy':''):it.d||it.t)+'</small>'+(it.t=='food'||id=='edrink'||id=='notebook'?'<button data-u="'+id+'">Use</button>':'')+'</div>'}).join('')||'<small>Your bag is empty. Buy items at the canteen or school store.</small>')+'</div>';
    B.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{useItem(b.dataset.u);renderMenu()})}
  else if(menuTab=='status'){const a=attStats(),ov=overall();B.innerHTML='<h3>'+pname+' · '+COURSES[O.course].n+' · '+COURSES[O.course].cls+'</h3>'+
    '<div class="kv"><span>Level</span><b>'+S.level+' ('+S.xp+'/'+xpNeed(S.level)+' XP)</b></div><div class="kv"><span>Energy / Hunger</span><b>'+Math.round(S.energy)+'% / '+Math.round(S.hunger)+'%</b></div><div class="kv"><span>Money</span><b>₱'+S.coins+'</b></div><div class="kv"><span>Day · Time</span><b>Day '+S.day+' · '+fmtTime(S.clock)+'</b></div>'+
    '<h3>Student dashboard</h3><div class="kv"><span>Attendance</span><b>'+a.rate+'% (present '+a.p+', late '+a.l+', absent '+a.ab+')</b></div>'+
    '<div class="kv"><span>Assignments</span><b>'+(S.asg.length?Math.round(avg(S.asg.map(x=>x.s)))+'% avg · '+S.asg.length+' submitted':'none yet')+'</b></div>'+
    '<div class="kv"><span>Examinations</span><b>'+(S.exm.length?S.exm.map(e=>e.n+' '+e.s+'%').join(', '):'none yet')+'</b></div>'+
    '<div class="kv"><span>Overall performance</span><b>'+Math.round(ov)+'% · Grade '+toGrade(ov).toFixed(2)+'</b></div>'+
    '<div class="kv"><span>Baskets scored · Rides · Distance driven</span><b>'+S.stat.baskets+' · '+S.stat.rides+' · '+Math.round(S.stat.drive)+' m</b></div>'+
    '<h3>Activities</h3>'+Object.keys(ACTS).map(k=>'<div class="kv"><span>'+ACTS[k].n+'</span><b>'+(S.level>=ACTS[k].lv?'✔ unlocked':'🔒 Level '+ACTS[k].lv)+'</b></div>').join('')+
    '<h3>Week progress</h3><small>'+weekText()+'</small>'+(S.flags.stage2?'<div class="tag">Stage 2 unlocked</div>':'')}
  else if(menuTab=='friends'){const ns=Object.keys(S.fr).sort((a,b)=>S.fr[b]-S.fr[a]);B.innerHTML='<h3>Friendships</h3>'+(ns.map(n=>{const l=frLevel(n);return '<div class="mi"><b>'+n+' <span class="tag">'+FR_LV[l][0]+'</span></b><small>'+'♥'.repeat(S.fr[n]>0?Math.min(8,Math.ceil(S.fr[n]/2)):0)+' ('+S.fr[n]+' pts)</small></div>'}).join('')||'<small>Chat with students and teachers to make friends! Friends gift you snacks.</small>')}
  else if(menuTab=='wardrobe'){const at=inHouseNow();B.innerHTML='<h3>Outfits'+(at?'':' (change at the wardrobe in your boarding house)')+'</h3><div class="grid2">'+Object.keys(OUTFITS).map(k=>{const lock=S.level<OUTFITS[k].lv;return '<div class="mi '+(lock?'lock':'')+'"><b>'+OUTFITS[k].n+(S.outfit==k?' ✔':'')+'</b><small>'+(lock?'🔒 Level '+OUTFITS[k].lv:'Unlocked')+'</small>'+(!lock&&at&&S.outfit!=k?'<button data-o="'+k+'">Wear</button>':'')+'</div>'}).join('')+'</div>'+
    '<h3>Accessories</h3><div class="grid2">'+Object.keys(ACCS).map(k=>{const a=ACCS[k],lock=a.mis?!S.flags['acc_'+k]&&S.level<a.lv:S.level<a.lv;const on=S.acc.includes(k);return '<div class="mi '+(lock?'lock':'')+'"><b>'+a.n+(on?' ✔':'')+'</b><small>'+(lock?(a.mis?'🔒 Level '+a.lv+' or finish a mission':'🔒 Level '+a.lv):'Unlocked')+'</small>'+(!lock&&at?'<button data-a="'+k+'">'+(on?'Remove':'Wear')+'</button>':'')+'</div>'}).join('')+'</div>';
    B.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{S.outfit=b.dataset.o;rebuildPlayer();renderMenu()});B.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const k=b.dataset.a;S.acc=S.acc.includes(k)?S.acc.filter(x=>x!=k):S.acc.concat(k);rebuildPlayer();renderMenu()})}}
const inHouseNow=()=>{const r=curRoom();return !!r&&r.house};
/* ---------- pause + settings ---------- */
function pause(){if(state=='pause'||state=='load'||state=='select'||state=='fade')return;if(state=='drive')DRV.pausedV=1;pauseFrom=state=='menu'?menuPrev:state;state='pause';saveGame();endJ();if(document.pointerLockElement)document.exitPointerLock();$('menu').classList.add('hid');$('pause').classList.remove('hid')}
let pauseFrom='play';
function resume(){$('pause').classList.add('hid');$('settings').classList.add('hid');state=pauseFrom=='pause'||pauseFrom=='menu'?'play':pauseFrom;if(dlgChoices||dlgLines.length&&!$('dlg').classList.contains('hid'))state='dlg';if(!isTouch&&state=='play'){try{renderer.domElement.requestPointerLock()}catch(e){}}last=performance.now()}
$('bres').onclick=resume;$('bmis').onclick=()=>{$('pause').classList.add('hid');menuPrev=pauseFrom;state='play';openMenu('missions')};$('bstat').onclick=()=>{$('pause').classList.add('hid');menuPrev=pauseFrom;state='play';openMenu('status')};
$('bset').onclick=()=>$('settings').classList.remove('hid');
$('brest').onclick=()=>{if(!confirm('Restart the game from Day 1? All progress will be erased.'))return;$('pause').classList.add('hid');try{localStorage.removeItem(SAVE)}catch(e){}resetWorldState();startGame(null)};
$('bexit').onclick=()=>{saveGame();returnToMenu()};
function returnToMenu(){$('pause').classList.add('hid');$('menu').classList.add('hid');$('hud').classList.add('hid');$('touch').classList.add('hid');$('dlg').classList.add('hid');hideOvl&&hideOvl();document.body.classList.remove('playing','driving');
  if(DRV.on){myTrike.remove(player);scene.add(player);DRV.on=false;$('vc').classList.add('hid')}dlgChoices=null;state='select';setSong('menu');$('select').classList.remove('hid');$('cont').disabled=!localStorage.getItem(SAVE);pvSize();engineUpdate(0,0,false)}
$('set1').onclick=()=>{$('settings').classList.remove('hid')};
$('sclose').onclick=()=>{$('settings').classList.add('hid');saveSettings()};
$('sfs').onclick=()=>{try{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}catch(e){}};
$('s4').oninput=e=>{sens=e.target.value*.001;saveSettings()};
$('s5').onchange=e=>{applyGraphics(e.target.value);saveSettings()};
function applyGraphics(level){if(!renderer)return;renderer.setPixelRatio(level=='low'?1:level=='med'?Math.min(devicePixelRatio,1.5):Math.min(devicePixelRatio,2));if(built)enableShadows(level);onResize&&onResize()}
/* ---------- orientation (mobile) ---------- */
function lockLandscape(){try{if(isTouch&&screen.orientation&&screen.orientation.lock)return screen.orientation.lock('landscape').catch(()=>{})}catch(e){}}
$('rotok').onclick=()=>{try{document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().then(lockLandscape).catch(()=>{})}catch(e){}lockLandscape()};
