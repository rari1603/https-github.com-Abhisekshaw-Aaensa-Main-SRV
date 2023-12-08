const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class UserController {

    static async index(req, res) {
        res.status(200).json({
            "message": "Server says hello!"
        });
    }

    static async manager(req, res) {
        console.log('Route name:', req.route.name);
        res.status(200).json({
            "message": "Server says hello Manager!"
        });
    }

    static async create(req, res) {
        const user = new User(req.body);

        await user.save();

        res.send(user);
    }

    static async register(req, res) {

        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;
        const user_type = "user";

        // Validate the username, email, and password



        // Check if the username already exists
        const user = await User.findOne({ email });

        // If the username already exists, return an error
        if (user) {
            return res.status(409).send('Email already exists');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user document
        const newUser = {
            username,
            email,
            password: hashedPassword,
            user_type
        };

        // Insert the new user document into the database
        const saveUser = new User(newUser);;
        await saveUser.save();
        // Send a success response
        res.send({
            message: 'Registration successful',
            saveUser,
            newUser
        });
    };

    static async login(req, res) {
        const username = req.body.username;
        const password = req.body.password;

        // Validate the username and password

        // Find the user in the database
        const user = await User.findOne({ username });

        // If the user does not exist, return an error
        if (!user) {
            return res.status(401).send('Invalid username or password');
        }

        // Compare the password
        const isPasswordValid = bcrypt.compare(password, user.password);

        // If the password is invalid, return an error
        if (!isPasswordValid) {
            return res.status(401).send('Invalid username or password');
        }

        // Generate a JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        // Set the token in the cookie
        res.cookie('token', token, {
            httpOnly: true,
            expires: new Date(Date.now() + 60 * 60 * 1000),
        });


        // Exclude password field from user object
        const userWithoutPassword = { ...user._doc };
        delete userWithoutPassword.password;

        // Send a success response
        res.send({
            message: 'Login successful',
            user: userWithoutPassword,
        });
    }
}

module.exports = UserController;