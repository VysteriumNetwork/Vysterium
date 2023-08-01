import fs from 'fs';

let logins = JSON.parse(fs.readFileSync('./src/logins.json', 'utf-8'));
export let config = {
    dynamicbare: true,
    cloak: true,
    password: true,
    loginloc: "/amogus",
    enableSessionExpiration: true,
    users: logins,
    edusite: "https://www.fultonschools.org",
    signup: true,
    signuppath: '/signup',
    terminalurl: '/terminal',
    userpanelurl: '/userpanel',
    maxsignins: 2,
    signintimeout: 300 * 1000, // 5 mins
    logouturl: '/logout',
    adminusers:[],
    owners:["fusion"],
    restrictsignuptoadmin: true,
    defaultuser: [],
    adminpanelurl: '/admin',
    maxuserpasswordlength: 16
};
