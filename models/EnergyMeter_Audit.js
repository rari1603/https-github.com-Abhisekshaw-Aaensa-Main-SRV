const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const moment = require('moment-timezone');
const { type } = require('os');
const EnergyMeterAudit = new mongoose.Schema({


    GatewayId: {
        type: Schema.Types.ObjectId,
        ref: "Gateway",
        required: true,
        index: true
    },
    TimeStamp: { type: Number },
    KWH: { type: Number },
    kVAH: { type: Number },
    PF: { type: Number },
    runId: { type: Number },
    batchId: { type: Number },
}, { timestamps: true });

const EnergyMeterAuditModel = mongoose.model('EnergyMeterAudit', EnergyMeterAudit);

module.exports = EnergyMeterAuditModel;