/* =====================================================================
   STATE: player stats, time, schedule, inventory, friendship, XP,
   daily challenges, notifications, save / load.
   ===================================================================== */
const FLN=['Ground Floor','2nd Floor','3rd Floor','4th Floor'];
const CLK=1.2;                       // game minutes per real second
const CLASSES=[{n:1,start:480,name:'Class 1'},{n:2,start:600,name:'Class 2'},{n:3,start:780,name:'Class 3'}];
const CLS_LEN=90,CLS_ONTIME=10,CLS_LATE=30;
const ASSIGN={'BSIT':'Room 303','HS':'Room 203','EDUC':'Room 203','AB':'Room 403','CRIM':'Room 403'};
const TEACH={'Room 203':'Sir Cruz','Room 303':"Ma'am Lopez",'Room 403':"Ma'am Santos"};
const myRoom=()=>ASSIGN[O.course]||'Room 303';
const myTeacher=()=>TEACH[myRoom()];
const ITEMS={
 rice:{n:'Rice Meal',i:'🍛',t:'food',h:45,e:10,p:45},pancit:{n:'Pancit Canton',i:'🍜',t:'food',h:35,e:8,p:35},burger:{n:'Burger',i:'🍔',t:'food',h:28,e:6,p:30},
 siomai:{n:'Siomai',i:'🥟',t:'food',h:22,e:4,p:25},bread:{n:'Pandesal',i:'🥖',t:'food',h:12,e:2,p:12},soda:{n:'Softdrink',i:'🥤',t:'food',h:8,e:6,p:15},
 water:{n:'Bottled Water',i:'💧',t:'food',h:3,e:3,p:10},coffee:{n:'3-in-1 Coffee',i:'☕',t:'food',h:2,e:15,p:20},
 edrink:{n:'Energy Drink',i:'⚡',t:'supply',h:0,e:30,p:55,d:'Restores 30 energy.'},
 notebook:{n:'Notebook',i:'📓',t:'supply',p:40,d:'Use: review your notes (+12 XP).'},pen:{n:'Ballpen',i:'🖊️',t:'supply',p:10,d:'Handy school supply.'},
 calc:{n:'Calculator',i:'🧮',t:'supply',p:120,d:'Gives a free hint during an exam (consumed).'},
 b_hist:{n:'Philippine History',i:'📕',t:'book',d:'Library book.'},b_comp:{n:'Intro to Computing',i:'📗',t:'book',d:'Library book.'},b_math:{n:'College Algebra',i:'📘',t:'book',d:'Library book.'},
 wallet:{n:'Lost Wallet',i:'👛',t:'quest',d:'Find its owner.'},pp1:{n:'Mika’s Research Part',i:'📄',t:'quest'},pp2:{n:'Joshua’s Slides',i:'📊',t:'quest'},pp3:{n:'Angel’s Report',i:'📑',t:'quest'},
 asg:{n:'Finished Assignment',i:'📝',t:'quest',d:'Submit it to your instructor.'},notes:{n:'Class Notes',i:'🗒️',t:'quest',d:'Deliver to the instructor.'}};
const OUTFITS={uniform:{n:'School Uniform',lv:1},pe:{n:'PE Uniform',lv:2},casual:{n:'Casual Wear',lv:3},formal:{n:'Formal Attire',lv:5}};
const ACCS={glasses:{n:'Glasses',lv:3},cap:{n:'Cap',lv:4},headphones:{n:'Headphones',lv:5},ribbon:{n:'Ribbon',lv:2,mis:'m8'}};
const ACTS={libstudy:{n:'Library study session',lv:2},nightball:{n:'Night basketball',lv:3},labprac:{n:'Lab practice',lv:4}};
const xpNeed=l=>80+40*(l-1);
function newS(){return {energy:100,hunger:100,coins:150,xp:0,level:1,day:1,clock:420,inv:{},fr:{},frCd:{},att:[],asg:[],exm:[],asgPending:0,
 miss:{},track:'m1',outfit:'uniform',acc:[],daily:{day:0,list:[]},flags:{},stat:{baskets:0,run:0,drive:0,chats:0,helped:0,rides:0},cls:{day:1,1:null,2:null,3:null},
 sideDone:{},ev:{}}}
let S=newS();
function mergeDeep(d,s){if(!s||typeof s!='object')return d;for(const k in s){if(d&&typeof d[k]=='object'&&d[k]&&!Array.isArray(d[k])&&typeof s[k]=='object')mergeDeep(d[k],s[k]);else d[k]=s[k]}return d}

/* ---------- time ---------- */
const hourOf=()=>Math.floor(S.clock/60)%24;
function fmtTime(c){c=((c%1440)+1440)%1440;const h=Math.floor(c/60),m=Math.floor(c%60);return ((h%12)||12)+':'+String(m).padStart(2,'0')+(h<12?' AM':' PM')}
const isNight=()=>S.clock>=1140||S.clock<330;
function schedText(){const c=S.clock;
  for(const k of CLASSES){const st=S.cls[k.n],end=k.start+CLS_LEN;if(c<k.start&&c>=k.start-90&&!st)return k.name+' at '+fmtTime(k.start)+' · '+myRoom();if(c>=k.start&&c<end&&!st)return '⏰ '+k.name+' NOW · '+myRoom()}
  if(c>=690&&c<780)return '🍽 Lunch break';if(c>=870&&c<1080)return '🏀 Free time · activities';if(c>=1080&&c<1260)return '🌆 Evening · free time';if(c>=1260||c<360)return '🌙 Time to rest';if(c<480)return '🌅 Get ready for class';return '📚 Study / errands'}
function nextClass(){for(const k of CLASSES){if(!S.cls[k.n]&&S.clock<k.start+CLS_LATE)return k}return null}
/* ---------- notifications ---------- */
function notify(msg,type,sub,ms){const box=document.getElementById('nots');if(!box)return;const d=document.createElement('div');d.className='nt '+(type||'');d.innerHTML=msg+(sub?'<small>'+sub+'</small>':'');
  while(box.children.length>=3)box.firstChild.remove();box.appendChild(d);setTimeout(()=>{d.classList.add('out');setTimeout(()=>d.remove(),450)},ms||2800)}
const toast=(t,type)=>notify(t,type||'');
/* ---------- stats ---------- */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function useEnergy(n){S.energy=clamp(S.energy-n,0,100);checkTired()}
function addEnergy(n){S.energy=clamp(S.energy+n,0,100);if(S.energy>60)S.flags.tiredWarn=0}
function addHunger(n){S.hunger=clamp(S.hunger+n,0,100)}
function checkTired(){if(S.energy<=50&&!S.flags.tiredWarn){S.flags.tiredWarn=1;notify('😴 You are tired!','warn','Energy is '+Math.round(S.energy)+'%. Go back to your boarding house and sleep.',4200);sfx('err')}
  if(S.hunger<=20&&!S.flags.hungryWarn){S.flags.hungryWarn=1;notify('🍽 You are hungry!','warn','Buy food at the canteen.',3500)}if(S.hunger>35)S.flags.hungryWarn=0}
function giveXP(n){if(!n)return;S.xp+=n;let up=false;while(S.xp>=xpNeed(S.level)){S.xp-=xpNeed(S.level);S.level++;up=true;levelUnlocks(S.level)}
  if(up){notify('⭐ LEVEL '+S.level+'!','gold','New rewards may be unlocked — check Outfits.');sfx('levelup')}}
function levelUnlocks(l){for(const k in OUTFITS)if(OUTFITS[k].lv==l)notify('👕 Unlocked: '+OUTFITS[k].n,'good');for(const k in ACCS)if(ACCS[k].lv==l&&!ACCS[k].mis)notify('🕶 Unlocked: '+ACCS[k].n,'good');for(const k in ACTS)if(ACTS[k].lv==l)notify('🎮 New activity: '+ACTS[k].n,'good')}
function giveCoins(n){S.coins=Math.max(0,S.coins+n);if(n>0)sfx('coin')}
function reward(r,title){if(!r)return;const parts=[];if(r.xp){giveXP(r.xp);parts.push('+'+r.xp+' XP')}if(r.coins){giveCoins(r.coins);parts.push('+₱'+r.coins)}
  if(r.items)for(const k in r.items){addItem(k,r.items[k]);parts.push(ITEMS[k].i+' '+ITEMS[k].n)}if(r.acc){S.flags['acc_'+r.acc]=1;parts.push('🕶 '+ACCS[r.acc].n)}
  if(r.energy){addEnergy(r.energy);parts.push('+'+r.energy+' energy')}if(parts.length)notify('🎁 '+(title||'Reward'),'good',parts.join(' · '),3500)}
/* ---------- inventory ---------- */
const hasItem=(id,n)=>(S.inv[id]||0)>=(n||1);
function addItem(id,n){S.inv[id]=(S.inv[id]||0)+(n||1)}
function takeItem(id,n){if(!hasItem(id,n))return false;S.inv[id]-=(n||1);if(S.inv[id]<=0)delete S.inv[id];return true}
function useItem(id){const it=ITEMS[id];if(!it||!hasItem(id))return false;
  if(it.t=='food'){takeItem(id);addHunger(it.h);addEnergy(it.e||0);sfx(id=='soda'||id=='water'||id=='coffee'?'drink':'eat');notify(it.i+' '+it.n,'good','+'+it.h+' hunger'+(it.e?' · +'+it.e+' energy':''),2200);ev('eat',id);return true}
  if(id=='edrink'){takeItem(id);addEnergy(30);sfx('drink');notify('⚡ Energy drink','good','+30 energy');return true}
  if(id=='notebook'){takeItem(id);giveXP(12);sfx('page');notify('📓 You reviewed your notes','good','+12 XP');ev('study');return true}
  if(it.t=='book'||it.t=='quest'||id=='calc'||id=='pen'){notify(it.i+' '+it.n,'',it.d||'Keep this item.');return false}
  return false}
/* ---------- friendship ---------- */
const FR_LV=[['Stranger',0],['Acquaintance',1],['Friend',4],['Close Friend',9],['Best Friend',16]];
const frLevel=n=>{const p=S.fr[n]||0;let l=0;FR_LV.forEach((x,i)=>{if(p>=x[1])l=i});return l};
function addFr(n,p){if(!n)return;const before=frLevel(n);S.fr[n]=(S.fr[n]||0)+p;const af=frLevel(n);if(af>before){notify('💚 '+n+' is now your '+FR_LV[af][0]+'!','good');ev('friend',n,af)}}
function chatFr(n){const now=S.day*1440+S.clock;if(S.frCd[n]&&now-S.frCd[n]<180)return false;S.frCd[n]=now;addFr(n,1);S.stat.chats++;ev('chat',n);return true}
/* ---------- daily challenges ---------- */
const DAILY=[{id:'att',t:'Attend 2 classes',need:2,ev:'lessonDone',rw:{coins:40,xp:25}},{id:'eat',t:'Eat a meal',need:1,ev:'eat',rw:{coins:15,xp:10}},
 {id:'hoop',t:'Score 2 baskets',need:2,ev:'basket',rw:{coins:25,xp:20}},{id:'talk',t:'Chat with 3 students',need:3,ev:'chat',rw:{coins:20,xp:15}},
 {id:'run',t:'Run 150 m',need:150,ev:'run',rw:{coins:20,xp:15}},{id:'asg',t:'Submit an assignment',need:1,ev:'asgSubmit',rw:{coins:35,xp:25}},
 {id:'study',t:'Study (library, desk or notebook)',need:1,ev:'study',rw:{coins:25,xp:20}},{id:'drive',t:'Drive 250 m in your tricycle',need:250,ev:'drive',rw:{coins:25,xp:20}}];
function rollDaily(){if(S.daily.day==S.day)return;const pool=DAILY.slice();const l=[];for(let i=0;i<3;i++){const k=pool.splice(Math.floor(Math.random()*pool.length),1)[0];l.push({id:k.id,t:k.t,need:k.need,have:0,done:0,ev:k.ev,rw:k.rw})}S.daily={day:S.day,list:l}}
function dailyEv(type,n){S.daily.list.forEach(d=>{if(d.ev==type&&!d.done){d.have=Math.min(d.need,d.have+(n||1));if(d.have>=d.need){d.done=1;notify('✅ Daily challenge done!','good',d.t);reward(d.rw,'Daily challenge');sfx('ok')}}})}
/* ---------- grades ---------- */
function avg(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:0}
function attStats(){const p=S.att.filter(a=>a.s=='present').length,l=S.att.filter(a=>a.s=='late').length,ab=S.att.filter(a=>a.s=='absent').length,tot=p+l+ab;return {p,l,ab,tot,rate:tot?Math.round((p+l*.7)/tot*100):100}}
function overall(){const a=attStats(),as=avg(S.asg.map(x=>x.s)),ex=avg(S.exm.map(x=>x.s));let w=0,t=0;if(a.tot){t+=a.rate*.2;w+=.2}if(S.asg.length){t+=as*.35;w+=.35}if(S.exm.length){t+=ex*.45;w+=.45}return w?t/w:0}
function toGrade(pct){return pct>=96?1.0:pct>=92?1.25:pct>=88?1.5:pct>=84?1.75:pct>=80?2.0:pct>=76?2.25:pct>=72?2.5:pct>=68?2.75:pct>=60?3.0:5.0}
/* ---------- save / load ---------- */
function snapshot(){return {v:5,name:pname,gender,O,x:P.x,y:P.y,z:P.z,S}}
function saveGame(){if(!player||typeof P=='undefined')return;try{localStorage.setItem(SAVE,JSON.stringify(snapshot()))}catch(e){}}
function loadSave(){try{const s=JSON.parse(localStorage.getItem(SAVE));if(!s||!s.name)return null;return s}catch(e){return null}}
function applySave(s){S=newS();if(s&&s.S)mergeDeep(S,s.S);if(s&&s.v==undefined&&s){S.miss={};S.track='m1'}rollDaily()}
const SKEY='nemcoSettingsV1';
function saveSettings(){try{localStorage.setItem(SKEY,JSON.stringify({s1:$('s1').value,s2:$('s2').value,s3:$('s3').value,s6:$('s6').value,s4:$('s4').value,s5:$('s5').value,music:musicOn}))}catch(e){}}
function loadSettings(){try{const s=JSON.parse(localStorage.getItem(SKEY));if(!s)return;['s1','s2','s3','s6','s4','s5'].forEach(k=>{if(s[k]!=null&&$(k))$(k).value=s[k]});if(s.music===false)musicOn=false}catch(e){}
  sens=$('s4').value*.001}
