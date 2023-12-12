const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema
const StateSchema = new mongoose.Schema({
    StateName: String,
    // Other relevant fields for State entity
});

const StateModel = mongoose.model('State', StateSchema);

module.exports = StateModel;
