const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for Agenda jobs
const AgendaJobSchema = new Schema({
    name: { type: String, required: true },
    data: {
        runId: { type: Number, default: 0 },
        processStartTime: { type: String },
        window: { type: String },
        start: { type: String },
        end: { type: String },
        actualWindow: { type: String },
        status: { type: String },
    },
    priority: { type: Number, default: 0 },
    shouldSaveResult: { type: Boolean, default: false },
    type: { type: String, default: 'normal' },
    nextRunAt: { type: Date },
    lastModifiedBy: { type: String },
    lockedAt: { type: Date },
    lastRunAt: { type: Date },
    lastFinishedAt: { type: Date },
}, {
    collection: 'agendaJobs', // Use the same collection name as in Agenda
    timestamps: true // Automatically manage createdAt and updatedAt fields
});

// Pre-save hook to increment runId
AgendaJobSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const lastJob = await mongoose.model('AgendaJob').findOne({}).sort({ 'data.runId': -1 });
            // console.log('Last Job:', lastJob);
            this.data.runId = lastJob ? lastJob.data.runId + 1 : 1;
            // console.log('Assigned runId:', this.data.runId);
        } catch (error) {
            console.error('Error in pre-save hook:', error);
            next(error); // Pass the error to the next middleware
        }
    }
    next();
});

module.exports = mongoose.model('AgendaJob', AgendaJobSchema);
