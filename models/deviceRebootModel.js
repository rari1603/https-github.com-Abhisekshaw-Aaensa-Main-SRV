const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define a new schema for storing only GatewayID, storeTime, and receivedTime
const DeviceRebootStatus = new mongoose.Schema({
    GatewayID: {
        type: String,
        required: true
    },
    storeTime: {
        type: Date,
        default: Date.now,  // Automatically stores the time when the document is created
    },
    receivedTime: {
        type: Date,  // You can pass this value when you create the document
        required: true,
    }
}, { timestamps: true });

// Create a new model for GatewayStatus
const DeviceRebootStatusModel = mongoose.model('DeviceRebootStatus', DeviceRebootStatus);

module.exports = DeviceRebootStatusModel;
