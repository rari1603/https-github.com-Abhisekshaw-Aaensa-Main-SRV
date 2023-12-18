const UserModel = require('../models/user.model');
const bcrypt = require('bcrypt');


exports.HandleLoginError = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).send({ success: false, message: !email ? 'Email is required!' : 'Password is required!' });
        }

        const user = await UserModel.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(user ? 401 : 404).send({ success: false, message: !user ? 'User not found!' : 'Invalid password!' });
        }

        next();
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.', err: error.message });
    }
};


exports.ForgetPasswordValidation = async (req, res, next) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).send({ success: false, message: 'Email is required!' });
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(404).send({ success: false, message: 'User not found!' });
        }

        next();
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.', err: error.message });
    }
}


// Check empty fields of User.
exports.emptyUserCheck = async (req, res, next) => {
    const { username, email, password, role, type, permission } = req.body;
    try {
        if (!(username && email && password && role && type && permission)) {
            return res.status(400).send({ success: false, message: 'All Fields Are required!' });
        }
        next();
    } catch (error) {
        console.log("auth.validation.EmptyCheck===>", error.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.', err: error.message });
    }
};


// Check duplicate fields of User.
exports.duplicateUserCheck = async (req, res, next) => {
    const { email } = req.body;
    try {
        const existingEmail = await UserModel.findOne({ email });

        if (existingEmail) {
            return res.status(409).json({ success: false, message: 'This email address is already associated with an account. Please choose a different email.' });
        }
        next();

    } catch (error) {
        console.log("auth.validation.DuplicateCheck===>", error.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.', err: error.message });
    }
}


// Check duplicate fields of User.
exports.duplicateEnterpriseCheck = async (req, res, next) => {
    const { Email } = req.body;
    try {
        const existingEmail = await UserModel.findOne({ email: Email });
        if (existingEmail) {
            return res.status(409).json({ success: false, message: 'This email address is already associated with an account. Please choose a different email.' });
        }
        next();

    } catch (error) {
        console.log("auth.validation.DuplicateCheck===>", error.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.', err: error.message });
    }
}
