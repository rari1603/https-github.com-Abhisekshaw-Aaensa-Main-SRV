const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OptimizerOnOffSchema = new Schema({
    optimizerId: {
        type: Schema.Types.ObjectId, // Assuming optimizerId is a reference to another collection
        required: true,
        ref: 'Optimizer' // Reference to the Optimizer collection, if applicable
    },
    starttime: {
        type: Number,
        required: true
    },
    endtime: {
        type: Number
    },
    acstatus: {
        type: String,
        enum: ['ON', 'OFF', '--'], // Restricting values to "ON", "OFF", or "--"
        required: true
    },
    lastmsgtime: {
        type: Number
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

const OptimizerOnOff = mongoose.model('OptimizerOnOff', OptimizerOnOffSchema);

module.exports = OptimizerOnOff;
