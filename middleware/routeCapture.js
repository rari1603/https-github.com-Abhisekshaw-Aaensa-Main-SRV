// middleware/routeCapture.js

function routeCapture(req, res, next) {
    // Capture the route information manually based on req.url or other criteria
    req.routeName = req.baseUrl + req.route ? req.route.path : 'unknown-route';
    next();
}

module.exports = routeCapture;
