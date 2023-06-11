importScripts('/uv/uv.bundle.js');
importScripts("/uv/uv.sw.js");

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
      handler: "/uv/uv.handler.js",
      client: "/uv/uv.client.js",
      bundle: "/uv/uv.bundle.js",
      config: "/uv/uv.config.js",
      sw: "/uv/uv.sw.js",
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
