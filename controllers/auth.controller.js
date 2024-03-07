const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const { CreateToken, hashValue } = require('../utility/CreateToken');
const { SendMail } = require('../utility/SendMail');
const path = require('path');
const ejs = require('ejs');
const fs = require('fs').promises;
const { decode, ExtractToken } = require('../utility/JwtDecoder');



// login
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


// register
exports.register = async (req, res) => {

    try {
        const { username, email, role, password, type, permission, enterpriseUserId } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).send({ success: false, message: 'Invalid input. Username, email, and password are required.' });
        }

        // Check if the email already exists
        const existingUser = await User.findOne({ email });

        // If the email already exists, return an error
        if (existingUser) {
            return res.status(409).send({ success: false, message: 'Email already exists' });
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
            password: hashedPassword,
            isDelete: false
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
        res.status(500).send({ success: false, message: 'Internal Server Error' });
    }
}


// ForgetPassword
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

        // Call the sendEmail function
        const emailResult = await SendMail(email, "Password recovery mail", renderHTML);
        return res.status(emailResult.success ? 200 : 503).json(emailResult);
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }

}


// ForgetPasswordView
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
            backend_url: url + "/api/auth/forget/password/" + req.params.hashValue,
            perpose: "Forget Password"
        }
        // return res.status(200).json(DATA);
        // return res.send(decodedHashValue);
        return res.render("auth/set_password", {
            title: "Forgot Password",
            DATA
        });
    } catch (error) {
        if (error.message === "jwt expired") {

            const decoded = ExtractToken(req.params.hashValue);
            return res.render("auth/expire", { email: decoded.email, url: process.env.HOST });
        }
        return res.send({ success: false, message: error.message });
    }
}


// ResetNewPassword
exports.ResetNewPassword = async (req, res) => {
    const { _token, password } = req.body;
    try {
        const decodedHashValueEmail = decode("Bearer " + _token).email;
        // const user = await User.findOne({ email: decodedHashValueEmail });
        // return console.log({ MM: decodedHashValueEmail })
        const hashedPassword = await bcrypt.hash(password, 10);
        const filter = { email: decodedHashValueEmail };
        const update = { password: hashedPassword };

        // Use updateOne to update a single document
        const result = await User.updateOne(filter, update);

        console.log(result);
        // return res.status(200).json({
        //     success: true,
        //     message: "Password reset successfully!",
        // });

        return res.render("auth/success", {});
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// EnterpriseUser & System Integrator delete
exports.DeleteUser = async (req, res) => {
    const { user_id } = req.params;
    try {
        const user = await User.findByIdAndUpdate(
            { _id: user_id },
            { isDelete: true }, // Updating isDelete field to true
            { new: true });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        return res.status(200).json({ success: true, message: "User deleted successfully." });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
};

