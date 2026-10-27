/* =====================================================================
   VEHICLES: drivable tricycle (accelerate / brake / steer / collisions),
   tricycle ride service (terminals), traffic behaviour, motorcycles.
   ===================================================================== */
const DRV={on:false,v:0,h:0,x:0,z:0,steer:0,t:null,dist:0,acc:0,bumpT:0};
const vin={gas:0,brake:0};
function makeMoto(color){const g=new THREE.Group();g.userData.wheels=[];const B=vbox(g);
  B(.3,.35,1.2,0,.65,0,color);B(.28,.2,.7,0,.95,-.1,0x222222);B(.4,.1,.3,0,.95,.3,0x333333);B(.5,.06,.06,0,1.12,.45,0x888888);B(.16,.16,.1,0,.95,.72,0xfff4c0,bmat);B(.12,.1,.05,0,.8,-.62,0xe02020,bmat);B(.18,.3,.5,0,.4,0,0x555555);
  addWheel(g,0,.33,.62,.33);addWheel(g,0,.33,-.62,.33);const r=makeChar(civOpts(),null,g);r.position.set(0,.18,-.15);sitPose(r);r.userData.a1.rotation.x=r.userData.a2.rotation.x=-1.2;r.scale.setScalar(.9);g.userData.len=1.8;return g}
function buildTrafficExtras(){
  const add=(g,lane,x,dir,sp,hl,hw,off)=>{g.position.set(x,0,lane+(off||0));g.rotation.y=dir>0?Math.PI/2:-Math.PI/2;scene.add(g);vehicles.push({g,dir,sp,v0:sp,hl,hw,lane:lane+(off||0)})};
  add(makeMoto(0xc0392b),37,70,-1,9,1,.5,-.9);add(makeMoto(0x2f6fbf),43,-80,1,10,1,.5,.9);add(makeMoto(0x222222),37,-10,-1,8.5,1,.5,-1.2);
  add(makeCar('sedan',0x2e9e5b),43,-20,1,6.5,2.2,1,0);add(makeCar('van',0xf5f5f5),37,10,-1,5.8,2.4,1,0)}
let myTrike=null;
function buildPlayerTrike(){const t=makeTrike(0xffb400,0x2e9e5b,-1,civOpts);t.position.set(-8,0,32.3);t.rotation.y=-Math.PI/2;scene.add(t);myTrike=t;
  DRV.x=-8;DRV.z=32.3;DRV.h=-Math.PI/2;DRV.t=t;label('Your Tricycle',-8,2.9,32.3,3.2,.64);
  addAct({x:-8,y:0,z:32.3,r:3.2,t:'Drive your tricycle',kind:'drive',when:()=>!DRV.on,fn:()=>enterTrike()})}
const ang=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a};
function enterTrike(){if(DRV.on||!player)return;if(S.energy<=0){notify('Too exhausted to drive','warn');return}
  DRV.on=true;DRV.v=0;DRV.steer=0;state='drive';document.body.classList.add('driving');$('vc').classList.remove('hid');
  player.visible=true;myTrike.add(player);player.position.set(0,0,-.12);player.rotation.set(0,0,0);setSit(playerSitProxy(),true,.0);playerPose(true);
  sfx('start');AUC.driving=true;notify('🛺 Driving','','W/S gas & brake · A/D steer · SPACE handbrake · H horn · E exit',3500)}
function playerSitProxy(){return {g:player,sitting:false}}
function playerPose(sit){const u=player.userData;if(sit){u.l1.rotation.x=u.l2.rotation.x=-1.25;u.a1.rotation.x=u.a2.rotation.x=-1.1;player.position.y=-.3}else{u.l1.rotation.x=u.l2.rotation.x=0;u.a1.rotation.x=u.a2.rotation.x=0;player.position.y=0}}
function exitTrike(){if(!DRV.on)return;if(Math.abs(DRV.v)>2.5){notify('Slow down before getting off!','warn');return}
  const cands=[[1.6,0],[-2.2,0],[0,-2.2],[0,2.2]];let ok=null;for(const [lx,lz] of cands){const wx=DRV.x+Math.cos(DRV.h)*lx+Math.sin(DRV.h)*lz,wz=DRV.z-Math.sin(DRV.h)*lx+Math.cos(DRV.h)*lz;if(!blocked(wx,wz,0,.4)){ok=[wx,wz];break}}
  if(!ok)ok=[DRV.x+Math.cos(DRV.h)*1.6,DRV.z-Math.sin(DRV.h)*1.6];
  myTrike.remove(player);scene.add(player);P.x=ok[0];P.z=ok[1];P.y=0;player.position.set(P.x,0,P.z);playerPose(false);
  DRV.on=false;DRV.v=0;state='play';document.body.classList.remove('driving');$('vc').classList.add('hid');AUC.driving=false;engineUpdate(0,0,false);sfx('door')}
const vehHit=(x,z,r)=>{if(blockedV(x,z,r))return true;for(const v of vehicles){const vx=v.g.position.x,vz=v.g.position.z;if(Math.abs(x-vx)<v.hl+r*.6&&Math.abs(z-vz)<v.hw+r)return true}return false};
function driveUpdate(dt,now){const D=DRV,kb=keys;
  let thr=(kb.KeyW||kb.ArrowUp?1:0)-(kb.KeyS||kb.ArrowDown?1:0),st=(kb.KeyA||kb.ArrowLeft?1:0)-(kb.KeyD||kb.ArrowRight?1:0),brk=kb.Space?1:0;
  if(Math.hypot(J.x,J.y)>.15){thr+=-J.y;st+=-J.x}
  if(vin.gas)thr+=1;if(vin.brake)brk=1;thr=clamp(thr,-1,1);st=clamp(st,-1,1);
  const MAX=13,REV=-4;let acc=0;
  if(thr>0&&D.v>=-.1)acc=5.5*(1-Math.max(0,D.v)/MAX)*thr;else if(thr<0&&D.v<=.1)acc=4*thr*(1-Math.max(0,-D.v)/-REV);else if(thr!=0)acc=Math.sign(thr)*9; // braking when pressing the opposite direction
  if(brk)acc-=Math.sign(D.v||0)*Math.min(Math.abs(D.v)/dt,14);
  acc-=D.v*.35;if(thr==0&&!brk)acc-=Math.sign(D.v)*1.2;
  D.v+=acc*dt;if(Math.abs(D.v)<.05&&thr==0)D.v=0;D.v=clamp(D.v,REV,MAX);
  if(S.energy<=0)D.v*=.98;
  D.steer+=((st*.55)-D.steer)*Math.min(1,dt*7);const L=1.6,sp=Math.abs(D.v);
  D.h+=D.v/L*Math.tan(D.steer)*dt*(1-Math.min(.5,sp/40));
  const nx=D.x+Math.sin(D.h)*D.v*dt,nz=D.z+Math.cos(D.h)*D.v*dt;
  const pts=(x,z,h)=>[[x+Math.sin(h)*1.3,z+Math.cos(h)*1.3],[x-Math.sin(h)*1.0,z-Math.cos(h)*1.0],[x+Math.cos(h)*-.9,z-Math.sin(h)*-.9],[x,z]];
  let hit=false;for(const q of pts(nx,nz,D.h)){if(vehHit(q[0],q[1],.55)){hit=true;break}}
  if(nx<-57||nx>57||nz<-38||nz>51)hit=true;
  if(hit){if(Math.abs(D.v)>3&&now-D.bumpT>400){D.bumpT=now;sfx('bump');if(typeof shake!='undefined')shake=.25}D.v=-D.v*.25}else{D.x=nx;D.z=nz;D.dist+=sp*dt;S.stat.drive+=sp*dt;if(D.dist>25){dailyEv('drive',Math.round(D.dist));ev('drive',Math.round(D.dist));D.dist=0}}
  P.x=D.x;P.z=D.z;P.y=0;myTrike.position.set(D.x,0,D.z);myTrike.rotation.y=D.h;
  myTrike.userData.wheels.forEach(w=>w.p.rotation.x+=D.v*dt/w.r);
  // front wheel steering visual
  const fw=myTrike.userData.wheels[0];if(fw)fw.p.rotation.y=D.steer*.8;
  if(brk&&sp>4&&now-(D.brkT||0)>500){D.brkT=now;sfx('brake')}
  engineUpdate(D.v,Math.max(0,thr),true);if(thr>0&&sp<1&&(D.hornT||0)<now&&false){}
  // wheel dust-free simple camera follow
  const want=D.h+Math.PI;if(now-(lastLook||0)>1500){camYaw+=ang(want-camYaw)*Math.min(1,dt*2.2)}
  camPitch+=(.28-camPitch)*Math.min(1,dt*.8)}
let lastLook=0;
function hornNow(){sfx('horn',{x:P.x,y:1,z:P.z})}
/* ---------- public ride ---------- */
function rideMenu(key){const t=TERMINAL[key];const dest=key=='school'?'Boarding House':'NEMCO Campus';const fare=S.coins<20?0:20;
  ask(t.name+' (Tricycle driver)',key=='school'?'Sakay na po! Saan tayo, '+(S.energy<=50?'mukhang pagod ka na — uwi na?':'iho/iha?'):'Magandang gabi/umaga! Pa-eskwela na ba?',[
    {t:'🛺 Ride to '+dest+(fare?' (₱20)':' (free ride)'),fn:()=>doRide(key,fare)},{t:'Not now',fn:()=>closeDlg()}])}
function doRide(key,fare){closeDlg();if(fare>S.coins){notify('Not enough coins','warn');return}
  if(fare)giveCoins(-fare);S.stat.rides++;sfx('pay');const toHouse=key=='school',dx=toHouse?-4.5:4,dz=toHouse?49.6:28.6;
  fadeTo((toHouse?'🛺 Riding to the Boarding House...':'🛺 Riding to NEMCO...'),2800,()=>{
    P.x=dx;P.z=dz;P.y=0;S.clock+=12;addEnergy(3);addHunger(-2);camYaw=toHouse?Math.PI:0;sfx('ride');S.stat.rides;ev('ride',toHouse?'house':'school');if(toHouse)ev('home')},()=>{notify(toHouse?'🏠 You arrived at the boarding house':'🏫 You arrived at NEMCO','good')})}
/* ---------- traffic behaviour ---------- */
function updateTraffic(dt){let near=99,nv=null;
  for(const v of vehicles){const g=v.g,gx=g.position.x;let tgt=v.v0,d=99;
    // look ahead for the player (on foot or driving) and other vehicles in the same lane
    const px=P.x-gx,pz=Math.abs(P.z-v.lane);
    if(P.y<1&&pz<v.hw+1.1&&px*v.dir>0&&px*v.dir<9+v.hl)d=Math.min(d,px*v.dir-v.hl);
    for(const o of vehicles){if(o===v||Math.abs(o.lane-v.lane)>1.6)continue;const ox=(o.g.position.x-gx)*v.dir;if(ox>0&&ox<10)d=Math.min(d,ox-o.hl-v.hl)}
    if(DRV.on&&Math.abs(DRV.z-v.lane)<v.hw+1.4){const ox=(DRV.x-gx)*v.dir;if(ox>0&&ox<10)d=Math.min(d,ox-v.hl-1.5)}
    if(d<8)tgt=v.v0*clamp((d-1.2)/6,0,1);
    const braking=tgt<v.sp-.3;v.sp+=clamp(tgt-v.sp,-9*dt,3*dt);
    if(braking&&d<4&&v.sp<1.5&&!v.honk&&Math.hypot(px,P.z-v.lane)<30){v.honk=1;sfx('horn',{x:gx,y:1,z:g.position.z});setTimeout(()=>v.honk=0,3500)}
    g.position.x+=v.dir*v.sp*dt;if(g.position.x>115)g.position.x=-115;if(g.position.x<-115)g.position.x=115;
    g.userData.wheels.forEach(w=>w.p.rotation.x+=v.sp*dt/w.r);
    const dd=Math.hypot(P.x-gx,P.z-g.position.z);if(dd<near){near=dd;nv=v}}
  AUC.vdist=near;if(nv){AUC.vx=nv.g.position.x;AUC.vz=nv.g.position.z;AUC.vsp=nv.sp}}
