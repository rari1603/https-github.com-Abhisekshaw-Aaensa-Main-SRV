const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OptimizerDefaultSettingValue = new Schema({
    FirstPowerOnObservationTime: { type: String },
    MaximumObservationTime: { type: String },
    OptimizationOnTime: { type: String },
    ThermostateInterval: { type: String },
    SteadyStateTimeRoomTemperatureTolrence: { type: String },
    SteadyStateCoilTemperatureTolerance: { type: String },
    isDelete: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const OptimizerDefaultSettingValueModel = mongoose.model('OptimizerDefaultSettingValue', OptimizerDefaultSettingValue);

module.exports = OptimizerDefaultSettingValueModel;
