const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Add this line to import Schema
const UserSchema = new mongoose.Schema({
    username: { type: String },
    email: { type: String },
    password: { type: String },
    role: { type: String }, // SuAdmin, Enterprise, SystemInt
    type: { type: String }, // Webmaster, Enterprise, Enterprise-User, System-integrator
    permission: { type: Array }, // *, Add, Edit, Delete, 
    enterpriseUserId: {
        type: Schema.Types.ObjectId,
        ref: "EnterpriseUser",
        require: false
    }

});

const User = mongoose.model('User', UserSchema);

module.exports = User;