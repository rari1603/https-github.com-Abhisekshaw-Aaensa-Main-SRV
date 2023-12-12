const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const handleLoginError = (res) => {
    return res.status(401).send({ status: 401, message: 'Invalid username or password' });
};

class UserController {

    static async login(req, res) {
        try {
            const username = req.body.username;
            const password = req.body.password;

            // Validate the username and password

            // Find the user in the database
            const user = await User.findOne({ email: username });

            // If the user does not exist, return an error
            if (!user) {
                return handleLoginError(res);
            }

            // Compare the password
            const isPasswordValid = await bcrypt.compare(password, user.password);

            // If the password is invalid, return an error
            if (!isPasswordValid) {
                return handleLoginError(res);
            }


            // Exclude password field from user object
            const userWithoutPassword = { ...user._doc };
            // hide sensitive data 
            delete userWithoutPassword.password;

            // Generate a JWT token
            const token = jwt.sign({ user: userWithoutPassword }, process.env.JWT_SECRET, {
                expiresIn: '1h',
            });

            // Set the token in the cookie with the same expiration time
            res.cookie('token', token, {
                httpOnly: true,
                expires: new Date(Date.now() + 60 * 60 * 1000), // Same expiration time as the JWT
                // secure: true, // This ensures the cookie is sent only over HTTPS
            });

            // Send a success response
            res.send({
                message: 'Login successful',
                user: userWithoutPassword,
                token
            });
        } catch (error) {
            // Log the error for debugging
            console.error(error);
            // Handle other errors and send a generic message
            res.status(500).send({
                status: 500,
                message: 'Server error!'
            });
        }
    }
}

module.exports = UserController;
