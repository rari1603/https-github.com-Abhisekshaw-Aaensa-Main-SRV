const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const { CreateToken, hashValue } = require('../utility/CreateToken');
const nodemailer = require('nodemailer');
const path = require('path');
const ejs = require('ejs');
const fs = require('fs').promises;
const decode = require('../utility/JwtDecoder');




exports.login = async (req, res) => {
    try {
        const email = req.body.email;
        const user = await User.findOne({ email: email });

        const userWithoutPassword = { ...user._doc };
        // hide sensitive data 
        delete userWithoutPassword.password;
        // Generate a JWT token
        const token = CreateToken(userWithoutPassword);

        // Set the token in the cookie with the same expiration time
        res.cookie('token', token, {
            httpOnly: true,
            expires: new Date(Date.now() + 60 * 60 * 1000), // Same expiration time as the JWT
            // secure: true, // This ensures the cookie is sent only over HTTPS
        });

        // Send a success response
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: userWithoutPassword,
            token
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            success: false,
            message: 'Server error!'
        });
    }
}

exports.register = async (req, res) => {

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

exports.ForgetPassword = async (req, res) => {
    const { email } = req.body;
    try {
        // hashValue(email);
        const url = process.env.HOST + "/api/auth/forget/password/" + hashValue(email);
        const ExistingUser = await User.findOne({ email });
        const templatePath = path.resolve('./views/Email/forget_password.ejs');
        const templateContent = await fs.readFile(templatePath, 'utf8');
        // console.log(url);
        // return;
        const renderHTML = ejs.render(templateContent, {
            Name: ExistingUser.username,
            Url: url,
        });

        // Initialize nodemailer
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL_ID,
                pass: process.env.EMAIL_APP_PASSWORD,
            },
        });

        const mailOptions = {
            form: "<no-reply@aaensa.com>",
            to: email,
            subject: "Password recovery mail",
            html: renderHTML
        };

        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                console.error("Error===>", error);
                return res.status(500).json({ success: false, message: 'Error sending email' });
            }
            return res.status(200).json({ success: true, message: "Please check email." });
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }

}

exports.ForgetPasswordView = async (req, res) => {
    try {
        const url = process.env.HOST;
        const decodedHashValue = decode("Bearer " + req.params.hashValue);
        let valid = true;
        let message = "";
        // Check if the token has expired
        const currentTimestamp = Math.floor(Date.now() / 1000); // Get current timestamp in seconds
        if (decodedHashValue.exp && currentTimestamp > decodedHashValue.exp) {
            valid = false
            message = 'Token has expired';
        } else {
            valid = true;
            message = 'Token is still valid';
        }
        const DATA = {
            message,
            valid,
            token: req.params.hashValue,
            backend_url: url + "/api/auth/forget/password/" + req.params.hashValue
        }
        // return res.status(200).json(DATA);
        // return res.send(decodedHashValue);
        return res.render("auth/set_password", {
            title: "Reset Password",
            DATA
        });
    } catch (error) {
        return res.send(error.message);
    }
}

exports.ResetNewPassword = async (req, res) => {
    const { _token, password } = req.body;
    try {
        const decodedHashValueEmail = decode("Bearer " + _token).email;
        // const user = await User.findOne({ email: decodedHashValueEmail });
        const hashedPassword = await bcrypt.hash(password, 10);
        const filter = { email: decodedHashValueEmail };
        const update = { password: hashedPassword };

        // Use updateOne to update a single document
        const result = await User.updateOne(filter, update);

        console.log(result);
        return res.status(200).json({
            success: true,
            message: "Password reset successfully!",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

exports.CreateUser = async (req, res) => {
    console.log(req.body);
    return res.send(req.body)
}


