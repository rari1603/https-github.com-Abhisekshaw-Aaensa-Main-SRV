// roles.js
const rolePermissions = {
    SuAdmin: {
        allowedRoutes: ["*"],
    },
    Enterprise: {
        allowedRoutes: ["/", "get/enterprise/list"],
    },
    SystemInt: {
        allowedRoutes: ["/"],
    },
};


module.exports = rolePermissions;
