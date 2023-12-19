const EnterpriseStateModel = require('../../models/enterprise_state.model');
const EnterpriseStateLocationModel = require('../../models/enterprise_state_location.model');


// AddEnterpriseState
exports.AddEnterpriseState = async (req, res) => {
    const { Enterprise_ID, State_ID } = req.body;
    try {
        const NewEntState = new EnterpriseStateModel({ Enterprise_ID, State_ID });

        await NewEntState.save();
        return res.status(201).json({ success: true, message: "Enterprise state added successfully." });

    } catch (error) {
        console.error('Error adding enterprise:', error.message);
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
        console.error('Error adding enterprise:', error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", err: error.message });
    }
}