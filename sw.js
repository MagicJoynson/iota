/* Iota service worker — caches the app shell so the Ring opens offline.
   Bump CACHE on every deploy that changes shell files. */
const CACHE = 'iota-shell-v0.4.1';
const SHELL = [
  './',
  './index.html',
  './css/app.css',
  './js/orb.js',
  './js/supabase.js',
  './js/store.js',
  './js/eden.js',
  './js/app.js',
  './manifest.webmanifest',
  './assets/brand-512.png',
  './assets/ring-tree.webp',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;   // Supabase etc. go straight to network
  // Stale-while-revalidate for shell files: instant open, fresh next time
  e.respondWith(caches.match(e.request).then(cached => {
    const net = fetch(e.request).then(res => { if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone())); return res; }).catch(() => cached);
    return cached || net;
  }));
});
