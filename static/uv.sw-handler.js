importScripts('/script/uv.bundle.js');
importScripts("/script/uv.sw.js");
<<<<<<< HEAD
importScripts("/script/uv.config.js");
=======

>>>>>>> parent of 8a360e9 (fixed constant 404s)
let sw;

async function init() {
  try {
    const response = await fetch('/server/');
    const data = await response.json();
    self.__uv$config = {
      prefix: "/security/flaws/xor/learn/",
      bare: data.bare,
      encodeUrl: Ultraviolet.codec.xor.encode,
      decodeUrl: Ultraviolet.codec.xor.decode,
      handler: "/script/uv.handler.js",
      client: "/script/uv.client.js",
      bundle: "/script/uv.bundle.js",
      config: "/script/uv.config.js",
      sw: "/script/uv.sw.js",
    };
    sw = new UVServiceWorker(); // Initialize the service worker after receiving the response
  } catch (error) {
    console.error('Error:', error);
  }
}

init();

self.addEventListener('fetch', event => {
  if (!sw) return; // If the service worker hasn't been initialized yet, don't handle the fetch event
  event.respondWith(sw.fetch(event));
});