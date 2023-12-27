const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema

const GatewayLogSchema = new mongoose.Schema({

    Time: { type: Date, default: Date.now },
    GatewayID: {
        type: Schema.Types.ObjectId,
        ref: "Gateway",
        required: true
    },
    OptimizerID: {
        type: Schema.Types.ObjectId,
        ref: "Optimizer",
        required: true
    },
    OptimizerMode: { type: String },
    RoomTemperature: { type: Number },
    CoilTemperature: { type: Number },
    Phases: {
        Ph1: {
            Voltage: { type: Number },
            Current: { type: Number },
            ActivePower: { type: Number },
            PowerFactor: { type: Number },
            ApparentPower: { type: Number },
        },
        Ph2: {
            Voltage: { type: Number },
            Current: { type: Number },
            ActivePower: { type: Number },
            PowerFactor: { type: Number },
            ApparentPower: { type: Number },
        },
        Ph3: {
            Voltage: { type: Number },
            Current: { type: Number },
            ActivePower: { type: Number },
            PowerFactor: { type: Number },
            ApparentPower: { type: Number },
        },
    },
    Humidity: { type: Number },
    KVAH: { type: Number },
    KWH: { type: Number },
    PF: { type: Number },
    ByPass: { type: Boolean, default: false },
    isDelete: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

// const DataLogModel = mongoose.model('DataLog', DataLogSchema);
const GatewayLogModel = mongoose.model('GatewayLog', GatewayLogSchema);

module.exports = GatewayLogModel;


// OK