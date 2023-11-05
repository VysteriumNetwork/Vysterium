import fs from 'fs';
import { edusites } from "./sites.js"
let logins = JSON.parse(fs.readFileSync('./src/logins.json', 'utf-8'));
export let config = {
    dynamicbare: true,
    cloak: true,
    password: "true",
    loginloc: "/login",
    enableSessionExpiration: true,
    users: logins,
    edusite: edusites[Math.floor(Math.random()*edusites.length)],
    signup: true,
    signuppath: '/signup',
    terminalurl: '/terminal',
    userpanelurl: '/userpanel',
    maxsignins: 2,
    signintimeout: 300 * 1000, // 5 mins
    logouturl: '/logout',
    adminusers:[],
    owners:["adminaccount"],
    restrictsignuptoadmin: false,
    defaultuser: ["sus", "sussy"],
    adminpanelurl: '/admin',
    maxuserpasswordlength: 16,
    autorestart: true
};

  