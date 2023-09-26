import fs from 'fs';

let logins = JSON.parse(fs.readFileSync('./src/logins.json', 'utf-8'));
export let config = {
    dynamicbare: true,
    cloak: true,
    password: "true",
    loginloc: "/login",
    enableSessionExpiration: true,
    users: logins,
    edusite: "http://keybusinessconnection.com/",
    signup: true,
    signuppath: '/signup',
    terminalurl: '/terminal',
    userpanelurl: '/userpanel',
    maxsignins: 2,
    signintimeout: 300 * 1000, // 5 mins
    logouturl: '/logout',
    adminusers:["adminaccount"],
    owners:[],
    restrictsignuptoadmin: false,
    defaultuser: ["sus", "sussy"],
    adminpanelurl: '/admin',
    maxuserpasswordlength: 16
};
