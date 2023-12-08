const mongoose = require('mongoose');

const DataLogSchema = new mongoose.Schema({
    Time: { type: Date, default: Date.now },
    OptimizerID: { type: String },
    GatewayID: { type: String },
    OptimizerMode: { type: String },
    RoomTemperature: { type: Number },
    CoilTemperature: { type: Number },
    Phases: {
        Ph1: {
            Voltage: { type: Number },
            Current: { type: Number },
            ActivePower: { type: Number },
            PowerFactor: { type: Number },
            ApparentPower: { type: Number },
        },
        Ph2: {
            Voltage: { type: Number },
            Current: { type: Number },
            ActivePower: { type: Number },
            PowerFactor: { type: Number },
            ApparentPower: { type: Number },
        },
        Ph3: {
            Voltage: { type: Number },
            Current: { type: Number },
            ActivePower: { type: Number },
            PowerFactor: { type: Number },
            ApparentPower: { type: Number },
        },
    },
    Humidity: { type: Number },
    AcOnTime: { type: Date, default: null },
    AcOffTime: { type: Date, default: null },
    KVAH: { type: Number },
    KWH: { type: Number },
    PF: { type: Number },
    CustomerName: { type: String },
    Zone: { type: String },
    Location: { type: String },
});

const DataLogModel = mongoose.model('DataLog', DataLogSchema);

module.exports = DataLogModel;
