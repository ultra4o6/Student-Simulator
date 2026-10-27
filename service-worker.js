/* NEMCO College Student Simulator - service worker.
   Bump VERSION on every deployment so players get the new files. */
const VERSION = 'v5.0.0';
const CACHE = 'nemco-sim-' + VERSION;
const CORE = [
  './', './index.html', './offline.html', './manifest.webmanifest',
  './css/style.css',
  './js/three.min.js', './js/gfx.js', './js/base.js', './js/audio.js', './js/state.js', './js/world.js', './js/interior.js',
  './js/npc.js', './js/missions.js', './js/vehicle.js', './js/ui.js', './js/game.js', './js/pwa.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-192.png', './icons/maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon.png', './icons/logo.jpg'
];
const okRes = r => r && r.ok && r.status === 200 && (r.type === 'basic' || r.type === 'default');

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // cache one by one so a single failure is reported but never stores an error page
    const failed = [];
    await Promise.all(CORE.map(async u => {
      try { const r = await fetch(new Request(u, { cache: 'reload' })); if (okRes(r)) await c.put(u, r); else failed.push(u); }
      catch (_) { failed.push(u); }
    }));
    if (failed.length) throw new Error('Precache failed: ' + failed.join(', ')); // install aborts, old SW stays active
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('nemco-sim-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
  if (e.data === 'GET_VERSION' && e.source) e.source.postMessage({ type: 'VERSION', version: VERSION });
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // never cache external resources
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const r = await fetch(req);
        if (okRes(r)) { const c = await caches.open(CACHE); c.put('./index.html', r.clone()); }
        return r;
      } catch (_) {
        return (await caches.match('./index.html', { ignoreSearch: true })) || (await caches.match('./offline.html')) ||
          new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }
    })());
    return;
  }
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit; // cache-first: files are versioned by VERSION
    try {
      const r = await fetch(req);
      if (okRes(r)) { const c = await caches.open(CACHE); c.put(req, r.clone()); }
      return r;
    } catch (_) {
      return new Response('Offline: ' + url.pathname + ' is not downloaded yet.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    }
  })());
});
