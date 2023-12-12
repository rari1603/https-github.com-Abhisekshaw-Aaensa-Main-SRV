const mongoose = require('mongoose');

const EnterpriseUserSchema = new mongoose.Schema({
    EnterpriseID: {
        type: Schema.Types.ObjectId,
        ref: "Enterprise",
        require: true
    },
    GatewayIDs: [{
        type: Schema.Types.ObjectId,
        ref: "Gateway",
        require: true
    }],
    StateID: {
        type: Schema.Types.ObjectId,
        ref: "State",
        require: true
    },
    LocationID: {
        type: Schema.Types.ObjectId,
        ref: "Location",
        require: true
    }
    // Other relevant fields for EnterpriseUser entity
});

const EnterpriseUserModel = mongoose.model('EnterpriseUser', EnterpriseUserSchema);

module.exports = EnterpriseUserModel;
