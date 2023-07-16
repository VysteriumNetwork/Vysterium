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
import crypto from 'crypto'
const app = express();
import FileStore from 'session-file-store';
const FileStoreSession = FileStore(session);
import path from 'path';
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression())
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const blacklisted = [];
function readUsersFromFile() {
  let rawdata = fs.readFileSync('./src/logins.json');
  let users = JSON.parse(rawdata);
  return users;
}  
fs.readFile(path.join(__dirname, './blocklist.txt'), 'utf-8', (err, data) => { if (err) { console.error(err); return; } blacklisted.push(...data.split('\n')); });

app.use(session({
  store: new FileStoreSession({ path: './tmp', ttl: 3600 }),
  secret: 'randomsecretkey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
const PORT = 80
const server = createHttpServer();
import createRammerhead from 'rammerhead/src/server/index.js';
function randoms(e){for(var t="",n="abcdefghijklmnopqrstuvwxyz0123456789",r=0;r<e;r++)t+=n.charAt(Math.floor(Math.random()*n.length));return t}
let randomString;
if (config.dynamicbare === true) {
  randomString = '/' + randoms(50) + '/' + randoms(50) + '/';
} else {
  randomString = '/bare/';
}
app.get('/server', (req, res, next) => {
  if (!req.session.loggedin && config.password == true) {
    next(); 
  } else {
    res.json({ bare: randomString });
  }
});
const middle =  createProxyMiddleware({ target: config.edusite, changeOrigin: true, secure: true, ws: false });
fs.watch('./src/logins.json', (eventType, filename) => {
  if (eventType === 'change') {
    console.log(`users changed`);
    config.users = JSON.parse(fs.readFileSync('./src/logins.json', 'utf-8'));
  }
});
const bare = createBareServer(randomString);
app.get(config.logouturl, (req, res, next) => {
  if (req.session.loggedin) {
    req.session.destroy(function(err) {
      // Session destroyed, handle error if it exists.
      if (err) {
        console.log(err);
      } else {
        // Send the response file after session destruction.
        res.status(401);
        res.sendFile(__dirname + '/html/endsession.html');
      }
    });    
} else {
  next();
}
});
if (config.signup == true) {
  const signupLimiter = rateLimit({
    windowMs: config.signintimeout, // 1 hour
    max: config.maxsignins, // limit each IP to 1 request per windowMs
    message: "Too many signups from this IP, please try again after five minutes"
  });
  
  app.get(config.signuppath, async (req, res, next) => {
    if (config.restrictsignuptoadmin == true) {
      if (req.session.admin) {
        res.status(404)
        res.sendFile(__dirname + '/html/signup.html');
      } else {
        res.redirect('/')
      }
    } else {
      res.status(404)
      res.sendFile(__dirname + '/html/signup.html');
    }
  })
  

  app.post(config.signuppath, signupLimiter, async (req, res, next) => {
    if (config.restrictsignuptoadmin == true && !req.session.admin) {
      return res.status(403).send('Access denied. Only admin users can create new users.');
    }
  
    let username = req.body.username;
    let password = req.body.password;
    let loginTime = req.body.loginTime;
  
    // Check if username or password contains blacklisted characters
    let regex = /["\\']/;
    if (regex.test(username) || regex.test(password) || regex.test(loginTime)) {
      return res.status(400).json({ message: 'Invalid input. Quotes are not allowed.' });
    }
  
    if (!username || !password || (!loginTime && loginTime != false)) {
      return res.status(400).json({ message: 'Missing username, password or login time.' });
    }
  
    let users = readUsersFromFile();
  
    if (users[username]) {
      return res.status(409).json({ message: 'Username already exists.' });
    }
  
    // Generate a secret code for the user
    let secretCode = crypto.randomBytes(16).toString('hex');
  
    // Generate a salt for hashing
    let salt = crypto.randomBytes(16).toString('hex');
  
    // Generate a hashed password using the salt
    let hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    let hashedkey = crypto.pbkdf2Sync(secretCode, salt, 10000, 64, 'sha512').toString('hex');
  
    // Store user
    users[username] = {
      password: hashedPassword,
      salt: salt,
      maxAge: loginTime,
      secretCode: hashedkey
    };
  
    // Write users back to the file
    fs.writeFileSync('./src/logins.json', JSON.stringify(users, null, 2));
  
    res.status(200).json({ message: 'User successfully created. Your secret code is: ' + secretCode + ' make sure to save it or you will not have access to userpanel features!' });
  });
// GET route
app.get(config.adminpanelurl, (req, res, next) => {
  if (!req.session.admin) {
    return res.redirect('/')
  }

  res.sendFile(__dirname + '/html/delete.html');
});

// POST route
app.post(config.adminpanelurl, (req, res, next) => {
  if (!req.session.admin) {
   next();
  }
  let newPassword = req.body.newPassword;
  let newSecretCode = req.body.newSecretCode;
  let users = readUsersFromFile();
  let usernameToDelete = req.body.user;
  let messageType = req.body.messageType;

  if (!messageType) {
    return res.status(400).send('Missing messageType parameter.');
  }

  switch (messageType) {
    case 'logoutUsers':
      fs.rm('./tmp', { recursive: true, force: true }, (err) => {
        if (err) {
          console.log(err);
          res.status(500).send('Error ending sessions');
        } else {
          res.status(200).send('Sessions ended');
        }
      });
      break;
      case 'changeCredentials':
        if (!usernameToDelete) {
          return res.status(400).send('Missing user parameter.');
        }
  
        let user = users[usernameToDelete];
        if (!user) {
          return res.status(404).send('User not found.');
        }
  
        if (newPassword) {
          newPassword = crypto.pbkdf2Sync(newPassword, user.salt, 10000, 64, 'sha512').toString('hex');
        }gi
  
        if (newSecretCode) {
          newSecretCode = crypto.pbkdf2Sync(newSecretCode, user.salt, 10000, 64, 'sha512').toString('hex');
          
        }
        users[usernameToDelete] = {
          password: newPassword || user.password,
          maxAge: user.maxAge,
          salt: user.salt,  // assuming that salt is stored in user object
          secretCode: newSecretCode || user.secretCode,  // assuming that secretCode is stored in user object
          cookie: user.cookie, // retain existing cookie
          AES: user.AES  // assuming that AES is stored in user object
        };
        fs.writeFileSync('./src/logins.json', JSON.stringify(users, null, 2));
        res.status(200).send('User credentials successfully changed.');
        break;
    case 'deleteUser':
      if (!usernameToDelete) {
        return res.status(400).send('Missing user parameter.');
      }
      if (config.adminusers.includes(usernameToDelete)) {
        return res.status(404).send("You can't delete admin users!")
      }
      if (config.defaultuser.includes(usernameToDelete)) {
        return res.status(404).send("You can't delete admin users!")
      }
      if (!users[usernameToDelete]) {
        return res.status(404).send('User not found.');
      }

      delete users[usernameToDelete];

      fs.writeFileSync('./src/logins.json', JSON.stringify(users, null, 2));

      res.status(200).send('User successfully deleted.');
      break;
    
      case 'listUsers':
        let usernames = Object.keys(users);
        let filteredUsernames = usernames.filter(username => !config.adminusers.includes(username) && !config.defaultuser.includes(username));
        res.status(200).json({users: filteredUsernames});
        break;
      

    default:
      res.status(400).send('Invalid messageType.');
  }
});

  
  
}
app.get(config.userpanelurl, (req, res, next) => {
  if (!req.session.loggedin && config.password == true) {
    next(); 
  } else {
    res.status(404);
  res.sendFile(path.join(__dirname, '/html/userpanel.html'));
  }
});

app.post(config.userpanelurl, async (req, res, next) => {
  if (!req.session.loggedin && config.password == true) {
    next(); 
  } else {
    let { username, password, secretCode, messageType, newUsername, newPassword, newSecretCode, cookie } = req.body;

    if (!username || !password || !secretCode || !messageType) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    let users = readUsersFromFile();

    const user = users[username];
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    function generateKey() {
      return crypto.randomBytes(32);
    }
    
    function encrypt(text, key) {
      let iv = crypto.randomBytes(16);
      let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
      let encrypted = cipher.update(text);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      return iv.toString('hex') + ':' + encrypted.toString('hex');
    }
    
    function decrypt(text, key) {
      let textParts = text.split(':');
      let iv = Buffer.from(textParts.shift(), 'hex');
      let encryptedText = Buffer.from(textParts.join(':'), 'hex');
      let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    }
    let hashedPassword = crypto.pbkdf2Sync(password, user.salt, 10000, 64, 'sha512').toString('hex');
    let hashedSecretCode = crypto.pbkdf2Sync(secretCode, user.salt, 10000, 64, 'sha512').toString('hex');
    let saltstore = user.salt
    if (config.defaultuser.includes(user)) {
      return res.status(403).json({ message: 'Operation not permitted for Default Users.' });
    }
    
    if (user.password !== hashedPassword || user.secretCode !== hashedSecretCode) {
      return res.status(403).json({ message: 'Invalid credentials.' });
    }
    
    switch(messageType) {
      case 'delete':
        req.session.destroy((err) => {
          if (err) {
            console.log(err);
          }
          res.status(401);
          res.sendFile(__dirname + '/html/endsession.html');
        });
        delete users[username];

        case 'setCookie':
          if (!cookie) {
            return res.status(400).json({ message: 'Missing cookie.' });
          }
          // Generate a new key for each cookie set
          user.AES = generateKey();
          user.cookie = encrypt(cookie, user.AES);
          res.status(200).json({ message: 'Cookie successfully updated.' });
          break;
        
        case 'getCookie':
          if (!user.cookie || !user.AES) {
            return res.status(404).json({ message: 'No cookie or AES key found.' });
          }
          res.status(200).json({ cookie: decrypt(user.cookie, user.AES) });
          break;
  
      case 'changeCredentials':
        if (!newUsername) {
          newUsername = username;
        }
        
        if(users[newUsername]){
          return res.status(400).json({ message: 'Username already exists.' });
        }
        
        // if newPassword is provided, hash it with user's salt
        if (newPassword) {
          newPassword = crypto.pbkdf2Sync(newPassword, user.salt, 10000, 64, 'sha512').toString('hex');
        }

        // if newSecretCode is provided, hash it with user's salt
        if (newSecretCode) {
          newSecretCode = crypto.pbkdf2Sync(newSecretCode, user.salt, 10000, 64, 'sha512').toString('hex');
        }
        
        delete users[username];
        
        users[newUsername] = {
          password: newPassword || password,
          maxAge: user.maxAge,
          salt: saltstore,
          secretCode: newSecretCode || secretCode,
          cookie: user.cookie, // retain existing cookie
          AES: user.AES
        };

        res.status(200).json({ message: 'User credentials successfully updated.' });
        break;
        
      default:
        res.status(400).json({ message: 'Invalid messageType.' });
    }
    
    // Write users back to the file
    fs.writeFileSync('./src/logins.json', JSON.stringify(users, null, 2));
  }
});
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
    if (config.password === true) {
      const users = config.users;
      const authHeader = req.headers.authorization;

      if (req.session.loggedin) {
        const userMaxAge = users[req.session.username]?.maxAge || config.maxAge;
        if (Date.now() - req.session.cookie.originalMaxAge >= userMaxAge * 60 * 1000 && userMaxAge != false) {
          req.session.destroy(err => {
            if (err) {
              console.log(err);
            }
            res.status(401)
            res.sendFile(__dirname + '/html/endsession.html');
            return;
          });
        } else {
          if (req.path == config.loginloc) {
            res.redirect('/');
            return;
          } else {
            next();
            return;
          }
        }
      } else if (authHeader) {
        const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf8');
        const [username, password] = auth.split(':');
        const user = users[username];
        if (user) {
          const hashedPassword = crypto.pbkdf2Sync(password, user.salt, 10000, 64, 'sha512').toString('hex');
          if (hashedPassword === user.password) {
            if (config.adminusers.includes(username)) {
              req.session.admin = true
            }
            req.session.loggedin = true;
            req.session.username = username;
            req.session.cookie.originalMaxAge = Date.now();
            if (req.path == config.loginloc) {
              res.redirect('/');
              return;
            }
            next();
            return;
          } else {
              req.headers.authorization = null
              req.session.destroy()
              res.status(401);
              res.sendFile(__dirname + '/html/endsession.html');
              return;
          }
        } else {
          if (req.path == config.loginloc) {
            res.sendFile(__dirname + '/html/login.html')
            return;
          } else {
            middle(req, res, next); // Middle function is called only when user is not logged in
            return;
          }
        }
      } else {
        if (req.path === config.loginloc) {
          res.sendFile(__dirname + '/html/login.html')
          return;
        } else {
          middle(req, res, next); // Middle function is called only when user is not logged in
          return;
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
if (config.cloak === true) {
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

app.use((req, res, next) => {
  if (req.path.endsWith('.html') || req.path.endsWith('/')) {
    // Construct the path to the file
    let filePath = path.join(__dirname, '../static', req.path);
    if (req.path === '/') {
      filePath = path.join(filePath, 'index.html');
    }

    // Read the file from disk
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        next(err);
        return;
      }

      // Inject the HTML
      const injectedData = data.replace('</body>', `
      <style>
      body {
        font-family: Arial, sans-serif;
    }
            .panel {
            opacity: 0;
            position: fixed;
            width: 300px;
            height: 200px;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #404040;
            border-radius: 25px;
            padding: 20px;
            color: black;
            z-index: 0;
            transition: opacity 0.7s ease;
        }

        .panel.show {
            opacity: 1;
            z-index: 99999;
        }

        .panel a {
            display: block;
            text-decoration: none;
            color: white;
            background: #007BFF; /* dark gray */
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 10px;
            text-align: center;
        }
  </style>
      <div class="panel" id="myPanel">
      <a href=${config.adminpanelurl}>Admin</a>
      <a href=${config.userpanelurl}>User Panel</a>
  </div>

  <script>
  document.body.addEventListener('keydown', function(e) {
    var panel = document.getElementById('myPanel');
    if (e.code === 'ShiftRight') {
        panel.classList.add('show');
    } else if (e.code === 'Escape') {
        panel.classList.remove('show');
    }
});
  </script>
    </body>`);

      // Send the response
      res.send(injectedData);
    });
  } else {
    // For non-HTML files, fall back to express.static
    express.static(fileURLToPath(new URL("../static/", import.meta.url)))(req, res, next);
  }
});
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
  let status = 404
  if (config.cloak == true) {
  status = 200
  }
    const nebulaFilename = nebularoutes[req.url];
  const shuttleFilename = shuttleroutes[req.url];
    if (nebulaFilename) {
      res.statusCode = status;
      res.setHeader("Content-Type", "text/html");
      res.end(fs.readFileSync(`./src/html/nebula/${nebulaFilename}`));
    } else if (shuttleFilename) {
      res.statusCode = status;
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
function getUnauthorizedResponse() {
  return `<!DOCTYPE html>
  <script> window.location.replace("/"); </script>
  </html>`;
}
server.on("listening", () => {
  const addr = server.address();
  console.log(`Server running on port ${addr.port}`)
});
server.listen({ port: PORT });
