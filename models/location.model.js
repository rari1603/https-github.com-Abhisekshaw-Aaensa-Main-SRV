const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
    LocationName: String,
    Address: String,
    // Other relevant fields for Location entity
});

const LocationModel = mongoose.model('Location', LocationSchema);

module.exports = LocationModel;
