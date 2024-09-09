
const logger = require('../../configs/pino_logger').createLogger(__filename);
const EnterpriseStateLocationModel = require('../../models/enterprise_state_location.model');
const OGConfigs = require('../../models/OGConfig.model');
const moment = require('moment-timezone');

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
        const lastRunRecord = await OGConfigs.findOne().sort({ runId: -1 });
        const runId = lastRunRecord && !isNaN(Number(lastRunRecord.runId)) ? Number(lastRunRecord.runId) + 1 : 1;

        // Perform the HTTP call or any other action here
        const result = await EnterpriseStateLocationModel.findOne({ Enterprise_ID: req.EnterpriseInfo })
            .populate({
                path: 'State_ID', // Populates the State_ID field
                select: 'name'    // Only selects the 'name' field from the State document
            })
            .exec();

        const newRecord = {
            GatewayID: req.GatewayID,
            Location: result.LocationName,
            State: result.State_ID.name, // Use populated 'name' field from State_ID
            OnboardingDate: req.OnboardingDate,
            Switch: false,
            Time: moment().tz('Asia/Kolkata').format(),  // Current timestamp in IST
            Action: req.Action,
            Type: "Gateway",
            runId: runId  // Add the calculated runId      
        }
        // Create and save the new record in OGConfigs model
        const newConfig = new OGConfigs(newRecord);
        await newConfig.save();

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
