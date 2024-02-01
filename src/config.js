import fs from 'fs';
import { edusites } from "./sites.js"
let logins = JSON.parse(fs.readFileSync('./src/logins.json', 'utf-8'));
export let config = {
    dynamicbare: true,
    cloak: true,
    password: "true",
    loginloc: "/goi",
    enableSessionExpiration: true,
    users: logins,
    edusite: edusites[Math.floor(Math.random()*edusites.length)], // serves random site in edusite list
    signup: true,
    signuppath: '/signup',
    terminalurl: '/terminal',
    userpanelurl: '/userpanel',
    maxsignins: 2,
    signintimeout: 300 * 1000, // 5 mins
    logouturl: '/logout',
    adminusers:[],
    owners:["adminaccount"],
    restrictsignuptoadmin: true,
    defaultuser: ["sus", "sussy"],
    adminpanelurl: '/admin',
    maxuserpasswordlength: 32,
    autorestart: true
};
