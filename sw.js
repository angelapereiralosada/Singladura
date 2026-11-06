// Singladura · funciona sin conexión: guarda la app, tus datos y los trozos de mapa que ya has visto
const V = "singladura-v6", TILES = "singladura-tiles";
const SHELL = ["./", "index.html", "manifest.webmanifest", "gz.json", "vendor/maplibre-gl.js", "vendor/maplibre-gl.css", "vendor/d3.min.js", "vendor/world.js", "icons/icon-192.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== TILES).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
let puts = 0;
async function trim(c){ if (++puts % 60) return; const ks = await c.keys(); for (const k of ks.slice(0, Math.max(0, ks.length - 3000))) await c.delete(k); }
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.hostname === "tiles.openfreemap.org") {
    e.respondWith(caches.open(TILES).then(async c => {
      const hit = await c.match(r);
      const net = fetch(r).then(res => { if (res.ok) { c.put(r, res.clone()); trim(c); } return res; }).catch(() => hit || Response.error());
      return hit || net;
    }));
    return;
  }
  if (u.origin !== location.origin) return;
  const fresh = r.mode === "navigate" || u.pathname.endsWith("/data/items.json") || u.pathname.endsWith("/data/config.json") || u.pathname.endsWith("/index.html");
  const key = new Request(u.origin + u.pathname);
  if (fresh) {
    e.respondWith(fetch(r).then(res => { if (res.ok) caches.open(V).then(c => c.put(key, res.clone())); return res; }).catch(async () => (await caches.match(key)) || (await caches.match(new Request(u.origin + u.pathname.replace(/[^/]*$/, "index.html")))) || Response.error()));
    return;
  }
  e.respondWith(caches.match(key).then(hit => {
    const net = fetch(r).then(res => { if (res.ok) caches.open(V).then(c => c.put(key, res.clone())); return res; }).catch(() => hit || Response.error());
    return hit || net;
  }));
});
