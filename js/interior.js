/* =====================================================================
   INTERIOR: realistic doors + glass, room furnishing, library / canteen /
   computer lab / comfort rooms, boarding house, basketball court + hoops,
   outdoor furniture, seats + interactables, day/night lighting, shadows.
   ===================================================================== */
const seats=[],acts=[],pcs=[],shelves=[],benches=[];
const addAct=o=>{acts.push(o);return o};
const uvw=(r,u,v)=>{const p=uv(r,u,v);return {x:p[0],z:p[1]}};
const rotFront=r=>({S:Math.PI,N:0,E:-Math.PI/2,W:Math.PI/2}[r.d]);   // facing the far wall (blackboard side)
const rotDoor=r=>({S:0,N:Math.PI,E:Math.PI/2,W:-Math.PI/2}[r.d]);    // facing the door
function fbc(r,y0,u,v,uw,vd,h,c,solid,inst){const [x,z]=uv(r,u,v),ns=r.d=='S'||r.d=='N',sx=ns?uw:vd,sz=ns?vd:uw;
  ibc(inst||IC,x-sx/2,y0,z-sz/2,x+sx/2,y0+h,z+sz/2,c);if(solid)colliders.push({x1:x-sx/2,x2:x+sx/2,z1:z-sz/2,z2:z+sz/2,y0,y1:y0+h})}
const WOOD=0x8b5a2b,DWOOD=0x5a3a1c,WHITE=0xf4f4f0,METAL=0x9aa3a8,BLUE=0x3a6ea5,SCREEN=0x4ab0ff;
const roomCenter=r=>({x:(r.x1+r.x2)/2,z:(r.z1+r.z2)/2,y:r.f*H});
const GLASSM=new THREE.MeshPhongMaterial({color:0x9fd4ea,specular:0xffffff,shininess:100,transparent:true,opacity:.42,depthWrite:false});

/* ---------- doors ---------- */
const dtx={};
function doorTex(kind){if(dtx[kind])return dtx[kind];const c=document.createElement('canvas');c.width=128;c.height=256;const g=c.getContext('2d');
  const base={class:'#2f8f7a',cr:'#4f78b0',glass:'#b98a52',wood:'#8b5a2b'}[kind];g.fillStyle=base;g.fillRect(0,0,128,256);
  g.strokeStyle='rgba(0,0,0,.28)';g.lineWidth=3;g.strokeRect(10,10,108,236);
  if(kind=='wood'||kind=='cr'){g.strokeRect(24,26,80,92);g.strokeRect(24,140,80,92);g.fillStyle='rgba(255,255,255,.07)';g.fillRect(26,28,76,88);g.fillRect(26,142,76,88)}
  else{g.strokeRect(18,150,92,88);g.fillStyle='rgba(255,255,255,.08)';g.fillRect(20,152,88,84);
    const gr=g.createLinearGradient(26,28,102,130);gr.addColorStop(0,'#cfeaf7');gr.addColorStop(.5,'#8cc4de');gr.addColorStop(1,'#bfe3f2');g.fillStyle=gr;g.fillRect(26,28,76,102);
    g.fillStyle='rgba(255,255,255,.55)';g.beginPath();g.moveTo(40,28);g.lineTo(58,28);g.lineTo(34,130);g.lineTo(26,130);g.fill();g.beginPath();g.moveTo(70,28);g.lineTo(78,28);g.lineTo(54,130);g.lineTo(48,130);g.fill();
    g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=4;g.strokeRect(26,28,76,102)}
  if(kind=='cr'){g.fillStyle='#fff';g.font='bold 30px Arial';g.textAlign='center';g.fillText('WC',64,200)}
  const t=new THREE.CanvasTexture(c);return dtx[kind]=t}
function makeDoor(r,vert,ax,az,c,y,cx,cz,kindOv){
  const kind=kindOv||(r.cls?'class':r.cr?'cr':(r.n=='Library'||r.n=='Canteen'||r.lab||r.n=='School Store')?'glass':'wood'),hx2=vert?ax:c-1,hz=vert?c-1:az;
  const g=new THREE.Group();g.position.set(hx2,y,hz);
  const leaf=new THREE.Mesh(new THREE.BoxGeometry(vert?.07:1.9,2.5,vert?1.9:.07),new THREE.MeshLambertMaterial({map:doorTex(kind)}));leaf.position.set(vert?0:1,1.28,vert?1:0);g.add(leaf);
  if(kind=='class'||kind=='glass'){const gp=new THREE.Mesh(new THREE.BoxGeometry(vert?.09:.74,.98,vert?.74:.09),GLASSM);gp.position.set(vert?0:.97,1.77,vert?.97:0);g.add(gp)}
  [-1,1].forEach(s=>{const h=new THREE.Mesh(new THREE.BoxGeometry(vert?.16:.04,.04,vert?.04:.16),mat(0xd8dde0));h.position.set(vert?.1*s:1.78,1.1,vert?1.78:.1*s);g.add(h)});
  scene.add(g);
  // frame (jambs + top) and lintel above the door so the wall is closed up to the ceiling
  const fc=kind=='wood'?DWOOD:0x374a45,fr=(x1,y1,z1,x2,y2,z2)=>ibc(IC,x1,y+y1,z1,x2,y+y2,z2,fc);
  if(vert){fr(ax-.17,0,c-1-.07,ax+.17,2.62,c-1+.03);fr(ax-.17,0,c+1-.03,ax+.17,2.62,c+1+.07);fr(ax-.17,2.55,c-1,ax+.17,2.65,c+1);ib(IY,ax-.15,y+2.65,c-1,ax+.15,y+H,c+1)}
  else{fr(c-1-.07,0,az-.17,c-1+.03,2.62,az+.17);fr(c+1-.03,0,az-.17,c+1+.07,2.62,az+.17);fr(c-1,2.55,az-.17,c+1,2.65,az+.17);ib(IY,c-1,y+2.65,az-.15,c+1,y+H,az+.15)}
  const col=vert?{x1:hx2-.1,x2:hx2+.1,z1:hz,z2:hz+2,y0:y,y1:y+2.6}:{x1:hx2,x2:hx2+2,z1:hz-.1,z2:hz+.1,y0:y,y1:y+2.6};colliders.push(col);
  const d={g,col,sw:{S:1,N:-1,E:-1,W:1}[r.d]*Math.PI/2,open:false,t:0,r,cx,cz,kind,vert,hold:0};doors.push(d);return d}
function toggleDoor(d,open){const o=open===undefined?!d.open:open;if(o==d.open)return;d.open=o;sfx(o?'door':'doorclose',{x:d.cx,y:d.r.f*H+1,z:d.cz})}
function animDoors(dt){const k=Math.min(1,dt*6);for(const d of doors){const tg=d.open?1:0;if(Math.abs(tg-d.t)>.003){d.t+=(tg-d.t)*k;d.g.rotation.y=d.sw*d.t}d.col.off=d.t>.55}}

/* ---------- furnishing ---------- */
function ceilLights(r,y,D,n){for(let i=0;i<n;i++)fb(r,y+3.62,0,D*(i+.5)/n,1.6,.3,.08,IL)}
function wallClock(r,y,u,v){fbc(r,y+2.8,u,v,.42,.04,.42,0x222222);fbc(r,y+2.83,u,v+.025,.34,.02,.34,0xfafafa,false)}
function chair(r,y,u,v,c,type,extra){ // seat at (u,v), back toward the door side (v+)
  fbc(r,y+.42,u,v,.45,.45,.06,c||BLUE);fbc(r,y+.48,u,v+.2,.45,.05,.5,c||BLUE);fbc(r,y,u-.18,v-.18,.05,.05,.42,METAL);fbc(r,y,u+.18,v+.18,.05,.05,.42,METAL);fbc(r,y,u-.18,v+.18,.05,.05,.42,METAL);fbc(r,y,u+.18,v-.18,.05,.05,.42,METAL);
  const w=uvw(r,u,v);if(type){const s={x:w.x,y,z:w.z,rot:rotFront(r),type,room:r};if(extra)Object.assign(s,extra);seats.push(s);return s}}
function desk(r,y,u,v,w,d,c){const top=c||WOOD;fbc(r,y+.7,u,v,w,d,.06,top,true);fbc(r,y,u-w/2+.04,v,.05,d-.06,.7,METAL);fbc(r,y,u+w/2-.04,v,.05,d-.06,.7,METAL)}
function monitor(r,y,u,v,face){fbc(r,y+.76,u,v,.45,.2,.03,0x2b2f36);fbc(r,y+.8,u,v,.08,.06,.15,0x2b2f36);fbc(r,y+.9,u,v,.52,.04,.32,0x15181c);fbc(r,y+.92,u,v+.026*(face||1),.46,.01,.26,SCREEN,false,ICB)}
function laptop(r,y,u,v){fbc(r,y+.76,u,v,.34,.24,.02,0x30343a);fbc(r,y+.78,u,v-.12,.34,.02,.22,0x15181c);fbc(r,y+.79,u,v-.115,.3,.01,.18,SCREEN,false,ICB)}
function bookshelf(r,y,u,v,w,d,cat,rows){const rr=rows||5;fbc(r,y,u,v,w,d,2.25,0x6b4a2a,true);
  for(let k=0;k<rr;k++){const yy=y+.15+k*.42;fbc(r,yy,u,v,w-.1,d+.02,.03,0x7d5a36);
    const nb=Math.floor((w>d?w:d)/.1);for(let b=0;b<nb;b++){const bh=.22+Math.random()*.15,bc=[0xc0392b,0x2f6fbf,0x2e9e5b,0xf2c21b,0x8e5bb5,0xe67e22,0xeeeeee,0x34495e][Math.floor(Math.random()*8)];
      const off=-(w>d?w:d)/2+.08+b*.1;if(w>d)fbc(r,yy+.03,u+off,v,.08,d*.7,bh,bc);else fbc(r,yy+.03,u,v+off,w*.7,.08,bh,bc)}}
  if(cat){const p=uvw(r,u,v);label(cat,p.x,y+2.6,p.z,2.2,.44)}}
function plant(x,y,z){ibc(IC,x-.16,y,z-.16,x+.16,y+.28,z+.16,0xb5651d);ibc(IC,x-.2,y+.28,z-.2,x+.2,y+.75,z+.2,0x2e8b3a);ibc(IC,x-.12,y+.7,z-.12,x+.12,y+.95,z+.12,0x3fae4a)}
function furnish(f,r,y,Wd,D){
  ceilLights(r,y,D,2);const n=r.n;
  if(r.cls)return classroom(f,r,y,Wd,D);
  if(r.lab)return computerLab(f,r,y,Wd,D);
  if(r.cr)return comfortRoom(f,r,y,Wd,D);
  if(f==0&&n=='Library')return library(f,r,y,Wd,D);
  if(f==0&&n=='Canteen')return canteen(f,r,y,Wd,D);
  if(f==0&&n=='School Store')return schoolStore(f,r,y,Wd,D);
  if(r.hall)return confHall(f,r,y,Wd,D);
  office(f,r,y,Wd,D)}
function classroom(f,r,y,Wd,D){
  // whiteboard + windows on the far wall, teacher desk + laptop, student desks with chairs
  fbc(r,y+.92,0,.1,Math.min(4.4,Wd-1.2),.06,1.5,0x555a60);fbc(r,y+1.0,0,.14,Math.min(4.2,Wd-1.4),.04,1.34,0xfbfbf8);fbc(r,y+.95,0,.17,Math.min(4.2,Wd-1.4),.1,.04,METAL);
  fbc(r,y+1.5,-1.2,.2,.5,.02,.03,0x2f6fbf,false,ICB);fbc(r,y+1.7,.8,.2,.8,.02,.03,0xc0392b,false,ICB);
  if(Wd>8)[-3.7,3.7].forEach(u=>{const p=uvw(r,u,.2),ns=r.d=='S'||r.d=='N';ib(IG,p.x-(ns?.8:.12),y+1.1,p.z-(ns?.12:.8),p.x+(ns?.8:.12),y+2.6,p.z+(ns?.12:.8));fbc(r,y+1.0,u,.2,1.9,.3,.1,CREAM)});
  desk(r,y,Wd/2-1.5,1.0,1.5,.7,DWOOD);laptop(r,y,Wd/2-1.5,1.0);r.tseat=chair(r,y,Wd/2-1.5,1.7,0x333a44,'teacher');colliders.push({...bbox(r,Wd/2-1.5,1.0,1.5,.7),y0:y,y1:y+.8});
  const cols=Math.floor((Wd-2.5)/2);
  for(let j=0;j<2;j++)for(let i=0;i<cols;i++){const u=-(cols-1)+2*i,v=2.7+1.6*j;desk(r,y,u,v,.9,.6);fbc(r,y+.73,u,v,.5,.3,.012,0xffffff);chair(r,y,u,v+.78,BLUE,'class',{col:i,row:j})}
  wallClock(r,y,-Wd/2+.6,.12);fbc(r,y+1.1,Wd/2-.1,.12,.9,.03,.7,0xc9a56a);fbc(r,y,-Wd/2+.45,5.8,.4,.4,.45,0x5a6a70); // bulletin board + bin
  const tp=uvw(r,Wd/2-1.5,1.0);addAct({x:tp.x,y,z:tp.z,r:1.8,t:'Instructor desk',kind:'desk',room:r,fn:()=>{notify('🗂 Instructor’s desk','','Ask your instructor for lessons.')},hide:true})}
function bbox(r,u,v,w,d){const [x,z]=uv(r,u,v),ns=r.d=='S'||r.d=='N',sx=ns?w:d,sz=ns?d:w;return {x1:x-sx/2,x2:x+sx/2,z1:z-sz/2,z2:z+sz/2}}
function computerLab(f,r,y,Wd,D){
  fbc(r,y+.92,0,.1,4.4,.06,1.5,0x555a60);fbc(r,y+1.0,0,.14,4.2,.04,1.34,0xfbfbf8);
  [-3.7,3.7].forEach(u=>{const p=uvw(r,u,.2);ib(IG,p.x-.8,y+1.1,p.z-.12,p.x+.8,y+2.6,p.z+.12)});
  fbc(r,y+1.7,0,.2,3,.02,.3,0x1f3a8a,false,ICB);
  for(let j=0;j<2;j++){const v=2.6+1.9*j;desk(r,y,0,v,8.2,.75,0xdfe3e4);
    for(let i=0;i<5;i++){const u=-3.2+i*1.6;monitor(r,y,u,v-.1,1);fbc(r,y+.76,u,v+.18,.38,.12,.015,0x222222);fbc(r,y+.76,u+.3,v+.18,.06,.1,.02,0x222222);fbc(r,y,u+.55,v-.1,.18,.4,.55,0x2b2f36);
      const s=chair(r,y,u,v+.95,0x2b2f36,'lab',{pc:pcs.length});const p=uvw(r,u,v-.1);const pc={x:p.x,y,z:p.z,room:r,seat:s,id:pcs.length};pcs.push(pc);
      addAct({x:p.x,y,z:p.z,r:1.9,t:'Use computer',kind:'pc',pc,room:r,fn:()=>usePC(pc)})}}
  const pr=uvw(r,-Wd/2+.8,.9);fbc(r,y,-Wd/2+.8,.9,.7,.6,.9,0xdddddd,true);fbc(r,y+.9,-Wd/2+.8,.9,.5,.4,.12,0x333333);
  wallClock(r,y,Wd/2-.8,.12)}
function library(f,r,y,Wd,D){
  const cats=[['HISTORY',-2.1,.45,0],['SCIENCE',0,.45,0],['LITERATURE',2.1,.45,0]];
  cats.forEach(([c,u,v])=>{bookshelf(r,y,u,v,1.9,.4,c);const p=uvw(r,u,v+.9);shelves.push({cat:c,x:p.x,y,z:p.z,room:r});
    addAct({x:p.x,y,z:p.z,r:1.7,t:'Browse '+c+' shelf',kind:'shelf',cat:c,fn:()=>browseShelf(c)})});
  [['MATH',-1,2.3],['COMPUTING',-1,4.7],['EDUCATION',1,2.3]].forEach(([c,side,v])=>{const u=side*(Wd/2-.22);bookshelf(r,y,u,v,.4,2.0,c);const p=uvw(r,u-side*.9,v);shelves.push({cat:c,x:p.x,y,z:p.z,room:r});
    addAct({x:p.x,y,z:p.z,r:1.7,t:'Browse '+c+' shelf',kind:'shelf',cat:c,fn:()=>browseShelf(c)})});
  desk(r,y,0,3.7,2.6,1.1,0xb98a52);[-.9,.9].forEach(u=>[3.0,4.4].forEach(v=>chair(r,y,u,v+(v>3.7?.15:-.15),0x8a5a2b,'lib')));
  fbc(r,y+.76,-.5,3.7,.4,.3,.02,0xeeeeee);fbc(r,y+.76,.6,3.65,.3,.4,.03,0xc0392b);
  desk(r,y,1.9,6.2,1.4,.6,DWOOD);const lp=uvw(r,1.9,6.2);librarianSpot.x=lp.x;librarianSpot.z=lp.z;librarianSpot.y=y;
  wallClock(r,y,-1.5,.12);plant(uvw(r,-2.9,6.4).x,y,uvw(r,-2.9,6.4).z)}
const librarianSpot={};
function canteen(f,r,y,Wd,D){
  desk(r,y+.3,0,1.2,5.8,.8,0xd9c9a0);fbc(r,y,0,1.2,5.8,.8,.35,0x7a5a3a,true);colliders.push({...bbox(r,0,1.2,5.8,.8),y0:y,y1:y+1.1});
  ib(IG,uvw(r,0,1.05).x-(r.d=='S'||r.d=='N'?2.4:.2),y+1.1,uvw(r,0,1.05).z-(r.d=='S'||r.d=='N'?.2:2.4),uvw(r,0,1.05).x+(r.d=='S'||r.d=='N'?2.4:.2),y+1.65,uvw(r,0,1.05).z+(r.d=='S'||r.d=='N'?.2:2.4));
  [[-2,0xc0392b],[-1.2,0xf2c21b],[-.4,0xe67e22],[.4,0x8b5a2b],[1.2,0xd9b45a],[2,0x2e9e5b]].forEach(([u,c])=>{fbc(r,y+1.0,u,1.05,.5,.4,.14,c)});
  const mp=uvw(r,0,.3);signPlane('CANTEEN MENU · Rice ₱45 · Pancit ₱35 · Burger ₱30',Wd>7?5.4:4.6,.5,'#2b3a2f',mp.x+(r.d=='E'?.14:r.d=='W'?-.14:0),y+2.7,mp.z+(r.d=='S'?.14:r.d=='N'?-.14:0),{S:0,N:Math.PI,E:-Math.PI/2,W:Math.PI/2}[r.d],'#ffe27a');
  const vp=uvw(r,0,.55);vendorSpot.x=vp.x;vendorSpot.z=vp.z;vendorSpot.y=y;
  addAct({x:uvw(r,0,1.9).x,y,z:uvw(r,0,1.9).z,r:2.2,t:'Order food',kind:'shop',fn:()=>openShop('canteen')});
  [[-1.9,3.5],[1.9,3.5],[-1.9,5.2],[1.9,5.2]].forEach(([u,v])=>{desk(r,y,u,v,1.2,.8,0xeeeeee);[[-.4,-.65],[.4,-.65],[-.4,.65],[.4,.65]].forEach(([a,b])=>{const s=chair(r,y,u+a,v+b,0xd35400,'cafe',{table:{u,v}})})});
  wallClock(r,y,Wd/2-.5,.12)}
const vendorSpot={},storeSpot={};
function schoolStore(f,r,y,Wd,D){
  desk(r,y,0,1.3,4.6,.8,0xd9c9a0);colliders.push({...bbox(r,0,1.3,4.6,.8),y0:y,y1:y+1});
  const sp=uvw(r,0,.6);storeSpot.x=sp.x;storeSpot.z=sp.z;storeSpot.y=y;
  [-1,1].forEach(side=>bookshelf(r,y,side*(Wd/2-.3),4.2,.4,2.4,null,4));fbc(r,y,0,.2,4,.4,2.2,0x6b4a2a,true);
  for(let k=0;k<4;k++)for(let b=0;b<14;b++)fbc(r,y+.2+k*.5,-1.8+b*.27,.42,.2,.2,.3,[0x2f6fbf,0xf2c21b,0xe74c3c,0x2ecc71,0xffffff][(b+k)%5]);
  addAct({x:uvw(r,0,2.1).x,y,z:uvw(r,0,2.1).z,r:2.2,t:'Buy school supplies',kind:'shop',fn:()=>openShop('store')});wallClock(r,y,2.5,.12)}
function comfortRoom(f,r,y,Wd,D){
  [-2.1,0,2.1].forEach(u=>{fbc(r,y,u,.8,1.35,1.3,.0,0xffffff);fbc(r,y+.2,u,.55,.5,.7,.5,0xf4f4f4);fbc(r,y+.7,u,.35,.5,.2,.5,0xf4f4f4);fbc(r,y,u-.7,1.2,.04,1.5,1.9,0x6fa5c0,true);fbc(r,y,u+.7,1.2,.04,1.5,1.9,0x6fa5c0,true);fbc(r,y+.1,u,1.94,1.36,.04,1.8,0x4f78b0,true)});
  for(let i=0;i<3;i++){const v=3+i*1.3,u=-Wd/2+.4;fbc(r,y+.8,u,v,.5,.7,.1,0xeeeeee,true);fbc(r,y,u,v,.12,.12,.8,METAL);fbc(r,y+1.2,u-.1,v,.03,.9,.8,0xcfe8f4)}
  fbc(r,y+.01,0,3.5,2.2,1.4,.02,0xb8d8e4);fbc(r,y+.02,0,3.6,.8,.5,.05,0xf2c21b);wallClock(r,y,Wd/2-.6,.12)}
function confHall(f,r,y,Wd,D){desk(r,y,0,3.5,6,1.4,0x7a5a3a);for(let i=0;i<6;i++)[-1,1].forEach(s=>chair(r,y,-2.5+i*1,3.5+s*1.1,0x30343a,'conf'));fbc(r,y+1.2,0,.12,4,.04,2,0xf2f2f2);fbc(r,y+.9,0,.1,4.2,.06,.3,0x555a60)}
function office(f,r,y,Wd,D){const i=r.i||0,n=r.n;
  desk(r,y,0,1.8,2.2,.9,i%2?DWOOD:WOOD);monitor(r,y,-.4,1.8,-1);laptop(r,y,.5,1.8);chair(r,y,0,.9,0x333a44);chair(r,y,-.6,2.9,0x8a5a2b);chair(r,y,.6,2.9,0x8a5a2b);
  bookshelf(r,y,-Wd/2+.3,4.6,.4,1.6,null,4);fbc(r,y,Wd/2-.45,1.2,.5,.8,1.4,0x7c858a,true);plant(uvw(r,Wd/2-.5,5.6).x,y,uvw(r,Wd/2-.5,5.6).z);wallClock(r,y,0,.12);
  if(n=="Clinic"){fbc(r,y+.45,Wd/2-1.4,4.5,.9,2,.2,0xffffff,true);fbc(r,y+.65,Wd/2-1.4,4.5,.8,1.9,.12,0x6fd0b8)}
  if(n=="Principal's Office"){const p=uvw(r,Wd/2-.6,.6);const pl=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,2.2,6),mat(0xcccccc));pl.position.set(p.x,y+1.1,p.z);scene.add(pl)}
  if(n=="Faculty Room"||n=="Staff Lounge"||n=="Learning Hub"){desk(r,y,-2,4.3,1.6,.7,0xb98a52);desk(r,y,2,4.3,1.6,.7,0xb98a52);monitor(r,y,-2,4.3,1);monitor(r,y,2,4.3,1);chair(r,y,-2,5.1,0x333a44);chair(r,y,2,5.1,0x333a44)}}

/* ---------- court, hoops, ball ---------- */
const HOOPS=[],COURT={x1:-6.5,x2:6.5,z1:-10,z2:-1,cz:-5.5};
function courtLines(cg){const X=x=>(x+20)*20,Z=z=>(z+16)*20;cg.strokeStyle='rgba(240,240,230,.9)';cg.lineWidth=4;cg.strokeRect(X(-6.5),Z(-10),13*20,9*20);cg.beginPath();cg.moveTo(X(0),Z(-10));cg.lineTo(X(0),Z(-1));cg.stroke();
  cg.beginPath();cg.arc(X(0),Z(-5.5),36,0,7);cg.stroke();
  [-1,1].forEach(s=>{const bx=X(s*6.5);cg.strokeRect(s<0?bx:bx-90,Z(-7.3),90,72);cg.beginPath();cg.arc(X(s*(6.5-4.5)),Z(-5.5),36,s<0?-Math.PI/2:Math.PI/2,s<0?Math.PI/2:Math.PI*1.5);cg.stroke();
    cg.beginPath();cg.arc(X(s*5.8),Z(-5.5),110,s<0?-1.15:Math.PI-1.15+0,s<0?1.15:Math.PI+1.15);cg.stroke();cg.beginPath();cg.arc(X(s*5.8),Z(-5.5),14,0,7);cg.stroke()})}
function netMesh(){const g=new THREE.Group(),m=new THREE.LineBasicMaterial({color:0xffffff}),pts=[];const N=10,r1=.23,r2=.12,h=.42;
  for(let i=0;i<N;i++){const a=i/N*Math.PI*2,b=(i+1)/N*Math.PI*2,a2=(i+.5)/N*Math.PI*2;
    pts.push(Math.cos(a)*r1,0,Math.sin(a)*r1,Math.cos(a2)*r2,-h,Math.sin(a2)*r2);pts.push(Math.cos(b)*r1,0,Math.sin(b)*r1,Math.cos(a2)*r2,-h,Math.sin(a2)*r2);
    for(const k of [.35,.7]){const rr=r1+(r2-r1)*k;pts.push(Math.cos(a)*rr,-h*k,Math.sin(a)*rr,Math.cos(b)*rr,-h*k,Math.sin(b)*rr)}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.add(new THREE.LineSegments(geo,m));return g}
function buildCourt(){
  const cz=COURT.cz;
  [-1,1].forEach(s=>{const hx=s*5.8,bx=s*6.25,px=s*7.0,g=new THREE.Group();
    // pole + arm + backboard + rim + net
    cbox(px-.09,0,cz-.09,px+.09,3.9,cz+.09,0x4b5258,true);cbox(s<0?px:bx-.02,3.7,cz-.05,s<0?bx+.02:px,3.8,cz+.05,0x4b5258,false);
    const bb=new THREE.Mesh(new THREE.BoxGeometry(.08,1.05,1.8),new THREE.MeshPhongMaterial({color:0xdfeff7,specular:0xffffff,shininess:80,transparent:true,opacity:.7}));bb.position.set(bx,3.5,cz);scene.add(bb);
    const fr=new THREE.Mesh(new THREE.BoxGeometry(.09,.5,.7),new THREE.MeshBasicMaterial({color:0xe0553c,wireframe:false}));fr.scale.set(1,1,1);const sq=new THREE.Mesh(new THREE.BoxGeometry(.1,.04,.6),bmat(0xe0553c));sq.position.set(bx-s*.01,3.2,cz);scene.add(sq);
    colliders.push({x1:Math.min(bx,bx)-.06,x2:bx+.06,z1:cz-.9,z2:cz+.9,y0:2.9,y1:4.05});
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.23,.022,6,18),bmat(0xf2551d));rim.rotation.x=Math.PI/2;rim.position.set(hx,3.05,cz);scene.add(rim);
    cbox(hx+s*.23,3.03,cz-.03,bx,3.07,cz+.03,0xd04010,false);
    const net=netMesh();net.position.set(hx,3.05,cz);scene.add(net);
    const base=new THREE.Mesh(new THREE.BoxGeometry(.5,.25,.5),mat(0x2b2f36));base.position.set(px,.125,cz);scene.add(base);
    HOOPS.push({x:hx,y:3.05,z:cz,s,bx,net,rim,r:.23,t:0})});
  // practice ball + ball rack
  cbox(7.4,0,-8.7,8.0,.5,-8.1,0x2f6fbf,true);
  BALLS.player=new Ball(0xe0742a);BALLS.player.rest(-1.2,-5.0);BALLS.npc=new Ball(0xd9651d);BALLS.npc.rest(2,-4.5)}
/* Ball physics (shared by the player and the NPC players) */
const BALLS={};
class Ball{constructor(c){this.m=new THREE.Mesh(new THREE.SphereGeometry(.13,12,10),new THREE.MeshLambertMaterial({map:ballTex(),color:c}));this.m.castShadow=true;scene.add(this.m);this.x=this.y=this.z=0;this.vx=this.vy=this.vz=0;this.st='floor';this.scored=false;this.shooter=null;this.bt=0}
  rest(x,z){this.x=x;this.z=z;this.y=.13;this.vx=this.vy=this.vz=0;this.st='floor';this.sync()}
  sync(){this.m.position.set(this.x,this.y,this.z)}
  shoot(from,hoop,make,sh){this.x=from.x;this.y=from.y;this.z=from.z;this.st='fly';this.scored=false;this.make=!!make;this.shooter=sh||'p';this.hoop=hoop;this.passed=false;
    const d=Math.hypot(hoop.x-from.x,hoop.z-from.z),T=.7+d*.055,g=14;this.g=g;let tx=hoop.x,tz=hoop.z;
    if(!make){const a=Math.random()*6.28,o=.34+Math.random()*.3;tx+=Math.cos(a)*o;tz+=Math.sin(a)*o}
    this.vx=(tx-from.x)/T;this.vz=(tz-from.z)/T;this.vy=(hoop.y-from.y+.5*g*T*T)/T}
  step(dt,onScore){if(this.st!='fly')return;const g=this.g||14,n=Math.ceil(dt/.01),h=dt/n;
    for(let i=0;i<n;i++){const py=this.y;this.vy-=g*h;this.x+=this.vx*h;this.y+=this.vy*h;this.z+=this.vz*h;
      for(const H2 of HOOPS){const dx=this.x-H2.x,dz=this.z-H2.z,dr=Math.hypot(dx,dz);
        // score: falling through the rim opening
        if(!this.scored&&py>H2.y&&this.y<=H2.y&&dr<.17&&this.vy<0){this.scored=true;this.vx*=.15;this.vz*=.15;H2.t=1;if(onScore)onScore(H2,this)}
        // rim collision ring
        if(!this.make&&Math.abs(this.y-H2.y)<.09&&Math.abs(dr-.23)<.12&&!this.scored){const nx=dx/(dr||1),nz=dz/(dr||1),vn=this.vx*nx+this.vz*nz;this.vx-=1.5*vn*nx;this.vz-=1.5*vn*nz;this.vy=Math.abs(this.vy)*.45+1.2;this.vx*=.7;this.vz*=.7;sfx('rim',{x:this.x,y:this.y,z:this.z})}
        // backboard
        if(!this.make&&Math.abs(this.x-H2.bx)<.12&&Math.abs(this.z-H2.z)<.95&&this.y>2.95&&this.y<4.05&&(this.x-H2.bx)*H2.s>-.3){const side=(this.x-H2.x)*H2.s>0.0&&this.vx*H2.s>0;if(side){this.vx=-this.vx*.5;this.x=H2.bx-H2.s*.14;sfx('board',{x:this.x,y:this.y,z:this.z})}}}
      if(this.y<=.13){this.y=.13;if(Math.abs(this.vy)>1.6){this.vy=-this.vy*.62;this.vx*=.82;this.vz*=.82;sfx('bounce',{x:this.x,y:.2,z:this.z})}else{this.vy=0;this.vx*=.9;this.vz*=.9;if(Math.hypot(this.vx,this.vz)<.3){this.vx=this.vz=0;this.st='floor';this.m.rotation.set(0,0,0);break}}}
      for(const c of colliders){if(c.off||c.veh||c.y1<.3||c.y0>2)continue;if(this.x>c.x1-.1&&this.x<c.x2+.1&&this.z>c.z1-.1&&this.z<c.z2+.1&&this.y<c.y1){const cx=(c.x1+c.x2)/2,cz2=(c.z1+c.z2)/2;if(Math.abs(this.x-cx)/(c.x2-c.x1+.2)>Math.abs(this.z-cz2)/(c.z2-c.z1+.2))this.vx=-this.vx*.5;else this.vz=-this.vz*.5;this.x+=this.vx*h*2;this.z+=this.vz*h*2}}}
    this.m.rotation.x+=dt*8;this.sync()}}
let _bt;function ballTex(){if(_bt)return _bt;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,64,64);g.strokeStyle='#222';g.lineWidth=3;g.beginPath();g.moveTo(0,32);g.lineTo(64,32);g.moveTo(32,0);g.lineTo(32,64);g.moveTo(8,0);g.quadraticCurveTo(26,32,8,64);g.moveTo(56,0);g.quadraticCurveTo(38,32,56,64);g.stroke();return _bt=new THREE.CanvasTexture(c)}
function netWobble(dt){HOOPS.forEach(h=>{if(h.t>0){h.t=Math.max(0,h.t-dt*1.6);const k=1+Math.sin(h.t*30)*.12*h.t;h.net.scale.set(k,1+h.t*.1,k)}})}

/* ---------- boarding house ---------- */
const HOUSE={x1:-2,x2:14,z1:53,z2:63,cx:6,doorZ:53};
const houseRoom={n:'Boarding House',f:0,x1:-2,x2:14,z1:53.15,z2:62.85,d:'N',house:true};
function winGap(x1,x2,z,thick){ // real see-through window opening in a wall along x
  ib(IY,x1,0,z-thick,x2,1.1,z+thick);ib(IY,x1,2.6,z-thick,x2,H,z+thick);ib(IG,x1+.05,1.1,z-.04,x2-.05,2.6,z+.04);ib(IW,x1,1.05,z-thick-.04,x2,1.12,z+thick+.04);ib(IW,x1,2.6,z-thick-.04,x2,2.68,z+thick+.04);ib(IW,x1,1.1,z-.07,x1+.06,2.6,z+.07);ib(IW,x2-.06,1.1,z-.07,x2,2.6,z+.07)}
function buildBoardingHouse(){
  const H0=HOUSE,y=0,col=0xc9dcb4;rooms.push(houseRoom);
  // floor
  const fc=document.createElement('canvas');fc.width=fc.height=128;const fg=fc.getContext('2d');fg.fillStyle='#b88a54';fg.fillRect(0,0,128,128);for(let i=0;i<8;i++){fg.fillStyle=i%2?'#a97a45':'#c19661';fg.fillRect(0,i*16,128,15);fg.fillStyle='#8a6030';fg.fillRect((i*37)%128,i*16,2,16)}
  const ft=new THREE.CanvasTexture(fc);ft.wrapS=ft.wrapT=THREE.RepeatWrapping;ft.repeat.set(8,5);const fl=new THREE.Mesh(new THREE.PlaneGeometry(16,10),new THREE.MeshLambertMaterial({map:ft}));fl.rotation.x=-Math.PI/2;fl.position.set(6,.07,58);scene.add(fl);
  // walls (instanced, tinted by the house colour) + real windows on the front and back
  const wl=(ax,az,bx,bz)=>{const x1=Math.min(ax,bx),x2=Math.max(ax,bx),z1=Math.min(az,bz),z2=Math.max(az,bz),v=ax==bx;const a=v?[x1-.15,z1,x2+.15,z2]:[x1,z1-.15,x2,z2+.15];ibc(IC,a[0],0,a[1],a[2],H,a[3],col);colliders.push({x1:a[0],z1:a[1],x2:a[2],z2:a[3],y0:0,y1:H})};
  wl(-2,63,-2,53);wl(14,63,14,53);
  // front (z=53): door gap 5..7, windows 0.2..2.6 and 9.4..11.8   (windows are real openings with glass)
  const fw=(x1,x2)=>{ibc(IC,x1,0,53-.15,x2,H,53+.15,col);colliders.push({x1,x2,z1:52.85,z2:53.15,y0:0,y1:H})};
  fw(-2.15,.2);fw(2.6,5);fw(7,9.4);fw(11.8,14.15);
  [[.2,2.6],[9.4,11.8]].forEach(([a,b])=>{ibc(IC,a,0,52.85,b,1.1,53.15,col);ibc(IC,a,2.6,52.85,b,H,53.15,col);ibc(IC,a,1.1,52.93,b,2.6,53.07,0xffffff);ib(IG,a+.06,1.15,52.97,b-.06,2.55,53.03);colliders.push({x1:a,x2:b,z1:52.85,z2:53.15,y0:0,y1:H});
    ibc(IC,a,1.02,52.78,b,1.1,53.22,0xeeeeee);ibc(IC,(a+b)/2-.03,1.1,52.97,(a+b)/2+.03,2.6,53.03,0xffffff)});
  ibc(IC,5,2.65,52.85,7,H,53.15,col);
  const bw=(x1,x2)=>{ibc(IC,x1,0,62.85,x2,H,63.15,col);colliders.push({x1,x2,z1:62.85,z2:63.15,y0:0,y1:H})};
  bw(-2.15,3);bw(5,14.15);ibc(IC,3,0,62.85,5,1.1,63.15,col);ibc(IC,3,2.6,62.85,5,H,63.15,col);ibc(IC,3.06,1.15,62.97,4.94,2.55,63.03,0xffffff);ib(IG,3.06,1.15,62.97,4.94,2.55,63.03);colliders.push({x1:3,x2:5,z1:62.85,z2:63.15,y0:0,y1:H});
  // blocks vehicles from entering through the door
  colliders.push({x1:-2,x2:14,z1:52.5,z2:53.4,y0:0,y1:4,veh:true});
  // roof + parapet + awning + sign
  cbox(-2.5,H,52.5,14.5,H+.25,63.5,0xe9e4d2,false);cbox(-2.5,H+.25,52.5,14.5,H+.9,52.7,col,false);cbox(-2.5,H+.25,63.3,14.5,H+.9,63.5,col,false);cbox(-2.5,H+.25,52.5,-2.3,H+.9,63.5,col,false);cbox(14.3,H+.25,52.5,14.5,H+.9,63.5,col,false);
  cbox(-2.4,3.1,51.5,14.4,3.25,53,0xc0392b,false);for(let i=0;i<8;i++)cbox(-2.4+i*2.1,3.25,51.5,-2.4+i*2.1+1.05,3.3,53,0xffffff,false);
  signPlane('BOARDING HOUSE · Rooms for Rent',9,.6,'#8b2f23',6,4.55,52.45,Math.PI,'#fff');
  cbox(.2,0,52.2,.9,.55,52.85,0x7a5a3a,false);plant(-1,0,52);plant(13,0,52);
  // interior light + furniture
  [[1.5,55],[6,55],[10.5,55],[3,60],[9,60]].forEach(([x,z])=>ibc(ICB,x-.4,H-.08,z-.15,x+.4,H,z+.15,0xfff3c8));
  const L=(x1,y1,z1,x2,y2,z2,c,s)=>{ibc(IC,x1,y1,z1,x2,y2,z2,c);if(s)colliders.push({x1,x2,z1,z2,y0:y1,y1:y2})};
  // bed 1 (player)  - head at the back wall
  L(.1,.15,60.7,1.9,.45,62.8,0x7a5230,true);L(.1,.45,62.75,1.9,1.1,62.85,0x7a5230);L(.15,.45,60.75,1.85,.62,62.7,0xf0f0f0);L(.15,.62,61.0,1.85,.72,61.9,0x2f6fbf);L(.35,.62,62.0,1.65,.72,62.6,0xffffff);
  L(2.0,0,62.1,2.7,.55,62.8,0x6b4a2a,true);L(2.25,.55,62.35,2.45,.85,62.55,0xfff3c8);ibc(ICB,2.28,.85,62.38,2.42,1.0,62.52,0xffe9a0);
  // bed 2 (roommate)
  L(11.9,.15,60.7,13.7,.45,62.8,0x7a5230,true);L(11.95,.45,60.75,13.65,.62,62.7,0xf0f0f0);L(11.95,.62,61.0,13.65,.72,61.9,0xe67e22);L(12.15,.62,62.0,13.45,.72,62.6,0xffffff);
  // wardrobe (outfits) + desk (assignments) + table + kitchen
  L(5.1,0,62.2,6.9,2.2,62.85,0x8b5a2b,true);L(5.95,0,62.15,6.05,2.2,62.2,0x3a2a1a);L(5.8,1.0,62.12,5.9,1.2,62.16,0xe8e8e8);L(6.1,1.0,62.12,6.2,1.2,62.16,0xe8e8e8);
  L(8,.7,62.0,10.6,.76,62.85,0xb98a52,true);L(8.05,0,62.05,8.15,.7,62.15,METAL);L(10.45,0,62.05,10.55,.7,62.15,METAL);ibc(IC,8.9,.76,62.3,9.4,.78,62.7,0x30343a);ibc(IC,8.9,.78,62.62,9.4,1.0,62.66,0x15181c);ibc(ICB,8.93,.8,62.6,9.37,.98,62.62,SCREEN);L(8.8,.45,61.2,9.4,.5,61.8,0x333a44);L(8.85,.5,61.2,9.35,1.0,61.25,0x333a44);L(8.85,0,61.45,8.9,.45,61.5,METAL);L(9.3,0,61.45,9.35,.45,61.5,METAL);L(8.85,0,61.25,8.9,.45,61.3,METAL);L(9.3,0,61.25,9.35,.45,61.3,METAL);
  L(5,.7,56.2,7.4,.77,57.4,0xd9c9a0,true);L(5.1,0,56.3,5.2,.7,56.4,METAL);L(7.2,0,56.3,7.3,.7,56.4,METAL);L(5.1,0,57.2,5.2,.7,57.3,METAL);L(7.2,0,57.2,7.3,.7,57.3,METAL);
  [[5.5,55.6],[6.9,55.6],[5.5,58]].forEach(([x,z])=>L(x-.2,.42,z-.2,x+.2,.47,z+.2,0xd35400));
  L(-1.85,0,54,-1.1,.9,59,0xe8e8e8,true);L(-1.85,.9,54,-1.1,.95,59,0x555a60);L(-1.7,.95,56,-1.3,1.0,56.8,0xb9bec4);L(-1.7,.95,57.5,-1.3,1.02,57.9,0x222222);L(-1.85,0,59.3,-1.1,1.8,60.2,0xdddddd,true);
  L(12.2,0,54,13.7,.6,57,0x4a6fa5,true);L(12.2,.6,54,13.7,1.1,54.4,0x4a6fa5);L(13.4,0,57.4,13.9,.8,58.2,0x333a44,true);
  ibc(IC,3.5,.08,57.5,9.5,.1,59.5,0xb04a3a);ibc(IC,4.8,.1,58.6,8.2,.11,58.8,0xf2c21b);plant(13,0,59.5);plant(-1.2,0,62);
  // posters
  [[1.2,62.78],[10,62.8]].forEach(([x,z],i)=>{ibc(IC,x-.4,1.5,z-.02,x+.4,2.3,z+.01,[0x2f6fbf,0xe67e22][i]);ibc(IC,x-.3,1.6,z-.03,x+.3,2.2,z,0xffffff)});
  houseCurtain(.2,2.6);houseCurtain(9.4,11.8);
  // door (real swinging door) + interactables
  makeDoor(houseRoom,false,H0.cx-1,53,H0.cx,0,H0.cx,53,'wood');label('Boarding House',6,3.25,52.5,3.6,.7);
  const cx=6;
  addAct({x:1,y:0,z:60.0,r:1.9,t:'Sleep / Rest',kind:'bed',fn:()=>bedMenu()});
  addAct({x:6,y:0,z:61.2,r:1.7,t:'Wardrobe · change outfit',kind:'ward',fn:()=>openMenu('wardrobe')});
  addAct({x:9.1,y:0,z:61.2,r:1.7,t:'Study desk · do assignment',kind:'desk2',fn:()=>studyDesk()});
  addAct({x:-.9,y:0,z:58.2,r:1.6,t:'Refrigerator',kind:'fridge',fn:()=>fridge()});
  seats.push({x:9.1,y:0,z:61.3,rot:0,type:'home'});
  seats.push({x:5.5,y:0,z:55.4,rot:Math.PI/2,type:'home'});}
function houseCurtain(a,b){[[a,a+.4],[b-.4,b]].forEach(([p,q])=>ibc(IC,p,1.0,52.88,q,2.7,52.95,0xf2d6a0))}

/* ---------- outdoor extras: benches, picnic tables, hallway items, ceiling lights ---------- */
function benchAt(x,y,z,rot,seatsN){const g=Math.abs(Math.sin(rot))>.5;const sx=g?.5:1.8,sz=g?1.8:.5;
  ibc(IC,x-sx/2,y+.42,z-sz/2,x+sx/2,y+.48,z+sz/2,0x8b5a2b);ibc(IC,x-sx/2*(g?1:1),y,z-sz/2,x-sx/2*(g?1:1)+(g?.5:.06),y+.42,z-sz/2+(g?.06:.5),0x444444);
  const bk=g?[x-Math.sin(rot)*.27-.03,y+.48,z-.9,x-Math.sin(rot)*.27+.03,y+.95,z+.9]:[x-.9,y+.48,z-Math.cos(rot)*.27-.03,x+.9,y+.95,z-Math.cos(rot)*.27+.03];
  ibc(IC,bk[0],bk[1],bk[2],bk[3],bk[4],bk[5],0x8b5a2b);
  ibc(IC,g?x-.2:x-.88,y,g?z-.88:z-.2,g?x+.2:x-.8,y+.42,g?z-.8:z+.2,0x444444);ibc(IC,g?x-.2:x+.8,y,g?z+.8:z-.2,g?x+.2:x+.88,y+.42,g?z+.88:z+.2,0x444444);
  colliders.push({x1:x-sx/2,x2:x+sx/2,z1:z-sz/2,z2:z+sz/2,y0:y,y1:y+.5});
  for(let i=0;i<seatsN;i++){const o=(i-(seatsN-1)/2)*.8;seats.push({x:g?x:x+o,y,z:g?z+o:z,rot,type:'bench'})}}
function picnic(x,z){ibc(IC,x-.9,.72,z-.5,x+.9,.78,z+.5,0xdfd3b0);ibc(IC,x-.1,0,z-.1,x+.1,.72,z+.1,METAL);colliders.push({x1:x-.9,x2:x+.9,z1:z-.5,z2:z+.5,y0:0,y1:.8});
  [[-.45,-.85,0],[.45,-.85,0],[-.45,.85,Math.PI],[.45,.85,Math.PI]].forEach(([a,b,r])=>{ibc(IC,x+a-.2,.4,z+b-.15,x+a+.2,.45,z+b+.15,0xd35400);ibc(IC,x+a-.02,0,z+b-.02,x+a+.02,.4,z+b+.02,METAL);seats.push({x:x+a,y:0,z:z+b,rot:b>0?Math.PI:0,type:'cafe',out:true,table:{x,z}})})}
function buildExtras(){
  // benches facing the court / garden, picnic tables for lunch
  [-18.0].forEach(x=>{seats.push({x:-18,y:0,z:-7.2,rot:Math.PI/2,type:'bench'},{x:-18,y:0,z:-5.9,rot:Math.PI/2,type:'bench'})}); // existing bench
  benchAt(16,0,8.2,Math.PI,3);benchAt(-6,0,6.8,0,3);benchAt(6,0,6.8,0,3);benchAt(-8,0,-11.2,0,3);benchAt(0,0,0.8,Math.PI,3);
  picnic(-13.5,-13.4);picnic(14.5,-13.2);picnic(-3.5,4.2);picnic(3.5,4.2);
  [[-27,24.5,Math.PI],[27,24.5,Math.PI],[-14,27.6,0],[14,27.6,0]].forEach(([x,z,r])=>benchAt(x,0,z,r,2));
  // hallway items on every floor: benches, plants, bulletin boards, bins, fire extinguishers, ceiling lights
  for(let f=0;f<4;f++){const y=f*H;
    for(let x=-26;x<=26;x+=5.5){ibc(ICB,x-.4,y+3.66,-17.9-.15,x+.4,y+3.74,-17.9+.15,0xfff3c8);ibc(ICB,x-.4,y+3.66,11.9-.15,x+.4,y+3.74,11.9+.15,0xfff3c8)}
    for(let z=-14;z<=8;z+=5.5){ibc(ICB,-21.5-.15,y+3.66,z-.4,-21.5+.15,y+3.74,z+.4,0xfff3c8);ibc(ICB,21.5-.15,y+3.66,z-.4,21.5+.15,y+3.74,z+.4,0xfff3c8)}
    [[-14,-18.7],[16,-18.7]].forEach(([x,z])=>{ibc(IC,x-.9,y+1.2,z-.04,x+.9,y+2.1,z+.02,0xc9a56a);for(let k=0;k<5;k++)ibc(IC,x-.8+k*.34,y+1.35+(k%2)*.35,z+.01,x-.6+k*.34,y+1.65+(k%2)*.35,z+.04,[0xffffff,0xffe27a,0xaee6ff,0xffb6c1,0xffffff][k])});
    plant(-27,y,-17.3);plant(27,y,-17.3);plant(-29.2,y,12.2);plant(29.2,y,12.2);plant(-22.5,y,-14);plant(22.5,y,8);
    [[-9,-17.6],[9,11.6],[-21.7,3],[21.7,-3]].forEach(([x,z])=>{ibc(IC,x-.16,y,z-.16,x+.16,y+.55,z+.16,0x4a5258);ibc(IC,x-.18,y+.55,z-.18,x+.18,y+.6,z+.18,0x2b2f36)});
    [[-4,-18.85],[24,11.15]].forEach(([x,z])=>{ibc(IC,x-.1,y+1.0,z-.06,x+.1,y+1.5,z+.06,0xd63a2f)});
    colliders.push({x1:-8.4,x2:-7.6,z1:-18.9,z2:-18.3,y0:y,y1:y+1.1});
    // bench along the north corridor
    ibc(IC,-18,y+.42,-18.8,-16,y+.48,-18.4,0x8b5a2b);ibc(IC,-17.9,y,-18.75,-17.8,y+.42,-18.45,0x444444);ibc(IC,-16.2,y,-18.75,-16.1,y+.42,-18.45,0x444444);colliders.push({x1:-18,x2:-16,z1:-18.8,z2:-18.4,y0:y,y1:y+.5});
    seats.push({x:-17.4,y,z:-18.5,rot:0,type:'bench',hall:true},{x:-16.6,y,z:-18.5,rot:0,type:'bench',hall:true})}
  // more props
  [[ -12,-15.6],[12,-15.6]].forEach(([x,z])=>plant(x,0,z));
  // sky: stars + moon
  const st=[];for(let i=0;i<450;i++){const a=Math.random()*6.28,b=Math.random()*1.35+.1,r=270;st.push(Math.cos(a)*Math.cos(b)*r,Math.sin(b)*r,Math.sin(a)*Math.cos(b)*r)}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(st,3));LT.stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:1.6,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false}));scene.add(LT.stars);
  LT.moon=new THREE.Mesh(new THREE.SphereGeometry(7,12,10),new THREE.MeshBasicMaterial({color:0xe8eefc,fog:false}));scene.add(LT.moon);
  // lamp halos (visible at night)
  const hc=document.createElement('canvas');hc.width=hc.height=64;const hg=hc.getContext('2d'),gr=hg.createRadialGradient(32,32,2,32,32,32);gr.addColorStop(0,'rgba(255,240,180,.95)');gr.addColorStop(1,'rgba(255,240,180,0)');hg.fillStyle=gr;hg.fillRect(0,0,64,64);
  const hm=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(hc),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,fog:false});LT.halo=hm;
  const addHalo=(x,y,z,s)=>{const sp=new THREE.Sprite(hm);sp.position.set(x,y,z);sp.scale.set(s,s,1);scene.add(sp)};
  for(let x=-49;x<=49;x+=14)addHalo(x,4.75,28.9,4.5);[[-12,3.85,-12],[12,3.85,4]].forEach(([x,y,z])=>addHalo(x,y,z,4));
  for(let i=0;i<4;i++)addHalo(-14+i*9.3,3.8,22,3)}

/* ---------- day / night + shadows ---------- */
const lerpC=(a,b,t)=>new THREE.Color(a).lerp(new THREE.Color(b),t);
function setupDayNight(){applyDayNight(S.clock,true)}
let _dn=-1;
function applyDayNight(clock,force){const h=clock/60;
  // daylight factor 0 (night) .. 1 (day), smooth at dawn (5.5-7) and dusk (17.5-19)
  let d=h<5.5?0:h<7?(h-5.5)/1.5:h<17.5?1:h<19?1-(h-17.5)/1.5:0;d=d*d*(3-2*d);if(!force&&Math.abs(d-_dn)<.004&&Math.abs(h*60%5)>0.2)return;_dn=d;
  const dusk=(h>16.8&&h<19.2)||(h>5&&h<6.8)?1-Math.min(1,Math.abs(h>12?h-18:h-6)/1.4):0;
  if(LT.hemi){LT.hemi.intensity=.2+.66*d;LT.hemi.color.copy(lerpC(0x7d8fc8,0xffffff,d)).lerp(new THREE.Color(0xffd0a0),dusk*.35);LT.hemi.groundColor.copy(lerpC(0x20243a,0xb8b8a4,d))}
  if(LT.dir){LT.dir.intensity=.06+.42*d;LT.dir.color.copy(lerpC(0x7d8fd8,0xfff4dc,d)).lerp(new THREE.Color(0xff9a50),dusk*.7);const a=((h-6)/12)*Math.PI;LT.sunDir=new THREE.Vector3(Math.cos(a)*90,Math.max(25,Math.sin(Math.max(0,a))*100),50);}
  if(LT.sky)LT.sky.material.color.copy(lerpC(0x0c1230,0xffffff,d)).lerp(new THREE.Color(0xffb78a),dusk*.35);
  if(LT.sun){const a=((h-6)/12)*Math.PI;LT.sun.position.set(Math.cos(a)*220,Math.sin(a)*200,-120);LT.sun.visible=h>5.5&&h<19;LT.sun.material.color.setHex(dusk>.3?0xff9a40:0xfff2a0)}
  if(LT.moon){const a=((h<12?h+24:h)-18)/12*Math.PI;LT.moon.position.set(Math.cos(a)*220,Math.max(30,Math.sin(a)*200),-120);LT.moon.visible=d<.9}
  if(LT.stars)LT.stars.material.opacity=Math.max(0,.95-d*1.6);
  if(scene){scene.fog.color.copy(lerpC(0x0c1230,0xcfeaf5,d)).lerp(new THREE.Color(0xf0b890),dusk*.25);scene.background=scene.fog.color.clone()}
  if(LT.halo)LT.halo.opacity=Math.max(0,1-d*1.8);
  if(IG)IG.material.emissive.setHex(d<.5?0x3a3010:0x000000);
  LT.day=d}
function indoorLight(on,night){if(!LT.pt)return;LT.pt.intensity=on?(night?.95:.35):0}
function enableShadows(level){if(!scene||!renderer)return;const on=level!='low';renderer.shadowMap.enabled=on;renderer.shadowMap.type=THREE.PCFShadowMap;
  if(LT.dir){LT.dir.castShadow=on;if(on){const s=level=='high'?2048:1024;LT.dir.shadow.mapSize.set(s,s);const c=LT.dir.shadow.camera;c.left=c.bottom=-30;c.right=c.top=30;c.near=10;c.far=200;LT.dir.shadow.bias=-.0006;c.updateProjectionMatrix();if(LT.dir.shadow.map){LT.dir.shadow.map.dispose();LT.dir.shadow.map=null}}}
  if(!LT.shadowSet){LT.shadowSet=true;scene.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o.material&&!o.material.transparent&&o.material.type!='MeshBasicMaterial'){o.castShadow=true;o.receiveShadow=true}if(o.isInstancedMesh&&o.material.type!='MeshBasicMaterial'&&!o.material.transparent){o.castShadow=true;o.receiveShadow=true}});
    if(player)player.traverse(o=>{if(o.isMesh)o.castShadow=true})}
  scene.traverse(o=>{if(o.material)o.material.needsUpdate=true})}
