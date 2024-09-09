const mongoose = require('mongoose');
const { Schema } = mongoose;

const messageSchema = new Schema({
    MessageId: { type: String, required: true }, // UUID
    OptimizerId: { type: String, default: null }, // UUID, optional for Gateway
    GatewayID: { type: String, required: true }, // UUID
    Details: {
        ACTonnage: { type: Number, default: null }, // Only for Optimizer
        AC_Energy: { type: Number, default: null }, // Only for Optimizer
    },
    Location: { type: String, default: '' }, // Only for Gateway
    State: { type: String, default: '' },    // Only for Gateway
    OnboardingDate: { type: String, default: null }, // Only for Gateway (DD-MM-YYYY)
    Switch: { type: Boolean, default: null }, // Only for Gateway
    Time: { type: Date, required: true }, // Time of the event
    MessageTime: { type: Date, required: true }, // Time the message was generated
    Action: { type: String, enum: ['add', 'delete', 'update'], required: true }, // Action type
    Type: { type: String, enum: ['Optimizer', 'Gateway'], required: true } // Type of message
}, { timestamps: true });

// Export the model
module.exports = mongoose.model('OGConfig', messageSchema);
