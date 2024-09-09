
const logger = require('../../configs/pino_logger').createLogger(__filename);

exports.SendAudit = async (req) => {
    try {
       logger.trace(req); 
        return {
            success: true,
            status: 200,
            message: "Audit sent successfully",
            data: { /* any additional data you want to include */ }
        };
    } catch (err) {
        console.log(err.message);
        // Assuming `req` has a `res` object, otherwise remove `res` handling
        if (req) {
            return req.res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
        } else {
            // If there's no `res`, just throw the error
            throw err;
        }
    }
};

exports.InfoPassGateway = async (req) => {
    try {
        // Perform the HTTP call or any other action here
        console.log({req});
        
        console.log({
            success: true,
            message: "New Gateway info sent successfully",
            data: req
        });
    } catch (err) {
        console.error(err.message); // More appropriate error logging
        console.log({
            success: false,
            message: "Internal Server Error",
            error: err.message
        });
    }
};

exports.InfoPassOptimizer = async (req) => {
    try {
        // Perform the HTTP call or any other action here

        console.log({
            success: true,
            message: "New Optimizer info sent successfully",
            data: req
        });
    } catch (err) {
        console.error(err.message); // More appropriate error logging
        console.log({
            success: false,
            message: "Internal Server Error",
            error: err.message
        });
    }
};
