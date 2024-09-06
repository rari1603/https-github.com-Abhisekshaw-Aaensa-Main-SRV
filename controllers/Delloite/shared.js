exports.InfoPassGateway = async (req) => {
    try {
        // Perform the HTTP call or any other action here

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
