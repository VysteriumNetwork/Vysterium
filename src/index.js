import createBareServer from "@tomphttp/bare-server-node";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { fileURLToPath } from "node:url";
import { createServer as createHttpServer } from "node:http";
import serveStatic from "serve-static";
import fs from 'fs';
import session from 'express-session';
import { config } from './config.js';
import express from 'express';

const app = express();
import path, { join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const blacklisted = [];

fs.readFile(path.join(__dirname, './blocklist.txt'), 'utf-8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    blacklisted.push(...data.split('\n'));
});

app.use(session({
  secret: 'randomsecretkeyreal',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
const PORT = 80
const server = createHttpServer();
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
let randomString;

if (config.dynamicbare === "true") {
  randomString = '/' + generateRandomString(50) + '/' + generateRandomString(50) + '/';
} else {
  randomString = '/bare/';
}
app.get('/server', (req, res, next) => {
  if (!req.session || !req.session.loggedin || !config.password == "true") {
    next(); 
  } else {
    res.json({ bare: randomString });
  }
});


const bare = createBareServer(randomString);


app.use((req, res, next) => {
  if (req.path.startsWith(randomString)) {
    try {
      if (!req.session && config.password  === "true") {
        res.end('404  Not Found');
      }
      if (bare.shouldRoute(req)) {
        try {
          for (let i in blacklisted) {
          if (blacklisted[i].includes(req.headers['x-bare-host'])) {
              return res.end('Denied');
   }}
        } catch (error) {
        }
        bare.routeRequest(req, res);
      }
    } catch (error) {
    }
  } else {
    if(config.password === "true") {   // add this condition
      const users = { 
        'tennis': 'player',
        'thechin': 'brothers',
        'ihate': 'gays'
      };
      
      const authHeader = req.headers.authorization;
  
      if (authHeader) {
        const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf8');
        const [username, password] = auth.split(':');
        const userPassword = users[username];
          
        if (userPassword && userPassword === password) {
          req.session.loggedin = true;
          next();
          return;
        }
      }
          
      if (req.session.loggedin) {
        next();
      } else {
        if (req.path === '/login') {
          res.status(401);
          res.setHeader('WWW-Authenticate', 'Basic realm="Access Denied"');
          res.end(getUnauthorizedResponse(req));
        } else if (req.path === '/') {
          res.setHeader('Content-Type', 'text/html');
          res.status(200);
          res.send(getUnauthorizedResponse(req));
        } else {
          res.status(404).send('404 Not Found');
        }
      }
    } else {  // if config.password is not "true"
      next(); // proceed to the next middleware
    }
  }
});




app.use('/script', (req, res, next) => {
  if (config.password === "true") {
  if (!req.session || !req.session.loggedin) {
    next();
  } else {
  if (req.url.endsWith('uv.config.js')) {
    return next();
  }
}
  serveStatic(uvPath)(req, res, next);
} else {
  if (req.url.endsWith('uv.config.js')) {
    return next();
  }
  serveStatic(uvPath)(req, res, next);
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
//@ts-ignore
function routeRhUpgrade(req, socket, head) {
    try {
      rh.emit('upgrade', req, socket, head);
    }
    catch (error) {}
  }
const rammerheadSession = /^\/[a-z0-9]{32}/;
if (config.cloak === "true") {
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
}
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
    return fs.readFileSync('./src/html/education/index.html', 'utf-8');
}


server.on("listening", () => {
  const addr = server.address();

  console.log(`Server running on port ${addr.port}`)
  console.log("");
  console.log("You can now view it in your browser.")
});
server.listen({ port: PORT });
