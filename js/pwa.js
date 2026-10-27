/* PWA: service worker registration, update toast, install button, standalone detection */
let deferredInstall=null,swReg=null;
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true;
const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
function installHelp(){
  if(isStandalone())return 'The app is already installed and running.';
  if(isIOS)return 'On iPhone/iPad: tap the Share button, then "Add to Home Screen".';
  if(/android/i.test(navigator.userAgent))return 'Open the browser menu (⋮) and tap "Install app" or "Add to Home screen".';
  return 'In Chrome/Edge: click the install icon in the address bar, or open the menu and choose "Install NEMCO Simulator". Your browser may not support installing.'}
function setInstStat(t){const e=$('inststat');if(e)e.textContent=t||''}
function refreshInstallUi(){const hide=isStandalone();document.querySelectorAll('.instbtn').forEach(b=>{b.style.display=hide?'none':'';b.textContent=deferredInstall?'📲 INSTALL APP':'📲 INSTALL APP'});if(hide)setInstStat('Installed ✔')}
async function doInstall(){
  if(isStandalone()){notify('Already installed','good');return}
  if(deferredInstall){deferredInstall.prompt();let r;try{r=await deferredInstall.userChoice}catch(e){r={outcome:'dismissed'}}
    if(r.outcome==='accepted'){setInstStat('Installing... ✔');notify('📲 App installed','good','Find NEMCO Simulator on your home screen.')}else{setInstStat('Install cancelled. You can try again anytime.');notify('Install cancelled','')}
    deferredInstall=null;return}
  const t=installHelp();setInstStat(t);try{alert(t)}catch(e){notify('How to install','',t,7000)}}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;setInstStat('Ready to install.');refreshInstallUi()});
addEventListener('appinstalled',()=>{deferredInstall=null;setInstStat('Installed ✔');refreshInstallUi()});
document.querySelectorAll('.instbtn').forEach(b=>b.addEventListener('click',doInstall));
matchMedia('(display-mode: standalone)').addEventListener&&matchMedia('(display-mode: standalone)').addEventListener('change',refreshInstallUi);
refreshInstallUi();
/* service worker (relative scope so it works on https://user.github.io/repo/) */
function updateToast(reg){const t=$('toastu');if(!t||!reg.waiting)return;t.innerHTML='🔄 A new version is ready. <button id="updbtn">Update</button>';t.classList.remove('hid');
  $('updbtn').onclick=()=>{try{saveGame()}catch(e){}reg.waiting.postMessage('SKIP_WAITING')}}
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
  let reloading=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading||!window.__hadSW)return;reloading=true;location.reload()});
  window.__hadSW=!!navigator.serviceWorker.controller;
  addEventListener('load',()=>{navigator.serviceWorker.register('./service-worker.js',{scope:'./'}).then(reg=>{swReg=reg;
    if(reg.waiting&&navigator.serviceWorker.controller)updateToast(reg);
    reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)updateToast(reg)})});
    setInterval(()=>reg.update().catch(()=>{}),30*60*1000);
    navigator.serviceWorker.ready.then(r=>{r.active&&r.active.postMessage('GET_VERSION')});
  }).catch(e=>console.warn('SW registration failed',e))});
  navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.type==='VERSION'){const v=$('verl');if(v)v.textContent='Version '+e.data.version+' · offline ready ✔'}})}
else{const v=$('verl');if(v)v.textContent='Offline mode needs HTTPS (GitHub Pages).'}
if(isStandalone())document.body.classList.add('standalone');
