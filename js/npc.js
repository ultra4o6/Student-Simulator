/* =====================================================================
   NPC LIFE: navigation grid + A*, stairs, schedules, sitting / eating /
   typing / talking / basketball, teachers, pedestrians.
   ===================================================================== */
function civOpts(){return {f:Math.random()<.4,hair:HCOLS[Math.floor(Math.random()*6)],style:['short','spiky','bob'][Math.floor(Math.random()*3)],skin:SKINS[Math.floor(Math.random()*4)],
  shirt:[0xe74c3c,0xf1c40f,0x3498db,0x1abc9c,0xecf0f1,0xe67e22][Math.floor(Math.random()*6)],pants:0x2c3e50,tie:0,noTie:1,lite:1}}
const NAV={x0:-33,z0:-29,s:.5,nx:132,nz:122,g:[]};
const navI=(x,z)=>{const i=Math.floor((x-NAV.x0)/NAV.s),j=Math.floor((z-NAV.z0)/NAV.s);return (i<0||j<0||i>=NAV.nx||j>=NAV.nz)?-1:j*NAV.nx+i};
const navXZ=k=>[NAV.x0+(k%NAV.nx+.5)*NAV.s,NAV.z0+(Math.floor(k/NAV.nx)+.5)*NAV.s];
const navFree=(f,x,z)=>{const k=navI(x,z);return k>=0&&!NAV.g[f][k]};
function buildNav(){
  doors.forEach(d=>d.col.off=true);
  for(let f=0;f<4;f++){const g=NAV.g[f]=new Uint8Array(NAV.nx*NAV.nz);
    for(let k=0;k<g.length;k++){const [x,z]=navXZ(k);
      // stair wells are only traversed by the explicit stair routes
      const inA=x>7.8&&x<14.2&&z>-14.1&&z<-5.9,inB=x>-14.2&&x<-7.8&&z>-.1&&z<8.1;
      if(inA||inB||blocked(x,z,f*H+.02,.3))g[k]=1}
    // keep only the region connected to the corridor / yard (removes void cells and closed pockets)
    const seed=f==0?navI(0,26.5):navI(-21.5,-17.5),seen=new Uint8Array(g.length),q=[seed];seen[seed]=1;
    while(q.length){const k=q.pop(),i=k%NAV.nx,j=Math.floor(k/NAV.nx);for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=NAV.nx||jj>=NAV.nz)continue;const n=jj*NAV.nx+ii;if(!seen[n]&&!g[n]){seen[n]=1;q.push(n)}}}
    NAV.g[f]=g;for(let k=0;k<g.length;k++)if(!seen[k])g[k]=1}
  doors.forEach(d=>d.col.off=false)}
function snapFree(f,x,z){if(navFree(f,x,z))return [x,z];for(let r=1;r<14;r++)for(let a=0;a<16;a++){const nx=x+Math.cos(a/16*6.283)*r*.5,nz=z+Math.sin(a/16*6.283)*r*.5;if(navFree(f,nx,nz))return [nx,nz]}return [x,z]}
const los=(f,x0,z0,x1,z1)=>{const d=Math.hypot(x1-x0,z1-z0),n=Math.ceil(d/.25);for(let i=1;i<n;i++){const t=i/n;if(!navFree(f,x0+(x1-x0)*t,z0+(z1-z0)*t))return false}return true};
function astar(f,sx,sz,gx,gz){const g=NAV.g[f],nx=NAV.nx;let s=navI(sx,sz),e=navI(gx,gz);if(s<0||e<0)return null;
  if(g[s]){const p=snapFree(f,sx,sz);s=navI(p[0],p[1])}if(g[e]){const p=snapFree(f,gx,gz);e=navI(p[0],p[1])}if(s<0||e<0||g[s]||g[e])return null;
  const N=g.length,gs=new Float32Array(N).fill(1e9),from=new Int32Array(N).fill(-1),closed=new Uint8Array(N),heap=[[0,s]];gs[s]=0;const ex=e%nx,ez=Math.floor(e/nx);
  const hp=(k)=>{const dx=Math.abs(k%nx-ex),dz=Math.abs(Math.floor(k/nx)-ez);return (dx+dz)+(1.414-2)*Math.min(dx,dz)};
  const push=it=>{heap.push(it);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p}};
  const pop=()=>{const t=heap[0],l=heap.pop();if(heap.length){heap[0]=l;let i=0;for(;;){let a=2*i+1,b=a+1,m=i;if(a<heap.length&&heap[a][0]<heap[m][0])m=a;if(b<heap.length&&heap[b][0]<heap[m][0])m=b;if(m==i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m}}return t};
  let guard=0;while(heap.length&&guard++<30000){const [,k]=pop();if(k==e)break;if(closed[k])continue;closed[k]=1;const i=k%nx,j=Math.floor(k/nx);
    for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++){if(!di&&!dj)continue;const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=nx||jj>=NAV.nz)continue;const n=jj*nx+ii;if(g[n]||closed[n])continue;
      if(di&&dj&&(g[j*nx+ii]||g[jj*nx+i]))continue;const c=gs[k]+(di&&dj?1.414:1);if(c<gs[n]){gs[n]=c;from[n]=k;push([c+hp(n),n])}}}
  if(from[e]<0&&e!=s)return null;const pts=[];for(let k=e;k!=-1;k=from[k])pts.push(navXZ(k));pts.reverse();
  // string pulling
  const out=[pts[0]];let a=0;while(a<pts.length-1){let b=pts.length-1;while(b>a+1&&!los(f,pts[a][0],pts[a][1],pts[b][0],pts[b][1]))b--;out.push(pts[b]);a=b}
  out.shift();return out}
/* stair polylines (x,z) per direction. L = base level of the flight */
function stairPts(which,up){const pts=[];
  if(which=='A'){pts.push([9.25,-14.6],[9.25,-14.0],[9.25,-8.0],[9.25,-7.0],[12.75,-7.0],[12.75,-8.0],[12.75,-14.0],[12.75,-15.2]);}
  else{pts.push([-12.75,9.0],[-12.75,8.0],[-12.75,2.0],[-12.75,1.0],[-9.25,1.0],[-9.25,2.0],[-9.25,8.0],[-9.25,9.2]);}
  return up?pts:pts.slice().reverse()}
const stairEntry=(w,f)=>w=='A'?[9.25,-15.0]:[-12.75,9.4],stairExit=(w)=>w=='A'?[12.75,-15.6]:[-9.25,9.5];
function route(fa,xa,za,fb,xb,zb){ // returns [{x,z,f,stair}]
  const out=[];
  if(fa==fb){const p=astar(fa,xa,za,xb,zb);return p?p.map(q=>({x:q[0],z:q[1],f:fa})):null}
  const dir=fb>fa?1:-1;
  // choose stairs: A (north side) or B (south side) whichever is nearer the start
  const dA=Math.hypot(xa-9.25,za+15),dB=Math.hypot(xa+12.75,za-9.4),w=dA<=dB?'A':'B';
  let f=fa;
  const gt=(f0,from,to)=>{const p=astar(f0,from[0],from[1],to[0],to[1]);return p?p.map(q=>({x:q[0],z:q[1],f:f0})):null};
  if(dir>0){let p=gt(f,[xa,za],w=='A'?[9.25,-15.2]:[-12.75,9.3]);if(!p)return null;out.push(...p);
    while(f<fb){stairPts(w,true).forEach((q,i)=>out.push({x:q[0],z:q[1],f:i>3?f+1:f,stair:1,lvl:f}));f++}
    const ex=w=='A'?[12.75,-15.2]:[-9.25,9.2];const p2=gt(f,ex,[xb,zb]);if(!p2)return null;out.push(...p2);return out}
  // going down: enter at the upper landing
  {let p=gt(f,[xa,za],w=='A'?[12.75,-15.2]:[-9.25,9.2]);if(!p)return null;out.push(...p);
    while(f>fb){stairPts(w,false).forEach((q,i)=>out.push({x:q[0],z:q[1],f:i>3?f-1:f,stair:1,lvl:f-1,down:1}));f--}
    const p2=gt(f,w=='A'?[9.25,-15.2]:[-12.75,9.3],[xb,zb]);if(!p2)return null;out.push(...p2);return out}}

/* ---------- agents ---------- */
const agents=[];let agId=0;
function setSit(a,on,lowerBy){const u=a.g.userData;a.sitting=on;if(on){u.l1.rotation.x=u.l2.rotation.x=-1.25;a.g.userData.sitOff=lowerBy==null?.36:lowerBy}else{u.sitOff=0;u.l1.rotation.x=u.l2.rotation.x=0}}
function mkAgent(name,o,role,extra){const g=makeChar(o,name,scene);g.visible=false;const a=Object.assign({id:agId++,g,name,role,x:0,z:0,f:0,path:null,pi:0,act:'idle',place:'gone',pkey:'',wait:Math.random()*3,sp:1.3+Math.random()*.4,sitting:false,seat:null,phase:Math.random()*6,off:Math.random()*8,rot:0,talkT:0,y:0,gone:true,q:0},extra||{});
  g.userData.sitOff=0;npcs.push(a);agents.push(a);a.stu=role!='staff'&&role!='civ';return a}
const NAMES=['Mika','Joshua','Angel','Carlo','Bea','Renz','Ella','Paolo','Jade','Kyle','Nica','Dan','Liza','Marco','Trixie','Jun','Ivy','Leo','Rica','Noel','Gina','Alex','Pia','Toni'];
const KEYNPC={};
const stuOpts=i=>{const k=CK[i%5],c=COURSES[k],f=i%2==1;let st=STY[(i*3)%7][0],hr=HCOLS[i%6];
  if(k=='CRIM'){st=f?'bun':'bald';if(f)hr=0x111111}else if(!f&&st!='short'&&st!='spiky')st='short';
  const casual=(i%5==3);return {f,hair:hr,style:st,skin:SKINS[i%4],shirt:casual?[0xe67e22,0xe74c3c,0x9b59b6,0x16a085][i%4]:c.shirt,pants:casual?0x3a3f4a:c.pants,tie:c.tie,noTie:casual,lite:1,bag:[0x2a3350,0x7a2a2a,0x2a5a3a][i%3]}};
function roomByName(n){return rooms.find(r=>r.n==n)}
function seatsOf(room,type){return seats.filter(s=>s.room==room&&s.type==type)}
const HANG={benches:[],talks:[]};
function buildNpcs(){
  buildNav();
  // ---- staff (instructors, vendors, guard, coach) ----
  const mkT=(name,room,o,role,extra)=>{const r=roomByName(room);const a=mkAgent(name,Object.assign({lite:1,tie:0x222233,noTie:0},o),'staff',Object.assign({room:r,staff:role},extra||{}));a.sp=1.1;KEYNPC[name]=a;return a};
  [['Sir Cruz','Room 203',{f:false,hair:0x2a1a0e,style:'short',skin:SKINS[1],shirt:0x2f4f7a,pants:0x222233},'teacher'],
   ["Ma'am Lopez",'Room 303',{f:true,hair:0x2a1a0e,style:'bun',skin:SKINS[0],shirt:0x7a2f5a,pants:0x222233},'teacher'],
   ["Ma'am Santos",'Room 403',{f:true,hair:0x1a1a1a,style:'long',skin:SKINS[1],shirt:0x2f7a5a,pants:0x222233},'teacher'],
   ['Sir Ben','Computer Lab 1',{f:false,hair:0x111111,style:'spiky',skin:SKINS[2],shirt:0x4a2f7a,pants:0x222233},'lab'],
   ["Ma'am Reyes",'Faculty Room',{f:true,hair:0x2a1a0e,style:'bun',skin:SKINS[1],shirt:0x4a2f7a,pants:0x222233},'faculty'],
   ['Ms. Ria','Library',{f:true,hair:0x3a2210,style:'pony',skin:SKINS[0],shirt:0x8e5bb5,pants:0x2b2b3a},'librarian'],
   ['Ate Rose','Canteen',{f:true,hair:0x2a1a0e,style:'bun',skin:SKINS[2],shirt:0xe74c3c,pants:0x2c3e50,noTie:1},'vendor'],
   ["Ma'am Tess",'School Store',{f:true,hair:0x555555,style:'bob',skin:SKINS[1],shirt:0x2f6fbf,pants:0x2c3e50},'store'],
   ['Principal Dela Cruz',"Principal's Office",{f:false,hair:0x777777,style:'short',skin:SKINS[1],shirt:0x111122,pants:0x111122,tie:0xc0392b},'principal']].forEach(([n,r,o,role])=>mkT(n,r,o,role));
  // ---- students ----
  const rooms3=['Room 203','Room 303','Room 403'].map(roomByName),lab=roomByName('Computer Lab 1'),lib=roomByName('Library');
  const cfg=[ // name,role,room index/hangType
   ['Mika','cls',0,'talk'],['Joshua','cls',1,'bench'],['Angel','cls',2,'talk'],['Carlo','baller',0,'wander'],['Bea','cls',0,'talk'],['Renz','baller',1,'bench'],
   ['Ella','cls',2,'bench'],['Paolo','lab',0,'wander'],['Jade','lab',0,'talk'],['Kyle','baller',2,'wander'],['Nica','cls',1,'talk'],['Dan','baller',0,'bench'],
   ['Liza','lib',0,'bench'],['Marco','lib',0,'wander'],['Trixie','cls',0,'talk'],['Jun','cls',1,'bench'],['Ivy','walker',0,'wander'],['Leo','walker',0,'wander'],
   ['Rica','cls',2,'talk'],['Noel','lab',0,'wander'],['Gina','walker',0,'wander'],['Alex','cls',1,'wander'],['Pia','lab',0,'talk'],['Toni','walker',0,'wander']];
  const used=new Set();
  cfg.forEach(([n,role,ri,hang],i)=>{const a=mkAgent(n,stuOpts(i),role,{hang,cls:rooms3[ri%3]});KEYNPC[n]=a;a.sp=1.25+(i%4)*.12;
    const pool=seatsOf(a.cls,'class').filter(s=>!used.has(s));const s=pool[(i*5)%Math.max(1,pool.length)];if(s){used.add(s);a.seat=s}
    if(role=='lab'){const lp=pcs.filter(p=>p.room==lab&&!used.has(p.seat));const p=lp[i%lp.length];if(p){used.add(p.seat);a.lseat=p.seat}}
    if(role=='lib'){const ls=seatsOf(lib,'lib').filter(x=>!used.has(x));const s2=ls[0];if(s2){used.add(s2);a.libseat=s2}}});
  // ---- outside: guard, street vendor, tricycle drivers, pedestrians ----
  const gd=makeChar({f:false,hair:0x111111,style:'short',skin:SKINS[1],shirt:0x2b3a55,pants:0x1b2438,tie:0x111111,lite:1},'Manong Guard',scene);gd.position.set(5.6,0,23.2);gd.rotation.y=Math.PI/2;
  const ag=Object.assign({g:gd,name:'Manong Guard',role:'staff',staff:'guard',fixed:1,x:5.6,z:23.2,y:0,f:0,act:'idle',id:agId++,phase:1,sp:1},{});npcs.push(ag);agents.push(ag);KEYNPC['Manong Guard']=ag;
  const vd=makeChar({f:true,hair:0x2a1a0e,style:'bun',skin:SKINS[1],shirt:0xe74c3c,pants:0x2c3e50,tie:0,noTie:1,lite:1},'Aling Nena',scene);vd.position.set(6,0,51.8);vd.rotation.y=Math.PI;
  const av={g:vd,name:'Aling Nena',role:'staff',staff:'streetvendor',fixed:1,x:6,z:51.8,y:0,f:0,act:'idle',id:agId++,phase:2,sp:1};npcs.push(av);agents.push(av);KEYNPC['Aling Nena']=av;
  const cn=makeChar({f:false,hair:0x111111,style:'short',skin:SKINS[2],shirt:0xf5f5f5,pants:0x1c2f6b,tie:0,noTie:1,lite:1},'Coach Dan',scene);cn.position.set(0,0,-10.6);cn.rotation.y=Math.PI;
  const ac={g:cn,name:'Coach Dan',role:'staff',staff:'coach',fixed:1,x:0,z:-10.6,y:0,f:0,act:'idle',id:agId++,phase:3,sp:1};npcs.push(ac);agents.push(ac);KEYNPC['Coach Dan']=ac;
  // pedestrians along sidewalks (simple patrols, outside the campus)
  const civN=(i,p,sp)=>{const o=civOpts();o.f=i%2==0;const g=makeChar(o,NAMES[(i*5)%24],scene);g.position.set(p[0][0],0,p[0][1]);npcs.push({g,p,i:1,sp:sp||1.4,y:0,civ:1,name:'Pedestrian',role:'civ',id:agId++,stu:0})};
  civN(0,[[-56,27.5],[56,27.5]]);civN(1,[[56,28.7],[-56,28.7]],1.6);civN(2,[[-40,27.8],[30,27.8]],1.2);civN(3,[[50,28.3],[-20,28.3]],1.3);
  civN(4,[[-56,48.6],[56,48.6]],1.3);civN(5,[[56,50],[-56,50]],1.5);civN(6,[[0,29],[0,47]],1.2);civN(7,[[-30,49.5],[-8,49.5],[-8,52],[-30,52]],1.2);
  // tricycle terminals: driver + trike at the school gate and at the boarding house
  [[4,32.3,-Math.PI/2,'Mang Berto','school'],[-6.5,48.8,Math.PI/2,'Mang Ador','house']].forEach(([x,z,r,n,key])=>{
    const t=makeTrike(0x2f6fbf,0xf2c21b,0,civOpts);t.position.set(x,0,z);t.rotation.y=r;scene.add(t);TERMINAL[key]={x,z,trike:t,name:n};
    colliders.push({x1:x-1.3,x2:x+1.3,z1:z-1.2,z2:z+1.2,y0:0,y1:1.6});
    label('Tricycle Terminal',x,3.1,z,3.4,.68);
    addAct({x,y:0,z,r:3.2,t:'Ride a tricycle',kind:'ride',key,fn:()=>rideMenu(key)})});
  // moving traffic extras
  buildTrafficExtras();
  // player's own tricycle (drive it!)
  buildPlayerTrike();
  // basketball players get their court + ball set up in buildCourt()
  }
const TERMINAL={};
/* ---------- schedule ---------- */
const inRange=(c,a,b)=>c>=a&&c<b;
function inClass(c){return CLASSES.some(k=>c>=k.start-4&&c<k.start+CLS_LEN-6)}
function placeFor(a,c){
  if(a.fixed||a.civ)return 'fixed';
  if(a.staff){const r=a.staff;if(r=='teacher'||r=='lab'){return inClass(c)?'teach':(c>=1080||c<420?'gone':'desk')}
    if(r=='faculty'||r=='principal'||r=='librarian'||r=='vendor'||r=='store'){return (c>=1020||c<450)?'gone':'post'}return 'post'}
  const lab=inRange(c,600,690)||inRange(c,780,870),lunch=inRange(c,690,780);
  if(c>=1140||c<420)return 'gone';
  if(c>=1050)return 'leave';
  if(a.role=='walker')return inRange(c,420,1050)?'wander':'gone';
  if(a.role=='lib'){if(inRange(c,510,690)||inRange(c,810,990))return 'lib';if(lunch)return 'eat'}
  if(a.role=='lab'&&lab)return 'lab';
  if(a.role=='baller'&&inRange(c,900,1050))return 'court';
  if(inClass(c))return 'seat';
  if(lunch)return 'eat';
  return a.hang=='bench'?'bench':a.hang=='talk'?'talk':'wander'}
const TALKSPOTS=[[-4.5,1.2],[4.5,1.2],[0,7.8],[12,-1.2],[-3,-11.5],[-9,-12.5],[16,6]];
const rand=(a,b)=>a+Math.random()*(b-a);
function freeSeatOf(type,out){const l=seats.filter(s=>s.type==type&&!s.taken&&(out==null||!!s.out==out));return l.length?l[Math.floor(Math.random()*l.length)]:null}
function claim(a,s){release(a);if(s){s.taken=a.id;a.cur=s}return s}
function release(a){if(a.cur){if(a.cur.taken==a.id)a.cur.taken=null;a.cur=null}}
/* choose destination for an agent: returns {f,x,z,rot,act,seat} */
function destFor(a,pl,c){
  const floorOf=y=>Math.round(y/H);
  switch(pl){
   case 'seat':{const s=claim(a,a.seat);if(!s)return destFor(a,'wander',c);return {f:floorOf(s.y),x:s.x,z:s.z,rot:s.rot,act:'listen',seat:s}}
   case 'lab':{const s=claim(a,a.lseat);if(!s)return destFor(a,'wander',c);return {f:floorOf(s.y),x:s.x,z:s.z,rot:s.rot,act:'type',seat:s}}
   case 'lib':{const s=claim(a,a.libseat);if(!s)return destFor(a,'wander',c);return {f:0,x:s.x,z:s.z,rot:s.rot,act:'study',seat:s}}
   case 'eat':{let s=a.cafe&&!a.cafe.taken?a.cafe:null;if(!s)s=freeSeatOf('cafe',null);if(!s)return destFor(a,'wander',c);a.cafe=s;claim(a,s);return {f:0,x:s.x,z:s.z,rot:s.rot,act:'eat',seat:s}}
   case 'bench':{const s=freeSeatOf('bench',null);if(!s||s.hall&&Math.random()<.3)return destFor(a,'talk',c);claim(a,s);return {f:floorOf(s.y),x:s.x,z:s.z,rot:s.rot,act:Math.random()<.5?'study':'chat',seat:s}}
   case 'talk':{release(a);const gi=(a.id*7)%TALKSPOTS.length,t=TALKSPOTS[gi],k=a.id%3,ang=k*2.1+gi;return {f:0,x:t[0]+Math.cos(ang)*.9,z:t[1]+Math.sin(ang)*.9,rot:Math.atan2(-Math.cos(ang),-Math.sin(ang)),act:'talk'}}
   case 'court':{release(a);const sp=a.id%4,cz=COURT.cz,spots=[[-3,cz-2],[3,cz+2],[-1,cz+3],[2,cz-3]][sp];return {f:0,x:spots[0],z:spots[1],rot:0,act:'play'}}
   case 'wander':{release(a);const r=Math.random(),f=r<.25?1:r<.35?2:0;
     if(f==0){const t=TALKSPOTS[Math.floor(Math.random()*TALKSPOTS.length)];return {f:0,x:t[0]+rand(-2,2),z:t[1]+rand(-2,2),rot:rand(0,6.28),act:'idle',wander:1}}
     return {f,x:rand(-24,24),z:pickA([-17.5,11.5]),rot:rand(0,6.28),act:'idle',wander:1}}
   case 'leave':return {f:0,x:rand(-1.5,1.5),z:27.4,rot:0,act:'idle',leave:1,gone:1}
   case 'teach':{const r=a.room,w=uvw(r,rand(-1.5,1.5),1.5),f=r.f;return {f,x:w.x,z:w.z,rot:rotFront(r)+Math.PI,act:'teach',pace:1}}
   case 'desk':{const s=a.room.tseat;if(!s)return destFor(a,'post',c);return {f:a.room.f,x:s.x,z:s.z,rot:s.rot+Math.PI,act:'type',seat:s,sitStaff:1}}
   case 'post':{const r=a.room,sp=a.staff=='vendor'?vendorSpot:a.staff=='store'?storeSpot:a.staff=='librarian'?librarianSpot:null;
     if(sp&&sp.x!=null)return {f:0,x:sp.x,z:sp.z,rot:rotDoor(r)+(a.staff=='librarian'?0:0),act:'serve'};
     const t=a.room.tseat;if(t)return {f:r.f,x:t.x,z:t.z,rot:t.rot+Math.PI,act:'type',seat:t,sitStaff:1};const w=uvw(r,0,1.4);return {f:r.f,x:w.x,z:w.z,rot:rotFront(r),act:'type'}}
  }
  return {f:0,x:0,z:5,rot:0,act:'idle'}}
function placeAgent(a,d){if(!d.seat&&!a.staff&&!d.snapped){const p=snapFree(d.f,d.x,d.z);d.x=p[0];d.z=p[1];d.snapped=1}a.f=d.f;a.x=d.x;a.z=d.z;a.rot=d.rot;a.g.position.set(d.x,d.f*H,d.z);a.g.rotation.y=d.rot;a.path=null;a.dest=d;applyAct(a,d,true)}
function applyAct(a,d,snap){a.act=d.act;if(d.seat){const s=d.seat;a.x=s.x;a.z=s.z;a.g.position.set(s.x,s.y,s.z);a.g.rotation.y=d.rot;setSit(a,true,s.type=='cafe'||s.type=='bench'?.36:.36);}else{if(a.sitting)setSit(a,false)}
  a.g.userData.book&&(a.g.userData.book.visible=d.act=='study');if(d.act=='study'&&!a.g.userData.book){const b=new THREE.Mesh(new THREE.BoxGeometry(.3,.04,.22),mat(0xf2f2f2));b.position.set(0,1.0,.3);a.g.add(b);a.g.userData.book=b}
  if(d.act=='study'&&a.g.userData.book)a.g.userData.book.visible=true}
const ASTAR_Q=[];
function planTo(a,d){a.dest=d;const fa=a.f,from=a.sitting?[a.x+Math.sin(a.rot+Math.PI)*.5,a.z+Math.cos(a.rot+Math.PI)*.5]:[a.x,a.z];
  if(a.sitting){setSit(a,false);a.g.position.y=a.f*H;const s=a.cur;}
  let r=route(fa,a.g.position.x,a.g.position.z,d.f,d.x,d.z);
  if(!r){const p=snapFree(d.f,d.x,d.z);r=route(fa,a.g.position.x,a.g.position.z,d.f,p[0],p[1])}
  a.path=r&&r.length?r:null;a.pi=0;if(!a.path)placeAgent(a,d)}
function spawnAtGate(a){a.gone=false;a.g.visible=true;const p=[rand(-2,2),27.4];a.x=p[0];a.z=p[1];a.f=0;a.g.position.set(p[0],0,p[1]);if(a.sitting)setSit(a,false)}
let npcClock=0;
function npcThink(a,c,snap){if(a.fixed||a.civ)return;const pl=placeFor(a,c),key=pl+(pl=='wander'?Math.floor(c/45):'');if(key==a.pkey)return;a.pkey=key;
  if(pl=='gone'){release(a);a.g.visible=false;a.gone=true;a.dest=null;a.path=null;a.place=pl;return}
  const d=destFor(a,pl,c);if(!d)return;a.place=pl;
  if(a.gone){if(snap&&!d.gone){a.gone=false;a.g.visible=true;placeAgent(a,d);return}spawnAtGate(a)}
  if(snap&&!d.gone){a.gone=false;a.g.visible=true;placeAgent(a,d);return}
  if(snap&&d.gone){a.g.visible=false;a.gone=true;return}
  a.wait=rand(0,a.off*.4);a.pend=d;if(pl=='leave')a.pend.gone=true}
function snapNpcs(){const c=S.clock;agents.forEach(a=>{a.pkey='';a.path=null;a.pend=null;npcThink(a,c,true)});
  agents.forEach(a=>{if(a.fixed){a.g.visible=true;a.act='idle'}if(a.staff&&!a.gone){a.g.visible=true}})}
/* ---------- per-frame update ---------- */
const NPCY=new Map();
function updateNpcs(dt,now){
  const c=S.clock;npcClock+=dt;
  if(npcClock>1.5){npcClock=0;agents.forEach(a=>npcThink(a,c,false))}
  // doors open for walking NPCs
  doors.forEach(d=>{if(d.hold>0)d.hold-=dt});
  let planned=0;
  for(const a of npcs){const g=a.g,gp=g.position;
    const vis=Math.abs(gp.y-P.y)<5&&Math.abs(gp.x-P.x)<75&&Math.abs(gp.z-P.z)<75;
    if(a.civ){g.visible=vis;if(!vis)continue;const t=a.p[a.i],dx=t[0]-gp.x,dz=t[1]-gp.z,d=Math.hypot(dx,dz);if(d<.3)a.i=(a.i+1)%a.p.length;else{gp.x+=dx/d*a.sp*dt;gp.z+=dz/d*a.sp*dt;g.rotation.y=Math.atan2(dx,dz);anim(g,now/150,.5)}continue}
    if(a.gone){g.visible=false;continue}
    g.visible=vis;const lb=g.userData.lbl;if(lb)lb.visible=vis&&Math.hypot(gp.x-P.x,gp.z-P.z)<14;
    if(a.fixed){anim_idle(a,now);continue}
    if(a.pend&&a.wait>0){a.wait-=dt;if(a.wait<=0&&!vis&&Math.random()<2){/* off-screen agents do not need to walk */}}
    if(a.pend&&a.wait<=0&&!a.path){if(planned<2||!vis){planTo(a,a.pend);a.pend=null;planned++;if(!vis&&a.path){/* teleport unseen agents to destination, keeps cost low */placeAgent(a,a.dest);continue}}}
    if(a.path){const w=a.path[a.pi];if(!w){a.path=null;arrive(a);continue}
      const dx=w.x-gp.x,dz=w.z-gp.z,d=Math.hypot(dx,dz);
      if(d<.18){a.pi++;if(a.pi>=a.path.length){a.path=null;arrive(a)}continue}
      let sp=a.sp*(w.stair?.9:1);let mx=dx/d,mz=dz/d;
      // simple avoidance of the player and other characters ahead
      let sx=0,sz=0;if(vis){for(const o of npcs){if(o===a||o.gone||!o.g.visible||o.sitting)continue;const ox=gp.x-o.g.position.x,oz=gp.z-o.g.position.z;if(Math.abs(ox)>1.1||Math.abs(oz)>1.1)continue;const od=Math.hypot(ox,oz);if(od<.75&&od>.01){const ahead=-(ox*mx+oz*mz)/od;if(ahead>-.2){sx+=ox/od*(.8-od);sz+=oz/od*(.8-od);if(ahead>.6)sp*=.45}}}
        const px=gp.x-P.x,pz=gp.z-P.z,pd=Math.hypot(px,pz);if(pd<1&&Math.abs(gp.y-P.y)<1.5){sx+=px/pd*(1-pd);sz+=pz/pd*(1-pd);sp*=.5}}
      let vx=mx*sp+sx*1.6,vz=mz*sp+sz*1.6;const nx=gp.x+vx*dt,nz=gp.z+vz*dt;
      if(w.stair||navFree(w.f==null?a.f:Math.round(gp.y/H),nx,nz)||!vis){gp.x=nx;gp.z=nz}else{gp.x+=mx*sp*dt;gp.z+=mz*sp*dt}
      g.rotation.y=Math.atan2(vx,vz);a.f=w.f;
      const ty=support(gp.x,gp.z,gp.y+(w.stair?.35:0));gp.y+=(ty-gp.y)*Math.min(1,dt*(w.stair?14:8));if(Math.abs(gp.y-ty)<.01)gp.y=ty;
      if(vis)anim(g,now/(sp>1.6?100:140)+a.phase,.5);
      // doors
      if(vis)for(const dr of doors){if(Math.abs(dr.r.f*H-gp.y)>2)continue;if(Math.abs(dr.cx-gp.x)<2.4&&Math.abs(dr.cz-gp.z)<2.4){dr.hold=1.6;if(!dr.open){toggleDoor(dr,true);dr.byNpc=true}}}
    }else{ if(vis)anim_idle(a,now)}
  }
  // close doors that NPCs opened
  for(const dr of doors){if(dr.byNpc&&dr.open&&dr.hold<=0&&Math.hypot(P.x-dr.cx,P.z-dr.cz)>1.8){toggleDoor(dr,false);dr.byNpc=false}
    else if(!dr.byNpc&&dr.open&&Math.hypot(P.x-dr.cx,P.z-dr.cz)>14&&dr.hold<=0){toggleDoor(dr,false)}}
  updateBallers(dt)}
function arrive(a){const d=a.dest;if(!d)return;if(d.gone&&d.leave){release(a);a.gone=true;a.g.visible=false;return}placeAgent(a,d)}
function anim_idle(a,now){const g=a.g,u=g.userData,t=now/1000+a.phase;const sit=a.sitting;
  g.position.y=(a.f*H+(a.fixed?0:0))+(sit?(a.cur?a.cur.y-a.f*H:0)-(u.sitOff||0):0);if(a.fixed)g.position.y=0;
  const ar=(l,r)=>{u.a1.rotation.x=l;u.a2.rotation.x=r};
  switch(a.act){
   case 'type':ar(-1.15+Math.sin(t*18)*.06,-1.15+Math.sin(t*15+1)*.06);break;
   case 'eat':ar(-.3,-1.0-Math.max(0,Math.sin(t*2.2))*.9);if(Math.sin(t*2.2)>.95&&a.g.visible&&Math.hypot(a.g.position.x-P.x,a.g.position.z-P.z)<8)sfx('eat',{x:a.g.position.x,y:1,z:a.g.position.z});break;
   case 'study':ar(-1.0,-1.0);u.a1.rotation.z=u.a2.rotation.z=0;break;
   case 'listen':ar(Math.sin(t*.5)*.05,Math.sin(t*.6)*.05);break;
   case 'talk':case 'chat':{const k=Math.sin(t*2.1)>0;ar(k?-.5-Math.sin(t*5)*.3:-.1,k?-.1:-.6-Math.sin(t*4)*.3);g.rotation.y=a.rot+Math.sin(t*.8)*.25;break}
   case 'teach':{ar(-.7-Math.sin(t*1.7)*.5,-.2+Math.sin(t*1.3)*.2);if(a.pace&&!a.sitting)g.position.x=a.dest.x+Math.sin(t*.4)*1.2;g.rotation.y=a.rot+Math.sin(t*.3)*.5;break}
   case 'serve':ar(-.4+Math.sin(t*1.4)*.2,Math.sin(t)*.1);break;
   case 'play':playerAnim(a,t);break;
   default:ar(Math.sin(t*.7)*.04,Math.sin(t*.8)*.04);if(!sit){u.l1.rotation.x*=.8;u.l2.rotation.x*=.8}}
  if(sit){u.l1.rotation.x=u.l2.rotation.x=-1.25}}
/* ---------- basketball players ---------- */
let bbT=3,bbShooter=null,bbPhase=0;
function playerAnim(a,t){const u=a.g.userData;u.a1.rotation.x=-.6+Math.sin(t*9)*.5;u.a2.rotation.x=-.6-Math.sin(t*9)*.5;const mv=Math.sin(t*1.3);u.l1.rotation.x=Math.sin(t*6)*.5*(mv>0?1:.2);u.l2.rotation.x=-Math.sin(t*6)*.5*(mv>0?1:.2);a.g.position.x=a.dest.x+Math.sin(t*.9+a.id)*1.8;a.g.position.z=a.dest.z+Math.cos(t*.7+a.id)*1.4;a.g.rotation.y=Math.sin(t*.9+a.id)>0?Math.PI/2:-Math.PI/2}
function updateBallers(dt){const ball=BALLS.npc;if(!ball)return;const pl=agents.filter(a=>a.place=='court'&&!a.gone&&a.path==null&&a.act=='play');AUC.courtPlay=pl.length>=2;
  if(ball.st=='fly'){ball.step(dt,(h)=>{sfx('swish',{x:h.x,y:3,z:h.z})});return}
  if(pl.length<2){if(ball.st=='held')ball.rest(2,-4.5);return}
  bbT-=dt;if(ball.st=='floor'&&bbT<=0){const sh=pl[Math.floor(Math.random()*pl.length)],h=HOOPS[Math.random()<.5?0:1],gp=sh.g.position;
    ball.shoot({x:gp.x,y:2.0,z:gp.z},h,Math.random()<.55,'npc');sfx('pass',{x:gp.x,y:1,z:gp.z});bbT=rand(5,9)}
  else if(ball.st=='floor'){ // ball lies there until the next shot; a player jogs to pick it up visually
    const sh=pl[0];ball.x+=(sh.g.position.x-ball.x)*Math.min(1,dt*.8);ball.z+=(sh.g.position.z-ball.z)*Math.min(1,dt*.8);ball.y=.13+Math.abs(Math.sin(performance.now()/180))*.55;ball.sync();if(Math.sin(performance.now()/180)>.985)sfx('bounce',{x:ball.x,y:.2,z:ball.z})}}
