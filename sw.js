/* 2026 神戸聖誕 APP — Service Worker（真離線快取 + 內容可更新） */
const CACHE = 'kobe-xmas-v2';
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
  const isDoc = req.mode === 'navigate' || req.destination === 'document';
  if (isDoc) {
    // HTML 網路優先：線上一定拿到最新行程；離線時回退快取
    e.respondWith(
      fetch(req).then((res) => {
        try {
          const copy = res.clone();
          caches.open(CACHE).then((c) => { c.put('./index.html', copy).catch(() => {}); });
        } catch (_) {}
        return res;
      }).catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
    );
    return;
  }
  // 其餘資產（字型/圖示/圖片）：快取優先，供離線使用
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        try {
          const copy = res.clone();
          caches.open(CACHE).then((c) => { c.put(req, copy).catch(() => {}); });
        } catch (_) {}
        return res;
      }).catch(() => cached);
    })
  );
});
