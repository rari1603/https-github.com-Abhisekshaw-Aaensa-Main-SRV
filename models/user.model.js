const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String },
    email: { type: String },
    password: { type: String },
    role: { type: String },
    permission: { type: Array },
    enterprise: { type: String }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;