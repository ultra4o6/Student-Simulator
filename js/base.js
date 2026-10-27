const $=id=>document.getElementById(id);
const H=4,SAVE='mySchoolLifeV4',hx=n=>'#'+n.toString(16).padStart(6,'0');
const isTouch=matchMedia('(pointer:coarse)').matches||(navigator.maxTouchPoints>0&&!matchMedia('(hover:hover)').matches);
if(isTouch)document.body.classList.add('touch');
let state='load',gender='m',sens=.005,built=false,locked=false,renderer,scene,camera,player,pname;
let pvR=null,pvS,pvC,pvW=0;const pvG={};
addEventListener('contextmenu',e=>e.preventDefault());

/* ---------- Character data ---------- */
const COURSES={
 BSIT:{n:'BSIT',cls:'BSIT 3',shirt:0x2f6fbf,pants:0x1c2f6b,tie:0x14224d},
 HS:{n:'HIGH SCHOOL',cls:'Grade 10',shirt:0xffffff,pants:0x1c2f6b,tie:0x1c2f6b},
 EDUC:{n:'EDUC',cls:'BSEd 2',shirt:0x2e9e5b,pants:0x3a3f4a,tie:0x1b5e35},
 AB:{n:'AB',cls:'AB 2',shirt:0x8e5bb5,pants:0x2b2b3a,tie:0x4b2a6b},
 CRIM:{n:'CRIM',cls:'BS Criminology 1',shirt:0xc0392b,pants:0xf5f5f5,tie:0x111111}};
const CK=Object.keys(COURSES),STY=[['short','Short'],['spiky','Spiky'],['bob','Bob'],['long','Long'],['bun','Bun'],['pony','Ponytail'],['curly','Curly']];
const HCOLS=[0x111111,0x3a2210,0x7a4a21,0xd9b45a,0x8a2a1a,0x777777],SKINS=[0xf3cf9d,0xe0ac69,0xc68642,0x8d5524];
const O={course:'BSIT',style:'short',hc:0,sk:0};
function eff(g){let st=O.style,hc=HCOLS[O.hc];
  if(O.course=='CRIM'){if(g=='m')st='bald';else{st='bun';hc=0x111111}}
  const c=COURSES[O.course];return {f:g=='f',style:st,hair:hc,skin:SKINS[O.sk],shirt:c.shirt,pants:c.pants,tie:c.tie}}
function refresh(){
  const crim=O.course=='CRIM';
  $('courses').innerHTML=CK.map(k=>`<div class="chip ${O.course==k?'on':''}" data-c="${k}"><i style="background:${hx(COURSES[k].shirt)}"></i>${COURSES[k].n}</div>`).join('');
  $('styles').innerHTML=STY.map(s=>`<div class="chip ${O.style==s[0]?'on':''} ${crim?'dis':''}" data-s="${s[0]}">${s[1]}</div>`).join('');
  $('hcols').className='sw'+(crim?' dis':'');
  $('hcols').innerHTML=HCOLS.map((c,i)=>`<span class="${O.hc==i?'on':''}" data-h="${i}" style="background:${hx(c)}"></span>`).join('');
  $('skins').innerHTML=SKINS.map((c,i)=>`<span class="${O.sk==i?'on':''}" data-k="${i}" style="background:${hx(c)}"></span>`).join('');
  $('note').textContent=crim?'CRIM rule: red uniform + white pants. Male = bald cut, Female = tied hair.':'';
  if(pvR)pvBuild()}
$('select').addEventListener('click',e=>{const t=e.target.closest('[data-c],[data-s],[data-h],[data-k]');if(!t)return;
  if(t.dataset.c)O.course=t.dataset.c;if(t.dataset.s)O.style=t.dataset.s;if(t.dataset.h)O.hc=+t.dataset.h;if(t.dataset.k)O.sk=+t.dataset.k;refresh()});
refresh();

/* ---------- Loading screen ---------- */
function fx(el){
  el.insertAdjacentHTML('beforeend','<div class="sun"></div>');
  for(let i=0;i<4;i++)el.insertAdjacentHTML('beforeend',`<div class="cl" style="top:${5+i*11}%;width:${14+i*3}vw;height:${4+i}vh;animation-duration:${50+i*18}s;animation-delay:-${i*17}s"></div>`);
  for(let i=0;i<24;i++){const s=4+Math.random()*10;el.insertAdjacentHTML('beforeend',`<div class="sp" style="left:${Math.random()*100}%;width:${s}px;height:${s}px;animation-duration:${6+Math.random()*9}s;animation-delay:-${Math.random()*12}s"></div>`)}}
document.querySelectorAll('.fx').forEach(fx);
$('ttl').innerHTML='NEMCO SIMULATOR'.split('').map((c,i)=>`<span style="animation-delay:${i*.09}s">${c==' '?'&nbsp;':c}</span>`).join('');
const TIPS=['Tip: Press E near an object, door or person to interact.','Tip: Energy below 50%? Go home to your boarding house and sleep.','Tip: Ride a tricycle at the terminal for ₱20, or drive your own!','Tip: Press E (or the E button) near a door to open it.','Tip: Climb the stairs in the courtyard to reach the 4th floor.','Tip: Hold SHIFT / the RUN button to run to class on time!','Tip: Talk to teachers, guards and students.','Tip: Careful sa kalsada — may mga tricycle at jeep!','Tip: Follow the glowing beacon of your objective.'];
let tipI=0;$('tip').textContent=TIPS[0];const tipTimer=setInterval(()=>{tipI=(tipI+1)%TIPS.length;$('tip').textContent=TIPS[tipI]},1300);
[0,10,25,50,75,90,100].forEach((p,i)=>setTimeout(()=>{
  $('barf').style.width=p+'%';$('pct').textContent=['Loading School...','Building classrooms...','Placing teachers...','Parking the cars...','Raising the flag...','Almost ready...','Ready!'][i]+' '+p+'%';
  if(p==100)setTimeout(()=>{clearInterval(tipTimer);$('load').classList.add('out');$('select').classList.remove('hid');state='select';pvSize();$('cont').disabled=!localStorage.getItem(SAVE);setTimeout(()=>$('load').classList.add('hid'),600)},600)},i*550));

function pick(g){gender=g;$('bm').classList.toggle('sel',g=='m');$('bf').classList.toggle('sel',g=='f')}
$('bm').onclick=()=>pick('m');$('bf').onclick=()=>pick('f');
$('start').onclick=()=>{
  if(!$('nm').value.trim())return $('err').textContent='Please enter your student name.';
  if(localStorage.getItem(SAVE)&&!confirm('Start a NEW game? Your old saved progress will be replaced.'))return;
  $('err').textContent='';startGame(null)};
$('cont').onclick=()=>{const s=loadSave();if(!s)return;gender=s.gender;Object.assign(O,s.O);$('nm').value=s.name;startGame(s)};

