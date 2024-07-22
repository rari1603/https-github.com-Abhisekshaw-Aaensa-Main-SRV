const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment-timezone');

const NewApplianceLogSchema = new mongoose.Schema({
    OptimizerID: {
        type: String,
        required: true,
        index: true // Create index on OptimizerID
    },
    CompStatus: {
        type: String,
        enum: ["COMPON", "COMPOFF+OPT", "COMPOFF+THRMO", "COMPOFF", "--"]
    },
    OptimizationMode: {
        type: String,
        enum: ["OPTIMIZATION", "NON-OPTIMIZATION", "--"]
    },
    Flag: {
        type: String,
        default: "ONLINE"
    },
    ACStatus: {
        type: String,
        enum: ["OFF", "ON", "UNKNOWN"]
    },
    TimeStamp: {
        type: String,
        index: true // Create index on Timestamp
    }
}, { timestamps: true });

// Middleware to convert timestamps to IST before saving
NewApplianceLogSchema.pre('save', function (next) {
    // Convert timestamps to IST
    this.createdAt = moment(this.createdAt).tz('Asia/Kolkata');
    this.updatedAt = moment(this.updatedAt).tz('Asia/Kolkata');
    next();
});


const NewApplianceLogModel = mongoose.model('NewApplianceLog', NewApplianceLogSchema);

module.exports = NewApplianceLogModel;