const EnterpriseAdminModel = require('../../models/enterprise.model');
const EnterpriseUserModel = require('../../models/enterprise_user.model');
const UserModel = require('../../models/user.model');
const SystemInitModel = require('../../models/systemInit.model');
const bcrypt = require('bcrypt');
const { hashValue } = require('../../utility/CreateToken');
const path = require('path');
const ejs = require('ejs');
const fs = require('fs').promises;
const { SendMail } = require('../../utility/SendMail');


// ADD ENTERPRISE ADMIN
exports.addEnterprise = async (req, res) => {
    try {
        const newEnterprise = new EnterpriseAdminModel({
            EnterpriseName: req.body.EnterpriseName,
            ContactInfo: {
                Email: req.body.Email,
                Name: req.body.Name,
                Phone: req.body.Phone,
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
    const { EnterpriseID, username, email, phone } = req.body;

    try {
        const EnterpriseUser = new EnterpriseUserModel({
            EnterpriseID: EnterpriseID,
            username: username,
            email: email,
            phone: phone,
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
        console.error('Error adding enterprise user:', error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", err: error.message });
    }
};

// Add System itigrator user
exports.addSystemInt = async (req, res) => {
    const { username, email, phone } = req.body;
    try {
        const SyetmInit = new SystemInitModel({
            username: username,
            email: email,
            phone: phone,
            isDelete: false
        });

        const savedSyetmInit = await SyetmInit.save();
        if (savedSyetmInit) {
            const password = new Date().getTime().toString();
            const hashedPassword = await bcrypt.hash(password, 10);

            const newSyetmInit = new UserModel({
                username: savedSyetmInit.username,
                email: savedSyetmInit.email,
                password: hashedPassword,
                role: "SystemInt",
                type: "System-integrator",
                permission: ["Read"],
                enterpriseUserId: savedSyetmInit._id,
                isDelete: false
            });

            const SavedSyetmInit = await newSyetmInit.save();

            if (SavedSyetmInit) {
                const expiresIn = "24h";
                const HashValue = hashValue(SavedSyetmInit?.email, expiresIn);

                const url = process.env.HOST + "/api/system/set/new/password/" + HashValue;
                const templatePath = path.resolve('./views/Email/set_password_email.ejs');
                const templateContent = await fs.readFile(templatePath, 'utf8');
                // console.log(url);
                // return;
                const renderHTML = ejs.render(templateContent, {
                    Name: SavedSyetmInit?.username,
                    Url: url,
                });

                // Call the sendEmail function
                await SendMail(SavedSyetmInit?.email, "Set New Password mail", renderHTML);
                return res.status(201).json({ success: true, message: "System intigrator added successfully!" });
            }
        } else {
            return res.status(500).json({ success: false, message: "Failed to save enterprise user." });
        }

    } catch (error) {
        console.error('Error adding system intigrator:', error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", err: error.message });
    }
}

// Get Enterprise & System Integrator User
exports.GetEnterpriseSystemIntUsers = async (req, res) => {
    try {
        const excludedTypes = ["Webmaster", "Enterprise"];
        const AllData = await UserModel.find({ type: { $nin: excludedTypes } }).populate({
            path: 'enterpriseUserId',
            populate: {
                path: 'EnterpriseID'
            }
        }).populate({
            path: 'systemIntegratorId',

        }).select('-password');
        return res.status(200).json({ success: true, message: "Data fetched successfully", data: AllData });
    } catch (err) {
        console.error('Error:', err.message);
        return res.status(500).json({ success: false, message: "Something Went wrong please try again later.", error: err.message });
    }
}