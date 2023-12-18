const EnterpriseAdminModel = require('../../models/enterprise.model');
const EnterpriseUserModel = require('../../models/enterprise_user.model');
const UserModel = require('../../models/user.model');
const bcrypt = require('bcrypt');
const { hashValue } = require('../../utility/CreateToken');
const path = require('path');
const ejs = require('ejs');
const fs = require('fs').promises;
const decode = require('../../utility/JwtDecoder');
const { SendMail } = require('../../utility/SendMail');


// ADD ENTERPRISE ADMIN
exports.addEnterprise = async (req, res) => {
    try {
        // Validate required fields
        const requiredFields = ['EnterpriseName', 'Email', 'Name', 'Phone', 'Address', 'OnboardingDate'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({ success: false, message: `Missing required fields: ${missingFields.join(', ')}` });
        }

        const newEnterprise = new EnterpriseAdminModel({
            EnterpriseName: req.body.EnterpriseName,
            ContactInfo: {
                Email: req.body.Email,
                Name: req.body.Name,
                Phone: req.body.Phone,
                Address: req.body.Address,
            },
            OnboardingDate: req.body.OnboardingDate,
            isDelete: false
        });
        const SavedEnterprise = await newEnterprise.save();

        if (SavedEnterprise) {
            const password = new Date().getTime().toString();
            const hashedPassword = await bcrypt.hash(password, 10);

            const newEnterpriseAdmin = new UserModel({
                username: SavedEnterprise.ContactInfo.Name,
                email: SavedEnterprise.ContactInfo.Email,
                password: hashedPassword,
                role: "Enterprise",
                type: "Enterprise",
                permission: ["Read"],
                enterpriseUserId: null,
                isDelete: false
            });

            const SavedEnterpriseAdmin = await newEnterpriseAdmin.save();
            if (SavedEnterpriseAdmin) {
                const expiresIn = "24h";
                const HashValue = hashValue(SavedEnterpriseAdmin?.email, expiresIn);

                const url = process.env.HOST + "/api/enterprise/set/new/password/" + HashValue;
                const templatePath = path.resolve('./views/Email/set_password_email.ejs');
                const templateContent = await fs.readFile(templatePath, 'utf8');
                // console.log(url);
                // return;
                const renderHTML = ejs.render(templateContent, {
                    Name: SavedEnterpriseAdmin?.username,
                    Url: url,
                });

                // Call the sendEmail function
                await SendMail(SavedEnterpriseAdmin?.email, "Set New Password mail", renderHTML);
                return res.status(201).json({ success: true, message: "Enterprise added successfully!" });
            }
        } else {
            return res.status(500).json({ success: false, message: "Failed to save enterprise admin." });
        }
    } catch (error) {
        console.error('Error adding enterprise:', error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", err: error.message });
    }
};


// ADD ENTERPRISE USER
exports.addEnterpriseUser = async (req, res) => {
    const { username, email, EnterpriseID, GatewayIDs, StateID, LocationID } = req.body;

    try {
        const EnterpriseUser = new EnterpriseUserModel({
            username: username,
            email: email,
            EnterpriseID: EnterpriseID,
            GatewayIDs: GatewayIDs,
            StateID: StateID,
            LocationID: LocationID,
            isDelete: false
        });

        const savedEnterpriseUser = await EnterpriseUser.save();
        if (savedEnterpriseUser) {
            const password = new Date().getTime().toString();
            const hashedPassword = await bcrypt.hash(password, 10);

            const newEnterpriseUser = new UserModel({
                username: savedEnterpriseUser.username,
                email: savedEnterpriseUser.email,
                password: hashedPassword,
                role: "Enterprise",
                type: "EnterpriseUser",
                permission: ["Read"],
                enterpriseUserId: savedEnterpriseUser._id,
                isDelete: false
            });

            const SavedEnterpriseUser = await newEnterpriseUser.save();

            if (SavedEnterpriseUser) {
                const expiresIn = "24h";
                const HashValue = hashValue(SavedEnterpriseUser?.email, expiresIn);

                const url = process.env.HOST + "/api/enterprise/set/new/password/" + HashValue;
                const templatePath = path.resolve('./views/Email/set_password_email.ejs');
                const templateContent = await fs.readFile(templatePath, 'utf8');
                // console.log(url);
                // return;
                const renderHTML = ejs.render(templateContent, {
                    Name: SavedEnterpriseUser?.username,
                    Url: url,
                });

                // Call the sendEmail function
                await SendMail(SavedEnterpriseUser?.email, "Set New Password mail", renderHTML);
                return res.status(201).json({ success: true, message: "Enterprise User added successfully!" });
            }
        } else {
            return res.status(500).json({ success: false, message: "Failed to save enterprise user." });
        }

    } catch (error) {
        console.error('Error adding enterprise:', error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", err: error.message });
    }
};


// Add System itigrator user
exports.addSystemInt = async (req, res) => {
    const { username, email, password, role, type, permission, enterpriseUserId } = req.body;
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        const newSystemInt = new UserModel({
            username: username,
            email: email,
            password: hashedPassword,
            role: role,
            type: type,
            permission: permission,
            enterpriseUserId: enterpriseUserId,
            isDelete: false
        });

        await newSystemInt.save();
        return res.status(201).json({ success: true, message: "System intigrator added successfully!" });

    } catch (error) {
        console.error('Error adding system intigrator:', error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", err: error.message });
    }
}