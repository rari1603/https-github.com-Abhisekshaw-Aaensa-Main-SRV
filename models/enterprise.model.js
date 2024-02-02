const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema
const moment = require('moment-timezone');

const EnterpriseSchema = new mongoose.Schema({
    EnterpriseName: { type: String },
    ContactInfo: {
        Email: { type: String },
        Name: { type: String },
        Phone: { type: String },
        // Address: { type: String, default: null },
        // Other contact-related fields
    },
    OnboardingDate: { type: String },
    isDelete: {
        type: Boolean,
        default: false
    }
    // Other relevant fields for Enterprise entity
}, { timestamps: true });


// Middleware to convert timestamps to IST before saving
EnterpriseSchema.pre('save', function (next) {
    // Convert timestamps to IST
    this.createdAt = moment(this.createdAt).tz('Asia/Kolkata');
    this.updatedAt = moment(this.updatedAt).tz('Asia/Kolkata');
    next();
});

const EnterpriseModel = mongoose.model('Enterprise', EnterpriseSchema);

module.exports = EnterpriseModel;
