const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema
const GatewaySchema = new mongoose.Schema({
    // EnterpriseName: { type: String },
    EnterpriseInfo: { // primary _id of EnterpriseStateLocation schema/model
        type: Schema.Types.ObjectId,
        ref: "EnterpriseStateLocation",
        require: true
    },
    OnboardingDate: { type: String },
    GatewayID: { type: String, unique: true },
    NetworkSSID: { type: String },
    NetworkPassword: { type: String },
    EnterpriseUserID: {
        type: Schema.Types.ObjectId,
        ref: "EnterpriseUser"
    },
    isDelete: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const GatewayModel = mongoose.model('Gateway', GatewaySchema);

module.exports = GatewayModel;
