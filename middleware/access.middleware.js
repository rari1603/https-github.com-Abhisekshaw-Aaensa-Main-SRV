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
            const decodedData = jwtDecode(token);
            // console.log(decodedData);
            if (decodedData === "jwt expired") {
                return res.status(401).json({ status: 401, error: 'The JSON Web Token (JWT) has expired.' });
            }

            // In a real application, you might get this information from authentication middleware
            req.user = {
                role: decodedData.user.role, // or 'Manager', 'Webmaster'
            }
            // Assuming you have a user object attached to the request
            const userRole = req.user && req.user.role;
            const requestedRoute = req.path;
            const baseUrl = req.baseUrl; // Should be '/api/srv-1'
            const originalUrl = req.originalUrl; // Should be '/api/srv-1/hi'
            const routeName = req.route.name; // The name of the route (if you've set it)

            if (!userRole || !rolePermissions[userRole] || !checkPermission(requestedRoute, rolePermissions[userRole].allowedRoutes)) {
                return res.status(403).json({ error: 'Access forbidden' });
            }

            next();

        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error.message });
        }
    };
}

module.exports = checkRoles;
