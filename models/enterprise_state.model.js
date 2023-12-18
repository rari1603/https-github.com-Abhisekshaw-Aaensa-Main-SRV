const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema
const EnterpriseStateSchema = new mongoose.Schema({
    Enterprise_ID: { // primary _id
        type: Schema.Types.ObjectId,
        ref: "Enterprise",
        require: true
    },
    State_ID: { // primary _id
        type: Schema.Types.ObjectId,
        ref: "State",
        require: true
    },
    isDelete: {
        type: Boolean,
        default: false
    }
    // Other relevant fields for Enterprise entity
}, { timestamps: true });

const EnterpriseStateModel = mongoose.model('EnterpriseState', EnterpriseStateSchema);

module.exports = EnterpriseStateModel;
