// roles.js
const rolePermissions = {
    SuAdmin: {
        allowedRoutes: ["*"],
    },
    Enterprise: {
        allowedRoutes: [
            "/",
            "get/enterprise/list",
            "/get/dashboard/details/data"
        ],
    },
    SystemInt: {
        allowedRoutes: [
            "/",
            "/get/dashboard/details/data"
        ],
    },
};


module.exports = rolePermissions;
