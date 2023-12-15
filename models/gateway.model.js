const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema
const GatewaySchema = new mongoose.Schema({
    GatewayID: { type: String },
    GatewayName: { type: String },
    Description: { type: String },
    Switch: { type: Boolean, default: null },
    Location: { type: String },
    State: { type: String },
    EnterpriseName: { type: String },
    EnterpriseUserID: { type: String },
    NetworkSSID: { type: String },
    NetworkPassword: { type: String },
    isDelete: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const GatewayModel = mongoose.model('Gateway', GatewaySchema);

module.exports = GatewayModel;
