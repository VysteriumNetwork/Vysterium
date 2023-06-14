importScripts('/script/uv.bundle.js');
importScripts("/script/uv.sw.js");
importScripts("/script/uv.config.js");
self.addEventListener('fetch', event => {
  if (!sw) return; // If the service worker hasn't been initialized yet, don't handle the fetch event
  event.respondWith(sw.fetch(event));
});
