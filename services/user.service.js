const User = require('../models/user');

class UserService {
    static async getUserById(id) {
        const user = await User.findById(id);

        return user;
    }

    static async createUser(user) {
        await User.create(user);
    }
}

module.exports = UserService;