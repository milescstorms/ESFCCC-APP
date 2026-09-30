// Offline support for baby-first-foods-tracker.html only (registered with that page as its scope).
// The tracker's data lives in the browser's own storage; this only keeps the page itself available offline.
var CACHE = "first-foods-v1";
var PAGE = "./baby-first-foods-tracker.html";

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll([PAGE, "./first-foods.webmanifest", "./assets/apple-touch-icon.png", "./assets/icon-192.png", "./assets/favicon.png"]);
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("first-foods-") === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  // The page: try the network first so updates show up, fall back to the saved copy offline.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(PAGE, copy); });
      return res;
    }).catch(function () { return caches.match(PAGE); }));
    return;
  }
  // Fonts and icons: use the saved copy, refresh it in the background.
  var isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  var isOwnAsset = url.origin === self.location.origin && /\/assets\//.test(url.pathname);
  if (isFont || isOwnAsset) {
    e.respondWith(caches.open(CACHE).then(function (c) {
      return c.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) { if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res; }).catch(function () { return hit; });
        return hit || net;
      });
    }));
  }
});
