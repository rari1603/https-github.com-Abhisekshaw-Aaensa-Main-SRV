const EnterpriseStateModel = require('../../models/enterprise_state.model');
const EnterpriseStateLocationModel = require('../../models/enterprise_state_location.model');
const GatewayModel = require('../../models/gateway.model');
const OptimizerModel = require('../../models/optimizer.model');


// AddEnterpriseState
exports.AddEnterpriseState = async (req, res) => {
    const { Enterprise_ID, State_ID } = req.body;
    try {
        const NewEntState = new EnterpriseStateModel({ Enterprise_ID, State_ID });

        await NewEntState.save();
        return res.status(201).json({ success: true, message: "Enterprise state added successfully." });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", err: error.message });
    }
};

// AddEnterpriseStateLocation
exports.AddEnterpriseStateLocation = async (req, res) => {
    const { Enterprise_ID, State_ID, LocationName } = req.body;
    try {
        const NewEntStateLocation = new EnterpriseStateLocationModel({ Enterprise_ID, State_ID, LocationName });

        await NewEntStateLocation.save();
        return res.status(201).json({ success: true, message: "Enterprise Location added successfully." });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", err: error.message });
    }
}

// Add gateway
exports.AddGateway = async (req, res) => {
    const { EnterpriseInfo, OnboardingDate, GatewayID, NetworkSSID, NetworkPassword, EnterpriseUserID } = req.body;
    try {
        const NewGateway = new GatewayModel({
            EnterpriseInfo,
            OnboardingDate,
            GatewayID,
            NetworkSSID,
            NetworkPassword,
            EnterpriseUserID,
            isDelete: false,
            isConfigure: false,
        });

        await NewGateway.save();
        return res.status(201).json({ success: true, message: "Gateway added successfully." });

    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
}

// Add Optimizer
exports.AddOptimizer = async (req, res) => {
    const { GatewayId, OptimizerID, OptimizerName } = req.body;
    try {
        const GATEWAY = await GatewayModel.findOne({ GatewayID: GatewayId });
        const NewOptimizer = new OptimizerModel({
            GatewayId: GATEWAY._id, // primary _id of that Gateway
            OptimizerID,
            OptimizerName,
            Switch: false,
            isDelete: false,
        });

        await NewOptimizer.save();
        return res.status(201).json({ success: true, message: "Optimizer added successfully." });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
}

// Update gateway
exports.UpdateGateway = async (req, res) => {
    const { EnterpriseInfo, OnboardingDate, GatewayID, NetworkSSID, NetworkPassword, EnterpriseUserID } = req.body;
    const { gateway_id } = req.params;

    try {
        const UpdatedGateway = await GatewayModel.findByIdAndUpdate({ _id: gateway_id },
            {
                EnterpriseInfo,
                OnboardingDate,
                GatewayID,
                NetworkSSID,
                NetworkPassword,
                EnterpriseUserID
            },
            { new: true } // This option returns the modified document rather than the original
        );

        if (!UpdatedGateway) {
            return res.status(404).json({ success: false, message: "Gateway not found." });
        }

        return res.status(200).json({ success: true, message: "Gateway updated successfully." });

    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
}