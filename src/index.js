import { createBareServer } from "@tomphttp/bare-server-node";
import { fileURLToPath } from "url";
import http from 'http';
import fs from 'fs';
import compression from '../node_modules/compression/index.js'
import rateLimit from '../node_modules/express-rate-limit/dist/index.mjs';
import session from '../node_modules/express-session/index.js';
import { config } from './config.js';
import { createProxyMiddleware } from '../node_modules/http-proxy-middleware/dist/index.js'
import express from '../node_modules/express/index.js';
import { spawn, exec } from 'child_process'
import { pagescript, adminscript} from './html.js'
import crypto from 'crypto'
import { func } from './uvconfig.js'
import FileStore from '../node_modules/session-file-store/index.js';

const app = express();

const FileStoreSession = FileStore(session);
import path from 'path';
app.use(express.json());
app.use(compression())
app.use(express.urlencoded({ extended: true }));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const blacklisted = [];
function readUsersFromFile() {
  let rawdata = fs.readFileSync('./src/logins.json');
  let users = JSON.parse(rawdata);
  return users;
}  
fs.readFile(path.join(__dirname, './blocklist.txt'), 'utf-8', (err, data) => { if (err) { console.error(err); return; } blacklisted.push(...data.split('\n')); });



let serverProcess = null

function spawnServerProcess() {
  const server = spawn('node', ['src/index.js'], {
    stdio: 'inherit',
    detached: false
  });

  server.on('exit', (code, signal) => {
    if (signal) {
      console.log(`Server process was killed by signal: ${signal}`);
      serverProcess = null;
    } else if (code !== 0) {
      console.log(`Server process exited with error code ${code}, restarting in 5 seconds...`);
      setTimeout(() => {
        serverProcess = spawnServerProcess();
      }, 5000); // Restart after a delay
    } else {
      console.log('Server process exited normally.');
      serverProcess = null;
    }
  });

  return server;
}

process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down gracefully...');
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit();
});

// Optional: Implement a way to trigger a manual restart
process.stdin.on('data', (data) => {
  const command = data.toString().trim();
  if (command === 'restart') {
    if (serverProcess) {
      console.log('Server is already running.');
    } else {
      console.log('Restarting server...');
      serverProcess = spawnServerProcess();
    }
  }
});

console.log('Restart manager started. Type "restart" to manually restart the server.');

app.use(session({
  store: new FileStoreSession({ path: './tmp', ttl: 3600 }),
  secret: 'randomsecretkey',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false // By default, set an expiration time
  },
}));
const PORT = 8080
const server = http.createServer();
server.on("request", (req, res) => {
  if (bare.shouldRoute(req)) {
    bare.routeRequest(req, res);
  } else {
    app(req, res);
  }
});
server.on("upgrade", (req, socket, head) => {
  if (bare.shouldRoute(req)) {
    bare.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});
function randoms(e){for(var t="",n="abcdefghijklmnopqrstuvwxyz0123456789",r=0;r<e;r++)t+=n.charAt(Math.floor(Math.random()*n.length));return t}
let randomString;
if (config.dynamicbare === true) {
  randomString = '/' + randoms(50) + '/' + randoms(50) + '/';
} else {
  randomString = '/bare/';
}

app.get('/script/config.js', (req, res) => {
  if (req.session.loggedin) {
  res.setHeader('Content-Type', 'text/javascript');

  // Send JavaScript content
  res.send(func(randomString));
  } else {
    next()
  }
});
fs.watch('./src/logins.json', (eventType, filename) => {
  if (eventType === 'change') {
    config.users = JSON.parse(fs.readFileSync('./src/logins.json', 'utf-8'));
  }
});
const bare = createBareServer(randomString);
app.get(config.logouturl, (req, res, next) => {
  if (req.session.loggedin) {
    req.session.destroy(function(err) {
      if (err) {
        console.log(err);
      } else {
        res.status(401);
        res.sendFile(__dirname + '/html/endsession.html');
      }
    });    
  } else {
    return next()
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
        res.setHeader('Cache-Control', 'max-age=31536000');
        res.status(404)
        res.sendFile(__dirname + '/html/signup.html');
      } else {
        next()
      }
    } else {
      res.status(404)
      res.setHeader('Cache-Control', 'max-age=31536000');
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
    let deleteuser = req.body.deleteuser;
    const MAX_LENGTH = config.maxuserpasswordlength
    let regex = /["\\']/;
    if (regex.test(username) || regex.test(password) || regex.test(loginTime)) {
      return res.status(400).json({ message: 'Invalid input. Quotes are not allowed.' });
    }
  
    if (!username || !password || (!loginTime && loginTime != false)) {
      return res.status(400).json({ message: 'Missing username, password or login time.' });
    }
    if (username.length > MAX_LENGTH) {
      return res.status(400).json({ message: `Username is too long. Maximum length is ${MAX_LENGTH}.` });
    }
    
    if (password.length > MAX_LENGTH) {
      return res.status(400).json({ message: `Password is too long. Maximum length is ${MAX_LENGTH}.` });
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
    if (loginTime = "perm") {
      loginTime = null
    }
    users[username] = {
      password: hashedPassword,
      deleteuser: deleteuser,
      salt: salt,
      maxAge: loginTime,
      secretCode: hashedkey
    };
  
    // Write users back to the file
    fs.writeFileSync('./src/logins.json', JSON.stringify(users, null, 2));
  
    res.status(200).json({ message: 'User successfully created. Your secret code is in the popup make sure to save it or you will not have access to userpanel features!', secretCode: secretCode});
  });
// GET route
app.get(config.terminalurl, (req, res, next) => {
  if (!req.session.admin) {
    return next();
  } else {
    res.sendFile(__dirname + '/html/terminal.html');
  }
});
let currentCwd = process.cwd();
let child;
app.post(config.terminalurl, (req, res, next) => {
  if (!req.session.admin) {
    return next();
   } else {
      const command = req.body.command;
      if(command === '^C') {
        if(child) {
            child.kill('SIGINT');
        }
        return res.json({ stdout: 'Process interrupted', cwd: process.cwd() });
      } 
      if (command.startsWith('cd')) {
        const newCwd = path.join(currentCwd, command.slice(3));
        if (fs.existsSync(newCwd)) {
          currentCwd = newCwd;
          res.json({ cwd: currentCwd });
        } else {
          res.json({ stderr: 'Directory does not exist', cwd: currentCwd });
        }
      } else {
        exec(command, { cwd: currentCwd }, (error, stdout, stderr) => {
          stdout = stdout.toString();
          stderr = stderr.toString();
          if (error) {
            res.json({ stderr: stderr || error.message, cwd: currentCwd });
          } else {
            res.json({ stdout: stdout, stderr: stderr, cwd: currentCwd });
          }
        });
      }
    }
})
app.get(config.adminpanelurl, (req, res, next) => {
  if (!req.session.admin && !req.session.owner) {
    return next();
  }

  const script = adminscript

  fs.readFile(__dirname + '/html/admin.html', 'utf8', (err, html) => {
    if (err) {
      console.error(err);
      res.sendStatus(500);
      return;
    }

    const finalHtml = html.replace('</body>', script + '</body>');
    res.send(finalHtml);
  });
});

app.post(config.adminpanelurl, async (req, res, next) => {
  if (!req.session.admin) {
   return next();
  }
  let newPassword = req.body.newPassword;
  let newSecretCode = req.body.newSecretCode;
  let usernameToDelete = req.body.user;
  let messageType = req.body.messageType;
  let users = readUsersFromFile();
  let user = users[usernameToDelete];
  if (!messageType) {
    return res.status(400).send('Missing messageType parameter.');
  }
  switch (messageType) {
    case 'logoutUsers':
      fs.rm('tmp', { recursive: true, force: true }, (err) => {
          if (err) {
              console.log(err);
              res.status(500).send('Error ending sessions');
          } else {
              res.status(200).send('Sessions ended');
              restartServer();
          }
      });
      break;
      case 'restart':
        restartServer();
        break;
      case 'shutdown':
        if (req.session.owner) {
          res.status(200).send('Server shut down!')
        process.exit();
        } else {
          res.status(200).send('admins cannot shut down the server')
          return;
        }
      case 'changeCredentials':
        if (!usernameToDelete) {
          return res.status(400).send('Missing user parameter.');
        }
        let salt = user.salt
        if (newSecretCode && newPassword) {
          salt = crypto.randomBytes(16).toString('hex');
        }
        if (!req.session.owner) {
          if (config.adminusers.includes(users[usernameToDelete])) {
            res.status(403).send('You are not an owner')
          }
        }
        if (!user) {
          return res.status(404).send('User not found.');
        }
  
        if (newPassword) {
          newPassword = crypto.pbkdf2Sync(newPassword, salt, 10000, 64, 'sha512').toString('hex');
        }
  
        if (newSecretCode) {
          newSecretCode = crypto.pbkdf2Sync(newSecretCode, salt, 10000, 64, 'sha512').toString('hex');
          
        }
        users[usernameToDelete] = {
          password: newPassword || user.password,
          maxAge: user.maxAge,
          salt: salt,  // assuming that salt is stored in user object
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
      if (!req.session.owner) {
        usernames = usernames.filter(username => !config.adminusers.includes(username) && !config.defaultuser.includes(username) && !config.owners.includes(username));
      }
        res.status(200).json({users: usernames});
        break;
      

    default:
      res.status(400).send('Invalid messageType.');
  }
});
}
app.get(config.userpanelurl, (req, res, next) => {
  if (!req.session.loggedin && config.password == "true") {
    return next();
  } else {
    res.status(404);
  res.sendFile(path.join(__dirname, '/html/userpanel.html'));
  }
});
const middle =  createProxyMiddleware({ target: config.edusite, changeOrigin: true, secure: true, ws: false });
app.post(config.userpanelurl, async (req, res, next) => {
  if (!req.session.loggedin && config.password == "true") {
    return next();
  } else {
    let { username, password, secretCode, messageType, newUsername, newPassword, newSecretCode, cookie } = req.body;
    let users = readUsersFromFile();
    const user = users[username];
    if (!username || !password || !secretCode || !messageType) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    function generateKey() {
      return crypto.randomBytes(32);
    }
    
    function encrypt(text, key) {
      let iv = crypto.randomBytes(16);
      let cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key), iv);
      let encrypted = cipher.update(text);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      return iv.toString('hex') + ':' + encrypted.toString('hex');
    }
    
    function decrypt(text, key) {
      let textParts = text.split(':');
      let iv = Buffer.from(textParts.shift(), 'hex');
      let encryptedText = Buffer.from(textParts.join(':'), 'hex');
      let decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key), iv);
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
        fs.writeFileSync('./src/logins.json', JSON.stringify(users, null, 2));
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
        if (newPassword && newSecretCode) {
          saltstore = crypto.randomBytes(16).toString('hex');
        }
        // if newPassword is provided, hash it with user's salt
        if (newPassword) {
          newPassword = crypto.pbkdf2Sync(newPassword, saltstore, 10000, 64, 'sha512').toString('hex');
        }

        // if newSecretCode is provided, hash it with user's salt
        if (newSecretCode) {
          newSecretCode = crypto.pbkdf2Sync(newSecretCode, saltstore, 10000, 64, 'sha512').toString('hex');
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
if (config.password == "true") {
  app.use((req, res, next) => {
    if (req.session.loggedin) {
      return next()
    }
    const username = decodeURIComponent(req.query.user);
    const password = decodeURIComponent(req.query.pass);
    const user = config.users[username];
    if (user) {
      req.session.exist = true;
      const hashedPassword = crypto.pbkdf2Sync(password, user.salt, 10000, 64, 'sha512').toString('hex');
      if (hashedPassword === user.password) {
        if (config.adminusers.includes(username)) {
          req.session.admin = true;
        }
        if (config.owners.includes(username)) {
          req.session.admin = true;
          req.session.owner = true;
        }
        req.session.loggedin = true;
        req.session.username = username;
        req.session.locked = false;
        req.session.cookie.originalMaxAge = Date.now();
        if (user.deleteuser === true) {
          req.session.deleted = true;
          delete config.users[username]; // corrected to use config.users
          fs.writeFileSync('./src/logins.json', JSON.stringify(config.users, null, 2)); // corrected to use config.users
        }
        res.redirect("/");
        return;
      } else {
        return middle(req, res, next)
      }
    } else {
      return middle(req, res, next)
    }
  });
  }
if (config.cloak === true) {
  app.use((e, t, n) => {
    const r = e.url;
    if (r.endsWith(".html")) {
      t.statusCode = 404;
      t.setHeader("Cache-Control", "max-age=31536000");
      n();
    } else {
      if (r.endsWith("/")) {
        t.statusCode = 404;
        t.setHeader("Cache-Control", "max-age=31536000");
        n();
      } else {
        n();
      }
    }
  });
}
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  if (req.path === '/') {
      let filePath = path.join(__dirname, '../static', req.path);
      if (path.extname(req.path) === '') {
          filePath = path.join(filePath, 'index.html');
      }

      fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
              next(err);
              return;
          }

          // Inject the HTML
          const injectedData = data.replace('</body>', pagescript);

          // Send the response
          res.send(injectedData);
      });
  } else {
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