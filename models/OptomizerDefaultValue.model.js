// const mongoose = require('mongoose');
// const Schema = mongoose.Schema; // Add this line to import Schema
// const StateSchema = new mongoose.Schema({
//     {
//         "powerOnObservation": {
//             "type": "String"
//         },
//         "maxCompressorTurnoffCountPerHour": {
//             "type": "Number"
//         },
//         "optimizationTime": {
//             "type": "Number"
//         },
//         "steadyStateRoomTemperatureTolerance": {
//             "type": "Number"
//         },
//         "steadyStateCoilTemperatureTolerance": {
//             "type": "Number"
//         },
//         "steadyStateSamplingDuration": {
//             "type": "Number"
//         },
//         "minAirConditionerOffDuration": {
//             "type": "Number"
//         },
//         "airConditionerOffDeclarationMinPeriod": {
//             "type": "Number"
//         },
//         "maxObservationTime": {
//             "type": "Number"
//         },
//         "thermoStateTimeIncrease": {
//             "type": "Number"
//         },
//         "thermoStateInterval": {
//             "type": "Number"
//         }
//     }

//     // Other relevant fields for State entity
// }, { timestamps: true });

// const StateModel = mongoose.model('State', StateSchema);

// module.exports = StateModel;
