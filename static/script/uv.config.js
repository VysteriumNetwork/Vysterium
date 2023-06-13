self.__uv$config = {
  prefix: "/security/flaws/xor/learn/",
  bare: "/bare/",
  encodeUrl: Ultraviolet.codec.xor.encode,
  decodeUrl: Ultraviolet.codec.xor.decode,
  handler: "/script/uv.handler.js",
  client: "/script/uv.client.js",
  bundle: "/script/uv.bundle.js",
  config: "/script/uv.config.js",
  sw: "/script/uv.sw.js",
};

async function fetchAndSetBare() {
const response = await fetch('/server/');
const data = await response.json();
__uv$config.bare = data.bare;
}

fetchAndSetBare().then(() => {
console.log(__uv$config);
});