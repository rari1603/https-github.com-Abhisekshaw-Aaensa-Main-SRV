const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema
const moment = require('moment-timezone');


const GatewaySchema = new mongoose.Schema({
    // EnterpriseName: { type: String },
    EnterpriseInfo: { // primary _id of EnterpriseStateLocation schema/model
        type: Schema.Types.ObjectId,
        ref: "EnterpriseStateLocation",
        require: true
    },
    OnboardingDate: { type: String },
    GatewayID: { type: String, unique: true },
    NetworkSSID: { type: String },
    NetworkPassword: { type: String },
    EnterpriseUserID: { // primary _id of EnterpriseUser schema/model
        type: Schema.Types.ObjectId,
        ref: "EnterpriseUser"
    },
    Switch: { type: Boolean, default: false },
    isDelete: {
        type: Boolean,
        default: false
    },
    isConfigure: { type: Boolean, default: false },
    is_Ready_toConfig: { type: Boolean, default: false },
}, { timestamps: true });


// Middleware to convert timestamps to IST before saving
GatewaySchema.pre('save', function (next) {
    // Convert timestamps to IST
    this.createdAt = moment(this.createdAt).tz('Asia/Kolkata');
    this.updatedAt = moment(this.updatedAt).tz('Asia/Kolkata');
    next();
});
const GatewayModel = mongoose.model('Gateway', GatewaySchema);

module.exports = GatewayModel;
