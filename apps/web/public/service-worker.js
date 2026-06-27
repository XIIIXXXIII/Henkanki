const CACHE='henkanki-v0';
self.addEventListener('install',(event)=>event.waitUntil(caches.open(CACHE).then((c)=>c.addAll(['/','/src/styles.css','/src/main.mjs']))));
self.addEventListener('fetch',(event)=>event.respondWith(caches.match(event.request).then((r)=>r||fetch(event.request))));
