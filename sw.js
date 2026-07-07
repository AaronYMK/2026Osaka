/* 2026 大阪聖誕 APP — Service Worker（真離線快取） */
const CACHE = 'osaka-xmas-v1';
const CORE = ['./', './index.html', './manifest.json', './icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // 快取同源與 CDN 字型/圖示，供之後離線使用
        try {
          const copy = res.clone();
          caches.open(CACHE).then((c) => { c.put(req, copy).catch(() => {}); });
        } catch (_) {}
        return res;
      }).catch(() => cached);
    })
  );
});
