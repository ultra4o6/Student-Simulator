/* ---------- Room generation ---------- */
const _col=new THREE.Color();
function ibc(m,x1,y1,z1,x2,y2,z2,c){ib(m,x1,y1,z1,x2,y2,z2);m.setColorAt(m.count-1,_col.set(c))}
function uv(r,u,v){const cx=(r.x1+r.x2)/2,cz=(r.z1+r.z2)/2;
  return r.d=='S'?[cx+u,r.z1+v]:r.d=='N'?[cx+u,r.z2-v]:r.d=='E'?[r.x1+v,cz+u]:[r.x2-v,cz+u]}
function fb(r,y0,u,v,uw,vd,h,inst,solid){
  const [x,z]=uv(r,u,v),ns=r.d=='S'||r.d=='N',sx=ns?uw:vd,sz=ns?vd:uw;
  ib(inst,x-sx/2,y0,z-sz/2,x+sx/2,y0+h,z+sz/2);
  if(solid)colliders.push({x1:x-sx/2,x2:x+sx/2,z1:z-sz/2,z2:z+sz/2,y0,y1:y0+h})}
function glass(vert,ax,az,t,y,w){
  if(vert){ib(IG,ax-.17,y+1.2,t-w/2,ax+.17,y+2.6,t+w/2);ib(IW,ax-.28,y+1.1,t-w/2-.1,ax+.28,y+1.2,t+w/2+.1)}
  else{ib(IG,t-w/2,y+1.2,az-.17,t+w/2,y+2.6,az+.17);ib(IW,t-w/2-.1,y+1.1,az-.28,t+w/2+.1,y+1.2,az+.28)}}
function room(f,r){
  const y=f*H,E=[['N',r.x1,r.z1,r.x2,r.z1],['S',r.x1,r.z2,r.x2,r.z2],['W',r.x1,r.z1,r.x1,r.z2],['E',r.x2,r.z1,r.x2,r.z2]];
  r.f=f;rooms.push(r);
  E.forEach(([s,ax,az,bx,bz])=>{
    const vert=ax==bx,c=vert?(az+bz)/2:(ax+bx)/2,len=vert?bz-az:bx-ax;
    if(s!=r.d){wall(ax,az,bx,bz,y)}else{
      if(vert){wall(ax,az,ax,c-1,y);wall(ax,c+1,ax,bz,y)}else{wall(ax,az,c-1,az,y);wall(c+1,az,bx,az,y)}
      if(len>=6)[-2.2,2.2].forEach(o=>glass(vert,ax,az,c+o,y,1.6));
      const cx=vert?ax:c,cz=vert?c:az,off={S:[0,.4],N:[0,-.4],E:[.4,0],W:[-.4,0]}[r.d];
      makeDoor(r,vert,ax,az,c,y,cx,cz);
      label(r.n,cx+off[0],y+3.25,cz+off[1],3.4,.68)}
    });
  const ns=r.d=='S'||r.d=='N',Wd=ns?r.x2-r.x1:r.z2-r.z1,D=ns?r.z2-r.z1:r.x2-r.x1;
  furnish(f,r,y,Wd,D)}
function roomList(f){
  const L=[],GN=["Principal's Office","Faculty Room","Registrar","Cashier","Guidance Office","Clinic","Library","Canteen","Student Affairs","Alumni Office","School Store","Comfort Room (M)","Comfort Room (F)","Accounting","Security Office","Property Office","Learning Hub","Staff Lounge","Board Room","Alumni Hall"];
  for(let i=0;i<6;i++)L.push({x1:-30+i*10,x2:-20+i*10,z1:-26,z2:-19,d:'S',k:i,side:'N'});
  for(let i=0;i<4;i++)L.push({x1:-30,x2:-23,z1:-16+6.5*i,z2:-9.5+6.5*i,d:'E',side:'W'});
  for(let i=0;i<4;i++)L.push({x1:23,x2:30,z1:-16+6.5*i,z2:-9.5+6.5*i,d:'W',side:'E'});
  const xs=[[-30,-21],[-21,-12],[-12,-4],[4,12],[12,21],[21,30]];if(f>0)xs.splice(3,0,[-4,4]);
  xs.forEach(([a,b])=>L.push({x1:a,x2:b,z1:13,z2:20,d:'N',side:'S',hall:(a==-4)}));
  L.forEach((r,i)=>{r.n=f==0?GN[i]:r.hall?'Conference Hall':(f==3&&i<2)?'Computer Lab '+(i+1):(i==11||i==12)?'Comfort Room '+(i==11?'(M)':'(F)'):'Room '+((f+1)*100+i+1);r.i=i;r.cr=/^Comfort/.test(r.n);r.lab=/^Computer Lab/.test(r.n);r.cls=f>0&&!r.hall&&!r.cr});
  return L}

/* ---------- Stairs (clean, solid saw-tooth steps, consistent rise/run) ---------- */
const STEP_N=12,STEP_RISE=2/12;
function slopeRail(x,y0,za,y1,zb){const L=Math.hypot(zb-za,y1-y0),m=new THREE.Mesh(new THREE.BoxGeometry(.07,.07,L),mat(0x3b4a44));
  m.position.set(x,(y0+y1)/2+1.0,(za+zb)/2);m.rotation.x=-Math.atan2(y1-y0,zb-za);scene.add(m);return m}
function colWall(x,za,zb,y0,y1,t){t=t||.12;colliders.push({x1:x-t,x2:x+t,z1:Math.min(za,zb),z2:Math.max(za,zb),y0,y1})}
function stairs(ze,dd,xa,xb){
  const lw=2.5,n=STEP_N,za=ze+2*dd,zb=ze+8*dd,zc=ze+10*dd,mn=Math.min,mx=Math.max,R=STEP_RISE;
  colliders.push({x1:xa,x2:xb,z1:mn(ze,zc),z2:mx(ze,zc),y0:0,y1:3,veh:true});
  for(const L of [0,4,8]){
    surfs.push({x1:xa,x2:xa+lw,z1:mn(za,zb),z2:mx(za,zb),ramp:1,n,za,ya:L,zb,yb:L+2});
    surfs.push({x1:xb-lw,x2:xb,z1:mn(za,zb),z2:mx(za,zb),ramp:1,n,za:zb,ya:L+2,zb:za,yb:L+4});
    surfs.push({x1:xa,x2:xb,z1:mn(zb,zc),z2:mx(zb,zc),y:L+2});
    surfs.push({x1:xa,x2:xb,z1:mn(ze,za),z2:mx(ze,za),y:L+4});
    const stp=(x1,x2,s0,s1,top)=>{const zlo=mn(s0,s1),zhi=mx(s0,s1);ibc(IC,x1,top-R-.28,zlo,x2,top,zhi,0xd6cdb0);ibc(IC,x1,top-.03,zlo,x2,top+.005,zlo+(zhi-zlo)*.22,0xf7f2e0)};
    for(let i=0;i<n;i++){
      const s0=za+(zb-za)*i/n,s1=za+(zb-za)*(i+1)/n;stp(xa,xa+lw,s0,s1,L+R*(i+1));
      const t0=zb+(za-zb)*i/n,t1=zb+(za-zb)*(i+1)/n;stp(xb-lw,xb,t0,t1,L+2+R*(i+1))}
    // slabs: mid landing + top landing (with solid underside) and the central core between both flights
    cbox(xa,L+1.7,mn(zb,zc),xb,L+2,mx(zb,zc),0xe0d8bc,false);cbox(xa,L+3.7,mn(ze,za),xb,L+4,mx(ze,za),0xe0d8bc,false);
    cbox(xa+lw,L,mn(za,zb),xb-lw,L+4,mx(za,zb),MINT,true);
    // visible balustrades + invisible collision walls (so nobody falls off the sides)
    slopeRail(xa+.06,L,za,L+2,zb);slopeRail(xb-.06,L+2,zb,L+4,za);
    for(let i=0;i<=n;i+=3){const z0=za+(zb-za)*i/n,y0=L+R*mn(i+1,n);ibc(IC,xa+.03,y0,z0-.04,xa+.09,y0+1.0,z0+.04,0x3b4a44);
      const z1=zb+(za-zb)*i/n,y1=L+2+R*mn(i+1,n);ibc(IC,xb-.09,y1,z1-.04,xb-.03,y1+1.0,z1+.04,0x3b4a44)}
    colWall(xa,za,zb,L,L+3.1);colWall(xb,za,zb,L+2,L+5.1);
    railV(xa,mn(zb,zc),mx(zb,zc),L+2);railV(xb,mn(zb,zc),mx(zb,zc),L+2);railH(zc,xa,xb,L+2);
    railV(xa,mn(ze,za),mx(ze,za),L+4);railV(xb,mn(ze,za),mx(ze,za),L+4)}}

function support(x,z,y){let b=0;
  for(const s of surfs)if(x>s.x1&&x<s.x2&&z>s.z1&&z<s.z2){
    let h;if(s.ramp){const t=clamp((z-s.za)/(s.zb-s.za),0,.9999);h=s.n?s.ya+(s.yb-s.ya)*(Math.floor(t*s.n)+1)/s.n:s.ya+t*(s.yb-s.ya)}else h=s.y;
    if(h<=y+.7&&h>b)b=h}
  return b}
/* spatial grid for fast collision queries */
const CG=4,cgrid=new Map();let cgBuilt=false;
function buildGrid(){cgrid.clear();colliders.forEach(gridAdd);cgBuilt=true}
function gridAdd(c){for(let i=Math.floor(c.x1/CG);i<=Math.floor(c.x2/CG);i++)for(let j=Math.floor(c.z1/CG);j<=Math.floor(c.z2/CG);j++){const k=i*4096+j;let a=cgrid.get(k);if(!a)cgrid.set(k,a=[]);a.push(c)}}
function nearCols(x1,z1,x2,z2){if(!cgBuilt)return colliders;const out=[],seen=new Set();
  for(let i=Math.floor(x1/CG);i<=Math.floor(x2/CG);i++)for(let j=Math.floor(z1/CG);j<=Math.floor(z2/CG);j++){const a=cgrid.get(i*4096+j);if(a)for(const c of a)if(!seen.has(c)){seen.add(c);out.push(c)}}
  return out}
const blocked=(x,z,y,r)=>{r=r||.4;return nearCols(x-r,z-r,x+r,z+r).some(c=>!c.off&&!c.veh&&c.y0<y+1.7&&c.y1>y+.5&&x+r>c.x1&&x-r<c.x2&&z+r>c.z1&&z-r<c.z2)};
const blockedV=(x,z,r)=>nearCols(x-r,z-r,x+r,z+r).some(c=>!c.off&&c.y0<1.2&&c.y1>.25&&x+r>c.x1&&x-r<c.x2&&z+r>c.z1&&z-r<c.z2);
const hitPt=(x,y,z)=>nearCols(x,z,x,z).some(c=>!c.off&&!c.veh&&y>c.y0&&y<c.y1&&x>c.x1&&x<c.x2&&z>c.z1&&z<c.z2);

/* ---------- Vehicles ---------- */
const wgc={};
const wg=r=>wgc['w'+r]||(wgc['w'+r]=new THREE.CylinderGeometry(r,r,.26,14).rotateZ(Math.PI/2));
const hg=r=>wgc['h'+r]||(wgc['h'+r]=new THREE.BoxGeometry(.3,r*1.1,.07));
function addWheel(g,x,y,z,r){const p=new THREE.Group();p.position.set(x,y,z);g.add(p);
  p.add(new THREE.Mesh(wg(r),mat(0x15171a)));p.add(new THREE.Mesh(hg(r),mat(0xb9bec4)));g.userData.wheels.push({p,r})}
function vbox(g){return (w,h,d,x,y,z,c,m)=>{const o=new THREE.Mesh(geoBox(mat,w,h,d),(m||mat)(c));o.position.set(x,y,z);g.add(o);return o}}
function makeCar(type,color){
  const g=new THREE.Group();g.userData.wheels=[];const B=vbox(g);
  const van=type=='van',suv=type=='suv',pk=type=='pickup';
  const L=van?4.7:suv?4.5:pk?4.9:4.2,chh=van?1.15:suv?.85:pk?.8:.68;
  B(1.8,.58,L,0,.62,0,color);B(1.86,.1,L-.1,0,.37,0,0x25282c);
  const cl=van?3.4:suv?2.7:pk?1.6:2.0,cz=van?-.3:suv?-.35:pk?.55:-.15;
  B(1.62,chh,cl,0,.91+chh/2,cz,color);
  B(1.66,chh*.62,cl-.55,0,.91+chh*.58,cz,0x1c3a52);B(1.5,chh*.62,cl+.02,0,.91+chh*.58,cz,0x1c3a52);
  B(1.5,.05,cl-.15,0,.93+chh,cz,0xdddddd);
  if(pk)B(1.8,.38,1.9,0,1.14,-1.4,0x2b2e33);
  [-.62,.62].forEach(x=>{B(.34,.16,.06,x,.78,L/2+.02,0xfff4c0,bmat);B(.3,.14,.06,x,.8,-L/2-.02,0xe02020,bmat);B(.12,.1,.2,x*1.55,1.05,cz+cl/2-.1,color)});
  B(1.84,.18,.22,0,.42,L/2+.05,0x3a3d42);B(1.84,.18,.22,0,.42,-L/2-.05,0x3a3d42);B(.9,.2,.05,0,.7,L/2+.03,0x111111);B(.5,.14,.04,0,.55,-L/2-.06,0xffffff);
  [[.92,L/2-.85],[-.92,L/2-.85],[.92,-L/2+.85],[-.92,-L/2+.85]].forEach(([x,z])=>addWheel(g,x,.38,z,.38));
  g.userData.len=L;return g}
function makeJeep(c1,c2){
  const g=new THREE.Group();g.userData.wheels=[];const B=vbox(g);
  B(2,.25,6.4,0,.45,0,0x2a2c30);B(2,1.35,4.4,0,1.25,-.8,c1);B(2.06,.55,3.8,0,1.55,-.8,0x1c3a52);B(2.04,.14,4.4,0,.95,-.8,c2);
  B(2.1,.1,4.5,0,1.98,-.8,c2);B(1.9,.8,1.5,0,.9,2.2,c1);B(1.8,.5,.06,0,1.5,1.42,0x1c3a52);B(2,.2,.2,0,.55,3.1,0xcccccc);
  [-.7,.7].forEach(x=>B(.3,.2,.06,x,.95,2.97,0xfff4c0,bmat));B(1.8,.1,.4,0,.45,-3.15,0x555555);
  [-.75,.75].forEach(x=>B(.3,.14,.06,x,.7,-3.0,0xe02020,bmat));
  [1.04,-1.04].forEach((x,i)=>g.add(signPlane('NEMCO · CAGAYAN DE ORO',3.6,.34,hx(c2),x,1.1,-.8,i?-Math.PI/2:Math.PI/2,'#111')));
  B(1.9,.06,3.6,0,2.08,-.8,0x666666);
  [[1,2.1],[-1,2.1],[1,-1.9],[-1,-1.9]].forEach(([x,z])=>addWheel(g,x*.95,.45,z,.45));
  g.children.forEach(ch=>{});g.userData.len=6.4;return g}
function sitPose(c){const u=c.userData;u.l1.rotation.x=u.l2.rotation.x=-1.25}
function makeTrike(color,col2,pax,civ){
  const g=new THREE.Group();g.userData.wheels=[];const B=vbox(g);
  B(.36,.5,1.5,0,.7,0,0x2b2f36);B(.4,.28,.5,0,1.0,.45,color);B(.4,.12,.7,0,.82,-.3,0x111111);B(.12,.7,.1,0,.65,.85,0x777777);
  B(.9,.07,.07,0,1.15,.7,0x222222);B(.2,.2,.12,0,1.0,.97,0xfff4c0,bmat);B(.3,.1,.8,0,.52,-.65,color);
  addWheel(g,0,.33,.9,.33);addWheel(g,0,.33,-.75,.33);
  B(1.0,.1,.12,-.5,.5,.05,0x555555);
  B(1.0,.12,1.7,-1.05,.46,-.1,0x2b2f36);B(1.0,.65,1.5,-1.05,.85,-.1,col2);B(1.0,.5,.08,-1.05,1.0,.62,col2);
  [[-.58,.6],[-1.52,.6],[-.58,-.8],[-1.52,-.8]].forEach(([x,z])=>B(.06,.95,.06,x,1.62,z,0x444444));
  B(1.4,.07,1.95,-1.05,2.12,-.1,color);B(1.44,.1,2.0,-1.05,2.04,-.1,0xffffff);
  addWheel(g,-1.6,.3,.05,.3);
  if(pax>=0){const dr=makeChar(civ(),null,g);dr.position.set(0,0,-.12);sitPose(dr);dr.userData.a1.rotation.x=dr.userData.a2.rotation.x=-1}
  for(let i=0;i<pax;i++){const p=makeChar(civ(),null,g);p.position.set(-.85-i*.45,-.12,-.35+i*.4);sitPose(p)}
  g.userData.len=2.4;return g}

/* ---------- NEMCO building details ---------- */
const tileTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.fillStyle='#78a8ae';g.fillRect(0,0,64,64);g.strokeStyle='#a2c9ca';g.lineWidth=2;g.strokeRect(0,0,64,64);
  for(let i=0;i<8;i++){g.fillStyle='#6f9ea5';g.fillRect(Math.random()*58,Math.random()*58,5,5)}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t})();
function tilePlane(a,b,c,d,y){const t=tileTex.clone();t.needsUpdate=true;t.repeat.set((c-a)/1.5,(d-b)/1.5);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(c-a,d-b),new THREE.MeshLambertMaterial({map:t}));m.rotation.x=-Math.PI/2;m.position.set((a+c)/2,y,(b+d)/2);scene.add(m)}
function towerTex(){const W=400,Hh=890,c=document.createElement('canvas');c.width=W;c.height=Hh;const g=c.getContext('2d');
  g.fillStyle='#d9d0b4';g.fillRect(0,0,W,Hh);g.strokeStyle='rgba(120,110,85,.35)';g.lineWidth=2;
  for(let x=0;x<=W;x+=40){g.beginPath();g.moveTo(x,0);g.lineTo(x,Hh);g.stroke()}for(let y=0;y<=Hh;y+=40){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()}
  const Y=y=>Hh-y*50,X=x=>(x+4)*50;
  for(let f=1;f<=3;f++){g.fillStyle='#e8e2cc';g.fillRect(X(-3.6)-6,Y(f*4+3.3)-6,X(-1.9)-X(-3.6)+12,Y(f*4+.9)-Y(f*4+3.3)+12);g.fillStyle='#4d7b91';g.fillRect(X(-3.6),Y(f*4+3.3),X(-1.9)-X(-3.6),Y(f*4+.9)-Y(f*4+3.3))}
  g.fillStyle='#fff';g.beginPath();g.arc(X(-2.3),Y(13),26,0,7);g.fill();g.strokeStyle='#4a6fb0';g.lineWidth=4;g.beginPath();g.arc(X(-2.3),Y(13),17,0,7);g.stroke();
  g.fillStyle='#fff';g.font='bold 62px Arial';g.textAlign='left';g.textBaseline='middle';g.shadowColor='rgba(0,0,0,.35)';g.shadowBlur=4;g.fillText('NEMCO',X(-1.4),Y(13)+3);
  g.shadowBlur=0;g.fillStyle='#e0842a';g.fillRect(X(-3.1),Y(3.2),6,Y(0)-Y(3.2));g.fillRect(X(2.7),Y(3.2),6,Y(0)-Y(3.2));
  return new THREE.CanvasTexture(c)}
function frontTex(){const W=512,Hh=734,c=document.createElement('canvas');c.width=W;c.height=Hh;const g=c.getContext('2d');
  const X=x=>(x+6)/12*W,Y=y=>(17.2-y)/17.2*Hh,R=(x1,y1,x2,y2,col)=>{g.fillStyle=col;g.fillRect(X(x1),Y(y2),X(x2)-X(x1),Y(y1)-Y(y2))};
  R(-6,3.3,6,17.2,'#e6d79a');R(-6,0,-4,3.3,'#e6d79a');R(4,0,6,3.3,'#e6d79a');
  R(-6,16.5,6,17.2,'#76d2bc');R(-6,3.3,-5.8,17.2,'#76d2bc');R(5.8,3.3,6,17.2,'#76d2bc');R(-6,3.3,6,3.9,'#76d2bc');
  [[-5.5,-4.1],[4.1,5.5]].forEach(([a,b])=>{R(a,4.4,b,14.6,'#7ccdb6');for(let i=0;i<300;i++){g.fillStyle=['#9ae0cc','#5fb8a2','#a9e8d6','#6cc4ae'][i%4];g.fillRect(X(a)+Math.random()*(X(b)-X(a)-6),Y(14.6)+Math.random()*(Y(4.4)-Y(14.6)-6),6,6)}
    R(a,14.7,b,15.8,'#f3f1e6');R(a+.1,14.8,b-.1,15.7,'#cfe3f2')});
  for(let f=1;f<=2;f++)[-1.7,1.7].forEach(cx=>{R(cx-.85,f*4+.9,cx+.85,f*4+3.1,'#f3f1e6');R(cx-.7,f*4+1.05,cx+.7,f*4+2.95,'#5d8fa8');R(cx-.04,f*4+1.05,cx+.04,f*4+2.95,'#f3f1e6')});
  R(-3.8,12.2,3.8,15.8,'#ffffff');R(-3.65,12.35,3.65,15.65,'#3aa88f');
  g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.font='bold 33px Arial';g.fillText('NORTHEASTERN',X(0),Y(14.8));g.font='bold 36px Arial';g.fillText('MINDANAO',X(0),Y(13.95));g.fillText('COLLEGES',X(0),Y(13.1));
  g.font='bold 22px Arial';g.fillText('★   ★   ★',X(0),Y(12.55));
  R(-4,2.9,4,3.3,'#6b5a45');g.strokeStyle='#4a3d2e';g.lineWidth=1;for(let y=2.9;y<3.3;y+=.1){g.beginPath();g.moveTo(X(-4),Y(y));g.lineTo(X(4),Y(y));g.stroke()}
  R(-5.7,.5,-4.3,2.8,'#8fdcc8');R(4.3,.5,5.7,2.8,'#8fdcc8');
  return new THREE.CanvasTexture(c)}
function frontTower(){
  const z0=20.15,z1=22.4;
  cbox(-6,0,z0,-4,17.2,z1,WALLC,true);cbox(4,0,z0,6,17.2,z1,WALLC,true);cbox(-4,3.3,z0,4,17.2,z1,WALLC,true);
  cbox(-6.5,17.2,z0-.3,6.5,17.9,z1+.4,0xf1ebd8,false);cbox(-6.54,17.5,z0-.34,6.54,17.65,z1+.44,MINT,false);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(12,17.2),new THREE.MeshLambertMaterial({map:frontTex(),transparent:true,alphaTest:.05}));m.position.set(0,8.6,z1+.03);scene.add(m)}
function facade(){
  const faces=[['z',-26.15,-30,30,-1],['z',20.15,-30,30,1],['x',-30.15,-26,20,-1],['x',30.15,-26,20,1]];
  faces.forEach(([ax,fc,a,b,sg])=>{
    const od=(p1,p2)=>sg<0?[-p2,-p1]:[p1,p2];
    const put=(inst,t1,y1,t2,y2,p1,p2)=>{const d=od(p1,p2);if(ax=='z')ib(inst,t1,y1,fc+d[0],t2,y2,fc+d[1]);else ib(inst,fc+d[0],y1,t1,fc+d[1],y2,t2)};
    for(let t=a;t<=b+.01;t+=5)put(IT,t-.3,0,t+.3,15.9,-.05,.34);if((b-a)%5)put(IT,b-.3,0,b+.3,15.9,-.05,.34);
    for(let f=0;f<4;f++){const y=f*H;
      for(let s0=a;s0+5<=b+.01;s0+=5)for(const dx of [1.1,2.5,3.9]){const cx=s0+dx;
        if(ax=='z'&&sg>0&&Math.abs(cx)<(f==0?8:6.8))continue;
        put(IP,cx-.65,y+1.1,cx+.65,y+2.75,-.08,.08);put(IG,cx-.55,y+1.22,cx+.55,y+2.62,-.08,.14);put(IT,cx-.75,y+1.0,cx+.75,y+1.13,-.05,.3)}}});
}
/* ---------- Build world (NEMCO reference) ---------- */
const LT={};
function mkGlass(n){const m=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshPhongMaterial({color:0x8fc7e0,specular:0xffffff,shininess:100,transparent:true,opacity:.5,depthWrite:false,emissive:0x000000}),n);m.count=0;m.frustumCulled=false;m.renderOrder=3;scene.add(m);return m}
function buildWorld(){
  scene=new THREE.Scene();scene.background=new THREE.Color(0x9fd6f2);scene.fog=new THREE.Fog(0xcfeaf5,100,260);
  LT.hemi=new THREE.HemisphereLight(0xffffff,0xb8b8a4,.86);scene.add(LT.hemi);
  const dl=new THREE.DirectionalLight(0xfff4dc,.42);dl.position.set(40,80,50);scene.add(dl);scene.add(dl.target);LT.dir=dl;
  LT.pt=new THREE.PointLight(0xfff0cc,0,14,1.6);scene.add(LT.pt);
  // sky dome + sun
  const sc=document.createElement('canvas');sc.width=8;sc.height=256;const sg=sc.getContext('2d'),gr=sg.createLinearGradient(0,0,0,256);
  gr.addColorStop(0,'#3d8fd6');gr.addColorStop(.55,'#9ed8f6');gr.addColorStop(.8,'#e6f6fb');gr.addColorStop(1,'#fdf3c8');sg.fillStyle=gr;sg.fillRect(0,0,8,256);
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(300,16,12),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(sc),side:THREE.BackSide,fog:false,depthWrite:false})));
  const sun=new THREE.Mesh(new THREE.SphereGeometry(10,12,10),new THREE.MeshBasicMaterial({color:0xfff2a0,fog:false}));sun.position.set(120,150,-200);scene.add(sun);LT.sun=sun;LT.sky=scene.children[scene.children.length-2];
  IW=mkInst(CREAM,2600);IY=mkInst(WALLC,2600);IK=mkInst(0x4a504c,900);IP=mkInst(0xf6f4ea,2000);IG=mkGlass(1800);IC=mkInst(0xffffff,9000);ICB=mkInst(0xffffff,1600,true);ID=mkInst(BROWN,2600);IB=mkInst(0x2f4f3f,200);IL=mkInst(0xfff7d6,500,1);IS=mkInst(0xd9cfae,300);IT=mkInst(0x72d0b9,2600);IH=mkInst(0x3a6ea5,2600);IF=mkInst(0x2a2f36,700);IR=mkInst(0xf4f4f0,200);
  const FP=[[-30,-26,30,-16],[-30,-16,-20,10],[20,-16,30,10],[-30,10,30,20]];
  // ground
  const gc=document.createElement('canvas');gc.width=gc.height=64;const gx=gc.getContext('2d');gx.fillStyle='#7a9a62';gx.fillRect(0,0,64,64);
  for(let i=0;i<260;i++){gx.fillStyle=i%2?'#86a86c':'#6e8d58';gx.fillRect(Math.random()*64,Math.random()*64,2,2)}
  const gt=new THREE.CanvasTexture(gc);gt.wrapS=gt.wrapT=THREE.RepeatWrapping;gt.repeat.set(80,80);
  const gm=new THREE.Mesh(new THREE.PlaneGeometry(400,400),new THREE.MeshLambertMaterial({map:gt}));gm.rotation.x=-Math.PI/2;gm.position.y=-.01;scene.add(gm);
  // road, sidewalks, curbs, markings
  cbox(-150,0,30,150,.04,46,0x45484d,false);cbox(-150,0,26,150,.1,30,0xbdb9ad,false);cbox(-150,0,46,150,.1,53,0xbdb9ad,false);
  cbox(-150,0,29.85,150,.16,30,0xe0ddd2,false);cbox(-150,0,46,150,.16,46.15,0xe0ddd2,false);
  cbox(-34,0,20,34,.06,26,0xb8b3a4,false);cbox(-4.6,0,20,4.6,.07,26,0xd2cdbd,false);
  for(let x=-100;x<100;x+=7)ib(IR,x,.045,39.92,x+3.5,.075,40.08);
  for(let z=30.5;z<46;z+=1.1)ib(IR,-2.2,.045,z,2.2,.075,z+.5);
  cbox(-20,0,-16,20,.05,10,0x4b4d53,false);
  // courtyard asphalt with chalk marks + basketball court + parking stalls
  const cc=document.createElement('canvas');cc.width=800;cc.height=520;const cg=cc.getContext('2d');
  cg.fillStyle='#4b4d53';cg.fillRect(0,0,800,520);
  for(let i=0;i<1500;i++){cg.fillStyle=['#55575d','#424449','#50525a'][i%3];cg.fillRect(Math.random()*800,Math.random()*520,3+Math.random()*10,2+Math.random()*6)}
  cg.lineWidth=3;cg.strokeStyle='rgba(120,170,150,.5)';cg.beginPath();cg.arc(560,380,70,0,7);cg.stroke();cg.strokeStyle='rgba(200,150,110,.5)';cg.beginPath();cg.arc(200,400,55,0,7);cg.stroke();
  courtLines(cg);
  cg.strokeStyle='rgba(235,235,225,.7)';cg.lineWidth=3;[-10,-5.1,-.2,5.8].forEach(z=>{const zz=(z+16)*20;cg.beginPath();cg.moveTo(690,zz);cg.lineTo(780,zz);cg.stroke()});
  const cty=new THREE.Mesh(new THREE.PlaneGeometry(40,26),new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(cc)}));cty.rotation.x=-Math.PI/2;cty.position.set(0,.06,-3);scene.add(cty);
  buildCourt();
  // floors, slabs, roof with overhanging eave
  FP.forEach(([a,b,c,d])=>{cbox(a,0,b,c,.05,d,TILE,false);tilePlane(a,b,c,d,.06);
    for(let f=1;f<=3;f++){cbox(a,f*H-.3,b,c,f*H,d,0xe9e4d2,false);tilePlane(a,b,c,d,f*H+.01);surfs.push({x1:a,x2:c,z1:b,z2:d,y:f*H})}
    cbox(a-.6,15.7,b-.6,c+.6,16.5,d+.6,0xf1ebd8,false);cbox(a-.64,15.95,b-.64,c+.64,16.1,d+.64,MINT,false)});
  cbox(22,16.5,-15,29,19,-9,WALLC,false);cbox(21.6,19,-15.4,29.4,19.3,-8.6,0xf1ebd8,false);
  // mint horizontal bands around the building at every floor
  for(let f=0;f<4;f++){const y=f*H+3.3;
    cbox(-30.45,y,-26.45,30.45,y+.5,-26.1,MINT,false);cbox(-30.45,y,20.1,30.45,y+.5,20.45,MINT,false);
    cbox(-30.45,y,-26.45,-30.1,y+.5,20.45,MINT,false);cbox(30.1,y,-26.45,30.45,y+.5,20.45,MINT,false)}
  for(let f=0;f<4;f++){const y=f*H;wall(-30,-19,-30,-16,y);wall(30,-19,30,-16,y);wall(-30,10,-30,13,y);wall(30,10,30,13,y)}
  for(let f=1;f<=3;f++){const y=f*H;
    railH(-16,-20,8,y);railH(-16,14,20,y);railH(10,-20,-14,y);railH(10,-8,20,y);railV(-20,-16,10,y);railV(20,-16,10,y)}
  for(let f=0;f<4;f++){const y=f*H+3.45;
    for(let x=-29;x<30;x+=2.5){ib(IT,x-.12,y,-19,x+.12,y+.25,-16);ib(IT,x-.12,y,10,x+.12,y+.25,13)}
    for(let z=-14.5;z<10;z+=2.5){ib(IT,-23,y,z-.12,-20,y+.25,z+.12);ib(IT,20,y,z-.12,23,y+.25,z+.12)}}
  const col=(x,z,h)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,h||16,12),mat(MINT));m.position.set(x,(h||16)/2,z);scene.add(m);
    colliders.push({x1:x-.35,x2:x+.35,z1:z-.35,z2:z+.35,y0:0,y1:h||16});
    if(!h)for(let f=0;f<4;f++){ib(IT,x-.5,f*H+3.05,z-.5,x+.5,f*H+3.3,z+.5);ib(IT,x-.64,f*H+3.3,z-.64,x+.64,f*H+3.7,z+.64)}};
  for(let x=-30;x<=30;x+=5){if(x!=10)col(x,-16);if(x!=-10)col(x,10)}
  for(let z=-11;z<=5;z+=5){col(-20,z);col(20,z)}
  for(let f=0;f<4;f++)roomList(f).forEach(r=>room(f,r));
  stairs(-16,1,8,14);stairs(10,-1,-14,-8);
  // NEMCO tower (courtyard side) + street front tower + facade details
  cbox(-4,0,-16,4,17.8,-13,0xd9d0b4,true);col(-4.3,-12.7,17.8);col(4.3,-12.7,17.8);
  cbox(-4.7,17.8,-16.7,4.7,18.5,-12.5,0xf1ebd8,false);cbox(-4.74,18.1,-16.74,4.74,18.25,-12.46,MINT,false);cbox(-.1,18.5,-14.7,.1,21.5,-14.5,0xcccccc,false);
  const tw=new THREE.Mesh(new THREE.PlaneGeometry(8,17.8),new THREE.MeshLambertMaterial({map:towerTex()}));tw.position.set(0,8.9,-12.97);scene.add(tw);
  frontTower();facade();
  const fp=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,14,8),mat(0xcccccc));fp.position.set(-6,7,-12);scene.add(fp);colliders.push({x1:-6.2,x2:-5.8,z1:-12.2,z2:-11.8,y0:0,y1:14});
  const fc=document.createElement('canvas');fc.width=240;fc.height=140;const fg=fc.getContext('2d');
  fg.fillStyle='#0038a8';fg.fillRect(0,0,240,70);fg.fillStyle='#ce1126';fg.fillRect(0,70,240,70);fg.fillStyle='#fff';fg.beginPath();fg.moveTo(0,0);fg.lineTo(120,70);fg.lineTo(0,140);fg.fill();
  fg.fillStyle='#fcd116';fg.beginPath();fg.arc(38,70,12,0,7);fg.fill();
  const flag=new THREE.Mesh(new THREE.PlaneGeometry(2.4,1.4),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(fc),side:THREE.DoubleSide}));flag.position.set(-4.8,12.8,-12);scene.add(flag);flags.push(flag);
  // obelisk monument, drums, trees, benches, beds, chairs, boards, sign, lamps
  cbox(-15.3,0,-9,-13.7,.6,-7.4,0xe8dca8,true);
  const ob=new THREE.Mesh(new THREE.CylinderGeometry(.14,.6,6,4).rotateY(Math.PI/4),mat(0xe3d9b0));ob.position.set(-14.5,3.6,-8.2);scene.add(ob);
  [[-18.6,-14.7],[-17.8,-14.7],[-18.2,-14],[-17.4,-14]].forEach(([x,z])=>{const d=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.95,10),mat(0x1d4fa0));d.position.set(x,.48,z);scene.add(d)});
  colliders.push({x1:-19,x2:-17,z1:-15.1,z2:-13.6,y0:0,y1:1});
  [[-17,-12],[17,-12],[-17,7],[17,7.5]].forEach(([x,z])=>{const t=new THREE.Mesh(new THREE.CylinderGeometry(.18,.25,4,8),mat(0x6b4a2a));t.position.set(x,2,z);scene.add(t);
    colliders.push({x1:x-.3,x2:x+.3,z1:z-.3,z2:z+.3,y0:0,y1:4});
    for(let k=0;k<6;k++){const l=new THREE.Mesh(new THREE.BoxGeometry(2.4,.1,.5),mat(0x2e8b3a));l.position.set(x,4.1,z);l.rotation.y=k*Math.PI/3;l.rotation.z=.25;scene.add(l)}});
  cbox(-18.6,.45,-8,-17.4,.55,-5,0x8b5a2b,true);cbox(-18.65,.55,-8,-18.5,1.1,-5,0x8b5a2b,false);cbox(-18.5,0,-7.9,-18.4,.45,-7.8,0x444444,false);cbox(-18.5,0,-5.2,-18.4,.45,-5.1,0x444444,false);
  cbox(-19.4,0,-12.5,-16.6,.35,-9.5,0x6b8f4a,false);
  for(let i=0;i<12;i++){const fx=-19.2+(i%4)*.7,fz=-12.3+Math.floor(i/4)*.9;cbox(fx,.35,fz,fx+.18,.55,fz+.18,[0xff6b9d,0xffd23f,0xffffff,0xff8c42][i%4],false)}
  [[3.2,-12.3],[3.9,-12.3],[4.6,-12.3]].forEach(([x,z])=>{cbox(x-.25,0,z-.25,x+.25,1.3,z+.25,0xf2f2f2,true);cbox(x-.2,1.3,z-.2,x+.2,1.4,z+.2,0xdddddd,false)});
  [[6.2,-11.2],[6.9,-10.5],[5.4,-10.2]].forEach(([x,z])=>{cbox(x-.22,.42,z-.22,x+.22,.48,z+.22,0xf2f2f2,false);cbox(x-.22,.48,z-.22,x+.22,.9,z-.16,0xf2f2f2,false);cbox(x-.2,0,z-.2,x-.14,.42,z-.14,0xe0e0e0,false);cbox(x+.14,0,z+.14,x+.2,.42,z+.2,0xe0e0e0,false)});
  [[-12.8,-9],[8.5,12.3]].forEach(([a,b])=>{cbox(a,1.1,-18.86,b,2.5,-18.8,0x7a5230,false);cbox(a+.1,1.2,-18.8,b-.1,2.4,-18.78,0xc9a56a,false);
    for(let i=0;i<6;i++){const px=a+.25+((i*.61)%(b-a-.6));cbox(px,1.4+(i%3)*.3,-18.78,px+.35,1.65+(i%3)*.3,-18.76,0xffffff,false)}});
  cbox(-10.3,0,-12.35,-10.2,1.5,-12.25,0x555555,false);cbox(-8.8,0,-12.35,-8.7,1.5,-12.25,0x555555,false);
  signPlane('PARKING AREA',1.8,.7,'#f5f5f5',-9.5,1.15,-12.2,0,'#b02020');
  [[-12,-12],[12,4]].forEach(([x,z])=>{cbox(x-.06,0,z-.06,x+.06,3.6,z+.06,0x333333,true);cbox(x-.2,3.6,z-.2,x+.2,3.85,z+.2,0xfff7d6,false).material=bmat(0xfff7d6)});
  // front: fence, gate arch, guard house, yard trees, benches
  const fz=26;
  [[-62,-4.8],[4.8,62]].forEach(([a,b])=>{
    cbox(a,0,fz-.2,b,.7,fz+.2,0xe8dca8,false);
    for(let x=a+.3;x<b;x+=.5)ib(IF,x-.04,.7,fz-.04,x+.04,2.1,fz+.04);
    cbox(a,2.1,fz-.06,b,2.2,fz+.06,0x2a2f36,false);
    colliders.push({x1:a,x2:b,z1:fz-.25,z2:fz+.25,y0:0,y1:2.2});
    for(let x=a;x<=b;x+=6)cbox(x-.25,0,fz-.25,x+.25,2.5,fz+.25,0xe8dca8,false)});
  cbox(-5.4,0,fz-.45,-4.4,3.6,fz+.45,0xe8dca8,true);cbox(4.4,0,fz-.45,5.4,3.6,fz+.45,0xe8dca8,true);
  cbox(-5.4,3.6,fz-.35,5.4,4.6,fz+.35,0x3fa790,false);
  signPlane('NEMCO · WELCOME',9.6,.95,'#1f8f7a',0,4.1,fz+.37);signPlane('NEMCO · SEE YOU TOMORROW',9.6,.95,'#1f8f7a',0,4.1,fz-.37,Math.PI);
  cbox(6.6,0,21.5,9.2,2.8,24.3,0xe8dca8,true);cbox(6.4,2.8,21.3,9.4,3.1,24.5,0x3fa790,false);cbox(6.6,1.2,24.28,9.2,2.2,24.32,0x1c3a52,false);
  [[-24,23.5],[24,23.5],[-36,22],[36,22]].forEach(([x,z])=>{const t=new THREE.Mesh(new THREE.CylinderGeometry(.18,.25,3.6,8),mat(0x6b4a2a));t.position.set(x,1.8,z);scene.add(t);
    colliders.push({x1:x-.3,x2:x+.3,z1:z-.3,z2:z+.3,y0:0,y1:4});
    for(let k=0;k<6;k++){const l=new THREE.Mesh(new THREE.BoxGeometry(2.4,.1,.5),mat(0x2e8b3a));l.position.set(x,3.7,z);l.rotation.y=k*Math.PI/3;l.rotation.z=.25;scene.add(l)}});
  // street lamps
  for(let x=-49;x<=49;x+=14){cbox(x-.07,0,28-.07,x+.07,5,28+.07,0x333333,true);cbox(x-.07,4.9,28-.07,x+.07,5.05,28+.9,0x333333,false);cbox(x-.25,4.75,28+.7,x+.25,4.9,28+1.1,0xfff7d6,false).material=bmat(0xfff7d6)}
  // parked cars: faculty yard + roadside
  const CC=[0xc0392b,0xf5f5f5,0x2f6fbf,0xb8bcc0,0x1b1b1f,0xf2c21b,0x2e9e5b,0xe67e22],TY=['sedan','suv','van','pickup','sedan','suv'];
  const addPark=(type,color,x,z,rot)=>{const c=makeCar(type,color);c.position.set(x,0,z);c.rotation.y=rot;scene.add(c);
    const L=c.userData.len,al=Math.abs(Math.sin(rot))>.5,a=al?L/2:.95,b=al?.95:L/2;
    colliders.push({x1:x-a,x2:x+a,z1:z-b,z2:z+b,y0:0,y1:1.9});cars.push({x,z})};
  for(let i=0;i<5;i++)addPark(TY[i%6],CC[i%8],11.5+i*2.8,23.2,i%2?0:Math.PI);
  for(let i=0;i<4;i++)addPark(TY[(i+2)%6],CC[(i+3)%8],-11.5-i*2.8,23.2,i%2?Math.PI:0);
  [-54,-47,-40,-32,-24,-16,12,19,27,35,43,51].forEach((x,i)=>addPark(TY[i%6],CC[(i*3)%8],x,32.2,-Math.PI/2));
  addPark('sedan',0x4a90d0,17.2,-7.6,0);addPark('sedan',0x1b1b1f,17.2,-2.7,Math.PI);addPark('pickup',0xb8bcc0,17.3,3.0,0);addPark('van',0x3aa58a,-17,2.5,Math.PI);
  // shops across the street
  [[-48,'SARI-SARI STORE',0xd88a6a],[-30,'BAKERY',0xe8e0d0],[-12,'INTERNET CAFE',0xb8d0e0],[24,'PHARMACY',0xe8c8d8],[42,'HARDWARE',0xd9cfae]].forEach(([x,n,c],i)=>{
    cbox(x-8,0,53,x+8,6+(i%2)*1.5,63,c,true);cbox(x-8,3.1,50.5,x+8,3.3,53,[0xc0392b,0x2f6fbf,0x2e9e5b,0xf2c21b][i%4],false);
    cbox(x-6,0,52.9,x-2,2.6,53.1,0x1c3a52,false);signPlane(n,12,1.3,'#2a2f36',x,4.4,52.9,Math.PI)});
  // background city
  [[-60,75],[-40,85],[0,85],[40,85],[70,75],[-90,0],[-90,-40],[90,0],[90,-40],[-50,-60],[0,-65],[50,-60]].forEach(([x,z],i)=>
    cbox(x-9,0,z-8,x+9,10+(i%4)*5,z+8,[0xd88a6a,0xe8e0d0,0xb8d0e0,0x9fbf8f][i%4],false));
  for(let i=0;i<9;i++){const c=new THREE.Group(),cm=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9});
    for(let k=0;k<3;k++){const s=new THREE.Mesh(new THREE.SphereGeometry(6+k*2,10,8),cm);s.position.set(k*7-7,0,0);s.scale.y=.55;c.add(s)}
    c.position.set(-160+i*40,60+(i%3)*12,(i%2?-110:110));scene.add(c);clouds.push(c)}
  // moving vehicles
  const civ=civOpts;
  const addVeh=(g,lane,x,dir,sp,hl,hw,off)=>{g.position.set(x,0,lane+(off||0));g.rotation.y=dir>0?Math.PI/2:-Math.PI/2;scene.add(g);vehicles.push({g,dir,sp,v0:sp,hl,hw,lane:lane+(off||0)})};
  const tr=(c1,c2)=>makeTrike(c1,c2,Math.floor(Math.random()*3),civ);
  addVeh(tr(0xf2c21b,0x2f6fbf),37,40,-1,5.5,2.2,1.6,.7);addVeh(makeJeep(0x2f6fbf,0xf2c21b),37,-35,-1,5.5,3.4,1.2);addVeh(makeCar('sedan',0xf2c21b),37,-105,-1,5.5,2.2,1,0);
  addVeh(tr(0xc0392b,0x2e9e5b),43,-60,1,6,2.2,1.6,-.7);addVeh(tr(0xe67e22,0x8e5bb5),43,20,1,6,2.2,1.6,-.7);addVeh(makeCar('suv',0xf5f5f5),43,90,1,6,2.4,1,0);
  buildNpcs();
  colliders.push({x1:-4.15,x2:4.15,z1:19.4,z2:20.2,y0:0,y1:1.5,veh:true});
  buildBoardingHouse();buildExtras();buildGrid();
  [IW,IY,IK,IP,IG,ID,IB,IL,IS,IT,IH,IF,IR,IC,ICB].forEach(m=>{m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true});
  setupDayNight();built=true}
