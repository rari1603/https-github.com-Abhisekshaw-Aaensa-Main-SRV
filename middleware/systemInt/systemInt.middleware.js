// Check empty filed while adding data in EnterpriseAdmin 
exports.systemInitEmptyCheck = async (req, res, next) => {
    const { username, email, phone } = req.body;
    try {
        if (!(username && email && phone)) {
            return res.status(400).send({ success: false, message: 'All Fields Are required!' });
        }
        next();
    } catch (error) {
        console.log("enterprise.middleware.adminEmptyCheck===>", error.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.', err: error.message });
    }
}