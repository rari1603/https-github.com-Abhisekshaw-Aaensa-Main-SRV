const mongoose = require('mongoose');

const EnterpriseSchema = new mongoose.Schema({
    EnterpriseName: { type: String },
    ContactInfo: {
        Email: { type: String },
        Name: { type: String },
        Phone: { type: String },
        Address: { type: String },
        // Other contact-related fields
    },
    // Other relevant fields for Enterprise entity
});

const EnterpriseModel = mongoose.model('Enterprise', EnterpriseSchema);

module.exports = EnterpriseModel;
