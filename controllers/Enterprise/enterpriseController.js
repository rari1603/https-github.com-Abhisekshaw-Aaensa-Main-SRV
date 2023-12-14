const EnterpriseAdminModel = require('../../models/enterprise.model');



exports.list = async (req, res) => {
    const AllEnt = await EnterpriseAdminModel.find({});
    res.status(200).json({ message: "Hi enterprise list", AllEnt });
}

exports.add = async (req, res) => {
    try {
        // Validate required fields
        const requiredFields = ['EnterpriseName', 'Email', 'Name', 'Phone', 'Address'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
        }

        const enterpriseData = {
            EnterpriseName: req.body.EnterpriseName,
            ContactInfo: {
                Email: req.body.Email,
                Name: req.body.Name,
                Phone: req.body.Phone,
                Address: req.body.Address,
            },
        };

        const newEnterprise = new EnterpriseAdminModel(enterpriseData);
        await newEnterprise.save();

        return res.status(201).json({ message: "Enterprise added successfully!" });
    } catch (error) {
        console.error('Error adding enterprise:', error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
