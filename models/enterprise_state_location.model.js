const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema

const moment = require('moment-timezone');
const EnterpriseStateLocationSchema = new mongoose.Schema({
    Enterprise_ID: { // primary _id
        type: Schema.Types.ObjectId,
        ref: "Enterprise",
        require: true,
        index: true // Create index on EnterpriseID
    },
    State_ID: { // primary _id
        type: Schema.Types.ObjectId,
        ref: "State",
        require: true,
        index: true // Create index on StateId
    },
    LocationName: { type: String },
    Address: { type: String },
    Lat: { type: String, default: false },
    Long: { type: String, default: false },
    isDelete: {
        type: Boolean,
        default: false
    },
    BypassMode: { type: String, default: "" },
}, { timestamps: true });
// Middleware to convert timestamps to IST before saving
EnterpriseStateLocationSchema.pre('save', function (next) {
    // Convert timestamps to IST
    this.createdAt = moment(this.createdAt).tz('Asia/Kolkata');
    this.updatedAt = moment(this.updatedAt).tz('Asia/Kolkata');
    next();
});

const EnterpriseStateLocationModel = mongoose.model('EnterpriseStateLocation', EnterpriseStateLocationSchema);

module.exports = EnterpriseStateLocationModel;
