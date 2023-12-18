const StateModel = require('../models/state.model');

exports.getStates = async (req, res) => {
    try {
        const allStatesData = await StateModel.find().sort({ name: 1 }); // Sort by name in ascending order
        return res.status(200).json({ success: true, message: 'Data fetched successfully', data: allStatesData });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: 'Server error!', err: error.message });
    }
};
