
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OptimizerByPass = new mongoose.Schema({

    OptimizerId: {
        type: String,
        required: true,
        index: true
    },
    GatewayID: {

        type: String,
        ref: "gateway",
        index: true

    },
    ByPassType: { type: String, required: true },
    startTime: { type: Number },
    endTime: { type: Number },      // Updated to String
    Status: { type: String },
    deviceStatus: { type: String, default: null },
}, { timestamps: true });

const OptimizerByPassModel = mongoose.model('OptimizerByPass', OptimizerByPass);

module.exports = OptimizerByPassModel;