const EnterpriseAdminModel = require('../../models/enterprise.model');
const EnterpriseStateModel = require('../../models/enterprise_state.model');
const EnterpriseStateLocationModel = require('../../models/enterprise_state_location.model');
const UserModel = require('../../models/user.model');
const bcrypt = require('bcrypt');
const { decode } = require('../../utility/JwtDecoder');

// EnterpriseList
exports.EnterpriseListData = async (req, res) => {
    const AllEnt = await EnterpriseAdminModel.find({});
    // Define the fields to add

    // Map through the array and add the fields to each object
    const updatedAllEnt = AllEnt.map(ent => {
        const data = {
            location: Math.round(Math.random() * (3 - 1) + 1),
            gateway: Math.round(Math.random() * (5 - 1) + 1),
            optimizer: Math.round(Math.random() * (5 - 1) + 1),
            power_save_unit: Math.round(Math.random() * (300 - 100) + 1),
        };

        // Use the spread operator (...) to create a new object with existing properties
        // and add the new fields
        return {
            ...ent._doc,
            data,
        };
    });

    // console.log(updatedAllEnt);
    return res.status(200).json({ success: true, message: "Data fetched successfully", data: updatedAllEnt });
}

exports.EnterpriseList = async (req, res) => {
    const AllEnt = await EnterpriseAdminModel.find({});
    // Define the fields to add
    // console.log(updatedAllEnt);
    return res.status(200).json({ success: true, message: "Data fetched successfully", data: AllEnt });
}

// EnterpriseStateList
exports.EnterpriseStateList = async (req, res) => {
    const { enterprise_id } = req.body;
    const AllEnterpriseState = await EnterpriseStateModel.find({ Enterprise_ID: enterprise_id }).populate({
        path: 'Enterprise_ID'
    }).populate({
        path: 'State_ID'
    });


    if (AllEnterpriseState.length === 0) {
        return res.status(404).send({ success: false, message: 'No data found for the given enterprise ID.' });
    }

    // Extract the common Enterprise_ID data from the first object
    const { Enterprise_ID, ...commonEnterpriseData } = AllEnterpriseState[0].Enterprise_ID;
    const commonEnterpriseDataWithDoc = { ...commonEnterpriseData._doc };

    // Map through the array and add the fields to each object
    const AllEntState = AllEnterpriseState.map(ent => ({
        ...ent._doc,
        data: {
            location: Math.round(Math.random() * (3 - 1) + 1),
            gateway: Math.round(Math.random() * (5 - 1) + 1),
            optimizer: Math.round(Math.random() * (5 - 1) + 1),
            power_save_unit: Math.round(Math.random() * (300 - 100) + 1),
        },
    }));

    // Remove "Enterprise_ID" field from AllEntState
    AllEntState.forEach(ent => {
        delete ent.Enterprise_ID;
    });

    // console.log(AllEntState);
    return res.status(200).json(
        {
            success: true,
            message: "Data fetched successfully",
            commonEnterpriseData: commonEnterpriseDataWithDoc,
            AllEntState
        }
    );
}

// EnterpriseStateList
exports.EnterpriseStateLocationList = async (req, res) => {
    const { enterprise_id, state_id } = req.body;

    const AllEnterpriseStateLocation = await EnterpriseStateLocationModel.find({ Enterprise_ID: enterprise_id, State_ID: state_id }).populate({
        path: 'Enterprise_ID'
    }).populate({
        path: 'State_ID'
    });

    if (AllEnterpriseStateLocation.length === 0) {
        return res.status(404).send({ success: false, message: 'No data found for the given enterprise ID.' });
    }

    // Extract the common Enterprise_ID data from the first object
    const { Enterprise_ID, ...commonEnterpriseData } = AllEnterpriseStateLocation[0].Enterprise_ID;
    const commonEnterpriseDataWithDoc = { ...commonEnterpriseData._doc };

    const { State_ID, ...commonStateData } = AllEnterpriseStateLocation[0].State_ID;
    const commonStateDataWithDoc = { ...commonStateData._doc };

    // Map through the array and add the fields to each object
    const AllEntStateLocation = AllEnterpriseStateLocation.map(ent => ({
        ...ent._doc,
        data: {
            location: Math.round(Math.random() * (3 - 1) + 1),
            gateway: Math.round(Math.random() * (5 - 1) + 1),
            optimizer: Math.round(Math.random() * (5 - 1) + 1),
            power_save_unit: Math.round(Math.random() * (300 - 100) + 1),
        },
    }));

    // Remove "Enterprise_ID" field from AllEntStateLocation
    AllEntStateLocation.forEach(ent => {
        delete ent.Enterprise_ID;
        delete ent.State_ID;
    });

    // console.log(AllEntStateLocation);
    return res.status(200).json(
        {
            success: true,
            message: "Data fetched successfully",
            commonEnterpriseData: commonEnterpriseDataWithDoc,
            commonStateData: commonStateDataWithDoc,
            AllEntStateLocation
        }
    );
}

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

