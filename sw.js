/* Iota service worker — caches the app shell so Iota opens offline.
   Bump CACHE on every deploy that changes shell files. */
const CACHE = 'iota-shell-v1.1.0';
const SHELL = [
  './', './index.html',
  './css/app.css', './css/jp.css',
  './js/supabase.js', './js/store.js', './js/tasks.js', './js/ui.js',
  './js/eden.js', './js/jp.js', './js/hubs.js', './js/settings.js', './js/app.js',
  './manifest.webmanifest', './assets/brand-512.png',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-512-maskable.png', './icons/apple-touch-icon.png', './icons/mark.svg',
  './assets/fonts/hanken-grotesk-latin-wght-normal.woff2', './assets/fonts/hanken-grotesk-latin-ext-wght-normal.woff2',
];
const FONTS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== 'iota-fonts').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Google Fonts: cache-first, so the typeface survives offline.
  if (FONTS.test(e.request.url)) {
    e.respondWith(caches.open('iota-fonts').then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(res => { if (res.ok || res.type === 'opaque') c.put(e.request, res.clone()); return res; }))));
    return;
  }
  if (url.origin !== location.origin) return;   // Supabase etc. go straight to network
  // Stale-while-revalidate for shell files: instant open, fresh next time
  e.respondWith(caches.match(e.request).then(cached => {
    const net = fetch(e.request).then(res => { if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone())); return res; }).catch(() => cached);
    return cached || net;
  }));
});
