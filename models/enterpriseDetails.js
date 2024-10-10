const mongoose = require('mongoose');

const EnterpriseDetailsSchema = new mongoose.Schema({
    enterpriseId: {
        type: String,
    },
    enterprisename: { type: String },
    stateId: {
        type: String,
    },
    statename: { type: String },
    locationId: {
        type: String,
    },
    locationname: { type: String },
    gatewayId: {
        type: String,
    },
    gatewayname: { type: String },
    optimizerId: {
        type: String,
    },
    optimizername: { type: String },
}, { timestamps: true });

const EnterpriseDetailsModel = mongoose.model('EnterpriseDetails', EnterpriseDetailsSchema);

module.exports = EnterpriseDetailsModel;
