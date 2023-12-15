const SystemIntModel = require('../../models/user.model');
const bcrypt = require('bcrypt');


// Add System itigrator user
exports.addSystemInt = async (req, res) => {
    const { username, email, password, role, type, permission, enterpriseUserId } = req.body;
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        const newSystemInt = new SystemIntModel({
            username: username,
            email: email,
            password: hashedPassword,
            role: role,
            type: type,
            permission: permission,
            enterpriseUserId: enterpriseUserId
        });

        await newSystemInt.save();
        return res.status(201).json({ message: "System intigrator added successfully!" });

    } catch (error) {
        console.error('Error adding system intigrator:', error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}