const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema
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

const EnterpriseModel = mongoose.model('Enterprise', EnterpriseSchema);

module.exports = EnterpriseModel;
