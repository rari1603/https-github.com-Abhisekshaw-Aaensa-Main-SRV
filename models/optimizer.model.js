const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema
const OptimizerSchema = new mongoose.Schema({
    OptimizerID: { type: String, unique: true },
    GatewayId: {
        type: Schema.Types.ObjectId,
        ref: 'Gateway',
        required: true
    },
    OptimizerName: { type: String },
    Description: { type: String },
    Switch: { type: Boolean }, // For bypass
    NickName: { type: Array }
    // Other relevant fields for Optimizer entity
});

const OptimizerModel = mongoose.model('Optimizer', OptimizerSchema);

module.exports = OptimizerModel;
