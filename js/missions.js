/* =====================================================================
   MISSIONS, DIALOGUE, CLASSES, QUIZ, CODE CHALLENGE, SHOPS, SLEEP, SPORTS
   ===================================================================== */
/* ---------- dialogue engine (lines + choices) ---------- */
let dlgCb=null,dlgLines=[],dlgI=0,dlgChoices=null,dlgPrev='play',dlgNpc=null;
const esc=t=>String(t).replace(/@/g,pname);
function beginDlg(){if(state!='dlg'){dlgPrev=state;state='dlg'}$('dlg').classList.remove('hid');if(document.pointerLockElement)document.exitPointerLock()}
function say(lines,cb){dlgLines=lines;dlgI=0;dlgCb=cb||null;dlgChoices=null;beginDlg();showDlg()}
function ask(who,text,choices){dlgLines=[[who,text]];dlgI=0;dlgCb=null;dlgChoices=choices;beginDlg();showDlg()}
function showDlg(){const l=dlgLines[dlgI],e=$('dlg');let h='<span class="who">'+esc(l[0])+'</span><br>'+esc(l[1]);
  if(dlgChoices)h+='<div class="ch">'+dlgChoices.map((c,i)=>'<button data-i="'+i+'" class="'+(c.dis?'dis':'')+'">'+(isTouch?'':(i+1)+'. ')+c.t+'</button>').join('')+'</div>';
  else h+='<div class="nx">'+(isTouch?'Tap':'Press E')+' to continue</div>';e.innerHTML=h;
  talkSound(/Ma'am|Mika|Bea|Angel|Ella|Jade|Nica|Liza|Trixie|Ivy|Rica|Gina|Pia|Ate|Ms\./.test(l[0]))}
$('dlg').addEventListener('click',e=>{const b=e.target.closest('button[data-i]');if(b)return pickChoice(+b.dataset.i);if(!dlgChoices)advanceDlg()});
function advanceDlg(){if(dlgChoices)return;dlgI++;if(dlgI>=dlgLines.length){const cb=dlgCb;closeDlg();cb&&cb()}else{showDlg();sfx('talk')}}
function closeDlg(){$('dlg').classList.add('hid');dlgChoices=null;dlgNpc=null;if(state=='dlg')state=dlgPrev=='dlg'?'play':dlgPrev}
function pickChoice(i){const c=dlgChoices&&dlgChoices[i];if(!c)return;if(c.dis){sfx('err');return}const f=c.fn;dlgChoices=null;closeDlg();f&&f()}
/* ---------- overlay helpers (quiz, shop, challenge) ---------- */
let ovlOpen=false,ovlPrev='play';
function showOvl(html){if(!ovlOpen){ovlPrev=state;state='menu';ovlOpen=true}$('ovl').classList.remove('hid');$('ovl').innerHTML='<div class="panel">'+html+'</div>';if(document.pointerLockElement)document.exitPointerLock()}
function hideOvl(){$('ovl').classList.add('hid');$('ovl').innerHTML='';ovlOpen=false;if(state=='menu')state=ovlPrev=='menu'?'play':ovlPrev;timerTick=null;if(!isTouch&&state=='play'){try{renderer.domElement.requestPointerLock()}catch(e){}}}
/* ---------- event bus ---------- */
function ev(type,a,b){try{MISSIONS.forEach(m=>{const st=S.miss[m.id];if(st&&st.st=='active'){const s=m.steps[st.i];if(s&&s.ev&&s.ev(type,a,b,st)===true)advance(m.id)}})}catch(e){console.error(e)}}
/* ---------- marker helpers ---------- */
const roomMk=(n,label)=>{const d=doors.find(d=>d.r.n==n);return d?{x:d.cx,z:d.cz,y:d.r.f*H,label:label||n}:null};
const npcMk=n=>{const a=KEYNPC[n];if(!a||a.gone||!a.g.visible&&a.gone)return null;const p=a.g.position;return {x:p.x,z:p.z,y:p.y,label:n,npc:1}};
const MISSIONS=[];
function defM(o){MISSIONS.push(o);return o}
const mst=id=>S.miss[id]||(S.miss[id]={st:'locked',i:0,d:{}});
const isDone=id=>mst(id).st=='done';
function startM(id,silent){const m=MISSIONS.find(x=>x.id==id),st=mst(id);if(!m||st.st=='active'||st.st=='done')return;st.st='active';st.i=0;st.d={};if(m.onStart)m.onStart(st);
  if(!silent){notify('📋 '+(m.side?'Side quest':'New mission')+': '+m.title,'gold',m.desc,4200);sfx('notify')}if(!m.side||!S.track||isDone(S.track))S.track=id;if(m.steps[0]&&m.steps[0].init)m.steps[0].init(st)}
function advance(id){const m=MISSIONS.find(x=>x.id==id),st=mst(id);st.i++;sfx('ok');
  if(st.i>=m.steps.length)return completeM(id);const s=m.steps[st.i];if(s.init)s.init(st);notify('➡ '+stepText(m,st),'good',null,2600)}
function completeM(id){const m=MISSIONS.find(x=>x.id==id),st=mst(id);st.st='done';notify('🏆 MISSION COMPLETE','gold',m.title,4200);sfx('mission');reward(typeof m.rw=='function'?m.rw(st):m.rw,m.title);
  if(m.onDone)m.onDone(st);(m.unlock||[]).forEach(u=>{if(mst(u).st=='locked')startM(u)});
  if(S.track==id){const nx=MISSIONS.find(x=>mst(x.id).st=='active');S.track=nx?nx.id:null}saveGame()}
function stepText(m,st){st=st||mst(m.id);const s=m.steps[st.i];if(!s)return '';return typeof s.t=='function'?s.t(st):s.t}
function stepMarkers(m){const st=mst(m.id),s=m.steps[st.i];if(!s||!s.mk)return [];const r=s.mk(st);return r?(Array.isArray(r)?r:[r]).filter(Boolean):[]}
function allMarkers(){const out=[];MISSIONS.forEach(m=>{if(mst(m.id).st=='active')stepMarkers(m).forEach(k=>out.push(Object.assign({mid:m.id,main:m.id==S.track},k)))});return out}
let chkT=0;
function missionTick(dt){chkT+=dt;if(chkT<.35)return;chkT=0;MISSIONS.forEach(m=>{const st=mst(m.id);if(st.st!='active')return;const s=m.steps[st.i];if(s&&s.chk&&s.chk(st))advance(m.id);else if(s&&s.tick)s.tick(st)})}
const inRoom=n=>{const r=curRoom();return !!r&&r.n==n};
/* ---------- the 10 missions ---------- */
defM({id:'m1',title:'First Day at College',desc:'Find your assigned classroom and talk to your instructor.',rw:{xp:60,coins:100},unlock:['m2','m5'],
 steps:[{t:'Enter the school gate',mk:()=>({x:0,z:24,y:0,label:'School gate'}),chk:()=>P.z<25&&P.y<1&&Math.abs(P.x)<9},
  {t:()=>'Find your classroom: '+myRoom(),mk:()=>roomMk(myRoom()),chk:()=>inRoom(myRoom())},
  {t:()=>'Talk to your instructor, '+myTeacher(),mk:()=>npcMk(myTeacher())||roomMk(myRoom()),ev:(t,a)=>t=='talk'&&a==myTeacher()}]});
defM({id:'m2',title:'Attend Your Class',desc:'Reach your classroom before class starts, sit down and complete the lesson.',rw:{xp:80,coins:60},unlock:['m3','m4','m10'],
 onStart:st=>{},
 steps:[{t:st=>{const k=nextClass();return k?('Be seated in '+myRoom()+' before '+fmtTime(k.start+CLS_ONTIME)+' ('+k.name+')'):'No class left today - sleep and attend tomorrow'},mk:()=>roomMk(myRoom()),ev:(t,a,b)=>t=='lessonStart'},
  {t:'Stay seated and complete the lesson',mk:()=>roomMk(myRoom()),ev:t=>t=='lessonDone'}]});
defM({id:'m3',title:'Computer Laboratory Challenge',desc:'Solve a basic programming challenge in the computer lab before the deadline.',rw:{xp:100,coins:80,items:{calc:1}},unlock:['m6'],
 onStart:st=>{st.d.dl=S.clock+300},
 steps:[{t:st=>'Go to Computer Lab 1 (4th floor) · deadline '+fmtTime(st.d.dl||0),mk:()=>roomMk('Computer Lab 1'),chk:()=>inRoom('Computer Lab 1'),tick:st=>labDeadline(st)},
  {t:st=>'Use a computer and solve the challenge · deadline '+fmtTime(st.d.dl||0),mk:()=>roomMk('Computer Lab 1'),ev:t=>t=='pcSolved',tick:st=>labDeadline(st)}]});
function labDeadline(st){if(S.clock>st.d.dl){st.d.dl=S.clock+240;st.i=0;notify('⏰ Deadline missed!','warn','The lab challenge was reset - new deadline '+fmtTime(st.d.dl));sfx('err')}}
const REQ_BOOKS=[['b_hist','Philippine History','HISTORY'],['b_comp','Intro to Computing','COMPUTING'],['b_math','College Algebra','MATH']];
defM({id:'m4',title:'Library Research',desc:'Find three required books on the library shelves and deliver them to your instructor.',rw:{xp:90,coins:70},unlock:['m7'],
 steps:[{t:'Go to the Library (ground floor)',mk:()=>roomMk('Library'),chk:()=>inRoom('Library')},
  {t:()=>'Find the 3 books: '+REQ_BOOKS.map(b=>(hasItem(b[0])?'✔ ':'○ ')+b[1]+' ('+b[2]+')').join(' · '),mk:()=>shelves.filter(s=>REQ_BOOKS.some(b=>b[2]==s.cat&&!hasItem(b[0]))).map(s=>({x:s.x,z:s.z,y:s.y,label:s.cat})),ev:(t)=>t=='book'&&REQ_BOOKS.every(b=>hasItem(b[0]))},
  {t:()=>'Deliver the books to '+myTeacher(),mk:()=>npcMk(myTeacher())||roomMk(myRoom()),ev:(t,a)=>t=='deliver'&&a=='books'}]});
defM({id:'m5',title:'Lunch Break',desc:'Visit the cafeteria, choose food, pay with your money and restore your hunger.',rw:{xp:50,coins:20},unlock:['m8','m9'],
 steps:[{t:'Go to the Canteen (ground floor)',mk:()=>roomMk('Canteen'),chk:()=>inRoom('Canteen')},
  {t:'Order a meal from Ate Rose (pay with coins)',mk:()=>vendorSpot.x!=null?{x:vendorSpot.x,z:vendorSpot.z+0,y:0,label:'Ate Rose'}:null,ev:(t,a)=>t=='buy'&&ITEMS[a]&&ITEMS[a].t=='food'},
  {t:'Eat your meal to restore hunger',ev:t=>t=='eat'}]});
defM({id:'m6',title:'Surprise Examination',desc:'Your instructor announced a surprise exam. Pass the multiple-choice quiz.',rw:st=>({xp:40+Math.round((st.d.score||60)),coins:50+Math.round((st.d.score||60)/2)}),
 onStart:st=>{},
 steps:[{t:()=>'Go to '+myRoom()+' - surprise exam!',mk:()=>roomMk(myRoom()),chk:()=>inRoom(myRoom())},
  {t:()=>'Talk to '+myTeacher()+' to take the exam',mk:()=>npcMk(myTeacher())||roomMk(myRoom()),ev:(t,a,b)=>{if(t=='exam'&&a>=60){mst('m6').d.score=a;return true}}}]});
const MATES=['Mika','Joshua','Angel'];
defM({id:'m7',title:'Group Project',desc:'Find your three groupmates and collect their project contributions.',rw:{xp:130,coins:100},unlock:[],
 onStart:st=>{st.d.got={}},
 steps:[{t:st=>'Find your groupmates: '+MATES.map(n=>(st.d.got&&st.d.got[n]?'✔ ':'○ ')+n).join(' · '),mk:st=>MATES.filter(n=>!(mst('m7').d.got||{})[n]).map(n=>npcMk(n)).filter(Boolean),ev:(t,a)=>{if(t=='contrib'){const g=mst('m7').d.got||(mst('m7').d.got={});g[a]=1;return MATES.every(n=>g[n])}}},
  {t:()=>'Submit the project to '+myTeacher(),mk:()=>npcMk(myTeacher())||roomMk(myRoom()),ev:(t,a)=>t=='deliver'&&a=='project'}]});
const WALLET={x:-16.4,z:-6.6};let walletMesh=null;
defM({id:'m8',title:'Lost Wallet Mystery',desc:'Investigate clues, find the owner and return the wallet for a reward.',rw:{xp:120,coins:150,acc:'ribbon'},unlock:[],
 onStart:st=>{st.d.clues={};spawnWallet(true)},
 steps:[{t:'Pick up the lost wallet near the courtyard bench',mk:()=>({x:WALLET.x,z:WALLET.z,y:0,label:'Wallet'}),ev:t=>t=='pickWallet'},
  {t:st=>'Ask around for clues ('+Object.keys(st.d.clues||{}).length+'/2): Manong Guard, Ate Rose, Ms. Ria',mk:()=>['Manong Guard','Ate Rose','Ms. Ria'].map(npcMk).filter(Boolean),ev:(t,a)=>{if(t=='clue'){mst('m8').d.clues[a]=1;return Object.keys(mst('m8').d.clues).length>=2}}},
  {t:'Find the owner (blue wallet · panda keychain) and return it',mk:()=>['Carlo','Renz'].map(npcMk).filter(Boolean),ev:(t,a,b)=>t=='wallet'&&a=='Carlo'}]});
function spawnWallet(on){if(!walletMesh){walletMesh=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(.3,.06,.2),mat(0x2f6fbf));b.position.y=.05;walletMesh.add(b);const k=new THREE.Mesh(new THREE.SphereGeometry(.05,6,6),bmat(0x111111));k.position.set(.18,.06,0);walletMesh.add(k);walletMesh.position.set(WALLET.x,0,WALLET.z);scene.add(walletMesh)}walletMesh.visible=on}
const SPORT={mode:null,t:0,n:0,cp:0};
defM({id:'m9',title:'Campus Sports Challenge',desc:'Play basketball or run the checkpoint challenge to earn coins and XP.',rw:{xp:110,coins:120},unlock:[],
 steps:[{t:'Talk to Coach Dan at the basketball court',mk:()=>npcMk('Coach Dan'),ev:(t,a)=>t=='talk'&&a=='Coach Dan'},
  {t:()=>SPORT.mode=='bb'?'Score 3 baskets in 90 seconds ('+SPORT.n+'/3)':SPORT.mode=='run'?'Run through all checkpoints in 60 seconds ('+SPORT.cp+'/6)':'Choose basketball or running with Coach Dan',mk:()=>SPORT.mode=='run'?runMarker():(SPORT.mode?{x:0,z:COURT.cz,y:0,label:'Court'}:npcMk('Coach Dan')),ev:(t,a)=>t=='sportDone'&&a===true}]});
defM({id:'m10',title:'Survive Your First Week',desc:'Complete 5 school days: attend classes, submit assignments and pass the exam to unlock Stage 2.',rw:{xp:300,coins:300,items:{edrink:2}},unlock:['x1','x2','x3'],
 onDone:()=>{S.flags.stage2=1;setTimeout(()=>notify('🎓 STAGE 2 UNLOCKED','gold','Midterm Month: new missions, outfits and activities!',5000),1500)},
 steps:[{t:()=>weekText(),chk:()=>S.day>=6&&weekOK()}]});
const weekOK=()=>attStats().p+attStats().l>=9&&S.asg.length>=3&&S.exm.some(e=>e.s>=60);
function weekText(){const a=attStats();return 'Day '+Math.min(S.day,5)+'/5 · Classes '+(a.p+a.l)+'/9 · Assignments '+S.asg.length+'/3 · Exam '+(S.exm.some(e=>e.s>=60)?'✔':'○')+(S.day>=6&&!weekOK()?' (finish the missing items!)':'')}
/* stage 2 missions */
defM({id:'x1',title:'Midterm Exam',desc:'Stage 2: a tougher exam. Score 70% or higher.',rw:{xp:200,coins:200},steps:[{t:()=>'Take the midterm with '+myTeacher(),mk:()=>npcMk(myTeacher()),ev:(t,a)=>t=='midterm'&&a>=70}],locked2:1});
defM({id:'x2',title:'Campus Leader',desc:'Stage 2: become Friends with 3 people.',rw:{xp:150,coins:150,items:{notebook:2}},steps:[{t:()=>'Friends: '+Object.keys(S.fr).filter(n=>frLevel(n)>=2).length+'/3',chk:()=>Object.keys(S.fr).filter(n=>frLevel(n)>=2).length>=3}],locked2:1});
defM({id:'x3',title:'Perfect Attendance',desc:'Stage 2: attend all 3 classes in a single day.',rw:{xp:180,coins:150},steps:[{t:()=>'Attend all 3 classes today ('+CLASSES.filter(k=>S.cls[k.n]=='present'||S.cls[k.n]=='late').length+'/3)',chk:()=>CLASSES.every(k=>S.cls[k.n]=='present'||S.cls[k.n]=='late')}],locked2:1});
/* side quests offered by NPCs */
const SIDEQ={bea:{giver:'Bea',id:'s1',title:'Deliver the Notes',desc:'Bring Bea’s class notes to your instructor.',offer:'Pwede mo bang ibigay kay Sir/Ma’am yung notes ko? Late na ako!',rw:{xp:30,coins:40}},
 jun:{giver:'Jun',id:'s2',title:'Snack Run',desc:'Buy Siomai at the canteen and give it to Jun.',offer:'Gutom na gutom na ako... Pwede ka bang bumili ng siomai sa canteen?',rw:{xp:35,coins:30}},
 dan:{giver:'Coach Dan',id:'s3',title:'Morning Jog',desc:'Run 100 meters around the campus.',offer:'Warm up muna! Takbuhin mo ang 100 meters.',rw:{xp:30,coins:35}},
 paolo:{giver:'Paolo',id:'s4',title:'Help Paolo Debug',desc:'Solve a coding puzzle at any lab computer.',offer:'May bug yung code ko, pwede mo ba akong tulungan sa lab?',rw:{xp:45,coins:50}}};
defM({id:'s1',side:1,title:'Deliver the Notes',desc:SIDEQ.bea.desc,rw:SIDEQ.bea.rw,onStart:()=>addItem('notes',1),steps:[{t:()=>'Give Bea’s notes to '+myTeacher(),mk:()=>npcMk(myTeacher()),ev:(t,a)=>t=='deliver'&&a=='notes'}]});
defM({id:'s2',side:1,title:'Snack Run',desc:SIDEQ.jun.desc,rw:SIDEQ.jun.rw,steps:[{t:'Buy Siomai at the canteen',mk:()=>roomMk('Canteen'),ev:(t,a)=>t=='buy'&&a=='siomai'},{t:'Give the Siomai to Jun',mk:()=>npcMk('Jun'),ev:(t,a)=>t=='give'&&a=='Jun'}]});
defM({id:'s3',side:1,title:'Morning Jog',desc:SIDEQ.dan.desc,rw:SIDEQ.dan.rw,onStart:st=>{st.d.m=0},steps:[{t:st=>'Run 100 m ('+Math.round(st.d.m||0)+'/100)',ev:(t,a)=>{if(t=='run'){const st2=mst('s3');st2.d.m=(st2.d.m||0)+a;return st2.d.m>=100}}}]});
defM({id:'s4',side:1,title:'Help Paolo Debug',desc:SIDEQ.paolo.desc,rw:SIDEQ.paolo.rw,steps:[{t:'Solve a puzzle at a computer in Computer Lab 1',mk:()=>roomMk('Computer Lab 1'),ev:t=>t=='pcSolved'}]});
/* ---------- initial mission state ---------- */
function initMissions(fresh){if(fresh){S.miss={};startM('m1',true);S.track='m1'}
  MISSIONS.forEach(m=>mst(m.id));if(S.flags.stage2)['x1','x2','x3'].forEach(i=>{if(mst(i).st=='locked')startM(i,true)});
  if(mst('m8').st=='active'&&mst('m8').i==0)spawnWallet(true);else if(walletMesh)walletMesh.visible=false;
  if(!S.track||!MISSIONS.find(m=>m.id==S.track&&mst(m.id).st=='active')){const a=MISSIONS.find(m=>mst(m.id).st=='active');S.track=a?a.id:null}}
/* ---------- classes (attendance + lesson) ---------- */
let lesson=null;
function classTick(dt){if(S.cls.day!=S.day)S.cls={day:S.day,1:null,2:null,3:null};
  CLASSES.forEach(k=>{if(S.cls[k.n]==null&&S.clock>=k.start+CLS_LATE&&!(lesson&&lesson.k==k)){S.cls[k.n]='absent';S.att.push({d:S.day,c:k.n,s:'absent'});if(S.flags.started){notify('❌ Absent in '+k.name,'warn','You missed the class.')}}})
  if(seatCur&&seatCur.type=='class'&&!lesson)trySitClass(seatCur);
  // class timer HUD
  const t=$('timer'),k=nextClass();if(lesson){t.classList.remove('hid','late');t.textContent='📖 Lesson '+Math.round(lesson.t/lesson.dur*100)+'%'}
  else if(k&&S.clock>=k.start-90&&state!='sit'){const left=k.start-S.clock;t.classList.remove('hid');t.classList.toggle('late',left<0);t.textContent=left>0?'⏰ '+k.name+' starts in '+Math.ceil(left)+' min':'⏰ '+k.name+' started! Sit in '+myRoom()+' ('+Math.max(0,Math.ceil(k.start+CLS_LATE-S.clock))+' min left)'}
  else if(!sport()&&!examOn)t.classList.add('hid')}
function trySitClass(seat){const k=CLASSES.find(k=>S.cls[k.n]==null&&S.clock>=k.start-10&&S.clock<k.start+CLS_LATE);if(!k||seat.room.n!=myRoom())return false;
  const st=S.clock<=k.start+CLS_ONTIME?'present':'late';
  if(S.clock<k.start){if(!seat.warned){seat.warned=1;notify('You are early','','Class '+k.n+' starts at '+fmtTime(k.start)+'. Wait seated.')}return true}
  startLesson(k,st);return true}
function startLesson(k,st){if(lesson)return;lesson={k,st,t:0,dur:16,q:false,room:myRoom()};S.cls[k.n]=st;S.att.push({d:S.day,c:k.n,s:st});
  sfx('bell');notify(st=='present'?'✅ Present - '+k.name:'⚠ Late - '+k.name,st=='present'?'good':'warn',myTeacher()+' starts the lesson');ev('lessonStart',k.n,st)}
const TOPICS=[['Today we discuss the basics of problem solving.','Always read the instructions first.'],['Let us review the fundamentals of our course.','Practice makes perfect, class!'],['Please open your notebooks and take notes.','Questions are welcome.']];
function lessonTick(dt){if(!lesson)return;const L=lesson;L.t+=dt;S.clock+=dt*(60/L.dur-0)*0+dt*(60/L.dur);if(Math.random()<dt*.5)sfx('page');
  if(!L.q&&L.t>L.dur*.5){L.q=true;const q=pickA(QBANK);const o=q.o.map((t,i)=>({t,ok:i==q.a}));shuffle(o);L.paused=true;
    ask(myTeacher(),'Quick question: '+q.q,o.map(c=>({t:c.t,fn:()=>{L.paused=false;if(c.ok){giveXP(10);notify('✔ Correct!','good','+10 XP participation');addFr(myTeacher(),1)}else notify('✘ Not quite','warn','The answer was: '+q.o[q.a]);L.hold=0}})))}
  if(L.paused){L.t-=dt;S.clock-=dt*(60/L.dur)}
  if(L.t>=L.dur){const k=L.k;lesson=null;const late=L.st=='late';reward({xp:late?25:40,coins:late?10:20},k.name+' complete');useEnergy(6);addHunger(-3);
    if(k.n==1||!S.asgPending){S.asgPending++;setTimeout(()=>notify('📝 New assignment','','Do it at your boarding house desk, then submit to '+myTeacher()),1800)}
    ev('lessonDone',k.n);dailyEv('lessonDone',1);saveGame();sfx('bell')}}
/* ---------- question bank + quiz UI ---------- */
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const QBANK=[
 {q:'What is 12 × 8?',o:['86','96','108','98'],a:1},{q:'Who is the national hero of the Philippines?',o:['Andres Bonifacio','Emilio Aguinaldo','Jose Rizal','Apolinario Mabini'],a:2},
 {q:'Which planet is known as the Red Planet?',o:['Venus','Mars','Jupiter','Mercury'],a:1},{q:'What does CPU stand for?',o:['Central Processing Unit','Computer Personal Unit','Central Program Utility','Core Power Unit'],a:0},
 {q:'Choose the correct sentence.',o:['She go to school.','She goes to school.','She going to school.','She gone to school.'],a:1},{q:'What is the capital of the Philippines?',o:['Cebu City','Davao City','Manila','Quezon City'],a:2},
 {q:'H2O is the chemical formula of…',o:['Salt','Oxygen','Water','Hydrogen'],a:2},{q:'Solve: 3x + 5 = 20. x = ?',o:['3','5','8','15'],a:1},
 {q:'Which is a programming language?',o:['HTML5 Paint','Python','Windows','Chrome'],a:1},{q:'The Philippines declared independence from Spain in…',o:['1521','1898','1946','1872'],a:1},
 {q:'Which is a prime number?',o:['21','27','29','33'],a:2},{q:'What part of the plant makes food?',o:['Roots','Stem','Leaves','Flower'],a:2},
 {q:'1 kilometer equals how many meters?',o:['10','100','1000','10000'],a:2},{q:'Which device is an INPUT device?',o:['Monitor','Printer','Keyboard','Speaker'],a:2},
 {q:'The synonym of “happy” is…',o:['Sad','Joyful','Angry','Tired'],a:1},{q:'Who discovered the Philippines for Spain in 1521?',o:['Magellan','Columbus','Legazpi','Marco Polo'],a:0},
 {q:'What is 25% of 200?',o:['25','40','50','75'],a:2},{q:'Which gas do humans need to breathe?',o:['Nitrogen','Oxygen','Carbon dioxide','Helium'],a:1},
 {q:'In education, “LET” stands for…',o:['Licensure Examination for Teachers','Learning English Test','Local Education Task','Literacy Exam Track'],a:0},{q:'What is the binary number 101 in decimal?',o:['3','4','5','6'],a:2},
 {q:'Which is the largest island in the Philippines?',o:['Mindanao','Luzon','Palawan','Cebu'],a:1},{q:'Which of these is a noun?',o:['Run','Beautiful','School','Quickly'],a:2},
 {q:'What is the square root of 144?',o:['10','11','12','14'],a:2},{q:'Which organ pumps blood?',o:['Lungs','Heart','Liver','Kidney'],a:1},
 {q:'Criminology: the study of…',o:['Plants','Crime and criminals','Stars','Numbers'],a:1},{q:'What does “www” stand for?',o:['World Wide Web','World Web Window','Wide World Wire','Web World Work'],a:0}];
let examOn=false,timerTick=null;
function openQuiz(o){const qs=shuffle(QBANK.slice()).slice(0,o.n||8).map(q=>{const opts=q.o.map((t,i)=>({t,ok:i==q.a}));shuffle(opts);return {q:q.q,opts}});
  let i=0,right=0,hint=false,tLeft=o.per||20;examOn=!!o.exam;let tm=null;
  const render=()=>{const q=qs[i];showOvl('<div class="qh"><span>'+o.title+'</span><span>Question '+(i+1)+'/'+qs.length+' · ⏱ <b id="qt">'+tLeft+'</b>s</span></div><h2 style="text-align:left;font-size:1.1em">'+q.q+'</h2>'+
    q.opts.map((c,k)=>'<button class="opt" data-k="'+k+'">'+String.fromCharCode(65+k)+'. '+c.t+'</button>').join('')+
    (hasItem('calc')&&!hint&&o.exam?'<button id="qhint" style="background:#2a6b60">🧮 Use calculator hint (removes 2 wrong answers)</button>':''));
    $('ovl').querySelectorAll('.opt').forEach(b=>b.onclick=()=>pick(+b.dataset.k));const h=$('qhint');if(h)h.onclick=()=>{takeItem('calc');hint=true;let rm=0;qs[i].opts.forEach((c,k)=>{if(!c.ok&&rm<2){rm++;const b=$('ovl').querySelector('[data-k="'+k+'"]');b.disabled=true;b.style.opacity=.3}});h.remove()}};
  const pick=k=>{if(k>=0&&qs[i].opts[k].ok){right++;sfx('ok')}else sfx('err');i++;hint=false;tLeft=o.per||20;if(i>=qs.length)finish();else render()};
  const finish=()=>{clearInterval(tm);examOn=false;const pct=Math.round(right/qs.length*100),gr=toGrade(pct);
    showOvl('<h2>'+(pct>=60?'🎉 PASSED':'😞 FAILED')+'</h2><div class="kv"><span>Score</span><b>'+right+' / '+qs.length+' ('+pct+'%)</b></div><div class="kv"><span>Grade</span><b>'+gr.toFixed(2)+'</b></div><button id="qok" class="big">Continue</button>');
    $('qok').onclick=()=>{hideOvl();o.done&&o.done(pct,gr)}};
  render();tm=setInterval(()=>{if(!ovlOpen){clearInterval(tm);return}tLeft--;const e=$('qt');if(e)e.textContent=tLeft;if(tLeft<=0)pick(-1)},1000)}
/* ---------- coding challenge ---------- */
const CODEQ=[
 {c:'console.log(___);\n// goal: print the text  Hello NEMCO',o:['"Hello NEMCO"','Hello NEMCO','Hello + NEMCO','print(Hello)'],a:0},
 {c:'let sum = 0;\nfor (let i = 1; i <= 4; i++) {\n  sum += i;\n}\nconsole.log(sum);\n// what is printed?',o:['4','10','24','6'],a:1},
 {c:'let age = 17;\nif (age >= 18) { console.log("Adult"); }\nelse { console.log("Minor"); }\n// what is printed?',o:['Adult','Minor','17','Nothing'],a:1},
 {c:'for (let i = 0; i < 3; ___) {\n  console.log(i);\n}\n// goal: print 0, 1, 2',o:['i--','i++','i==1','i*0'],a:1},
 {c:'let name = "NEMCO";\nconsole.log(name.length);\n// what is printed?',o:['4','5','6','"NEMCO"'],a:1},
 {c:'let a = [3, 5, 7];\nconsole.log(a[1]);\n// what is printed?',o:['3','5','7','1'],a:1},
 {c:'function add(a, b) { return ___; }\n// goal: add(2,3) returns 5',o:['a - b','a * b','a + b','a / b'],a:2}];
function openCode(o){const qs=shuffle(CODEQ.slice()).slice(0,3);let i=0,ok=0,tLeft=o.limit||90,tm=null;
  const render=()=>{const q=qs[i];const opts=q.o.map((t,k)=>({t,k}));showOvl('<div class="qh"><span>💻 '+o.title+'</span><span>Task '+(i+1)+'/3 · ⏱ <b id="qt">'+tLeft+'</b>s</span></div><pre>'+q.c.replace(/</g,'&lt;')+'</pre>'+opts.map(c=>'<button class="opt" data-k="'+c.k+'">'+c.t.replace(/</g,'&lt;')+'</button>').join(''));
    $('ovl').querySelectorAll('.opt').forEach(b=>b.onclick=()=>{sfx('type');if(+b.dataset.k==q.a){ok++;sfx('pc')}else sfx('err');i++;if(i>=3)end();else render()})};
  const end=()=>{clearInterval(tm);const pass=ok>=2;showOvl('<h2>'+(pass?'✅ Challenge solved!':'❌ Not enough correct answers')+'</h2><div class="kv"><span>Correct</span><b>'+ok+'/3</b></div><button id="qok" class="big">Continue</button>');$('qok').onclick=()=>{hideOvl();o.done&&o.done(pass,ok)}};
  render();tm=setInterval(()=>{if(!ovlOpen){clearInterval(tm);return}tLeft--;const e=$('qt');if(e)e.textContent=tLeft;if(tLeft<=0)end()},1000)}
function usePC(pc){if(state=='sit'&&seatCur==pc.seat){pcMenu(pc);return}
  if(trySit(pc.seat))setTimeout(()=>pcMenu(pc),300)}
function pcMenu(pc){const m3=mst('m3'),needs=(m3.st=='active'&&m3.i==1)||(mst('s4').st=='active');
  const cd=S.flags.labDay==S.day;
  ask('💻 Computer','Your screen lights up. What do you want to do?',[
   {t:needs?'⭐ Solve the programming challenge':'Programming practice (+20 XP, once a day)',dis:!needs&&cd,fn:()=>openCode({title:needs?'Programming Challenge':'Practice',limit:90,done:(pass)=>{if(pass){if(needs)ev('pcSolved');else{S.flags.labDay=S.day;reward({xp:20,coins:5},'Practice done');useEnergy(3)}}else notify('Try again!','warn')}})},
   {t:'Check emails',fn:()=>{sfx('pc');notify('📧 No new messages','','Your next class: '+(nextClass()?nextClass().name+' at '+fmtTime(nextClass().start):'none today'))}},{t:'Stand up',fn:()=>standUp()}])}
/* ---------- shops ---------- */
function openShop(kind){const items=kind=='store'?['edrink','notebook','pen','calc']:kind=='street'?['bread','water','soda']:['rice','pancit','burger','siomai','bread','soda','water','coffee'];
  const draw=()=>{showOvl('<h2>'+(kind=='store'?'🏪 School Store':kind=='street'?'🛒 Aling Nena':'🍽 Canteen - Ate Rose')+'</h2><div class="kv"><span>Your money</span><b>₱'+S.coins+'</b></div><div class="kv"><span>Hunger / Energy</span><b>'+Math.round(S.hunger)+'% / '+Math.round(S.energy)+'%</b></div>'+
    items.map(id=>{const it=ITEMS[id];return '<div class="mi"><b>'+it.i+' '+it.n+' · ₱'+it.p+'</b><small>'+(it.t=='food'?'+'+it.h+' hunger'+(it.e?' · +'+it.e+' energy':''):it.d||'')+'</small>'+
      '<button data-b="'+id+'">Buy</button>'+(it.t=='food'||id=='edrink'?' <button data-e="'+id+'" style="background:linear-gradient(#ffb400,#e08a00)">Buy &amp; use</button>':'')+'</div>'}).join('')+'<button id="shx">Close</button>');
    $('ovl').querySelectorAll('[data-b],[data-e]').forEach(b=>b.onclick=()=>{const id=b.dataset.b||b.dataset.e,it=ITEMS[id];if(S.coins<it.p){sfx('err');notify('Not enough coins','warn','You need ₱'+it.p);return}
      giveCoins(-it.p);sfx('pay');addItem(id,1);ev('buy',id);if(b.dataset.e)useItem(id);else notify(it.i+' '+it.n+' bought','good');draw()});$('shx').onclick=hideOvl};draw()}
/* ---------- library shelves ---------- */
function browseShelf(cat){sfx('page');const req=REQ_BOOKS.find(b=>b[2]==cat),m=mst('m4');
  if(req&&m.st=='active'&&m.i==1&&!hasItem(req[0])){addItem(req[0],1);notify('📚 Found: '+req[1],'good',REQ_BOOKS.filter(b=>hasItem(b[0])).length+'/3 books');ev('book',req[0]);return}
  if(req&&hasItem(req[0])){notify('You already took the book from this shelf','');return}
  notify('📖 '+cat+' shelf','','Nothing you need here right now.');if(S.level>=2)giveXP(1)}
/* ---------- seats ---------- */
let seatCur=null;
function trySit(seat){if(seat.taken&&seat.taken!='player'){const a=agents.find(x=>x.id==seat.taken);notify('Seat taken','warn',a?a.name+' is sitting here':'');return false}
  if(seat.type=='teacher'||seat.type=='conf'){notify('Reserved seat','');return false}
  sitAt(seat);return true}
function sitAt(seat){seatCur=seat;seat.taken='player';state='sit';P.x=seat.x;P.z=seat.z;P.y=seat.y;player.position.set(P.x,P.y-.36,P.z);player.rotation.y=seat.rot;const u=player.userData;u.l1.rotation.x=u.l2.rotation.x=-1.25;u.a1.rotation.x=u.a2.rotation.x=seat.type=='lab'?-1.15:-.3;sfx('chair');seat.warned=0;
  if(seat.type=='class')trySitClass(seat);if(seat.type=='class'||seat.type=='lab'||seat.type=='home'||seat.type=='lib')ev('sit',seat.room&&seat.room.n,seat.type);
  if(seat.type=='bench'||seat.type=='cafe'||seat.type=='lib'||seat.type=='home'){S.flags.restT=0}}
function standUp(){if(!seatCur)return;if(lesson){notify('Stay seated','warn','The lesson is not finished yet!');return}const s=seatCur;seatCur=null;s.taken=null;state='play';
  const back=s.type=='bench'?1.0:.9,fx=Math.sin(s.rot),fz=Math.cos(s.rot);let nx=s.x-fx*back,nz=s.z-fz*back;if(blocked(nx,nz,s.y,.3)){nx=s.x+fx*back;nz=s.z+fz*back;if(blocked(nx,nz,s.y,.3)){nx=s.x+fz*back;nz=s.z-fx*back}}
  P.x=nx;P.z=nz;player.position.set(P.x,P.y,P.z);const u=player.userData;u.l1.rotation.x=u.l2.rotation.x=0;u.a1.rotation.x=u.a2.rotation.x=0;sfx('chair');if(!isTouch&&!ovlOpen){try{renderer.domElement.requestPointerLock()}catch(e){}}}
/* ---------- boarding house: bed, desk, fridge ---------- */
function bedMenu(){const late=S.clock>=1080||S.energy<=60||S.clock<360;
  ask('🛏 Your bed','Energy '+Math.round(S.energy)+'% · Hunger '+Math.round(S.hunger)+'% · '+fmtTime(S.clock)+'. What would you like to do?',[
   {t:'💤 Sleep until morning (restores energy, starts the next school day)',dis:!late,fn:()=>sleepNow('night')},{t:'😴 Take a 1-hour nap (+15 energy)',dis:S.energy>=95,fn:()=>sleepNow('nap')},{t:late?'Not yet':'Too early to sleep... (after 6 PM or when tired)',fn:()=>closeDlg()}])}
function processDayEnd(){CLASSES.forEach(k=>{if(S.cls[k.n]==null){S.att.push({d:S.day,c:k.n,s:'absent'});S.cls[k.n]='absent'}})}
function sleepNow(mode,forced){closeDlg();
  if(mode=='nap'){fadeTo('😴 Zzz...',3200,()=>{S.clock+=60;addEnergy(15);addHunger(-5);sleepAudio(true)},()=>notify('😊 You feel a little better','good','+15 energy'));return}
  const hungry=S.hunger<20;
  fadeTo(forced?'💤 You collapsed from exhaustion...\nYou wake up in your boarding house.':'🌙 Good night, '+pname+'...\nZzz...',5200,()=>{sleepAudio(true);processDayEnd();S.day++;S.clock=forced?510:390;S.energy=forced?70:(hungry?85:100);S.hunger=clamp(S.hunger-20,8,100);
      S.flags.tiredWarn=0;S.flags.hungryWarn=0;S.cls={day:S.day,1:null,2:null,3:null};rollDaily();if(forced)giveCoins(-Math.min(S.coins,30));
      P.x=1.0;P.z=59.6;P.y=0;camYaw=0;lesson=null;seatCur=null;applyDayNight(S.clock,true);snapNpcs();setSong('home');randomEvT=60;
      if(S.day==6&&mst('m10').st=='active'&&!weekOK())setTimeout(()=>notify('📅 Week finished','warn','Complete the missing requirements to unlock Stage 2.',5000),2500);saveGame()},
    ()=>{sfx('wake');sfx('rooster');notify('🌅 Day '+S.day,'gold',fmtTime(S.clock)+' · '+(forced?'You overslept! Energy 70%':'Energy restored to '+Math.round(S.energy)+'%'),4500);setTimeout(()=>sfx('bell'),1500)})}
function studyDesk(){
  if(S.asgPending<=0&&!hasItem('asg')){ask('📚 Study desk','No assignment yet. Attend a class first. You can review your notes for XP.',[{t:'Review notes (+8 XP, -3 energy)',fn:()=>{giveXP(8);useEnergy(3);sfx('page');ev('study');dailyEv('study',1)}},{t:'Leave',fn:()=>closeDlg()}]);return}
  if(hasItem('asg')){notify('You already finished your assignment','','Submit it to '+myTeacher()+' at school.');return}
  ask('📚 Study desk','You have '+S.asgPending+' assignment(s) due. Start now?',[{t:'📝 Do the assignment (6 questions)',fn:()=>openQuiz({title:'Assignment',n:6,per:30,done:(pct)=>{S.asgPending=Math.max(0,S.asgPending-1);addItem('asg',1);S.flags.asgScore=Math.max(60,pct);useEnergy(5);addHunger(-4);S.clock+=45;ev('study');dailyEv('study',1);notify('📝 Assignment finished','good','Score '+pct+'% - submit it to '+myTeacher())}})},{t:'Later',fn:()=>closeDlg()}])}
function fridge(){if(S.flags.fridgeDay==S.day){notify('🧊 The fridge is empty','','Buy food at the canteen.');return}S.flags.fridgeDay=S.day;addItem('water',1);addItem('bread',1);notify('🧊 You found snacks!','good','+ Pandesal, + Bottled Water')}
/* ---------- NPC conversations ---------- */
const TIPS_NPC=["Energy below 50%? Go home and sleep at the boarding house.","Take the tricycle at the terminal if you're tired - only ₱20!","The canteen sells meals. Eat before your hunger runs out.","Sit down in your classroom before the class timer ends.","Basketball: press E to start the power meter, E again to shoot.","Press J for missions, I for your items, P for your grades."];
const CHAT=["Magandang araw! Ready ka na ba sa quiz?","Grabe ang init ngayon... tara canteen later.","May assignment ka na ba? Hindi pa ako tapos.","Nakita mo ba si Coach Dan? Nag-aaya maglaro.","Ang ganda ng school natin, di ba?","Sana walang surprise exam ngayon!"];
function faceNpc(a){if(a.g){const dx=P.x-a.g.position.x,dz=P.z-a.g.position.z;a.faceT=Date.now();a.g.rotation.y=Math.atan2(dx,dz)}}
function talkTo(a){dlgNpc=a;const n=a.name;if(a.g)faceNpc(a);
  if(a.civ)return say([['Pedestrian',pickA(["Ingat sa tricycle, ha!","Late na ako sa lakad ko!","Magandang umaga po!"])],['@','Thanks! See you around.']]);
  ev('talk',n);if(a.staff=='teacher'||a.staff=='lab'||a.staff=='faculty'||a.staff=='principal')return talkStaff(a);
  if(a.staff=='guard')return talkGuard(a);if(a.staff=='vendor')return talkVendor(a);if(a.staff=='store')return talkStore(a);if(a.staff=='librarian')return talkLibrarian(a);
  if(a.staff=='streetvendor')return ask('Aling Nena','Pandesal, softdrinks, tubig! Bili ka na!',[{t:'🛒 Buy something',fn:()=>openShop('street')},{t:'Maybe later',fn:()=>closeDlg()}]);
  if(a.staff=='coach')return talkCoach(a);talkStudent(a)}
function chats(n,ch){const first=chatFr(n);const l=frLevel(n);return first}
function talkStaff(a){const n=a.name,mine=n==myTeacher(),opts=[];
  if(mine){
   if(hasItem('asg'))opts.push({t:'📝 Submit my assignment',fn:()=>submitAsg(n)});
   if(REQ_BOOKS.every(b=>hasItem(b[0]))&&mst('m4').st=='active')opts.push({t:'📚 Deliver the 3 library books',fn:()=>{REQ_BOOKS.forEach(b=>takeItem(b[0]));say([[n,'Excellent research, '+pname+'! These are exactly the books I needed.']],()=>ev('deliver','books'))}});
   if(['pp1','pp2','pp3'].every(i=>hasItem(i))&&mst('m7').st=='active')opts.push({t:'📦 Submit the group project',fn:()=>{['pp1','pp2','pp3'].forEach(i=>takeItem(i));const sc=88+Math.min(12,(S.fr.Mika||0)+(S.fr.Joshua||0));S.asg.push({d:S.day,s:sc,n:'Group Project'});say([[n,'Great teamwork! Your group project score: '+sc+'%.']],()=>ev('deliver','project'))}});
   if(hasItem('notes')&&mst('s1').st=='active')opts.push({t:'🗒 Give Bea’s notes',fn:()=>{takeItem('notes');say([[n,'Ah, thank you. Tell Bea I received them.']],()=>{ev('deliver','notes');addFr('Bea',2)})}});
   const m6=mst('m6');if(m6.st=='active'&&m6.i==1)opts.push({t:'📋 Take the surprise exam',fn:()=>say([[n,'Surprise! Clear your desks, '+pname+'. 8 questions, 20 seconds each.']],()=>openQuiz({title:'Surprise Examination',n:8,per:20,exam:true,done:(pct,gr)=>{S.exm.push({d:S.day,s:pct,n:'Surprise Exam'});ev('exam',pct);dailyEv('exam',1);useEnergy(4);addFr(n,pct>=60?2:0);
      if(pct<60){notify('You can retake the exam later','warn','Review and talk to '+n+' again.');}}}))});
   if(S.flags.stage2&&mst('x1').st=='active')opts.push({t:'🎓 Take the Midterm Exam',fn:()=>openQuiz({title:'Midterm Examination',n:12,per:18,exam:true,done:(pct)=>{S.exm.push({d:S.day,s:pct,n:'Midterm'});ev('midterm',pct);useEnergy(6)}})});
   const k=nextClass();if(!S.flags.m1talk){S.flags.m1talk=1}
   opts.push({t:'💬 Ask about today’s lesson',fn:()=>{chatFr(n);say([[n,pickA(TOPICS)[0]],[n,k?'Your next class is '+k.name+' at '+fmtTime(k.start)+' in '+myRoom()+'.':'No more classes today. Get some rest!']])}})}
  else opts.push({t:'💬 Chat',fn:()=>{chatFr(n);say([[n,n=='Principal Dela Cruz'?'Welcome to NEMCO. Study hard, and remember to rest at your boarding house.':n=='Sir Ben'?'The computer lab is open for practice. Sit at any computer and press E.':n=="Ma'am Reyes"?'The faculty room is for staff only, but I’m happy to answer questions.':'Hello, '+pname+'! You should find your own class instructor: '+myTeacher()+'.']])}});
  if(n=='Principal Dela Cruz')opts.unshift({t:'📊 Ask about my progress',fn:()=>say([[n,'Overall performance: '+Math.round(overall())+'% (grade '+toGrade(overall()).toFixed(2)+'). '+weekText()]])});
  opts.push({t:'Goodbye',fn:()=>closeDlg()});
  const greeting=mine&&mst('m1').st=='active'&&mst('m1').i==2?[[n,'Good morning, '+pname+'! Welcome to '+COURSES[O.course].n+'. Your seat is in this room.'],['@','Thank you, '+n.split(' ')[0]+'!'],[n,'Class starts at 8:00 AM. Don’t be late - sit down before the timer ends!']]:[[n,'Yes, '+pname+'?']];
  say(greeting,()=>ask(n,'What do you need?',opts))}
function submitAsg(n){takeItem('asg');const sc=S.flags.asgScore||75;S.asg.push({d:S.day,s:sc,n:'Assignment'});say([[n,'Thank you. I graded your assignment: '+sc+'%.']],()=>{reward({xp:20+Math.round(sc/5),coins:20},'Assignment submitted');ev('asgSubmit');dailyEv('asgSubmit',1);addFr(n,1)})}
function talkGuard(a){const opts=[{t:'Ask about the school',fn:()=>say([['Manong Guard','Library ay sa ground floor, canteen katabi. Computer lab sa 4th floor!']])}];
  const m8=mst('m8');if(m8.st=='active'&&m8.i==1&&!m8.d.clues['Manong Guard'])opts.push({t:'🔎 Ask about the lost wallet',fn:()=>say([['Manong Guard','Wallet? May nakita akong estudyante kanina na nagmamadali, naka-jersey, may panda keychain sa bag.']],()=>ev('clue','Manong Guard'))});
  opts.push({t:'Goodbye',fn:()=>closeDlg()});say([['Manong Guard','Good morning, '+pname+'! Dala mo ba ang ID mo?'],['@','Opo, Manong. Salamat!']],()=>ask('Manong Guard','Anything else?',opts))}
function talkVendor(a){const opts=[{t:'🍽 Order food',fn:()=>openShop('canteen')}];const m8=mst('m8');
  if(m8.st=='active'&&m8.i==1&&!m8.d.clues['Ate Rose'])opts.push({t:'🔎 Ask about a blue wallet',fn:()=>say([['Ate Rose','Blue wallet? Parang kay Carlo yun! Lagi siyang bumibili ng siomai tapos may panda keychain.']],()=>ev('clue','Ate Rose'))});
  opts.push({t:'Goodbye',fn:()=>closeDlg()});say([['Ate Rose','Hello, '+pname+'! Gutom ka na ba? Rice meal, pancit, burger, siomai!']],()=>ask('Ate Rose','What would you like?',opts))}
function talkStore(a){ask("Ma'am Tess",'Notebooks, ballpens, calculators and energy drinks. May kailangan ka ba?',[{t:'🏪 Browse the store',fn:()=>openShop('store')},{t:'Goodbye',fn:()=>closeDlg()}])}
function talkLibrarian(a){const opts=[{t:'📚 Study at the reading table (Lv 2)',dis:S.level<2,fn:()=>studyTable()}],m8=mst('m8');
  if(m8.st=='active'&&m8.i==1&&!m8.d.clues['Ms. Ria'])opts.push({t:'🔎 Ask about the lost wallet',fn:()=>say([['Ms. Ria','Si Renz nagtanong kanina tungkol sa wallet, pero wala siyang panda keychain. Baka hindi sa kanya yun.']],()=>ev('clue','Ms. Ria'))});
  opts.push({t:'Goodbye',fn:()=>closeDlg()});say([['Ms. Ria','Shhh... Welcome to the NEMCO Library. Books are sorted by category.']],()=>ask('Ms. Ria','How can I help?',opts))}
function studyTable(){if(S.level<2){notify('Unlocks at Level 2','warn');return}if(S.flags.libDay==S.day){notify('You already studied here today','');return}S.flags.libDay=S.day;fadeTo('📚 Studying at the library...',2400,()=>{S.clock+=50;giveXP(25);useEnergy(4);addHunger(-3)},()=>{notify('📚 Study session complete','good','+25 XP');ev('study');dailyEv('study',1)})}
function talkCoach(a){const m9=mst('m9'),opts=[];
  if(m9.st=='active'&&m9.i<=1&&!sport())opts.push({t:'🏀 Basketball: score 3 baskets in 90 s',fn:()=>startSport('bb')},{t:'🏃 Running: 6 checkpoints in 60 s',fn:()=>startSport('run')});
  opts.push({t:'Any quests for me?',fn:()=>offerSide('dan')},{t:'Goodbye',fn:()=>closeDlg()});say([['Coach Dan',m9.st=='active'?'Ready for the Campus Sports Challenge, '+pname+'?':'Hey, '+pname+'! The court is open - grab the ball and shoot some hoops!']],()=>ask('Coach Dan','What will it be?',opts))}
function offerSide(key){const q=SIDEQ[key],st=mst(q.id);if(st.st=='done')return say([[q.giver,'Salamat ulit sa tulong mo!']]);if(st.st=='active')return say([[q.giver,'Kumusta na yung hiningi ko? Balikan mo ako pag tapos na.']]);
  ask(q.giver,q.offer,[{t:'✔ Sure, I’ll help (+ '+q.rw.xp+' XP, ₱'+q.rw.coins+')',fn:()=>startM(q.id)},{t:'Sorry, not now',fn:()=>closeDlg()}])}
function talkStudent(a){const n=a.name,opts=[];const m7=mst('m7'),m8=mst('m8');
  if(m7.st=='active'&&m7.i==0&&MATES.includes(n)&&!m7.d.got[n]){opts.push({t:'📌 Ask for your project contribution',fn:()=>mateTalk(n)})}
  if(m8.st=='active'&&m8.i==2&&(n=='Carlo'||n=='Renz')&&hasItem('wallet'))opts.push({t:'👛 Show the wallet',fn:()=>walletAsk(n)});
  if(mst('s2').st=='active'&&mst('s2').i==1&&n=='Jun'&&hasItem('siomai'))opts.push({t:'🥟 Give the Siomai',fn:()=>{takeItem('siomai');say([['Jun','Wow, salamat! Ang bait mo!']],()=>{ev('give','Jun');addFr('Jun',3)})}});
  const sk={Bea:'bea',Jun:'jun',Paolo:'paolo'}[n];if(sk)opts.push({t:'🙋 Anything I can help with?',fn:()=>offerSide(sk)});
  opts.push({t:'💬 Chat (+friendship)',fn:()=>{const f=chatFr(n),l=frLevel(n);say([[n,pickA(CHAT)],['@','Haha, true!']],()=>{if(f&&l>=2&&S.flags['gift_'+n]!=S.day&&Math.random()<.6){S.flags['gift_'+n]=S.day;addItem('bread',1);notify('🎁 '+n+' gave you pandesal','good')}else if(!f)notify(n+' is busy','','Chat again later to improve your friendship.')})}});
  opts.push({t:'💡 Ask for a tip',fn:()=>say([[n,pickA(TIPS_NPC)]])},{t:'Goodbye',fn:()=>closeDlg()});
  const l=frLevel(n);say([[n,l>=2?'Uy '+pname+'! Kumusta?':'Hi! Ikaw ba yung bagong estudyante?']],()=>ask(n,FR_LV[l][0]+' · '+'♥'.repeat(Math.min(5,l+(S.fr[n]>0?1:0))),opts))}
function mateTalk(n){const g=mst('m7').d.got;
  if(n=='Mika')return ask('Mika','Hi '+pname+'! Group project? Sure. How should I give you my part?',[{t:'"Please send your research part, thank you!"',fn:()=>{say([['Mika','Aww so polite! Here’s my research part. Good luck!']],()=>{addItem('pp1',1);addFr('Mika',2);ev('contrib','Mika')})}},{t:'"Give me your part now."',fn:()=>say([['Mika','Hmp. Ask nicely next time.']])}]);
  if(n=='Joshua')return ask('Joshua','Gutom na ako... Kapag nakakain ako ng kahit ano, ibibigay ko yung slides ko.',[{t:'Give him a food item from my bag',dis:!Object.keys(S.inv).some(i=>ITEMS[i]&&ITEMS[i].t=='food'),fn:()=>{const f=Object.keys(S.inv).find(i=>ITEMS[i]&&ITEMS[i].t=='food');takeItem(f);say([['Joshua','Salamat! Heto na yung slides.']],()=>{addItem('pp2',1);addFr('Joshua',3);ev('contrib','Joshua')})}},{t:'Okay, I’ll buy food first',fn:()=>closeDlg()}]);
  if(n=='Angel'){const q=pickA(QBANK),o=q.o.map((t,i)=>({t,ok:i==q.a}));shuffle(o);return ask('Angel','Sasagutin ko lang kapag nasagot mo ito: '+q.q,o.map(c=>({t:c.t,fn:()=>{if(c.ok)say([['Angel','Tama! Eto na yung report ko.']],()=>{addItem('pp3',1);addFr('Angel',2);ev('contrib','Angel')});else say([['Angel','Mali! Subukan mo ulit mamaya.']])}})))}}
function walletAsk(n){const right=n=='Carlo';ask(n,right?'Yan yung wallet ko!! May panda keychain pa.':'Akin yan! ...Ahh, actually, di ko sure.',[{t:'Return the wallet to '+n,fn:()=>{if(right){takeItem('wallet');spawnWallet(false);say([['Carlo','Maraming salamat, '+pname+'! Heto, reward mo.']],()=>{addFr('Carlo',4);ev('wallet','Carlo')})}else say([['Renz','Pero... wala talaga akong panda keychain. Sige na, hindi akin.'],['@','Hmm, kailangan ko pang maghanap ng ibang owner.']],()=>{addFr('Renz',0)})}},{t:'Not sure yet',fn:()=>closeDlg()}])}
function pickWallet(){if(walletMesh&&walletMesh.visible){walletMesh.visible=false;addItem('wallet',1);sfx('pay');notify('👛 You picked up a wallet','good','Blue wallet · panda keychain');ev('pickWallet')}}
/* ---------- sports challenge ---------- */
const sport=()=>SPORT.mode;
const RUN_PTS=[[-9.8,-12.5],[-8,0.5],[0,3],[7.5,0.5],[7.5,-8],[0,-12.2]];let runCache=null;
function runMarker(){if(!runCache)runCache=RUN_PTS.map(p=>snapFree(0,p[0],p[1]));const p=runCache[Math.min(5,SPORT.cp)];return {x:p[0],z:p[1],y:0,label:'Checkpoint '+(SPORT.cp+1)}}
function startSport(mode){closeDlg();if(S.energy<20){notify('Too tired for sports','warn','Rest first!');return}SPORT.mode=mode;SPORT.t=mode=='bb'?90:60;SPORT.n=0;SPORT.cp=0;BALLS.player.rest(-1.2,-5);notify(mode=='bb'?'🏀 Score 3 baskets!':'🏃 Reach all 6 checkpoints!','gold','Go go go!');sfx('bell')}
function sportTick(dt){if(!SPORT.mode)return;SPORT.t-=dt;const t=$('timer');t.classList.remove('hid');t.textContent=(SPORT.mode=='bb'?'🏀 '+SPORT.n+'/3':'🏃 '+SPORT.cp+'/6')+' · ⏱ '+Math.max(0,Math.ceil(SPORT.t))+'s';
  if(SPORT.mode=='run'){const m=runMarker();if(Math.hypot(P.x-m.x,P.z-m.z)<2&&P.y<1){SPORT.cp++;sfx('coin');if(SPORT.cp>=6)return endSport(true)}}
  if(SPORT.mode=='bb'&&SPORT.n>=3)return endSport(true);if(SPORT.t<=0)endSport(false)}
function endSport(ok){const mode=SPORT.mode;SPORT.mode=null;$('timer').classList.add('hid');useEnergy(mode=='bb'?10:14);addHunger(-5);
  if(ok){notify('🏆 Challenge complete!','gold','Great job!');reward({xp:25,coins:25},'Sports bonus')}else{notify('⏱ Time is up','warn','Talk to Coach Dan to try again.')}ev('sportDone',ok)}
/* ---------- random events ---------- */
let randomEvT=240;
function randomEventTick(dt){if(state!='play'||lesson||ovlOpen||dlgNpc)return;randomEvT-=dt;if(randomEvT>0)return;randomEvT=rand(200,380);if(!S.flags.started||P.y>1&&false)return;
  const r=Math.random();
  if(r<.34){const c=pickA([10,15,20,25]);giveCoins(c);notify('🪙 Lucky day!','good','You found ₱'+c+' on the ground');}
  else if(r<.62){addItem('siomai',1);notify('🎁 A classmate treated you','good','+ Siomai in your bag')}
  else if(r<.85){ask('Classmate','Hey '+pname+'! Quick one: '+QBANK[0].q,QBANK[0].o.map((t,i)=>({t,fn:()=>{if(i==QBANK[0].a){giveXP(12);notify('✔ Correct!','good','+12 XP')}else notify('✘ Nope','warn','The answer is 96.')}})))}
  else{notify('📣 Announcement','','Classes are going well today. Don’t forget to eat and rest!')}}
