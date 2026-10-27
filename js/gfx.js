/* ---------- Three.js helpers ---------- */
const colliders=[],doors=[],npcs=[],rooms=[],surfs=[],clouds=[],flags=[],vehicles=[],cars=[],mats={},bmats={},pmats={},texCache={};
const CREAM=0xefe8d0,WALLC=0xf0e3ac,MINT=0x78d3bd,TILE=0x7ea7ad,BROWN=0x8b5a2b;
const mat=c=>mats[c]||(mats[c]=new THREE.MeshLambertMaterial({color:c}));mat.gc={};
const pmat=c=>pmats[c]||(pmats[c]=new THREE.MeshLambertMaterial({color:c}));pmat.gc={};
const bmat=c=>bmats[c]||(bmats[c]=new THREE.MeshBasicMaterial({color:c}));
const geoBox=(M,w,h,d)=>{const k=w+','+h+','+d,c=M.gc;return c[k]||(c[k]=new THREE.BoxGeometry(w,h,d))};
const HEADG={};
function cbox(x1,y0,z1,x2,y1,z2,c,solid){
  const m=new THREE.Mesh(new THREE.BoxGeometry(x2-x1,y1-y0,z2-z1),mat(c));
  m.position.set((x1+x2)/2,(y0+y1)/2,(z1+z2)/2);scene.add(m);
  if(solid)colliders.push({x1,z1,x2,z2,y0,y1});return m}
let IW,IG,ID,IB,IL,IS,IT,IH,IF,IR,IY,IK,IP;const labels=[];const dm=new THREE.Object3D();
function mkInst(c,n,basic){const m=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),basic?bmat(c):mat(c),n);m.count=0;m.frustumCulled=false;m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(n*3).fill(1),3);scene.add(m);return m}
function ib(m,x1,y1,z1,x2,y2,z2){dm.position.set((x1+x2)/2,(y1+y2)/2,(z1+z2)/2);dm.scale.set(x2-x1,y2-y1,z2-z1);dm.updateMatrix();m.setMatrixAt(m.count++,dm.matrix)}
function wall(ax,az,bx,bz,y){
  const x1=Math.min(ax,bx),x2=Math.max(ax,bx),z1=Math.min(az,bz),z2=Math.max(az,bz),v=ax==bx;
  const a=v?[x1-.15,z1,x2+.15,z2]:[x1,z1-.15,x2,z2+.15];
  ib(IY,a[0],y,a[1],a[2],y+H,a[3]);colliders.push({x1:a[0],z1:a[1],x2:a[2],z2:a[3],y0:y,y1:y+H})}
function railH(z,xa,xb,y){cbox(xa,y,z-.12,xb,y+1.1,z+.12,CREAM,true);cbox(xa,y+.5,z-.15,xb,y+.7,z+.15,0xa6e3d2,false);cbox(xa,y+1.1,z-.17,xb,y+1.2,z+.17,CREAM,false);for(let x=xa+.4;x<xb-.3;x+=.9)ib(IK,x,y+.8,z-.14,x+.5,y+.88,z+.14)}
function railV(x,za,zb,y){cbox(x-.12,y,za,x+.12,y+1.1,zb,CREAM,true);cbox(x-.15,y+.5,za,x+.15,y+.7,zb,0xa6e3d2,false);cbox(x-.17,y+1.1,za,x+.17,y+1.2,zb,CREAM,false);for(let z=za+.4;z<zb-.3;z+=.9)ib(IK,x-.14,y+.8,z,x+.14,y+.88,z+.5)}
function sprite(text,w,h,font,bg){
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
  if(bg){g.fillStyle=bg;g.fillRect(0,0,w,h)}
  g.font=font;g.textAlign='center';g.textBaseline='middle';g.fillStyle='#fff';g.strokeStyle='#000';g.lineWidth=bg?0:6;
  if(!bg)g.strokeText(text,w/2,h/2);g.fillText(text,w/2,h/2);return new THREE.CanvasTexture(c)}
function lblTex(text){const c=document.createElement('canvas');c.width=400;c.height=80;const g=c.getContext('2d');let fs=40;g.font='bold '+fs+'px Arial';
  while(g.measureText(text).width>380&&fs>14){fs-=2;g.font='bold '+fs+'px Arial'}
  g.textAlign='center';g.textBaseline='middle';g.lineWidth=7;g.lineJoin='round';g.strokeStyle='#000';g.fillStyle='#fff';g.strokeText(text,200,40);g.fillText(text,200,40);return new THREE.CanvasTexture(c)}
function mkLabel(text,sx,sy){const t=texCache[text]||(texCache[text]=lblTex(text));
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true}));s.scale.set(sx,sy,1);s.renderOrder=5;return s}
function label(text,x,y,z,sx,sy){const s=mkLabel(text,sx,sy);s.position.set(x,y,z);scene.add(s);labels.push({s,x,y,z});return s}
function signPlane(text,w,h,bg,x,y,z,ry,fg){const cw=512,ch=Math.max(32,Math.round(512*h/w)),c=document.createElement('canvas');c.width=cw;c.height=ch;const g=c.getContext('2d');
  g.fillStyle=bg;g.fillRect(0,0,cw,ch);let fs=Math.floor(ch*.72);g.font='bold '+fs+'px Arial';while(g.measureText(text).width>cw-24&&fs>8){fs-=2;g.font='bold '+fs+'px Arial'}
  g.textAlign='center';g.textBaseline='middle';g.fillStyle=fg||'#fff';g.fillText(text,cw/2,ch/2+1);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}));m.position.set(x,y,z);m.rotation.y=ry||0;scene.add(m);return m}
/* Character with swinging limbs, hair styles, uniform colors */
function makeChar(o,name,parent,mf){
  const M=mf||mat,g=new THREE.Group(),ud=g.userData,lite=o.lite;
  const bx=(w,h,d,x,y,z,c,par)=>{const m=new THREE.Mesh(geoBox(M,w,h,d),M(c));m.position.set(x,y,z||0);(par||g).add(m);return m};
  const limb=(w,h,x,y,c,hand)=>{const pv=new THREE.Group();pv.position.set(x,y,0);g.add(pv);bx(w,h,w,0,-h/2,0,c,pv);if(hand)bx(.12,.12,.12,0,-h,0,o.skin,pv);else bx(.24,.1,.3,0,-h+.05,.04,0x222222,pv);return pv};
  const lc=o.f?o.skin:o.pants;
  ud.l1=limb(.22,.8,-.13,.8,lc);ud.l2=limb(.22,.8,.13,.8,lc);
  if(o.f)bx(.6,.4,.4,0,.85,0,o.pants);
  bx(.5,.65,.3,0,1.15,0,o.shirt);
  if(!o.noTie)bx(.08,.32,.02,0,1.2,.16,o.tie);
  if(!lite){bx(.22,.07,.03,0,1.46,.15,0xffffff);bx(.12,.1,.12,0,1.5,0,o.skin);if(!o.f)bx(.52,.06,.32,0,.86,0,0x222222);
    bx(.4,.5,.16,0,1.15,-.24,o.bag||0x2a3350);bx(.03,.4,.02,-.13,1.25,.16,0xffd23f);bx(.1,.13,.02,-.13,1.0,.16,0xffffff)}
  if(o.shirt==0xc0392b)bx(.1,.1,.02,.13,1.3,.16,0xffd23f);
  ud.a1=limb(.14,.6,-.33,1.45,o.shirt,1);ud.a2=limb(.14,.6,.33,1.45,o.shirt,1);
  const hg=HEADG.g||(HEADG.g=new THREE.SphereGeometry(.21,12,10)),h=new THREE.Mesh(hg,M(o.skin));h.position.y=1.72;g.add(h);
  bx(.04,.05,.02,-.07,1.74,.2,0x111111);bx(.04,.05,.02,.07,1.74,.2,0x111111);
  if(!lite){bx(.07,.015,.02,-.07,1.8,.2,0x222222);bx(.07,.015,.02,.07,1.8,.2,0x222222);bx(.08,.02,.02,0,1.66,.2,0xaa4444)}
  const st=o.style,hc=o.hair;
  if(st!='bald'){bx(.46,.14,.44,0,1.9,0,hc);bx(.46,.3,.12,0,1.76,-.17,hc);bx(.4,.06,.06,0,1.85,.19,hc);
    if(st=='spiky')[-.15,-.05,.05,.15].forEach(x=>bx(.09,.16,.09,x,2.01,0,hc));
    if(st=='long'){bx(.46,.62,.12,0,1.55,-.18,hc);bx(.07,.4,.3,-.23,1.72,-.03,hc);bx(.07,.4,.3,.23,1.72,-.03,hc)}
    if(st=='bob'){bx(.46,.42,.12,0,1.68,-.18,hc);bx(.07,.3,.3,-.23,1.72,-.02,hc);bx(.07,.3,.3,.23,1.72,-.02,hc)}
    if(st=='bun'){const b=new THREE.Mesh(HEADG.s||(HEADG.s=new THREE.SphereGeometry(.12,10,8)),M(hc));b.position.set(0,1.98,-.14);g.add(b)}
    if(st=='pony')bx(.12,.5,.12,0,1.66,-.26,hc);
    if(st=='curly')for(let k=0;k<9;k++){const b=new THREE.Mesh(HEADG.c||(HEADG.c=new THREE.SphereGeometry(.1,8,6)),M(hc));b.position.set(Math.cos(k*.7)*.18,1.97+(k%2)*.04,Math.sin(k*.7)*.18);g.add(b)}}
  (o.acc||[]).forEach(a=>{
    if(a=='glasses'){[-.09,.09].forEach(x=>{bx(.13,.02,.02,x,1.78,.215,0x222222);bx(.13,.02,.02,x,1.70,.215,0x222222);bx(.02,.1,.02,x-.065,1.74,.215,0x222222);bx(.02,.1,.02,x+.065,1.74,.215,0x222222)});bx(.05,.02,.02,0,1.75,.215,0x222222)}
    if(a=='cap'){bx(.5,.12,.48,0,1.96,0,0x1f3a8a);bx(.42,.03,.26,0,1.93,.3,0x15296a)}
    if(a=='headphones'){bx(.5,.05,.07,0,1.99,0,0x222222);[-.25,.25].forEach(x=>{bx(.08,.17,.17,x,1.73,0,0xe0453a);bx(.04,.3,.06,x*.98,1.86,0,0x222222)})}
    if(a=='ribbon'){bx(.1,.1,.06,-.07,1.98,-.12,0xff6b9d);bx(.1,.1,.06,.07,1.98,-.12,0xff6b9d);bx(.05,.05,.07,0,1.98,-.12,0xd63a76)}});
  if(name){const s=mkLabel(name,2.4,.48);s.position.set(0,2.45,0);g.add(s);ud.lbl=s}
  (parent||scene).add(g);return g}
function anim(g,t,a){const u=g.userData;u.l1.rotation.x=Math.sin(t)*a;u.l2.rotation.x=-Math.sin(t)*a;u.a1.rotation.x=-Math.sin(t)*a*.8;u.a2.rotation.x=Math.sin(t)*a*.8}
function rest(g){const u=g.userData;[u.l1,u.l2,u.a1,u.a2].forEach(p=>p.rotation.x*=.7)}

/* ---------- 3D character preview (selection screen) ---------- */
function pvInit(){
  const cv=$('pvc');pvR=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});pvR.setClearColor(0x000000,0);
  pvS=new THREE.Scene();pvS.add(new THREE.HemisphereLight(0xffffff,0x88aa99,1.05));const dl=new THREE.DirectionalLight(0xffffff,.7);dl.position.set(2,4,5);pvS.add(dl);
  pvC=new THREE.PerspectiveCamera(32,1,.1,50);
  ['m','f'].forEach(k=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.75,.8,.12,32),new THREE.MeshBasicMaterial({color:0xcfe9e3}));p.position.set(k=='m'?-.95:.95,-.06,0);pvS.add(p);pvG[k+'p']=p});
  cv.addEventListener('pointerdown',e=>{const r=cv.getBoundingClientRect();pick((e.clientX-r.left)<r.width/2?'m':'f');sfx('click')});
  pvBuild();pvSize();pvLoop(0)}
function pvBuild(){['m','f'].forEach(k=>{if(pvG[k])pvS.remove(pvG[k]);const c=makeChar(eff(k),null,pvS,pmat);c.position.x=k=='m'?-.95:.95;pvG[k]=c})}
function pvSize(){if(!pvR)return;const cv=$('pvc'),w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;
  pvR.setPixelRatio(Math.min(devicePixelRatio,2));pvR.setSize(w,h,false);pvC.aspect=w/h;pvC.updateProjectionMatrix();
  const d=Math.max(5,3.4/(pvC.aspect*2*Math.tan(16*Math.PI/180)));pvC.position.set(0,1.25,d);pvC.lookAt(0,1.05,0);pvW=w}
function pvLoop(t){requestAnimationFrame(pvLoop);if(state!='select'||!pvR)return;
  if($('pvc').clientWidth!=pvW)pvSize();t/=1000;
  ['m','f'].forEach(k=>{const g=pvG[k],sel=gender==k,s=g.scale.x+((sel?1.12:.9)-g.scale.x)*.12;g.scale.setScalar(s);
    if(sel){g.rotation.y=Math.sin(t*1.1)*.7;anim(g,t*5,.45)}else{g.rotation.y*=.9;rest(g)}
    pvG[k+'p'].material.color.setHex(sel?0xffd35c:0xcfe9e3)});
  pvR.render(pvS,pvC)}

/* 2D face avatar for the HUD (drawn from the character's colors) */
function drawAvatar(cv,o){const g=cv.getContext('2d'),w=cv.width,h=cv.height,hx2=n=>'#'+n.toString(16).padStart(6,'0');
  g.clearRect(0,0,w,h);g.fillStyle='#bfe3d8';g.fillRect(0,0,w,h);
  g.fillStyle=hx2(o.shirt);g.fillRect(w*.14,h*.8,w*.72,h*.3);g.fillStyle='#fff';g.fillRect(w*.42,h*.78,w*.16,h*.1);
  const hc=hx2(o.hair),st=o.style,cx=w/2,cy=h*.46,r=w*.27;
  const hairBack=()=>{g.fillStyle=hc;if(st=='long'||st=='pony'||st=='bob'){g.fillRect(cx-r*1.15,cy-r*.9,r*2.3,r*(st=='bob'?2:2.7))}if(st=='bun'){g.beginPath();g.arc(cx,cy-r*1.35,r*.5,0,7);g.fill()}};
  if(st!='bald')hairBack();
  g.fillStyle=hx2(o.skin);g.beginPath();g.ellipse(cx,cy,r*.95,r*1.1,0,0,7);g.fill();
  if(st!='bald'){g.fillStyle=hc;g.beginPath();g.ellipse(cx,cy-r*.55,r*1.02,r*.7,0,Math.PI,0);g.fill();g.fillRect(cx-r*1.0,cy-r*.6,r*.26,r*.8);g.fillRect(cx+r*.74,cy-r*.6,r*.26,r*.8);
    if(st=='spiky')for(let i=-2;i<=2;i++){g.beginPath();g.moveTo(cx+i*r*.4-r*.2,cy-r*1.1);g.lineTo(cx+i*r*.4,cy-r*1.6);g.lineTo(cx+i*r*.4+r*.2,cy-r*1.1);g.fill()}
    if(st=='curly')for(let i=0;i<7;i++){g.beginPath();g.arc(cx+(i-3)*r*.3,cy-r*1.05+Math.abs(i-3)*r*.08,r*.28,0,7);g.fill()}}
  g.fillStyle='#222';g.beginPath();g.arc(cx-r*.38,cy+r*.05,r*.1,0,7);g.arc(cx+r*.38,cy+r*.05,r*.1,0,7);g.fill();
  g.strokeStyle='#8a3a3a';g.lineWidth=Math.max(2,w*.02);g.beginPath();g.arc(cx,cy+r*.35,r*.3,.15*Math.PI,.85*Math.PI);g.stroke();
  (o.acc||[]).forEach(a=>{if(a=='glasses'){g.strokeStyle='#222';g.lineWidth=2;g.strokeRect(cx-r*.62,cy-r*.12,r*.5,r*.34);g.strokeRect(cx+r*.12,cy-r*.12,r*.5,r*.34)}
    if(a=='cap'){g.fillStyle='#1f3a8a';g.beginPath();g.ellipse(cx,cy-r*.7,r*1.05,r*.55,0,Math.PI,0);g.fill();g.fillRect(cx-r*1.05,cy-r*.72,r*2.1,r*.14)}
    if(a=='headphones'){g.strokeStyle='#222';g.lineWidth=4;g.beginPath();g.arc(cx,cy-r*.1,r*1.05,Math.PI,0);g.stroke();g.fillStyle='#e0453a';g.fillRect(cx-r*1.15,cy-r*.15,r*.22,r*.6);g.fillRect(cx+r*.93,cy-r*.15,r*.22,r*.6)}
    if(a=='ribbon'){g.fillStyle='#ff6b9d';g.beginPath();g.arc(cx+r*.5,cy-r*.95,r*.2,0,7);g.arc(cx+r*.9,cy-r*.85,r*.2,0,7);g.fill()}})}
