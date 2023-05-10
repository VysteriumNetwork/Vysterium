const scriptContentString = '/522675c8e566c8eeb53a06be383e5a78f4460bd5d3e6f5b56e9c6ba2413722e5/inject.js';

function injectScriptTag(req, res, next) {
  const oldWrite = res.write;
  const oldEnd = res.end;

  const chunks = [];

  res.write = function (chunk) {
    chunks.push(chunk);
    return oldWrite.apply(res, arguments);
  };

  res.end = function (chunk) {
    if (chunk) {
      chunks.push(chunk);
    }

    const body = Buffer.concat(chunks).toString('utf8');
    const scriptTag = `<script src="/static/inject.js"></script>`;

    res.setHeader('content-length', Buffer.byteLength(body) + Buffer.byteLength(scriptTag));

    const newBody = body.replace(scriptContentString, '') + scriptTag;

    oldEnd.call(res, newBody);
  };

  next();
}

module.exports = injectScriptTag;
