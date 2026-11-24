const CACHE = "pim-v106";
const FILES = ["./", "index.html", "questions.js", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "img/kin.webp", "img/dyn1.webp"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first: οι αλλαγές φτάνουν αμέσως όταν υπάρχει σύνδεση, αλλιώς δουλεύει από την cache (offline).
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r)
      .then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
        return res;
      })
      .catch(() => caches.match(r).then(m => m || caches.match("index.html")))
  );
});

// Ειδοποιήσεις push
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data.json(); } catch (_) { d = { title: "Physics in Motion", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Physics in Motion", {
    body: d.body || "", icon: "icon-192.png", badge: "icon-192.png", tag: d.tag || "pim",
    data: { url: d.url || "./" }
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./";
  const go = (url.split("#")[1] || "");
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => {
    for (const c of cs) {
      if (c.url.startsWith(self.registration.scope)) { return c.focus().then(() => { try { c.postMessage({ go }); } catch (_) {} }); }
    }
    return self.clients.openWindow(url);
  }));
});
