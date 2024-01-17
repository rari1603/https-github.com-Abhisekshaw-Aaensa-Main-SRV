const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OptimizerSettingValueSchema = new Schema({
    optimizerID: {
        type: Schema.Types.ObjectId,
        ref: "Optimizer"
    },
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

const OptimizerSettingValueModel = mongoose.model('OptimizerSettingValue', OptimizerSettingValueSchema);

module.exports = OptimizerSettingValueModel;
