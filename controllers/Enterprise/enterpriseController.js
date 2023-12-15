const EnterpriseAdminModel = require('../../models/enterprise.model');
const EnterpriseUserModel = require('../../models/enterprise_user.model');
const UserModel = require('../../models/user.model');
const bcrypt = require('bcrypt');


exports.list = async (req, res) => {
    const AllEnt = await EnterpriseAdminModel.find({});
    res.status(200).json({ message: "Hi enterprise list", AllEnt });
}

// ADD ENTERPRISE ADMIN
exports.addEnterprise = async (req, res) => {
    try {
        // Validate required fields
        const requiredFields = ['EnterpriseName', 'Email', 'Name', 'Phone', 'Address'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
        }

        const newEnterprise = new EnterpriseAdminModel({
            EnterpriseName: req.body.EnterpriseName,
            ContactInfo: {
                Email: req.body.Email,
                Name: req.body.Name,
                Phone: req.body.Phone,
                Address: req.body.Address,
            },
        });
        const SavedEnterprise = await newEnterprise.save();

        const password = new Date().getTime().toString();
        const hashedPassword = await bcrypt.hash(password, 10);

        const newEnterpriseAdmin = new UserModel({
            username: SavedEnterprise.ContactInfo.Name,
            email: SavedEnterprise.ContactInfo.Email,
            password: hashedPassword,
            role: "Enterprise",
            type: "Enterprise",
            permission: ["Read"],
            enterpriseUserId: null
        });

        await newEnterpriseAdmin.save();
        return res.status(201).json({ message: "Enterprise added successfully!" });
    } catch (error) {
        console.error('Error adding enterprise:', error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


// ADD ENTERPRISE USER
exports.addEnterpriseUser = async (req, res) => {
    const { EnterpriseID, GatewayIDs, StateID, LocationID } = req.body;

    try {
        const EnterpriseUser = new EnterpriseUserModel({
            EnterpriseID: EnterpriseID,
            GatewayIDs: GatewayIDs,
            StateID: StateID,
            LocationID: LocationID,
        });

        const savedEnterpriseUser = await EnterpriseUser.save();

        const newEnterpriseUser = new UserModel({
            username: username,
            email: email,
            password: hashedPassword,
            role: role,
            type: type,
            permission: permission,
            enterpriseUserId: savedEnterpriseUser._id
        });

        await newEnterpriseUser.save();
        return res.status(201).json({ message: "Enterprise User added successfully!" });

    } catch (error) {
        console.error('Error adding enterprise:', error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
