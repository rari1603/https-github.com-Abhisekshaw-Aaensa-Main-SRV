const EnterpriseAdminModel = require('../../models/enterprise.model');


// Check empty filed while adding data in EnterpriseAdmin 
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


// Check duplicate admin by email & phone 
exports.duplicateAdminCheck = async (req, res, next) => {
    const { Email, Phone } = req.body;
    try {
        const existingAdminEmail = await EnterpriseAdminModel.findOne({ 'ContactInfo.Email': Email });
        const existingAdminPhone = await EnterpriseAdminModel.findOne({ 'ContactInfo.Phone': Phone });

        if (existingAdminEmail) {
            return res.status(409).json({ success: false, message: 'Admin Already Exists With This Email ID' });
        }
        if (existingAdminPhone) {
            return res.status(409).json({ success: false, message: 'Admin Already Exists With This Phone Number' });
        }

        next();
    } catch (error) {
        console.log("enterprise.middleware.adminDuplicateCheck===>", error.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
    }
};


// Check empty filed while adding data in EnterpriseUser 
exports.userEmptyCheck = async (req, res, next) => {
    const { EnterpriseID, GatewayIDs, StateID, LocationID } = req.body;

    try {
        if (!(EnterpriseID && GatewayIDs && StateID && LocationID)) {
            return res.status(400).send({ success: false, message: 'All Fields Are required!' });
        }
        next();
    } catch (error) {
        console.log("enterprise.middleware.userEmptyCheck===>", error.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
    }
}
