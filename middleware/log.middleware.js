const logger = require('../configs/pino_logger');

// Middleware to log the request and response with dynamic route name
function logMiddleware(logLevel, fileName) {
    return function (req, res, next) {
        const { method, url, originalUrl, baseUrl, path, params, query, body } = req;
        // console.log({ method, url, originalUrl, baseUrl, path, params, query, body });
        
        // const routeName = req.routeName || 'unknown-route'; // Use route info from req

        // Log the request information with route name
        logger[logLevel](fileName, `Route: ${url} | Request - Method: ${method}, URL: ${url}, Params: ${JSON.stringify(params)}, Query: ${JSON.stringify(query)}, Body: ${JSON.stringify(body)}`);

        // Capture the original `res.send` function
        const originalSend = res.send;

        // Override `res.send` to capture the response body
        res.send = function (responseBody) {
            // Convert responseBody to a string if it is an object
            const responseString = typeof responseBody === 'object' ? JSON.stringify(responseBody) : responseBody;

            // Log the response body with route name
            logger[logLevel](fileName, `Route: ${url} | Response - Status: ${res.statusCode}, Body: ${responseString}`);

            // Call the original `send` function with the response
            originalSend.call(this, responseBody);
        };

        next(); // Move to the next middleware or route handler
    };
}

module.exports = { logMiddleware };
