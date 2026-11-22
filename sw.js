/* Cache rápido: abre na hora a partir do celular e atualiza em segundo plano. */
const V = 'calc-cache-v2';
const BASE = ['./', 'manifest.json', 'icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V)
      .then(c => Promise.allSettled(BASE.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(V).then(async c => {
      const hit = await c.match(r, { ignoreSearch: true });
      const net = fetch(r)
        .then(res => { if (res && res.ok) c.put(r, res.clone()); return res; })
        .catch(() => hit);
      e.waitUntil(net.catch(() => {}));
      return hit || net;
    })
  );
});
