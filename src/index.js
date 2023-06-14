import createBareServer from "@tomphttp/bare-server-node";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { fileURLToPath } from "node:url";
import { createServer as createHttpServer } from "node:http";
import serveStatic from "serve-static";
import express from "express";
import fs from 'fs';
const app = express();
const PORT = 80
const server = createHttpServer();
import basicAuth from 'express-basic-auth';
import createRammerhead from 'rammerhead/src/server/index.js';
function generateRandomString(length) {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
}
const randomString = '/' + generateRandomString(50) + '/' + generateRandomString(50) + '/'
app.get('/server/', (req, res) => { 
  res.json({ bare: randomString });
});
// const bare = createBareServer('/security/api/protection/');
const bare = createBareServer(randomString);
app.use((req, res, next) => {
  if (req.path.startsWith(randomString)) {
      bare.routeRequest(req, res);
  } else {
<<<<<<< HEAD
      const users = { 'admin': 'supersecret', 'benton': 'mena', 'anton': 'mena', 'sui': 'run', 'yezu':' il' };
=======
      const users = { 'admin': 'supersecret', 'benton': 'mena', 'anton': 'mena', 'sui': 'run' };
>>>>>>> parent of 8a360e9 (fixed constant 404s)

      // middleware for handling authentication
      const authMiddleware = basicAuth({
        users,
        challenge: req.path === '/login', // challenge only for routes other than '/'
        unauthorizedResponse: getUnauthorizedResponse,
      });

      authMiddleware(req, res, (err) => {
        if (err || !req.auth) {
          if (req.path !== '/login' ) {
            res.setHeader('Content-Type', 'text/html');
            res.status(200);
            res.send(getUnauthorizedResponse(req));
          } else {
            next(err);
          }
        } else {
          // The user is authenticated, proceed to next middleware or route handler
          next();
        }
      });
  }
});




app.use('/script', (req, res, next) => {
  if (req.url.endsWith('uv.config.js')) {
    // If the requested URL ends with uv.config.js, serve it as a static file
    return next();
  }
  // Otherwise, serve the contents of the uvPath directory
  serveStatic(uvPath)(req, res, next);
});
const rh = createRammerhead();
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
function shouldRouteRh(req) {
  const RHurl = new URL(req.url, 'http://0.0.0.0');
  return (
    rammerheadScopes.includes(RHurl.pathname) ||
    rammerheadSession.test(RHurl.pathname)
  );
}
function routeRhRequest(req, res) {
  rh.emit('request', req, res);
}
//@ts-ignore
function routeRhUpgrade(req, socket, head) {
    try {
      rh.emit('upgrade', req, socket, head);
    }
    catch (error) {}
  }
const rammerheadSession = /^\/[a-z0-9]{32}/;
app.use((req, res, next) => {
  const url = req.url;
  if (url.endsWith('.html')) {
    res.statusCode = 404;
    next();
  } else {
    if (url.endsWith('/')) {
      res.statusCode = 404;
      next();
    } else {
    next();
  }
}});
app.use((req, res, next) => {
  if (shouldRouteRh(req)) {
    routeRhRequest(req, res);
  } else {
    next();
  }
});

app.use((req, res, next) => {
  if (req.upgrade) {
    routeRhUpgrade(req, req.socket, req.head);
  } else {
    next();
  }
});
app.use(serveStatic(fileURLToPath(new URL("../static/", import.meta.url))));
const shuttleroutes = {
  '/shuttle/': 'index.html',
  '/shuttle/games': 'games.html',
  '/shuttle/settings': 'settings.html',
  '/shuttle/apps': 'apps.html',
  '/shuttle/discord': 'discord.html',
  '/shuttle/chat': 'chat.html'
};
const nebularoutes = {
  '/nebula/': 'index.html',
  '/nebula/options': 'options.html',
  '/nebula/privacy': 'privacy.html',
  '/nebula/unv': 'unv.html',
};

function handleRoutes(req, res, next) {
  const nfilename = nebularoutes[req.url];
  if (nfilename) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/html");
    res.end(fs.readFileSync(`./src/html/nebula/${nfilename}`));
  } else {
    const filename = shuttleroutes[req.url];
    if (filename) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/html");
      res.end(fs.readFileSync(`./src/html/shuttle/${filename}`));
    } else if (req.url.startsWith('/shuttle/') || req.url.startsWith('/nebula/')) {
      res.statusCode = 404;
      res.end(fs.readFileSync('src/html/404.html'));
      next();
    } else {
      // If the requested URL does not match any of the routes, pass the request to the next middleware function
      next();
    }
  }
}


app.use(handleRoutes)

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

app.use((req, res) => {
  res.statusCode = 404;
  res.setHeader("Content-Type", "text/html");
  res.end(fs.readFileSync('src/html/404.html'));
});
function getUnauthorizedResponse(req) {
    return fs.readFileSync('./src/lost.html', 'utf-8');
}


server.on("listening", () => {
  const addr = server.address();

  console.log(`Server running on port ${addr.port}`)
  console.log("");
  console.log("You can now view it in your browser.")
});
server.listen({ port: PORT })
