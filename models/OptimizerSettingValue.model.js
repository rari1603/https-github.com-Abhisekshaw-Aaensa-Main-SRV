const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OptimizerSettingValueSchema = new Schema({
    optimizerID: {
        type: Schema.Types.ObjectId,
        ref: "Optimizer"
    },
    powerOnObservation: { type: String },
    maxCompressorTurnoffCountPerHour: { type: String },
    optimizationTime: { type: String },
    steadyStateRoomTemperatureTolerance: { type: String },
    steadyStateCoilTemperatureTolerance: { type: String },
    steadyStateSamplingDuration: { type: String },
    minAirConditionerOffDuration: { type: String },
    airConditionerOffDeclarationMinPeriod: { type: String },
    maxObservationTime: { type: String },
    thermoStateTimeIncrease: { type: String },
    thermoStateInterval: { type: String },
    isDelete: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const OptimizerSettingValueModel = mongoose.model('OptimizerSettingValue', OptimizerSettingValueSchema);

module.exports = OptimizerSettingValueModel;
