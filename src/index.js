import createBareServer from "@tomphttp/bare-server-node";
import { fileURLToPath } from "node:url";
import { createServer as createHttpServer } from "node:http";
import fs from 'fs';
import compression from 'compression'
import session from 'express-session';
import { config } from './config.js';
import express from 'express';
import axios from 'axios';
const app = express();
import path from 'path';
app.use(compression())
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const blacklisted = [];
fs.readFile(path.join(__dirname, './blocklist.txt'), 'utf-8', (err, data) => { if (err) { console.error(err); return; } blacklisted.push(...data.split('\n')); });
app.use(session({ secret: 'randomsecretkeyreal', resave: false, saveUninitialized: true, cookie: { secure: false } }));
const PORT = 80
const server = createHttpServer();
import createRammerhead from 'rammerhead/src/server/index.js';
function randoms(e){for(var t="",n="abcdefghijklmnopqrstuvwxyz0123456789",r=0;r<e;r++)t+=n.charAt(Math.floor(Math.random()*n.length));return t}
let randomString;
if (config.dynamicbare === "true") {
  randomString = '/' + randoms(50) + '/' + randoms(50) + '/';
} else {
  randomString = '/bare/';
}
app.use(config.loginloc, (req, res, next) => {
  if (!req.session.loggedin && config.password == "true") {
    next(); 
  } else {
    res.redirect('/')
  }
});
app.get('/server', (req, res, next) => {
  if (!req.session.loggedin && config.password == "true") {
    next(); 
  } else {
    res.json({ bare: randomString });
  }
});
const bare = createBareServer(randomString);
app.use(async (req, res, next) => {
  if (req.path.startsWith(randomString)) {
      if (!req.session && config.password === "true") {
        res.redirect('/');
      } else {
        if (bare.shouldRoute(req)) {
          try {
            for (let i in blacklisted) {
              if (req.headers['x-bare-host']?.includes(blacklisted[i])) {
                return res.end('Denied, this may be an ad or is blacklisted.');
              }
            }
          } catch (e) {}
          bare.routeRequest(req, res);
        }
      }
  } else {
    if(config.password === "true") {
      const users = config.users;
      
      const authHeader = req.headers.authorization;
  
      if (authHeader) {
        const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf8');
        const [username, password] = auth.split(':');
        const userPassword = users[username];
          
        if (userPassword && userPassword === password) {
          req.session.loggedin = true;
          if (req.path === config.loginloc) {
            res.redirect('/');
            return;
          }
          next();
          return;
        }
      }
          
      if (req.session.loggedin) {
        next();
      } else {
        if (req.path === config.loginloc) {
          res.status(401);
          res.setHeader('WWW-Authenticate', 'Basic realm="Access Denied"');
          res.end(getUnauthorizedResponse(req));
        } else {
          const assetUrl = config.edusite + req.url;
          try {
            const response = await axios({
              method: req.method,
              url: assetUrl,
              responseType: "stream",
              validateStatus: (status) => status !== 404
            });
            res.writeHead(response.status, { "Content-Type": response.headers['content-type'].split(";")[0] });
            response.data.pipe(res);
          } catch (error) {
            next(error);
          }
        }
      }
    } else {
      next();
    }
  }
});
const rh = createRammerhead();
const rammerheadScopes = [
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
  const RHurl = new URL(req.url, 'https://0.0.0.0');
  return (
    rammerheadScopes.includes(RHurl.pathname) ||
    rammerheadSession.test(RHurl.pathname)
  );
}
function routeRhRequest(req, res) {
  rh.emit('request', req, res);
}
function routeRhUpgrade(req, socket, head) {
    try {
      rh.emit('upgrade', req, socket, head);
    }
    catch (error) {}
  }
const rammerheadSession = /^\/[a-z0-9]{32}/;
if (config.cloak === "true") {
  app.use((e,t,n)=>{const r=e.url;if(r.endsWith(".html")){t.statusCode=404;n()}else{if(r.endsWith("/")){t.statusCode=404;n()}else{n()}}});
}
app.use((req, res, next) => {
  if (shouldRouteRh(req)) {
    routeRhRequest(req, res);
  } else if (req.upgrade) {
    routeRhUpgrade(req, req.socket, req.head);
  } else {
    next();
  }
});
app.use(express.static(fileURLToPath(new URL("../static/", import.meta.url))));
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
app.use((req, res, next) => {
  const nebulaFilename = nebularoutes[req.url];
  const shuttleFilename = shuttleroutes[req.url];
  if (nebulaFilename) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/html");
    res.end(fs.readFileSync(`./src/html/nebula/${nebulaFilename}`));
  } else if (shuttleFilename) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/html");
    res.end(fs.readFileSync(`./src/html/shuttle/${shuttleFilename}`));
  } else if (req.url.startsWith('/shuttle/') || req.url.startsWith('/nebula/')) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/html");
    res.end(fs.readFileSync('src/html/404.html'));
  } else {
    next();
  }
});

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
    return `<!DOCTYPE html><script> window.location.replace("/")</script></html>`;
}
server.on("listening", () => {
  const addr = server.address();
  console.log(`Server running on port ${addr.port}`)
});
server.listen({ port: PORT });
