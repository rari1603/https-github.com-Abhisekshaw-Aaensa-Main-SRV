const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema

const moment = require('moment-timezone');
const EnterpriseStateSchema = new mongoose.Schema({
    Enterprise_ID: { // primary _id
        type: Schema.Types.ObjectId,
        ref: "Enterprise",
        require: true
    },
    State_ID: { // primary _id
        type: Schema.Types.ObjectId,
        ref: "State",
        require: true
    },
    isDelete: {
        type: Boolean,
        default: false
    }
    // Other relevant fields for Enterprise entity
}, { timestamps: true });


// Middleware to convert timestamps to IST before saving
EnterpriseStateSchema.pre('save', function (next) {
    // Convert timestamps to IST
    this.createdAt = moment(this.createdAt).tz('Asia/Kolkata');
    this.updatedAt = moment(this.updatedAt).tz('Asia/Kolkata');
    next();
});

const EnterpriseStateModel = mongoose.model('EnterpriseState', EnterpriseStateSchema);

module.exports = EnterpriseStateModel;
