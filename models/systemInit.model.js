const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema
const SystemInitSchema = new mongoose.Schema({
    username: { type: String },
    email: { type: String },
    phone: { type: String },
    isDelete: {
        type: Boolean,
        default: false
    }
    // Other relevant fields for EnterpriseUser entity
}, { timestamps: true });

const SystemInitModel = mongoose.model('SystemInit', SystemInitSchema);

module.exports = SystemInitModel;
