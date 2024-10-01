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
    ByPassSchedule: { type: String, required: true },
    ByPassTime: { type: String },  // Updated to String
    scheduleStartTime: { type: String},  
    scheduleEndTime: { type: String },      // Updated to String
    Status: { type: String}, 
}, { timestamps: true });

const OptimizerByPassModel = mongoose.model('OptimizerByPass', OptimizerByPass);

module.exports = OptimizerByPassModel;