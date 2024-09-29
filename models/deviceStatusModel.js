const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const moment = require('moment-timezone');
const { type } = require('os');
const DeviceStatus = new mongoose.Schema({

    HardwareID: {
        type: String,
        required: true
    },
    TimeStamp: { type:  String },
    DeviceStatus: { type: String },
    Type: { type: String },
}, { timestamps: true });
const DeviceStatusModel = mongoose.model('DeviceStatus', DeviceStatus);

module.exports = DeviceStatusModel;



