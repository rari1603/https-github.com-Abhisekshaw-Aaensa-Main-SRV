const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema

const GatewayLogSchema = new mongoose.Schema({

    GatewayID: {
        type: Schema.Types.ObjectId,
        ref: "Gateway",
        required: true
    },
    TimeStamp: { type: String, required: true },
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
    KVAH: { type: Number },
    KWH: { type: Number },
    PF: { type: Number },
    isDelete: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

// const DataLogModel = mongoose.model('DataLog', DataLogSchema);
const GatewayLogModel = mongoose.model('GatewayLog', GatewayLogSchema);

module.exports = GatewayLogModel;