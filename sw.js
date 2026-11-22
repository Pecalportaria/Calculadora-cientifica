/* Cache rápido: abre na hora a partir do celular, inclusive sem internet. */
const V = 'calc-cache-v3';
const BASE = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

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
  e.respondWith((async () => {
    const c = await caches.open(V);
    const hit = await c.match(r, { ignoreSearch: true });
    const net = fetch(r).then(res => { if (res && res.ok) c.put(r, res.clone()); return res; });
    e.waitUntil(net.catch(() => {}));
    if (hit) return hit;                       // abre na hora do cache
    try {                                       // sem cache: rede, mas sem esperar para sempre
      return await Promise.race([net, new Promise((_, j) => setTimeout(j, 3000))]);
    } catch (err) {
      if (r.mode === 'navigate') {              // plano B: qualquer página já guardada
        for (const k of await c.keys()) {
          const p = new URL(k.url).pathname;
          if (p.endsWith('.html') || p.endsWith('/')) return c.match(k);
        }
      }
      return Response.error();
    }
  })());
});
