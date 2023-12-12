const User = require('../models/user.model');
const bcrypt = require('bcrypt');

exports.HandleLoginError = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(401).send({ success: false, message: !email ? 'Email is required!' : 'Password is required!' });
        }

        const user = await User.findOne({ email });
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).send({ success: false, message: !user ? 'User not found!' : 'Invalid password!' });
        }

        next();
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
    }
};

exports.ForgetPasswordValidation = async (req, res, next) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(401).send({ success: false, message: 'Email is required!' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).send({ success: false, message: 'User not found!' });
        }

        next();
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
    }
}
