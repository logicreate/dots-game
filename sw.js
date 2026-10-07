/* DOTS WAR service worker — offline play + instant updates.
   Strategy: network-first for the game page (so new versions arrive as soon
   as you are online), cache fallback when offline. Firebase/Google requests
   are never intercepted. */
var CACHE = 'dotswar-v14';
// Push notifications (friend invites): Firebase Cloud Messaging shows them while the game is closed.
// Wrapped in try: when offline the scripts cannot load, and the game must still work.
try {
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
                'https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
  firebase.initializeApp({ apiKey: 'AIzaSyCxGB68ogFcdRk5Aeav_6rZmCNmIHY8_K0', authDomain: 'dots-2d4e4.firebaseapp.com',
    projectId: 'dots-2d4e4', storageBucket: 'dots-2d4e4.firebasestorage.app', messagingSenderId: '911143426593',
    appId: '1:911143426593:web:a89862c9acb24aff8f6160' });
  firebase.messaging();
} catch (e) {}

var ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './favicon.png', './preview.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(ASSETS.map(function (a) { return c.add(a).catch(function () {}); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin || e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (r) {
        return r || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined);
      });
    })
  );
});
