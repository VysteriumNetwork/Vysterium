self.__uv$config = {
    prefix: "/service/",
    bare: "/bare/",
    encodeUrl: Ultraviolet.codec.xor.encode,
    decodeUrl: Ultraviolet.codec.xor.decode,
    handler: "/uv/uv.handler.js",
    client: "/uv/uv.client.js",
    bundle: "/uv/uv.bundle.js",
    config: "/uv/uv.config.js",
    sw: "/uv/uv.sw.js",
  };
  const scriptContentString = '/522675c8e566c8eeb53a06be383e5a78f4460bd5d3e6f5b56e9c6ba2413722e5/inject.js';
const scripts = document.getElementsByTagName('script');
for (let i = 0; i < scripts.length; i++) {
  if (scripts[i].innerHTML.includes(scriptContentString)) {
    scripts[i].parentNode.removeChild(scripts[i]);
  }
}
