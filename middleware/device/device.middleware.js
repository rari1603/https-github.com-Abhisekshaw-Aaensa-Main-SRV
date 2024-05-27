const EnterpriseStateModel = require('../../models/enterprise_state.model');
const EnterpriseStateLocationModel = require('../../models/enterprise_state_location.model');
const GatewayModel = require('../../models/gateway.model');
const OptimizerModel = require('../../models/optimizer.model');


// check enterprise state
exports.CheckEntState = async (req, res, next) => {
    const { Enterprise_ID, State_ID } = req.body;
    const { ent_state_id } = req.params;

    try {

        if (!Enterprise_ID) {
            return res.status(401).json({ success: false, message: "Enterprise is required!", key: "Enterprise_ID" });

        }
        if (!State_ID) {
            return res.status(401).json({ success: false, message: "State is required!", key: "State_ID" });

        }

        if (!ent_state_id) {
            const existingEntState = await EnterpriseStateModel.findOne({ Enterprise_ID, State_ID });
            if (existingEntState) {
                return res.status(401).json({ success: false, message: "State already added under this enterprise!" });
            }
        }
        next();

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", err: error.message });
    }
};

// check enterprise state location
exports.CheckEntStateLocation = async (req, res, next) => {
    const { Enterprise_ID, State_ID, LocationName, Address } = req.body;
    const { location_id } = req.params;
    console.log(req.body, "=========");
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
        if (!Address) {
            return res.status(401).json({ success: false, message: "An Address is required!", key: "Address" });

        }


        if (!location_id) {
            const lowerCaseAddressName = Address.toLowerCase();
            // Assuming EnterpriseStateLocationModel is your Mongoose model
            const allLocations = await EnterpriseStateLocationModel.find({});
            // Check for existing records with the lowercase address name
            for (const location of allLocations) {
                const dbLocationName = location.Address.toLowerCase();
                if (lowerCaseAddressName === dbLocationName) {
                    return res.status(401).json({ success: false, message: "Same address already added under this location.", key: "Address" });
                }
            }
        }

        next();

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", err: error.message });
    }
};

// Add gateway empty field check
exports.CheckGateway = async (req, res, next) => {
    let { EnterpriseInfo, OnboardingDate, GatewayID, NetworkSSID, NetworkPassword, EnterpriseUserID } = req.body;
    const { gateway_id } = req.params;

    // Remove blank spaces from NetworkSSID, NetworkPassword, and GatewayID
    NetworkSSID = NetworkSSID.trim().replace(/\s+/g, '');
    NetworkPassword = NetworkPassword.trim().replace(/\s+/g, '');
    GatewayID = GatewayID.trim().replace(/\s+/g, '');


    try {
        if (!EnterpriseInfo) {
            return res.status(401).json({ success: false, message: "Enterprise Information is required!", key: "EnterpriseInfo" });
        }
        if (!OnboardingDate) {
            return res.status(401).json({ success: false, message: "Onboarding Date is required!", key: "OnboardingDate" });
        }
        if (!GatewayID) {
            return res.status(401).json({ success: false, message: "GatewayID is required!", key: "GatewayID" });
        }
        if (!EnterpriseUserID) {
            return res.status(401).json({ success: false, message: "Enterprise User is required!", key: "EnterpriseUser" });
        }
        if (!gateway_id) {
            const ExistingGateway = await GatewayModel.findOne({ GatewayID });
            if (ExistingGateway) {
                return res.status(409).json({ success: false, message: 'A gateway with the provided ID already exists. Please choose a different ID.', key: 'GatewayID' });
            }
        }

        if (NetworkSSID === "SC20Linux" && NetworkPassword === "12345678") {
            // Allow the specified SSID and password
            req.body = { EnterpriseInfo, OnboardingDate, GatewayID, NetworkSSID, NetworkPassword, EnterpriseUserID };
            return next();
        }

        // Additional validation for NetworkSSID
        if (!NetworkSSID || NetworkSSID.length <= 8) {
            return res.status(401).json({ success: false, message: "NetworkSSID should contain a minimum of 8 characters!", key: "NetworkSSID" });
        }

        // Additional validation for NetworkPassword
        if (!NetworkPassword || NetworkPassword.length <= 8 || !(/^(?=.*[@_!#*])[A-Za-z0-9@_!#*]+$/g.test(NetworkPassword))) {
            return res.status(401).json({ success: false, message: "Network Password should contain a minimum of 8 characters and include at least one of @, _, !, #, or *", key: "NetworkPassword" });
        }


        // Passing processed data to the controller
        req.body = { EnterpriseInfo, OnboardingDate, GatewayID, NetworkSSID, NetworkPassword, EnterpriseUserID };
        next();

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", err: error.message });
    }
};

// Add optimizer empty field check
exports.CheckOptimizer = async (req, res, next) => {
    let { GatewayId, OptimizerID, OptimizerName, ACTonnage, Fan_consumption, AC_Energy } = req.body;
    const { optimizer_id } = req.params;

    // Remove blank spaces from OptimizerID

    OptimizerID = OptimizerID.trim().replace(/\s+/g, '');
    ACTonnage = /[a-zA-Z@#$%^&*!'"{}|`~;:,<>?/+=-]/.test(ACTonnage) ? "Format" : ACTonnage.trim();
    AC_Energy = /[a-zA-Z@#$%^&*!'"{}|`~;:,<>?/+=-]/.test(AC_Energy) ? "Format" : AC_Energy.trim();
    Fan_consumption = /[a-zA-Z@#$%^&*!'"{}|`~;:,<>?/+=-]/.test(String(Fan_consumption)) ? "Format" : (typeof Fan_consumption === 'string' ? Fan_consumption.trim() : Fan_consumption);
    GatewayId = GatewayId.trim().replace(/\s+/g, '');

    try {

        if (!GatewayId) {
            return res.status(401).json({ success: false, message: "GatewayId is required!", key: "GatewayId" });

        }
        if (!OptimizerID) {
            return res.status(401).json({ success: false, message: "OptimizerID is required!", key: "OptimizerID" });

        }
        if (!OptimizerName) {
            return res.status(401).json({ success: false, message: "Optimizer name is required!", key: "OptimizerName" });

        }
        if (ACTonnage === "Format") {
            return res.status(401).json({ success: false, message: "Enter a valid Input!", key: "ACTonnage" });

        }

        if (!ACTonnage) {
            return res.status(401).json({ success: false, message: "AC Tonnage is required!", key: "ACTonnage" });

        }
        if (AC_Energy === "Format") {
            return res.status(401).json({ success: false, message: "Enter a valid Input!", key: "AC_Energy" });

        }
        if (!AC_Energy) {
            return res.status(401).json({ success: false, message: "AC Energy is required!", key: "AC_Energy" });

        }
        if (Fan_consumption === "Format") {
            return res.status(401).json({ success: false, message: "Enter a valid Input!", key: "Fan_consumption" });

        }
        if (!Fan_consumption) {
            return res.status(401).json({ success: false, message: "Fan Consumption is required!", key: "Fan_consumption" });

        }
        if (!optimizer_id) {
            const ExistingOptimizer = await OptimizerModel.findOne({ OptimizerID });
            if (ExistingOptimizer) {
                return res.status(409).json({ success: false, message: 'An optimizer with the provided ID already exists. Please choose a different ID.', key: 'OptimizerID' });
            }
        }

        // Passing processed data to the controller
        req.body = { GatewayId, OptimizerID, OptimizerName, ACTonnage, Fan_consumption, AC_Energy };
        next();

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", err: error.message });
    }
};