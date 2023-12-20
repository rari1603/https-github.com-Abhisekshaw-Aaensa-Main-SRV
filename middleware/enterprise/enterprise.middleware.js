// Check empty filed while adding data in EnterpriseAdmin 
exports.adminEmptyCheck = async (req, res, next) => {
    const { EnterpriseName, Email, Name, Phone, OnboardingDate } = req.body;
    try {
        if (!EnterpriseName) {
            return res.status(400).send({ success: false, message: 'Enterprise name is required!', key: "EnterpriseName" });
        }
        if (!Email) {
            return res.status(400).send({ success: false, message: 'Email address is required!', key: "Email" });
        }
        if (!Name) {
            return res.status(400).send({ success: false, message: 'Name is required!', key: "Name" });
        }
        if (!Phone) {
            return res.status(400).send({ success: false, message: 'Phone number is required!', key: "Phone" });
        }
        if (Phone.length !== 10) {
            return res.status(400).send({ success: false, message: 'Phone number should be 10 digits!', key: "Phone" });
        }
        if (!OnboardingDate) {
            return res.status(400).send({ success: false, message: 'Onboarding date is required!', key: "OnboardingDate" });
        }
        next();
    } catch (error) {
        console.log("enterprise.middleware.adminEmptyCheck===>", error.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.', err: error.message });
    }
}

// Check empty filed while adding data in EnterpriseUser 
exports.userEmptyCheck = async (req, res, next) => {
    const { username, email, EnterpriseID, phone } = req.body;
    try {
        if (!username) {
            return res.status(400).send({ success: false, message: 'Username is required!', key: "username" });
        }
        if (!email) {
            return res.status(400).send({ success: false, message: 'Email is required!', key: "email" });
        }
        if (!EnterpriseID) {
            return res.status(400).send({ success: false, message: 'Enterprise is required!', key: "EnterpriseID" });
        }
        if (!phone) {
            return res.status(400).send({ success: false, message: 'Phone number is required!', key: "phone" });
        }
        if (phone.length !== 10) {
            return res.status(400).send({ success: false, message: 'Phone number should be 10 digits!', key: "phone" });
        }
        next();
    } catch (error) {
        console.log("enterprise.middleware.userEmptyCheck===>", error.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.', err: error.message });
    }
}