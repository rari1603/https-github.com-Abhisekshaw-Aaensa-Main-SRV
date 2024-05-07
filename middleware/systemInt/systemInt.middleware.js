// Check empty filed while adding data in EnterpriseAdmin 
exports.systemInitEmptyCheck = async (req, res, next) => {
    const { username, email, phone } = req.body;

    const trimmedEmail = email.trim();

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
    try {
        if (!username) {
            return res.status(400).send({ success: false, message: 'Username is required!', key: "username" });
        }
        if (!email) {
            return res.status(400).send({ success: false, message: 'Email is required!', key: "email" });
        }
        if (!isValidEmail) {
            return res
              .status(400)
              .send({
                success: false,
                message: "Invalid email format!",
                key: "email",
              });
          }
        if (!phone) {
            return res.status(400).send({ success: false, message: 'Phone number is required!', key: "phone" });
        }
        if (!/^\d+$/.test(phone)) {
            return res.status(400).send({
              success: false,
              message: "Phone number should contain only digits!",
              key: "phone",
            });
          }
        if (phone.length !== 10) {
            return res.status(400).send({ success: false, message: 'Phone number should be 10 digits!', key: "phone" });
        }
        next();
    } catch (error) {
        console.log("systemInt.middleware===>", error.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.', err: error.message });
    }
}
