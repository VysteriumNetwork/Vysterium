import createBareServer from "@tomphttp/bare-server-node";
import { fileURLToPath } from "node:url";
import { createServer as createHttpServer } from "node:http";
import fs from 'fs';
import { createProxyMiddleware } from 'http-proxy-middleware'
import compression from 'compression'
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import { config } from './config.js';
import express from 'express';
const app = express();
import path from 'path';
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
const middle =  createProxyMiddleware({ target: config.edusite, changeOrigin: true, secure: true, ws: false });
app.get('/server', (req, res, next) => {
  if (!req.session.loggedin && config.password == "true") {
    next(); 
  } else {
    res.json({ bare: randomString });
  }
});
fs.watch('./src/logins.json', (eventType, filename) => {
  if (eventType === 'change') {
    console.log(`new user added`);
    config.users = JSON.parse(fs.readFileSync('./src/logins.json', 'utf-8'));
  }
});
const bare = createBareServer(randomString);
app.get('/logout', (req, res, next) => {
  if (req.session.loggedin) {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    // Send a 401 status to indicate that the user is now logged out.
    res.status(401).end();
  });
} else {
  next();
}
});
if (config.signup == true) {
  const signupLimiter = rateLimit({
    windowMs: 300 * 1000, // 1 hour
    max: 99, // limit each IP to 1 request per windowMs
    message: "Too many signups from this IP, please try again after five minutes"
  });
  
  app.get(config.signuppath, async (req, res) => {
    res.sendFile(__dirname + '/signup.html');
  })
  app.post(config.signuppath, signupLimiter, async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let loginTime = req.body.loginTime;
  
    // Password requirements: at least 8 characters and includes a symbol
    const passwordRequirements = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  
    if (!username || !password || !loginTime) {
      return res.status(400).json({ message: 'Missing username, password or login time.' });
    }
  
    let users = readUsersFromFile();
  
    if (users[username]) {
      return res.status(409).json({ message: 'Username already exists.' });
    }
  
    // Store user
    users[username] = {
      password: password,
      maxAge: loginTime
    };
  
    // Write users back to the file
    fs.writeFileSync('./src/logins.json', JSON.stringify(users, null, 2));
  
    res.status(200).json({ message: 'User successfully created.' });
  });
  
  function readUsersFromFile() {
    let rawdata = fs.readFileSync('./src/logins.json');
    let users = JSON.parse(rawdata);
    return users;
  }  
}
app.use(async (req, res, next) => {
  if (req.path.startsWith(randomString)) {
    if (bare.shouldRoute(req)) {
      try {
        for (let i in blacklisted) {
          if (req.headers['x-bare-host']?.includes(blacklisted[i])) {
            return res.end('Denied, this may be an ad or is blacklisted.');
          }
        }
      } catch (e) {
        console.log(e);
      }
      bare.routeRequest(req, res);
    } else {
      next();
    }
  } else {
    if (config.password === "true") {
      const users = config.users;
      const authHeader = req.headers.authorization;

      if (req.session.loggedin) {
        const userMaxAge = users[req.session.username]?.maxAge || config.maxAge;
        if (Date.now() - req.session.cookie.originalMaxAge >= userMaxAge * 60 * 1000) {
          req.session.destroy(err => {
            if (err) {
              console.log(err);
            }
            res.status(401).send('Your session expired due to site restrictions from your local administrator');
            return;
          });
        } else {
          next();
        }
      } else if (authHeader) {
        const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf8');
        const [username, password] = auth.split(':');
        const userDetails = users[username];

        if (userDetails && userDetails.password === password) {
          req.session.loggedin = true;
          req.session.username = username;
          req.session.cookie.originalMaxAge = Date.now();
          if (req.path == config.loginloc) {
            res.redirect('/')
          } else {
          next();
          }
        }
      } else {
        if (req.path === config.loginloc) {
          res.status(401);
          res.setHeader('WWW-Authenticate', 'Basic realm="Access Denied"');
          res.end('Please provide login credentials');
        } else {
          middle(req, res, next);
          }
        }
    } else {
      next();
    }
  }
});

const rh = createRammerhead();
const rammerheadScopes = [
  '/hammerhead.js',
  '/rammerhead.js',
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
server.on("listening", () => {
  const addr = server.address();
  console.log(`Server running on port ${addr.port}`)
});
server.listen({ port: PORT });
