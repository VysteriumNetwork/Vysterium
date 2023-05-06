import createBareServer from "@tomphttp/bare-server-node";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";

import { fileURLToPath } from "node:url";
import { createServer as createHttpsServer } from "node:https";
import { createServer as createHttpServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import serveStatic from "serve-static";
import connect from "connect";
import createRammerhead from 'rammerhead/src/server/index.js';
import dotenv from 'dotenv';
import compression from 'compression';
import fs from 'fs';
const app = connect();
const bare = createBareServer("/bare/");
const ssl = existsSync("../ssl/key.pem") && existsSync("../ssl/cert.pem");
const PORT = process.env.PORT || (ssl ? 443 : 80);
const server = ssl ? createHttpsServer({
  key: readFileSync("../ssl/key.pem"),
  cert: readFileSync("../ssl/cert.pem")
}) : createHttpServer();

dotenv.config();

function shouldRouteRh(req) {
	const url = new URL(req.url, 'http://0.0.0.0');
	return (
		rammerheadScopes.includes(url.pathname) ||
		rammerheadSession.test(url.pathname)
	);
}

function routeRhUpgrade(req, res) {
	rh.emit('upgrade', req, res);
}

const rh = createRammerhead();

// used when forwarding the script
const rammerheadScopes = [
	'/rammerhead.js',
	'/hammerhead.js',
	'/transport-worker.js',
	'/task.js',
	'/iframe-task.js',
	'/worker-hammerhead.js',
	'/messaging',
	'/sessionexists',
	'/deletesession',
	'/newsession',
	'/editsession',
	'/needpassword',
	'/syncLocalStorage',
	'/api/shuffleDict',
];

const rammerheadSession = /^\/[a-z0-9]{32}/;


app.use(compression());
app.use((req, res, next) => {
  if (bare.shouldRoute(req)) {
    bare.routeRequest(req, res);
  } else if (shouldRouteRh(req)) {
    try {
      routeRhUpgrade(req, res.socket, res.head);
    } catch(error) {
      console.error(error);
    }
  } else {
    next();
  }
});

app.use(serveStatic(fileURLToPath(new URL("../static/", import.meta.url))));
app.use("/uv/", serveStatic(uvPath));

const shuttleroutes = {
  '/shuttle/': 'index.html',
  '/shuttle/games': 'games.html',
  '/shuttle/settings': 'settings.html',
  '/shuttle/apps': 'apps.html',
  '/shuttle/discord': 'discord.html',
  '/shuttle/chat': 'chat.html'
};

function handleRoutes(req, res, next) {
  const filename = shuttleroutes[req.url];

  if (filename) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(`./src/html/shuttle/${filename}`));
  } else {
    next();
  }
}
app.use(handleRoutes);
server.on("request", app);
server.on('upgrade', (req, socket, head) => {
  if (bare.shouldRoute(req)) {
      bare.routeUpgrade(req, socket, head);
  } 
  else if (shouldRouteRh(req)) {
      try {
          routeRhUpgrade(req, socket, head);
      }
      catch (error) {}
  }
  else {
      socket.end();
  }
});



server.on("listening", () => {
  const addr = server.address();
  console.log(`Server running on port ${addr.port}`)
});

server.listen({ port: PORT });
