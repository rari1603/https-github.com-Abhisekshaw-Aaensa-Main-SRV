const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema
const GatewaySchema = new mongoose.Schema({
    EnterpriseName: { type: String },
    EnterpriseID: {
        type: Schema.Types.ObjectId,
        ref: "Enterprise",
        require: true
    },
    State: {
        type: Schema.Types.ObjectId,
        ref: "State",
        require: true
    },
    Location: {
        type: Schema.Types.ObjectId,
        ref: "Location",
        require: true
    },
    OnboardingDate: { type: String },
    GatewayID: { type: String },
    NetworkSSID: { type: String },
    NetworkPassword: { type: String },
    EnterpriseUserID: {
        type: Schema.Types.ObjectId,
        ref: "EnterpriseUser"
    },
    // GatewayName: { type: String },
    // Description: { type: String },
    // Switch: { type: Boolean, default: null },
    isDelete: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const GatewayModel = mongoose.model('Gateway', GatewaySchema);

module.exports = GatewayModel;
