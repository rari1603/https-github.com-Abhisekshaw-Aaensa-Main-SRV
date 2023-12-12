const User = require('../models/user.model');
const bcrypt = require('bcrypt');

class UserController {
    static async register(req, res) {
        return res.send({
            message: 'Sorry! We are not accepting new registration!. contact webmaster',
        });
        try {
            const { username, email, role, password, type, permission, enterpriseUserId } = req.body;
            // console.log(req.body);
            // return;
            // Validate input
            if (!username || !email || !password) {
                return res.status(400).send({ status: 400, message: 'Invalid input. Username, email, and password are required.' });
            }

            // Check if the email already exists
            const existingUser = await User.findOne({ email });

            // If the email already exists, return an error
            if (existingUser) {
                return res.status(409).send({ status: 409, message: 'Email already exists' });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create a new user document
            const newUser = await User.create({
                username,
                email,
                role,
                type,
                permission,
                enterpriseUserId,
                password: hashedPassword
            });

            // Exclude password field from user object
            const userWithoutPassword = { ...newUser._doc };
            delete userWithoutPassword.password;

            // Send a success response
            res.send({
                message: 'Registration successful',
                saveUser: userWithoutPassword
            });
        } catch (error) {
            console.error(error);
            res.status(500).send({ status: 500, message: 'Internal Server Error' });
        }
    }
}

module.exports = UserController;
