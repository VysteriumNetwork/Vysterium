self.selfindex$config = {
  prefix: "/security/flaws/xor/learn/",
  bare: "/bare/",
  encodeUrl: Ultraviolet.codec.xor.encode,
  decodeUrl: Ultraviolet.codec.xor.decode,
  handler: "/script/handler.js",
  client: "/script/client.js",
  bundle: "/script/bundle.js",
  config: "/script/config.js",
  sw: "/script/sw.js",
};
