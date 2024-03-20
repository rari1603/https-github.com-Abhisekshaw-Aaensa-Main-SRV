const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema
const moment = require('moment-timezone');


const UserSchema = new mongoose.Schema({
    username: { type: String },
    email: { type: String },
    password: { type: String },
    role: { type: String }, // SuAdmin, Enterprise, SystemInt
    type: { type: String }, // Webmaster, Enterprise, EnterpriseUser, System-integrator
    permission: { type: Array }, // *, Read, Add, Edit, Delete, 
    enterpriseId: {
        type: Schema.Types.ObjectId,
        ref: "Enterprise",
        require: false,
        default: null
    },
    enterpriseUserId: {
        type: Schema.Types.ObjectId,
        ref: "EnterpriseUser",
        require: false,
        default: null
    },
    systemIntegratorId: {
        type: Schema.Types.ObjectId,
        ref: "SystemInit",
        require: false,
        default: null
    },
    isDelete: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

// Middleware to convert timestamps to IST before saving
UserSchema.pre('save', function (next) {
    // Convert timestamps to IST
    this.createdAt = moment(this.createdAt).tz('Asia/Kolkata');
    this.updatedAt = moment(this.updatedAt).tz('Asia/Kolkata');
    next();
});

const User = mongoose.model('User', UserSchema);

module.exports = User;