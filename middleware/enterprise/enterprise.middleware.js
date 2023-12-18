// Check empty filed while adding data in EnterpriseAdmin 
exports.adminEmptyCheck = async (req, res, next) => {
    const { EnterpriseName, Email, Name, Phone, OnboardingDate } = req.body;
    try {
        if (!(EnterpriseName && Email && Name && Phone && OnboardingDate)) {
            return res.status(400).send({ success: false, message: 'All Fields Are required!' });
        }
        next();
    } catch (error) {
        console.log("enterprise.middleware.adminEmptyCheck===>", error.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.', err: error.message });
    }
}


// Check empty filed while adding data in EnterpriseUser 
exports.userEmptyCheck = async (req, res, next) => {
    const { username, email, EnterpriseID } = req.body;

    try {
        if (!(username && email && EnterpriseID)) {
            return res.status(400).send({ success: false, message: 'All Fields Are required!' });
        }
        next();
    } catch (error) {
        console.log("enterprise.middleware.userEmptyCheck===>", error.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.', err: error.message });
    }
}
