const mongoose = require('mongoose');

const OptimizerSchema = new mongoose.Schema({
    OptimizerID: { type: String },
    GatewayId: {
        type: Schema.Types.ObjectId,
        ref: 'Gateway',
        required: true
    },
    OptimizerName: { type: String },
    Description: { type: String },
    Switch: { type: Boolean },
    // Other relevant fields for Optimizer entity
});

const OptimizerModel = mongoose.model('Optimizer', OptimizerSchema);

module.exports = OptimizerModel;
