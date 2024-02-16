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
    owners:["admin"],
    restrictsignuptoadmin: true,
    defaultuser: [],
    adminpanelurl: '/admin',
    maxuserpasswordlength: 32,
    autorestart: true,
    supabaseUrl: "https://gfnsjorxdhxwdmfytxne.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmbnNqb3J4ZGh4d2RtZnl0eG5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODgzMTU0MzUsImV4cCI6MjAwMzg5MTQzNX0.1qudBW5S1172iZqTR0-wz7ztRlcC53XnTsYGFwVrLro"

};
