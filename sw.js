// Vinyl Crate service worker: app shell offline, cover images and fonts cached.
const SHELL = 'vc-shell-v3', IMG = 'vc-img-v1', FONT = 'vc-font-v1';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => ![SHELL, IMG, FONT].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.hostname === 'api.discogs.com') return;                 // live data, cached by the app itself
  if (u.hostname === 'i.discogs.com') { e.respondWith(cacheFirst(IMG, e.request)); return; }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) { e.respondWith(cacheFirst(FONT, e.request)); return; }
  if (u.origin === location.origin) {                           // network first, so updates arrive
    e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(SHELL).then(c => c.put(e.request, cp)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
  }
});
async function cacheFirst(name, req) {
  const c = await caches.open(name), hit = await c.match(req);
  if (hit) return hit;
  const r = await fetch(req);
  if (r.ok || r.type === 'opaque') c.put(req, r.clone());
  return r;
}
