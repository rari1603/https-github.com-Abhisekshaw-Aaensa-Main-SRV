const OptimizerModel = require('../models/optimizer.model');
const OptimizerDefaultSettingValueModel = require('../models/OptimizerDefaultSettingValue.model');
const OptimizerSettingValueModel = require('../models/OptimizerSettingValue.model');


// Common UpdateSettings functions for both set and reset
const UpdateSettings = async (optimizerIDS, data) => {
    // first get the optimizer default value
    const defaultValue = await OptimizerDefaultSettingValueModel.find();
    let resetValues = {
        firstPowerOnObservationTime: data ? data.firstPowerOnObservationTime : defaultValue.firstPowerOnObservationTime,
        maxObservatioTime: data ? data.maxObservatioTime : defaultValue.maxObservatioTime,
        OptimizationOnTime: data ? data.OptimizationOnTime : defaultValue.OptimizationOnTime,
        thermostatMonitoringInterval: data ? data.thermostatMonitoringInterval : defaultValue.thermostatMonitoringInterval,
        thermostatMonitoringTimeIncrement: data ? data.thermostatMonitoringTimeIncrement : defaultValue.thermostatMonitoringTimeIncrement,
        steadyStateTimeRoomTempTolerance: data ? data.steadyStateTimeRoomTempTolerance : defaultValue.steadyStateTimeRoomTempTolerance,
        steadyStateCoilTempTolerance: data ? data.steadyStateCoilTempTolerance : defaultValue.steadyStateCoilTempTolerance
    };

    return await Promise.all(optimizerIDS.map(async id => {
        resetValues.optimizerID = id.toString();
        await OptimizerModel.findByIdAndUpdate({ _id: id.toString() },
            {
                isReset: data ? false : true,
                isSetting: data ? true : false,
            },
            { new: true } // This option returns the modified document rather than the original
        );

        return await OptimizerSettingValueModel.findOneAndUpdate(
            { optimizerID: id },
            { $set: resetValues },
            { new: true, upsert: true }
        );
    }));
};

module.exports = UpdateSettings;