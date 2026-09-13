// Meya Arena — service worker (offline support + installability for PWA/APK).
const CACHE = 'meya-arena-v1';
const LOCAL = [
  './', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png',
  './src/main.js',
  './src/core/Engine.js', './src/core/InputManager.js', './src/core/constants.js',
  './src/game/Game.js', './src/game/heroes.js',
  './src/ui/HUD.js', './src/ui/Lobby.js',
  './src/audio/SFX.js', './src/audio/Music.js',
  './src/social/Social.js',
];
const CDN = ['https://unpkg.com/three@0.160.0/build/three.module.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([...LOCAL, ...CDN])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
