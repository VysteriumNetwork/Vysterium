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
  } catch (error) {
    console.error('Error:', error);
  }
}

init();
