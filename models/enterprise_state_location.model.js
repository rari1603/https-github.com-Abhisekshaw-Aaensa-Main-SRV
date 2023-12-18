const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema
const EnterpriseStateLocationSchema = new mongoose.Schema({
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
    LocationName: { type: String },
    isDelete: {
        type: Boolean,
        default: false
    }
    // Other relevant fields for Enterprise entity
}, { timestamps: true });

const EnterpriseStateLocationModel = mongoose.model('EnterpriseStateLocation', EnterpriseStateLocationSchema);

module.exports = EnterpriseStateLocationModel;
