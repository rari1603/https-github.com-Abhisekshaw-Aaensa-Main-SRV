const mongoose = require('mongoose');
const GatewayModel = require('../models/gateway.model');

const EnterpriseID = new mongoose.Types.ObjectId("66d6a882b7d83af6a1ba0865");

exports.Data = async () => {
    try {
        const gateways = await GatewayModel.find({
            EnterpriseUserID: EnterpriseID
        });

        // Check if gateways were found
        if (gateways.length === 0) {
            console.log('No gateways found for the given EnterpriseID.');
            return []; // Return empty array if no gateways
        }

        // Extract the _id fields and return them as an array
        const gatewayIds = gateways.map(gateway => gateway._id);
        return gatewayIds;
        
    } catch (error) {
        console.error('Error fetching gateways:', error);
        return []; // Return an empty array in case of error
    }
};
