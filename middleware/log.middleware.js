const logger = require('../configs/pino_logger');

// Middleware to log the request and response
function logMiddleware(logLevel, fileName) {
    return function (req, res, next) {
        const { method, url, params, query, body } = req;

        // Log the request information
        logger[logLevel](fileName, `Request - Method: ${method}, URL: ${url}, Params: ${JSON.stringify(params)}, Query: ${JSON.stringify(query)}, Body: ${JSON.stringify(body)}`);

        // Capture the original `res.send` function
        const originalSend = res.send;

        // Override `res.send` to capture the response body
        res.send = function (responseBody) {
            // Log the response body
            logger[logLevel](fileName, `Response - Status: ${res.statusCode}, Body: ${responseBody}`);

            // Call the original `send` function with the response
            originalSend.call(this, responseBody);
        };

        next(); // Move to the next middleware or route handler
    };
}

module.exports = { logMiddleware };