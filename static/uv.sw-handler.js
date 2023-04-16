importScripts('/uv/uv.bundle.js');
importScripts('/uv/uv.config.js');
importScripts(__uv$config.sw || '/uv/uv.sw.js');
importScripts("/osana/osana.worker.js");
const sw = new UVServiceWorker();
const Osana = new OsanaServiceWorker();

self.addEventListener("fetch", (event) => {
  if (event.request.url.startsWith(location.origin + "/service/")) {
  event.respondWith(sw.fetch(event))
  }
  if (event.request.url.startsWith(location.origin + "osana/")) {
    event.respondWith(Osana.fetch(event));
  }
});
