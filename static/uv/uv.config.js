
async function init() {
  try {
    const module = await import('./dynamic.js');
    const bare = await module.DynamicBare();
    self.__uv$config = {
      prefix: "/security/flaws/xor/learn/",
      bare: bare,
      encodeUrl: Ultraviolet.codec.xor.encode,
      decodeUrl: Ultraviolet.codec.xor.decode,
      handler: "/uv/uv.handler.js",
      client: "/uv/uv.client.js",
      bundle: "/uv/uv.bundle.js",
      config: "/uv/uv.config.js",
      sw: "/uv/uv.sw.js",
    };
  } catch (error) {
    console.error('Error:', error);
  }
}

init();
