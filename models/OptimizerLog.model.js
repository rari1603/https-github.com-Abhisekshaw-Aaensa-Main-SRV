const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema

const OptimizerLogSchema = new mongoose.Schema({

    OptimizerID: {
        type: Schema.Types.ObjectId,
        ref: "Optimizer",
        required: true
    },
    GatewayID: {
        type: Schema.Types.ObjectId,
        ref: "Gateway",
        required: true
    },
    GatewayLogID: {
        type: Schema.Types.ObjectId,
        ref: "GatewayLog",
        required: true
    },
    // TimeStamp: { type: Date, default: Date.now },
    RoomTemperature: { type: Number },
    Humidity: { type: Number },
    CoilTemperature: { type: Number },
    OptimizerMode: { type: String }, //OptimizerMode and Bypass are same.

    isDelete: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

const OptimizerLogModel = mongoose.model('OptimizerLog', OptimizerLogSchema);

module.exports = OptimizerLogModel;