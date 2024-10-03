const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OptimizerByPass = new mongoose.Schema({

    OptimizerId: {
        type: String,
        required: true, 
        index: true
    },
    GatewayID: {
        type: String
        },
    ByPassType: { type: String, required: true },
    startTime: { type: String},  
    endTime: { type: String },      // Updated to String
    Status: { type: String}, 
}, { timestamps: true });

const OptimizerByPassModel = mongoose.model('OptimizerByPass', OptimizerByPass);

module.exports = OptimizerByPassModel;