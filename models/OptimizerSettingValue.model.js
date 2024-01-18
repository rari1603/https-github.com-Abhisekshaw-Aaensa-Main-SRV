const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OptimizerSettingValueSchema = new Schema({
    optimizerID: {
        type: Schema.Types.ObjectId,
        ref: "Optimizer"
    },
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

const OptimizerSettingValueModel = mongoose.model('OptimizerSettingValue', OptimizerSettingValueSchema);

module.exports = OptimizerSettingValueModel;
