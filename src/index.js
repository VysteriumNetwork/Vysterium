import createBareServer from "@tomphttp/bare-server-node";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";

import { fileURLToPath } from "node:url";
import { createServer as createHttpsServer } from "node:https";
import { createServer as createHttpServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { hostname } from "node:os";

import serveStatic from "serve-static";
import serveIndex from "serve-index";
import connect from "connect";

const app = connect();
const bare = createBareServer("/bare/");
const ssl = existsSync("../ssl/key.pem") && existsSync("../ssl/cert.pem");
const PORT = process.env.PORT || ssl ? 443 : 8080;

const staticServe = serveStatic(fileURLToPath(new URL("../static/", import.meta.url)));
const uvServe = serveStatic(fileURLToPath(new URL(uvPath, import.meta.url)));
const serveIndexMiddleware = serveIndex(fileURLToPath(new URL("../static/", import.meta.url)));
const uvIndexMiddleware = serveIndex(uvPath);

const server = ssl ? createHttpsServer({
  key: readFileSync("../ssl/key.pem"),
  cert: readFileSync("../ssl/cert.pem")
}) : createHttpServer();

app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  var isLS = ip.startsWith('34.216.110') || ip.startsWith('54.244.51') || ip.startsWith('54.172.60') || ip.startsWith('34.203.250') || ip.startsWith('34.203.254');
  
  if (isLS) {
    // Serve files from the "BlacklistServe/" directory
    const fakeServe = serveStatic('BlacklistServe/');
    fakeServe(req, res, next);
  } else if (bare.shouldRoute(req)) {
    bare.routeRequest(req, res);
  } else {
    // Serve files from the "static/" directory
    staticServe(req, res, () => {
      // Serve directory listing if no file is found
      serveIndexMiddleware(req, res, next);
    });
  }
});

app.use("/uv", serveStatic(uvPath));

app.use((req, res) => {
  res.writeHead(500, null, {
    "Content-Type": "text/plain",
  });
  res.end("Error");
});

server.on("request", app);
server.on("upgrade", (req, socket, head) => {
  if (bare.shouldRoute(req, socket, head)) {
    bare.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

server.on("listening", () => {
  const addr = server.address();
  console.log(`Server running on port ${addr.port}`)
});

server.listen({ port: PORT });
