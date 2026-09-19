/* 希望峰学园 Service Worker — 缓存优先, 版本更新换 CACHE 名 */
var CACHE = 'kibogamine-v45-room-panels';
var ASSETS = [
  './', './index.html', './styles.css', './three.min.js', './pet3d.js', './data.js', './dict.js', './app.js', './arcade-world.js', './arcade.js', './arcade.css',
  './app-tools.js', './journal.js', './book-reader.js', './manifest.json', './icon-192.png', './icon-512.png',
  './home3d.js', './home3d.css', './assets/home/GLTFLoader.js', './assets/home/BufferGeometryUtils.js', './assets/home/three-bridge.js'
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
  self.skipWaiting();
});
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    })
  );
  self.clients.claim();
});
self.addEventListener('message', function (e) { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', function (e) {
  if(new URL(e.request.url).pathname.endsWith('/assets/home/hope-room.glb')){
    e.respondWith(caches.open(CACHE).then(function(c){return c.match(e.request).then(function(hit){return hit||fetch(e.request).then(function(r){return r.ok?c.put(e.request,r.clone()).then(function(){return r;},function(){return r;}):r;});});}));return;
  }
  e.respondWith(
    caches.match(e.request).then(function (hit) { return hit || fetch(e.request); })
  );
});
