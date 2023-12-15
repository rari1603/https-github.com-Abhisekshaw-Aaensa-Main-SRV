const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema
const EnterpriseUserSchema = new mongoose.Schema({
    username: { type: String },
    email: { type: String },
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
    },
    isDelete: {
        type: Boolean,
        default: false
    }
    // Other relevant fields for EnterpriseUser entity
}, { timestamps: true });

const EnterpriseUserModel = mongoose.model('EnterpriseUser', EnterpriseUserSchema);

module.exports = EnterpriseUserModel;
