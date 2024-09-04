exports.SendAudit = async (req) => {
    try {
        // return req;
        // http call or any other action
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
