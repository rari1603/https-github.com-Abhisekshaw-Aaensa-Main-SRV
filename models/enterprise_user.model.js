const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema

const moment = require('moment-timezone');
const EnterpriseUserSchema = new mongoose.Schema({
    EnterpriseID: {
        type: Schema.Types.ObjectId,
        ref: "Enterprise",
        require: true,
        index: true // Create index on EnterpriseID
    },
    username: { type: String },
    email: { type: String },
    phone: { type: String },
    isDelete: {
        type: Boolean,
        default: false
    }
    // Other relevant fields for EnterpriseUser entity
}, { timestamps: true });

// Middleware to convert timestamps to IST before saving
EnterpriseUserSchema.pre('save', function (next) {
    // Convert timestamps to IST
    this.createdAt = moment(this.createdAt).tz('Asia/Kolkata');
    this.updatedAt = moment(this.updatedAt).tz('Asia/Kolkata');
    next();
});

const EnterpriseUserModel = mongoose.model('EnterpriseUser', EnterpriseUserSchema);

module.exports = EnterpriseUserModel;
