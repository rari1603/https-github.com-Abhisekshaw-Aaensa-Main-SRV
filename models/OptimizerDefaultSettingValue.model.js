const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment-timezone');

const OptimizerDefaultSettingValue = new Schema({
    firstPowerOnObservationTime: { type: String },
    maxObservatioTime: { type: String },
    OptimizationOnTime: { type: String },
    thermostatMonitoringInterval: { type: String },
    thermostatMonitoringTimeIncrement: { type: String },
    steadyStateTimeRoomTempTolerance: { type: String },
    steadyStateCoilTempTolerance: { type: String },
    isDelete: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });


// Middleware to convert timestamps to IST before saving
OptimizerDefaultSettingValue.pre('save', function (next) {
    // Convert timestamps to IST
    this.createdAt = moment(this.createdAt).tz('Asia/Kolkata');
    this.updatedAt = moment(this.updatedAt).tz('Asia/Kolkata');
    next();
});

const OptimizerDefaultSettingValueModel = mongoose.model('OptimizerDefaultSettingValue', OptimizerDefaultSettingValue);

module.exports = OptimizerDefaultSettingValueModel;
