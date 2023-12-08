// roles.js
const rolePermissions = {
    Webmaster: {
        allowedRoutes: ["*"],
    },
    Admin: {
        allowedRoutes: ["/", "/home", "/hi/bug"],
    },
    Manager: {
        allowedRoutes: ["/", "/hi/manager", "/add-ticket", "/list-ticket", "/edit-ticket/:id"],
    },
};

module.exports = rolePermissions;
