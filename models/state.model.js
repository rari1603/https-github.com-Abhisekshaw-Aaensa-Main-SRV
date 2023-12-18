const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema
const StateSchema = new mongoose.Schema({
    name: { type: String },
    country_code: { type: String },
    iso2: { type: String },
    type: { type: String },
    latitude: { type: String },
    longitude: { type: String },
    isDelete: {
        type: Boolean,
        default: false
    }
    // Other relevant fields for State entity
}, { timestamps: true });

const StateModel = mongoose.model('State', StateSchema);

module.exports = StateModel;
