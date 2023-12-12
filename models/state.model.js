const mongoose = require('mongoose');

const StateSchema = new mongoose.Schema({
    StateName: String,
    // Other relevant fields for State entity
});

const StateModel = mongoose.model('State', StateSchema);

module.exports = StateModel;
