const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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

const OptimizerDefaultSettingValueModel = mongoose.model('OptimizerDefaultSettingValue', OptimizerDefaultSettingValue);

module.exports = OptimizerDefaultSettingValueModel;
