const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema

const moment = require('moment-timezone');

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

// Middleware to convert timestamps to IST before saving
StateSchema.pre('save', function (next) {
    // Convert timestamps to IST
    this.createdAt = moment(this.createdAt).tz('Asia/Kolkata');
    this.updatedAt = moment(this.updatedAt).tz('Asia/Kolkata');
    next();
});

const StateModel = mongoose.model('State1', StateSchema);

module.exports = StateModel;
