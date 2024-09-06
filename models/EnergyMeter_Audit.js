const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const moment = require('moment-timezone');
const { type } = require('os');
const EnergyMeterAudit = new mongoose.Schema({

    GatewayId: {
        type: String,
        ref: "Gateway",
        required: true,
        index: true
    },
    TimeStamp: { type: Number },
    KWH: { type: Number },
    KVAH: { type: Number },
    PF: { type: Number },
    runId: { type: Number },
    batchId: { type: Number },
    Type: { type: String },
}, { timestamps: true });

const EnergyMeterAuditModel = mongoose.model('EnergyMeterAudit', EnergyMeterAudit);

module.exports = EnergyMeterAuditModel;