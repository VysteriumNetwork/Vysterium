import fs from 'fs';

let logins = JSON.parse(fs.readFileSync('./src/logins.json', 'utf-8'));
export let config = {
    dynamicbare: false,
    cloak: true,
    password: false,
    loginloc: "/login",
    enableSessionExpiration: true,
    edusite: "https://www.hartfordschools.org",
    signup: true,
    signuppath: '/signup',
    terminalurl: '/terminal',
    userpanelurl: '/userpanel',
    maxsignins: 2,
    signintimeout: 300 * 1000, // 5 mins
    logouturl: '/logout',
    adminusers:["admin"],
    owners:["owner"],
    restrictsignuptoadmin: false,
    defaultuser: ["sus", "sussy"],
    adminpanelurl: '/admin',
    maxuserpasswordlength: 16
};
