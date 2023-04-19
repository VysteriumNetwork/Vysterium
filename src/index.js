import createBareServer from "@tomphttp/bare-server-node";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";

import { fileURLToPath } from "node:url";
import { createServer as createHttpsServer } from "node:https";
import { createServer as createHttpServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { hostname } from "node:os";

import staticHandler from "node-static";
import serveIndex from "serve-index";
import connect from "connect";
const app = connect();
const bare = createBareServer("/bare/");
const ssl = existsSync("../ssl/key.pem") && existsSync("../ssl/cert.pem");
const PORT = process.env.PORT || ssl ? 80 : 8080;
const server = ssl ? createHttpsServer({
  key: readFileSync("../ssl/key.pem"),
  cert: readFileSync("../ssl/cert.pem")
}) : createHttpServer();

app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const isLS = ip.startsWith('34.216.110') || ip.startsWith('54.244.51') || ip.startsWith('54.172.60') || ip.startsWith('34.203.250') || ip.startsWith('34.203.254');
  if (isLS) {
    const fileServer = new staticHandler.Server(fileURLToPath(new URL("../BlacklistServe/", import.meta.url)));
    fileServer.serve(req, res, next);
  } else if (bare.shouldRoute(req)) {
    bare.routeRequest(req, res);
  } else {
    next();
  }
});

const staticServer = new staticHandler.Server(fileURLToPath(new URL("../static/", import.meta.url)));
app.use((req, res, next) => {
  staticServer.serve(req, res, () => {
    next();
  });
});

const uvServer = new staticHandler.Server(uvPath);
app.use("/uv/", (req, res, next) => {
  uvServer.serve(req, res, () => {
    next();
  });
});

app.use((req, res) => {
  res.writeHead(500, null, {
    "Content-Type": "text/plain",
  });
  res.end("Error");
});

server.on("request", app);
server.on("upgrade", (req, socket, head) => {
  if(bare.shouldRoute(req, socket, head)) bare.routeUpgrade(req, socket, head); else socket.end();
});

server.on("listening", () => {
  const addr = server.address();

  console.log(`Server running on port ${addr.port}`)
  console.log("");
  console.log("You can now view it in your browser.")
  /* Code for listing IPS from website-aio */
  console.log(`Local: http${ssl ? "s" : ""}://${addr.family === "IPv6" ? `[${addr.address}]` : addr.address}${(addr.port === 80 || ssl && addr.port === 80)? "" : ":" + addr.port}`);
  console.log(`Local: http${ssl ? "s" : ""}://localhost${(addr.port === 80 || ssl && addr.port === 80)? "" : ":" + addr.port}`);
  try { console.log(`On Your Network: http${ssl ? "s" : ""}://${hostname()}${(addr.port === 80 || ssl && addr.port === 80)? "" : ":" + addr.port}`); } catch (err) {/* Can't find LAN interface */};
  if(process.env.REPL_SLUG && process.env.REPL_OWNER) console.log(`Replit: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
});

server.listen({ port: PORT })
