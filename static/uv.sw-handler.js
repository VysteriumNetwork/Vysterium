importScripts('/script/uv.bundle.js');
importScripts("/script/uv.sw.js");
importScripts("/script/uv.config.js");

let bareReady = fetchAndSetBare();

self.addEventListener('fetch', event => {
  event.respondWith(
    bareReady.then(() => {
      if (!sw) return fetch(event.request); // If the service worker hasn't been initialized yet, fallback to normal fetch
      return sw.fetch(event); // Proceed with the sw fetch if initialization is complete
    })
  );
});