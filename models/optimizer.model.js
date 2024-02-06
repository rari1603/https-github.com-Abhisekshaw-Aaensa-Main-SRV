const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema
const moment = require('moment-timezone');

const OptimizerSchema = new mongoose.Schema({
    GatewayId: {
        type: Schema.Types.ObjectId,
        ref: 'Gateway',
        required: true
    },
    OptimizerID: { type: String, unique: true },
    OptimizerName: { type: String }, // NickName
    // Description: { type: String },
    isBypass: {
        is_schedule: { type: Boolean, default: false },
        type: { type: Boolean, default: false },
        time: { type: String, default: "" }
    },
    isSetting: { type: Boolean, default: false }, // For set
    isReset: { type: Boolean, default: false }, // For reset
    isDelete: { type: Boolean, default: false }
}, { timestamps: true });

// Middleware to convert timestamps to IST before saving
OptimizerSchema.pre('save', function (next) {
    // Convert timestamps to IST
    this.createdAt = moment(this.createdAt).tz('Asia/Kolkata');
    this.updatedAt = moment(this.updatedAt).tz('Asia/Kolkata');
    next();
});

const OptimizerModel = mongoose.model('Optimizer', OptimizerSchema);

module.exports = OptimizerModel;
