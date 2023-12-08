const mongoose = require('mongoose');

const GatewaySchema = new mongoose.Schema({
    GatewayID: { type: String },
    GatewayName: { type: String },
    Description: { type: String },
    Switch: { type: Boolean },
    // Other relevant fields for Gateway entity
});

const GatewayModel = mongoose.model('Gateway', GatewaySchema);

module.exports = GatewayModel;
