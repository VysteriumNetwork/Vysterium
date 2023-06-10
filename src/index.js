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
//function generateRandomString(length) {
 // let result = '';
 // const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

 // for (let i = 0; i < length; i++) {
 //   const randomIndex = Math.floor(Math.random() * characters.length);
 //   result += characters.charAt(randomIndex);
 // }

//  return result;
//}

// Usage example: Generate a random string of 10 characters
//const randomString = generateRandomString(10);
//app.get('/server/', (req, res) => { 
//  res.json({ bare: '/' + randomString + '/' });
//});
const bare = createBareServer('/security/api/protection/');
app.use((req, res, next) => {
  if (req.path.startsWith('/security/api/protection/')) {
      bare.routeRequest(req, res);
  } else {
      const users = { 'admin': 'supersecret', 'benton': 'mena', 'anton': 'mena' };

      // middleware for handling authentication
      const authMiddleware = basicAuth({
        users,
        challenge: req.path === '/login', // challenge only for routes other than '/'
        unauthorizedResponse: getUnauthorizedResponse,
      });

      authMiddleware(req, res, (err) => {
        if (err || !req.auth) {
          if (req.path !== '/login' ) {
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




app.use('/uv', (req, res, next) => {
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
  return `
    <html>
      <head>
        <style>
          body {
            font-family: Roboto, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #89CFF0;
            color: #333;
            text-align: center;
          }
          div {
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
          }
          h1 {
            font-size: 2em;
            margin-bottom: 20px;
          }
          p {
            font-size: 1.2em;
            line-height: 1.6;
          }
          .resources {
            margin-top: 30px;
          }
          .resources h2 {
            margin-bottom: 20px;
          }
          .resources a {
            display: inline-block;
            margin: 10px;
            padding: 10px 20px;
            background-color: #89CFF0;
            color: #fff;
            text-decoration: none;
            border-radius: 5px;
            transition: background-color 0.3s ease;
          }
          .resources a:hover {
            background-color: #6fb8df;
          }
        </style>
      </head>
      <body>
        <div>
          <h1>You seem to be lost!</h1>
          <p>This is a restricted area intended only for teachers.</p>
          <p>If you believe you've reached this page in error, please go back to the previous page or contact the site administrator.</p>
          <div class="resources">
            <h2>Resources for Students</h2>
            <a href="https://www.khanacademy.org/" target="_blank">Khan Academy</a>
            <a href="https://www.edX.org/" target="_blank">edX</a>
            <a href="https://www.coursera.org/" target="_blank">Coursera</a>
            <a href="https://www.udemy.com/" target="_blank">Udemy</a>
            <a href="https://www.codecademy.com/" target="_blank">Codecademy</a>
            <a href="https://www.duolingo.com/" target="_blank">Duolingo</a>
            <a href="https://www.memrise.com/" target="_blank">Memrise</a>
            <a href="https://www.brainpop.com/" target="_blank">BrainPOP</a>
            <a href="https://www.quizlet.com/" target="_blank">Quizlet</a>
            <a href="https://www.mathway.com/" target="_blank">Mathway</a>
            <a href="https://www.sparknotes.com/" target="_blank">SparkNotes</a>
            <a href="https://www.grammarly.com/" target="_blank">Grammarly</a>
            <a href="https://www.scribd.com/" target="_blank">Scribd</a>
            <a href="https://www.wolframalpha.com/" target="_blank">Wolfram Alpha</a>
            <!-- Add more links as needed -->
          </div>
        </div>
      </body>
    </html>
  `;
}


server.on("listening", () => {
  const addr = server.address();

  console.log(`Server running on port ${addr.port}`)
  console.log("");
  console.log("You can now view it in your browser.")
});
server.listen({ port: PORT })