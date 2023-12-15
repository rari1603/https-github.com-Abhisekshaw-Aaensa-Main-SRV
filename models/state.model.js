const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema
const StateSchema = new mongoose.Schema({
    StateName: { type: String },
    isDelete: {
        type: Boolean,
        default: false
    }
    // Other relevant fields for State entity
}, { timestamps: true });

const StateModel = mongoose.model('State', StateSchema);

module.exports = StateModel;
