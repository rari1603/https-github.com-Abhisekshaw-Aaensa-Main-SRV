const EnterpriseStateModel = require('../../models/enterprise_state.model');


// AddEnterpriseState
exports.AddEnterpriseState = async (req, res) => {
    const { Enterprise_ID, State_ID } = req.body;
    try {

        if (!Enterprise_ID || !State_ID) {
            return res.status(401).json({ success: false, message: "All fields are required!" });

        }
        const existingEntState = await EnterpriseStateModel.findOne({ Enterprise_ID, State_ID });
        if (existingEntState) {
            return res.status(401).json({ success: false, message: "State already added under this enterprise!" });
        } else {
            const NewEntState = new EnterpriseStateModel({ Enterprise_ID, State_ID });

            await NewEntState.save();
            return res.status(201).json({ success: true, message: "Enterprise state added successfully." });
        }


    } catch (error) {
        console.error('Error adding enterprise:', error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", err: error.message });
    }
};
