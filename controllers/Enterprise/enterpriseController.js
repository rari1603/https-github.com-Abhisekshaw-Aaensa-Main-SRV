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


exports.list = async (req, res) => {
    const AllEnt = await EnterpriseAdminModel.find({});
    res.status(200).json({ message: "Hi enterprise list", AllEnt });
}

// ADD ENTERPRISE ADMIN
exports.addEnterprise = async (req, res) => {
    try {
        // Validate required fields
        const requiredFields = ['EnterpriseName', 'Email', 'Name', 'Phone', 'Address', 'OnboardingDate'];
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
            OnboardingDate: req.body.OnboardingDate,
            isDelete: false
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
            return res.status(201).json({ message: "Enterprise added successfully!" });
        }
    } catch (error) {
        console.error('Error adding enterprise:', error);
        return res.status(500).json({ message: "Internal Server Error" });
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
            return res.status(201).json({ message: "Enterprise User added successfully!" });
        }

    } catch (error) {
        console.error('Error adding enterprise:', error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


// SET PASSWORD VIEW
exports.SetNewPasswordView = async (req, res) => {
    try {
        const url = process.env.HOST;
        const decodedHashValue = decode("Bearer " + req.params.hashValue);
        let valid = true;
        let message = "";
        // Check if the token has expired
        const currentTimestamp = Math.floor(Date.now() / 1000); // Get current timestamp in seconds
        if (decodedHashValue.exp && currentTimestamp > decodedHashValue.exp) {
            valid = false
            message = 'Token has expired';
        } else {
            valid = true;
            message = 'Token is still valid';
        }
        const DATA = {
            message,
            valid,
            token: req.params.hashValue,
            backend_url: url + "/api/enterprise/set/new/password/" + req.params.hashValue,
            perpose: "Set New Password"
        }
        // return res.status(200).json(DATA);
        // return res.send(decodedHashValue);
        return res.render("auth/set_password", {
            title: "Set New Password",
            DATA
        });
    } catch (error) {
        console.log(error.message);
        return res.send({ success: false, message: error.message });
    }
}


// SET PASSWORD
exports.SetNewPassword = async (req, res) => {
    const { _token, password } = req.body;
    try {
        const decodedHashValueEmail = decode("Bearer " + _token).email;
        // const user = await User.findOne({ email: decodedHashValueEmail });
        const hashedPassword = await bcrypt.hash(password, 10);
        const filter = { email: decodedHashValueEmail };
        const update = { password: hashedPassword };

        // Use updateOne to update a single document
        const result = await UserModel.updateOne(filter, update);

        console.log(result);
        // return res.status(200).json({
        //     success: true,
        //     message: "Password reset successfully!",
        // });

        return res.render("auth/success", {});
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

