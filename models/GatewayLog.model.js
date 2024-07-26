const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema
const moment = require('moment-timezone');

const GatewayLogSchema = new mongoose.Schema({

    GatewayID: {
        type: Schema.Types.ObjectId,
        ref: "Gateway",
        required: true,
        index: true // Create index on GatewayID
    },
    TimeStamp: {
        type: String,
        required: true,
        index: true // Create index on TimeStamp
    },
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

//Compound Index on GatewayID & TimeStamp
GatewayLogSchema.index({ GatewayID: 1, TimeStamp: 1 });

// Middleware to convert timestamps to IST before saving
GatewayLogSchema.pre('save', function (next) {
    // Convert timestamps to IST
    this.createdAt = moment(this.createdAt).tz('Asia/Kolkata');
    this.updatedAt = moment(this.updatedAt).tz('Asia/Kolkata');
    next();
});

// const DataLogModel = mongoose.model('DataLog', DataLogSchema);
const GatewayLogModel = mongoose.model('GatewayLog', GatewayLogSchema);

module.exports = GatewayLogModel;