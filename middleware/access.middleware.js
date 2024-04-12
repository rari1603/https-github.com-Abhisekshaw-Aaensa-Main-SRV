// accessMiddleware
const rolePermissions = require('./lib/roles');
const jwtDecode = require('../utility/JwtDecoder');

function checkPermission(route, allowedRoutes) {

    // Check if the route is allowed or if the allowedRoutes array contains "*"
    return allowedRoutes.includes(route) || allowedRoutes.includes('*');
}

function checkRoles() {
    return (req, res, next) => {
        try {
            const token = req.header('Authorization');
            const decodedData = jwtDecode.decode(token);
            // console.log(decodedData);
            if (decodedData === "jwt expired") {
                return res.status(401).json({ success: false, message: 'The JSON Web Token (JWT) has expired.' });
            }

            // In a real application, you might get this information from authentication middleware
            req.user = {
                role: decodedData.user.role, // or 'Manager', 'Webmaster'
            }
            req.decodedData = decodedData;
            // Assuming you have a user object attached to the request
            const userRole = req.user && req.user.role;
            const requestedRoute = req.path;
            const baseUrl = req.baseUrl; // Should be '/api/admin'
            const originalUrl = req.originalUrl; // Should be '/api/admin/hi'
            const routeName = req.route.name; // The name of the route (if you've set it)
            console.log({
                userRole,
                requestedRoute,
                baseUrl,
                originalUrl,
                routeName,
                rolePermissions: rolePermissions[userRole],
                allowedRoutes: rolePermissions[userRole].allowedRoutes
            });
            if (!userRole || !rolePermissions[userRole] || !checkPermission(requestedRoute, rolePermissions[userRole].allowedRoutes)) {
                return res.status(403).json({ success: false, error: 'Route Access forbidden' });
            }

            next();

        } catch (error) {
            console.log(error);
            return res.status(500).json({ success: false, error: error.message });
        }
    };
}


module.exports = checkRoles;
