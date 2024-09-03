const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const moment = require('moment-timezone');
const { type } = require('os');
const EnergyMeterAudit = new mongoose.Schema({

    MessageId: {
        type: Schema.Types.ObjectId,
    },
    GatewayId: {
        type: Schema.Types.ObjectId,
        ref: "Gateway",
        required: true,
        index: true
    },
    KWH: { type: Number },
    kVAH: { type: Number },
    PF: { type: Number }
}, { timestamps: true });

const EnergyMeterAuditModel = mongoose.model('EnergyMeterAudit', EnergyMeterAudit);

module.exports = EnergyMeterAuditModel;