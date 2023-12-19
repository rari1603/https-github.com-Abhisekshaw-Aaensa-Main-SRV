const EnterpriseStateModel = require('../../models/enterprise_state.model');
const EnterpriseStateLocationModel = require('../../models/enterprise_state_location.model');


// Check empty filed while adding data in EnterpriseAdmin 
exports.adminEmptyCheck = async (req, res, next) => {
    const { EnterpriseName, Email, Name, Phone, OnboardingDate } = req.body;
    try {
        if (!(EnterpriseName && Email && Name && Phone && OnboardingDate)) {
            return res.status(400).send({ success: false, message: 'All Fields Are required!' });
        }
        next();
    } catch (error) {
        console.log("enterprise.middleware.adminEmptyCheck===>", error.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.', err: error.message });
    }
}

// Check empty filed while adding data in EnterpriseUser 
exports.userEmptyCheck = async (req, res, next) => {
    const { username, email, EnterpriseID } = req.body;

    try {
        if (!(username && email && EnterpriseID)) {
            return res.status(400).send({ success: false, message: 'All Fields Are required!' });
        }
        next();
    } catch (error) {
        console.log("enterprise.middleware.userEmptyCheck===>", error.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.', err: error.message });
    }
}

// check enterprise state
exports.CheckEntState = async (req, res, next) => {
    const { Enterprise_ID, State_ID } = req.body;
    try {

        if (!Enterprise_ID) {
            return res.status(401).json({ success: false, message: "Enterprise is required!" });

        }
        if (!State_ID) {
            return res.status(401).json({ success: false, message: "State is required!" });

        }
        const existingEntState = await EnterpriseStateModel.findOne({ Enterprise_ID, State_ID });
        if (existingEntState) {
            return res.status(401).json({ success: false, message: "State already added under this enterprise!" });
        }
        next();

    } catch (error) {
        console.error('Error adding enterprise:', error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", err: error.message });
    }
}

// check enterprise state location
exports.CheckEntStateLocation = async (req, res, next) => {
    const { Enterprise_ID, State_ID, LocationName } = req.body;
    try {

        if (!Enterprise_ID) {
            return res.status(401).json({ success: false, message: "Enterprise is required!" });

        }
        if (!State_ID) {
            return res.status(401).json({ success: false, message: "State is required!" });

        }
        if (!LocationName) {
            return res.status(401).json({ success: false, message: "Location name is required!" });

        }

        const lowerCaseLocationName = LocationName.toLowerCase();
        // Assuming EnterpriseStateLocationModel is your Mongoose model
        const allLocations = await EnterpriseStateLocationModel.find({});
        // Check for existing records with the lowercase location name
        for (const location of allLocations) {
            const dbLocationName = location.LocationName.toLowerCase();
            if (lowerCaseLocationName === dbLocationName) {
                return res.status(401).json({ success: false, message: "Location already added under this state." });
            }
        }

        next();

    } catch (error) {
        console.error('Error adding enterprise:', error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", err: error.message });
    }
}