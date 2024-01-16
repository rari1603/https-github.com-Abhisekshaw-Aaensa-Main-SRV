const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema
const OptimizerSchema = new mongoose.Schema({
    GatewayId: {
        type: Schema.Types.ObjectId,
        ref: 'Gateway',
        required: true
    },
    OptimizerID: { type: String, unique: true },
    OptimizerName: { type: String }, //NickName
    // Description: { type: String },
    isBypass: { type: Boolean, default: false }, // For bypass
    isSetting: { type: Boolean, default: false }, // For set
    isReset: { type: Boolean, default: false }, // For reset
    isDelete: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const OptimizerModel = mongoose.model('Optimizer', OptimizerSchema);

module.exports = OptimizerModel;
