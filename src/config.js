import fs from 'fs';

let logins = JSON.parse(fs.readFileSync('./src/logins.json', 'utf-8'));
export let config = {
    dynamicbare: true,
    cloak: true,
    password: true,
    loginloc: "/login",
    enableSessionExpiration: true,
    edusite: "https://www.nhaschools.com/",
    users: logins,
    maxAge: 60 * 24 * 31, // 1 month
    //maxage is in minutes, 60 is 1 hour, 60 * 24 is a day and 60 * 24 * 365 is a year
    signup: true,
    signuppath: '/signup',
    terminalurl: '/terminal',
    userpanelurl: '/userpanel',
    maxsignins: 2,
    signintimeout: 300 * 1000, // 5 mins
    logouturl: '/logout',
    adminusers:["admin"],
    restrictsignuptoadmin: false,
    defaultuser: ["sus", "sussy"],
    adminpanelurl: '/admin'
};
