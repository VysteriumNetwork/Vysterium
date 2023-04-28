"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bare_server_node_1 = __importDefault(require("@tomphttp/bare-server-node"));
const express_1 = __importDefault(require("express"));
const node_http_1 = require("node:http");
const ultraviolet_1 = require("@titaniumnetwork-dev/ultraviolet");
const node_path_1 = __importStar(require("node:path"));
const node_os_1 = require("node:os");
const cluster_1 = __importDefault(require("cluster"));
const os_1 = __importDefault(require("os"));
const chalk_1 = __importDefault(require("chalk"));
const compression_1 = __importDefault(require("compression"));
//@ts-ignore
const entry_mjs_1 = require("./dist/server/entry.mjs");
const __dirname = node_path_1.default.resolve();
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const http_auth_1 = __importDefault(require("http-auth"));
//rammerhead stuff
//@ts-ignore
const index_js_1 = __importDefault(require("rammerhead/src/server/index.js"));
const rh = (0, index_js_1.default)();
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
//END rammerhead specific stuff
//Chalk colors for codes
const error = chalk_1.default.bold.red;
const success = chalk_1.default.green;
const warning = chalk_1.default.yellow;
const info = chalk_1.default.blue;
const debug = chalk_1.default.magenta;
const boldInfo = chalk_1.default.bold.blue;
const debug2 = chalk_1.default.cyan;
//END CHALK
dotenv_1.default.config();
//getting environment vars
const numCPUs = process.env.CPUS || os_1.default.cpus().length;
let key = process.env.KEY || 'unlock';
let uri = process.env.URL || 'rubynetwork.tech';
if (uri.includes('http')) {
    uri = uri.replace('http://', '');
}
if (uri.includes('https')) {
    uri = uri.replace('https://', '');
}
let user = process.env.USERNAME || 'ruby';
let pass = process.env.PASSWORD || 'ruby';
let disableKEY = process.env.KEYDISABLE || 'false';
let educationWebsite = fs_1.default.readFileSync((0, node_path_1.join)(__dirname, 'education/index.html'));
let loadingPage = fs_1.default.readFileSync((0, node_path_1.join)(__dirname, 'education/load.html'));
const blacklisted = [];
const disableyt = [];
fs_1.default.readFile((0, node_path_1.join)(__dirname, 'blocklists/ADS.txt'), (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    const lines = data.toString().split('\n');
    for (let i in lines)
        blacklisted.push(lines[i]);
});
if (numCPUs > 0 && cluster_1.default.isPrimary) {
    console.log(debug(`Primary ${process.pid} is running`));
    for (let i = 0; i < numCPUs; i++) {
        cluster_1.default.fork().on('online', () => {
            console.log(debug2(`Worker ${i + 1} is online`));
        });
    }
    cluster_1.default.on('exit', (worker, code, signal) => {
        console.log(error(`Worker ${worker.process.pid} died with code: ${code} and signal: ${signal}`));
        console.log(warning(`Starting new worker in it's place`));
        cluster_1.default.fork();
    });
}
else {
    const bare = (0, bare_server_node_1.default)('/bare/');
    const app = (0, express_1.default)();
    app.use((0, compression_1.default)());
    app.use(express_1.default.static((0, node_path_1.join)(__dirname, 'dist/client')));
    //Server side render middleware for astro
    app.use(entry_mjs_1.handler);
    //express middleware for body
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: false }));
    //uv config
    app.use('/uv/', express_1.default.static(ultraviolet_1.uvPath));
    const server = (0, node_http_1.createServer)();
    server.on('request', (req, res) => {
        var _a, _b, _c, _d, _e;
        //@ts-ignore
        const url = new URL(req.url, `http://${req.headers.host}`);
        //Get the url search parameters and check if it matches the key from the environment variable
        //only block /,/404,/apps,/error,/search,/settings and /index if the key or cookie is not present
        if (bare.shouldRoute(req)) {
            try {
                if (!((_a = req.headers.cookie) === null || _a === void 0 ? void 0 : _a.includes('allowads'))) {
                    for (let i in blacklisted)
                        if ((_b = req.headers['x-bare-host']) === null || _b === void 0 ? void 0 : _b.includes(blacklisted[i]))
                            return res.end('Denied');
                }
                bare.routeRequest(req, res);
            }
            catch (error) {
                console.error(error);
                res.writeHead(302, {
                    Location: '/error',
                });
                res.end();
                return;
            }
        }
        else if (shouldRouteRh(req)) {
            routeRhRequest(req, res);
            //@ts-ignore
        }
        else if (req.headers.host === uri) {
            app(req, res);
        }
        else if (url.search === `?${key}` &&
            !((_c = req.headers.cookie) === null || _c === void 0 ? void 0 : _c.includes(key)) &&
            disableKEY === 'false') {
            res.writeHead(302, {
                Location: '/',
                'Set-Cookie': `key=${key}; Path=/; expires=Thu, 31 Dec 2099 23:59:59 GMT;`,
            });
            res.end();
            return;
        }
        else if ((_d = req.headers.cookie) === null || _d === void 0 ? void 0 : _d.includes(key)) {
            app(req, res);
        }
        else if ((!((_e = req.headers.cookie) === null || _e === void 0 ? void 0 : _e.includes(key)) && url.pathname === '/') ||
            url.pathname.includes('/404') ||
            url.pathname.includes('/apps') ||
            url.pathname.includes('/error') ||
            url.pathname.includes('/search') ||
            url.pathname.includes('/settings') ||
            url.pathname.includes('/index') ||
            url.pathname.includes('/ruby-assets') ||
            url.pathname.includes('/games') ||
            url.pathname.includes('/uv') ||
            url.pathname.includes('/aero') ||
            url.pathname.includes('/osana') ||
            url.pathname.includes('/dip')) {
            return res.end(educationWebsite);
        }
        else {
            app(req, res);
        }
    });
    server.on('upgrade', (req, socket, head) => {
        if (bare.shouldRoute(req)) {
            bare.routeUpgrade(req, socket, head);
        }
        else if (shouldRouteRh(req)) {
            try {
                routeRhUpgrade(req, socket, head);
            }
            catch (error) { }
        }
        else {
            socket.end();
        }
    });
    //!AUTHENTICATION
    const basic = http_auth_1.default.basic({
        realm: 'Restricted Access',
        file: __dirname + '/users.htpasswd',
    });
    //!END AUTHENTICATION
    //!CUSTOM ENDPOINTS
    app.get('/suggest', (req, res) => {
        // Get the search query from the query string
        const query = req.query.q;
        // Make a request to the Brave API
        fetch(`https://search.brave.com/api/suggest?q=${encodeURIComponent(
        //@ts-ignore
        query)}&format=json`)
            .then((response) => response.json())
            .then((data) => {
            // Send the response data back to the browser
            res.json(data);
        })
            .catch((error) => {
            // Handle the error
            console.error(error);
            res.sendStatus(500);
        });
    });
    //@ts-ignore
    app.get('/pid', basic.check((req, res) => {
        res.end(`Process id: ${process.pid}`);
    }));
    app.get('/load', basic.check((req, res) => {
        res.end(`Load average: ${os_1.default.loadavg()}`);
    }));
    app.get('/loading', (req, res) => {
        return res.end(loadingPage);
    });
    app.post('/login-form', (req, res) => {
        let body = req.body;
        body = JSON.stringify(body);
        body = JSON.parse(body);
        if (body.username === user && body.password === pass) {
            res.writeHead(302, {
                location: '/',
                'Set-Cookie': `key=${key}; Path=/; expires=Thu, 31 Dec 2099 23:59:59 GMT;`,
            });
            res.end();
            return;
        }
        else {
            res.writeHead(401);
            res.end(educationWebsite);
            return;
        }
    });
    app.get('/disable-ads', (req, res) => {
        var _a;
        if ((_a = req.headers.cookie) === null || _a === void 0 ? void 0 : _a.includes('allowads')) {
            res.clearCookie('allowads');
            res.writeHead(302, {
                Location: '/settings',
            });
            res.end('Disabled ads');
            return;
        }
        else {
            res.writeHead(302, {
                Location: '/settings',
                'Set-Cookie': 'allowads=allowads; Path=/; expires=Thu, 31 Dec 2099 23:59:59 GMT;',
            });
            res.end('Ads enabled');
            return;
        }
    });
    app.use((req, res) => {
        res.writeHead(302, {
            Location: '/404',
        });
        res.end();
        return;
    });
    //!CUSTOM ENDPOINTS END
    //RAMMERHEAD FUNCTIONS
    //@ts-ignore
    function shouldRouteRh(req) {
        const RHurl = new URL(req.url, 'http://0.0.0.0');
        return (rammerheadScopes.includes(RHurl.pathname) ||
            rammerheadSession.test(RHurl.pathname));
    }
    //@ts-ignore
    function routeRhRequest(req, res) {
        rh.emit('request', req, res);
    }
    //@ts-ignore
    function routeRhUpgrade(req, socket, head) {
        try {
            rh.emit('upgrade', req, socket, head);
        }
        catch (error) { }
    }
    //END RAMMERHEAD SPECIFIC FUNCTIONS
    let port = parseInt(process.env.PORT || '');
    if (isNaN(port))
        port = 8080;
    server.on('listening', () => {
        const address = server.address();
        // by default we are listening on 0.0.0.0 (every interface)
        // we just need to list a few
        // LIST PID
        console.log(success(`Process id: ${process.pid}`));
        console.log(debug('Listening on:'));
        //@ts-ignore
        console.log(debug2(`\thttp://localhost:${address.port}`));
        //@ts-ignore
        console.log(debug2(`\thttp://${(0, node_os_1.hostname)()}:${address.port}`));
        console.log(debug2(`\thttp://${
        //@ts-ignore
        address.family === 'IPv6'
            ? //@ts-ignore
                `[${address.address}]`
            : //@ts-ignore
                address.address
        //@ts-ignore
        }:${address.port}`));
    });
    server.listen({
        port,
    });
}
