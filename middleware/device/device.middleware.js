const EnterpriseStateModel = require('../../models/enterprise_state.model');
const EnterpriseStateLocationModel = require('../../models/enterprise_state_location.model');
const GatewayModel = require('../../models/gateway.model');


// check enterprise state
exports.CheckEntState = async (req, res, next) => {
    const { Enterprise_ID, State_ID } = req.body;
    try {

        if (!Enterprise_ID) {
            return res.status(401).json({ success: false, message: "Enterprise is required!", key: "Enterprise_ID" });

        }
        if (!State_ID) {
            return res.status(401).json({ success: false, message: "State is required!", key: "State_ID" });

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
};

// check enterprise state location
exports.CheckEntStateLocation = async (req, res, next) => {
    const { Enterprise_ID, State_ID, LocationName } = req.body;
    try {
        if (!Enterprise_ID) {
            return res.status(401).json({ success: false, message: "Enterprise is required!", key: "Enterprise_ID" });

        }
        if (!State_ID) {
            return res.status(401).json({ success: false, message: "State is required!", key: "State_ID" });

        }
        if (!LocationName) {
            return res.status(401).json({ success: false, message: "Location name is required!", key: "LocationName" });

        }

        const lowerCaseLocationName = LocationName.toLowerCase();
        // Assuming EnterpriseStateLocationModel is your Mongoose model
        const allLocations = await EnterpriseStateLocationModel.find({});
        // Check for existing records with the lowercase location name
        for (const location of allLocations) {
            const dbLocationName = location.LocationName.toLowerCase();
            if (lowerCaseLocationName === dbLocationName) {
                return res.status(401).json({ success: false, message: "Same location name already added under this state.", key: "LocationName" });
            }
        }

        next();

    } catch (error) {
        console.error('Error adding enterprise:', error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", err: error.message });
    }
};

// Add gateway empty field check
exports.CheckGateway = async (req, res, next) => {
    const { EnterpriseInfo, OnboardingDate, GatewayID, NetworkSSID, NetworkPassword, EnterpriseUserID } = req.body;
    try {

        if (!EnterpriseInfo) {
            return res.status(401).json({ success: false, message: "Enterprise Information is required!", key: "EnterpriseInfo" });

        }
        if (!OnboardingDate) {
            return res.status(401).json({ success: false, message: "Onboarding Date is required!", key: "OnboardingDate" });

        }
        if (!GatewayID) {
            return res.status(401).json({ success: false, message: "GatewayID Date is required!", key: "GatewayID" });

        }
        if (!NetworkSSID) {
            return res.status(401).json({ success: false, message: "NetworkSSID is required!", key: "NetworkSSID" });

        }
        if (!NetworkPassword) {
            return res.status(401).json({ success: false, message: "Network Password is required!", key: "NetworkPassword" });

        }
        if (!EnterpriseUserID) {
            return res.status(401).json({ success: false, message: "Enterprise User is required!", key: "EnterpriseUser" });

        }

        const ExsistingGateway = await GatewayModel.findOne({ GatewayID });
        if (ExsistingGateway) {
            return res.status(409).json({ success: false, message: 'A gateway with the provided ID already exists. Please choose a different ID.', key: 'GatewayID' });
        }

        next();

    } catch (error) {
        console.error('Error adding enterprise:', error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", err: error.message });
    }
};