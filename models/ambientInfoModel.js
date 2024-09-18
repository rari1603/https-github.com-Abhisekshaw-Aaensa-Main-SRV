const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const moment = require('moment-timezone');
const { type } = require('os');
const AmbientInfo = new mongoose.Schema({

    OID: {
        type: String,
        required: true
    },
    GID: {
        type: String,
        required: true
    },
    TimeStamp: { type: Number },
    TempUT: { type: String },
    AmbTemp: { type: Number },
    AmbHum: { type: Number },
    HumUT: { type: String },
    RunID: { type: Number },
    BatchID: { type: Number },
    Type: { type: String },
}, { timestamps: true });

const AmbientInfoModel = mongoose.model('AmbientInfo', AmbientInfo);

module.exports = AmbientInfoModel;

