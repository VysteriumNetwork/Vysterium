export const config = {
    dynamicbare: "true",
    cloak: "true",
    password: "true",
    loginloc: "/login",
    enableSessionExpiration: true,
    edusite: "https://www.nhaschools.com/",
    users: {
        "sus": {
            password: "imposter",
            maxAge: null // null means default maxAge below
          },
    },
    maxAge: 60 * 24 * 31 // 1 month
    //maxage is in minutes, 60 is 1 hour, 60 * 24 is a day and 60 * 24 * 365 is a year
};
