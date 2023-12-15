const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema
const UserSchema = new mongoose.Schema({
    username: { type: String },
    email: { type: String },
    password: { type: String },
    role: { type: String }, // SuAdmin, Enterprise, SystemInt
    type: { type: String }, // Webmaster, Enterprise, EnterpriseUser, System-integrator
    permission: { type: Array }, // *, Read, Add, Edit, Delete, 
    enterpriseUserId: {
        type: Schema.Types.ObjectId,
        ref: "EnterpriseUser",
        require: false
    },
    isDelete: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

module.exports = User;