const EnterpriseAdminModel = require('../../models/enterprise.model');

exports.adminEmptyCheck = async (req, res, next) => {
    const { EnterpriseName, Email, Name, Phone, Address } = req.body;
    try {
        if (!(EnterpriseName && Email && Name && Phone && Address)) {
            return res.status(400).send({ success: false, message: 'All Fields Are required!' });
        }
        next();
    } catch (error) {
        console.log("enterprise.middleware.adminEmptyCheck===>", error.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
    }
}


exports.duplicateAdminCheck = async (req, res, next) => {
    const { Email, Phone } = req.body;
    try {
        
        next();
    } catch (error) {
        console.log("enterprise.middleware.adminEmptyCheck===>", error.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
    }
}