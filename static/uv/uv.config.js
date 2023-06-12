self.__uv$config = {
  prefix: "/security/flaws/xor/learn/",
  bare: "/bare/",
  encodeUrl: Ultraviolet.codec.xor.encode,
  decodeUrl: Ultraviolet.codec.xor.decode,
  handler: "/uv/uv.handler.js",
  client: "/uv/uv.client.js",
  bundle: "/uv/uv.bundle.js",
  config: "/uv/uv.config.js",
  sw: "/uv/uv.sw.js",
};

async function fetchAndSetBare() {
const response = await fetch('/server/');
const data = await response.json();
__uv$config.bare = data.bare;
}

fetchAndSetBare().then(() => {
console.log(__uv$config);
});