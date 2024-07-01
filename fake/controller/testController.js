const { faker } = require('@faker-js/faker');
const GatewayModel = require('../../models/gateway.model');
const OptimizerModel = require('../../models/optimizer.model');
const DataLogModel = require('../../models/GatewayLog.model');
const GatewayLogModel = require('../../models/GatewayLog.model');
const OptimizerLogModel = require('../../models/OptimizerLog.model');
const UserModel = require('../../models/user.model');
const SystemIntModel = require('../../models/systemInit.model');
const EnterpriseModel = require('../../models/enterprise.model');
const EnterpriseUserModel = require('../../models/enterprise_user.model');
const StateModel = require('../../models/state.model');
const StateLocationModel = require('../../models/enterprise_state_location.model');
const ApplianceModel = require('../../models/NewApplianceLog.model');

exports.Optimizer = async (req, res) => {
    const fakeOptimizerData = {
        OptimizerID: 'OPT-00039',
        GatewayId: '6579818f943b8692984fc0d4', // Replace with a valid Gateway ObjectId
        OptimizerName: 'FakeOptimizer 002',
        Description: 'This is a fake optimizer for testing purposes',
        Switch: true,
    };

    // await Optimizer(fakeOptimizerData).save();
}

exports.Gateway = async (req, res) => {
    const fakeGatewayData = {
        GatewayID: 'GTABC-106',
        GatewayName: 'FakeGateway 03',
        Description: 'This is a fake gateway for testing purposes',
        Switch: true,
        Location: 'Fake Location 3',
        State: 'Active',
        EnterpriseName: 'Fake Enterprise',
        EnterpriseUserID: 'ENT-01250',
        NetworkSSID: 'FakeNetwork',
        NetworkPassword: 'FakePassword123',
    };

    console.log(fakeGatewayData);
    // await Gateway(fakeGatewayData).save();
    res.status(200).json({ data: fakeGatewayData });
}

exports.processArray = async (req, res) => {
    // const result = await DataLogModel.updateMany({}, { $set: { ByPass: false } });
    // console.log(result);
    // return;
    var array = [
        {
            "OptimizerID": "657982c9d1e8f47a82ed6a02",
            "GatewayId": "6579813137698f475737b112"
        },
        {
            "OptimizerID": "6579839264ce887e484538f0",
            "GatewayId": "657981641eee1e2fc00a76d7"
        },
        {
            "OptimizerID": "657983a86e29c4c1d8bb636c",
            "GatewayId": "6579818f943b8692984fc0d4"
        },
        {
            "OptimizerID": "657983e2d5d02031e9376913",
            "GatewayId": "6579818f943b8692984fc0d4"
        }
    ];

    let dataLogEntry;
    for (let index = 0; index < array.length; index++) {
        const element = array[index];

        // Assuming generateRandomData is a function that takes GatewayId and OptimizerID as parameters
        const randomData = await generateRandomData(element.GatewayId, element.OptimizerID);
        // console.log(randomData);
        try {
            dataLogEntry = await DataLogModel(randomData).save();
            // Save the dataLogEntry to the database.

            console.log(`DataLog entry saved : ${dataLogEntry.createdAt}`);
        } catch (error) {
            console.error(`Error saving DataLog entry for OptimizerID: ${element.OptimizerID}`, error.message);
            // Handle the error as needed
        }
        // Add a 2-second delay before the next iteration
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return res.status(200).json('Fake data creation in progress');
}


const generateRandomData = async (GatewayID, OptimizerID) => ({
    // Generate random values for various data points
    GatewayID: GatewayID,
    OptimizerID: OptimizerID,
    OptimizerMode: 'Auto',
    RoomTemperature: faker.number.int({ min: 10, max: 30 }),
    CoilTemperature: faker.number.int({ min: 20, max: 40 }),
    // Generate nested data for each phase
    Phases: {
        Ph1: {
            Voltage: faker.number.int({ min: 200, max: 240 }),
            Current: faker.number.int({ min: 5, max: 15 }),
            ActivePower: faker.number.int({ min: 2000, max: 2500 }),
            PowerFactor: faker.number.int({ min: 0.8, max: 1 }),
            ApparentPower: faker.number.int({ min: 2200, max: 2600 }),
        },
        Ph2: {
            Voltage: faker.number.int({ min: 200, max: 240 }),
            Current: faker.number.int({ min: 5, max: 15 }),
            ActivePower: faker.number.int({ min: 2000, max: 2500 }),
            PowerFactor: faker.number.int({ min: 0.8, max: 1 }),
            ApparentPower: faker.number.int({ min: 2200, max: 2600 }),
        },
        Ph3: {
            Voltage: faker.number.int({ min: 200, max: 240 }),
            Current: faker.number.int({ min: 5, max: 15 }),
            ActivePower: faker.number.int({ min: 2000, max: 2500 }),
            PowerFactor: faker.number.int({ min: 0.8, max: 1 }),
            ApparentPower: faker.number.int({ min: 2200, max: 2600 }),
        },
    },
    Humidity: faker.number.int({ min: 30, max: 70 }),
    KVAH: faker.number.int({ min: 800, max: 1200 }),
    KWH: faker.number.int({ min: 600, max: 1000 }),
    PF: Math.floor(faker.number.int({ min: 85, max: 95 }) * 100),
    ByPass: false
});


exports.addManyDataDB = async (req, res) => {
    // await GatewayModel.updateMany({}, { $set: { BypassMode: "" } });
    // await StateLocationModel.updateMany({}, { $set: { BypassMode: "" } });
    await ApplianceModel.updateMany({}, { $set: { ACStatus: "UNKNOWN" } });
    // await OptimizerLogModel.updateMany({}, {
    //     $set: {
    //         DeviceStatus: true
    //     }
    // });
    // await DataLogModel.updateMany({}, { $set: { isDelete: false } });
    // await UserModel.updateMany({}, { $set: { isDelete: false } });
    // await EnterpriseModel.updateMany({}, { $set: { isDelete: false } });
    // await EnterpriseUserModel.updateMany({}, { $set: { isDelete: false } });
    // await StateModel.updateMany({}, { $set: { isDelete: false } });
    // const allSystInt = await SystemIntModel.find({});
    // for (let index = 0; index < allSystInt.length; index++) {
    //     const element = allSystInt[index];
    //     console.log(element);
    //     await UserModel.updateMany({ email: element.email }, { $set: { systemIntegratorId: element._id } });

    // }
    // return res.send(allSystInt);
    return res.send("Done...")
}


// addFakeGatewayOptimizerData to create Gateway & Optimizer Data Log
exports.addFakeGatewayOptimizerData = async (req, res) => {
    const data = req.body;
    const optimizers = req.body.OptimizerDetails;

    try {
        const gateway = await GatewayModel.findOne({ GatewayID: req.body.GatewayID });
        // return console.log(gateway);
        if (!gateway) {
            throw new Error(`Gateway with ID ${req.body.GatewayID} not found`);
        }

        const gatewayId = gateway._id;
        const { Phases, KVAH, KWH, PF } = data;

        const gatewayLog = await GatewayLogModel({
            GatewayID: gatewayId,
            Phases,
            KVAH,
            KWH,
            PF
        }).save();

        const optimizerLogPromises = optimizers.map(async element => {
            const optimizer = await OptimizerModel.findOne({ OptimizerID: element.OptimizerID });
            // return console.log(optimizer);
            if (!optimizer) {
                console.log(`Optimizer with ID ${req.body.OptimizerID} not found`);
            }

            // if (!optimizer.GatewayId.equals(gateway._id)) {
            //     console.log(`The Optimizer with ID ${req.body.OptimizerID} is not associated with the Gateway with ID ${req.body.GatewayID}. Please verify with the system administrator.`);
            // }

            if (optimizer) {
                return OptimizerLogModel({
                    OptimizerID: optimizer._id,
                    GatewayID: gatewayId,
                    GatewayLogID: gatewayLog._id,
                    TimeStamp: element.TimeStamp,
                    RoomTemperature: element.RoomTemperature,
                    Humidity: element.Humidity,
                    CoilTemperature: element.CoilTemperature,
                    OptimizerMode: element.OptimizerMode,
                }).save();
            }
        });

        await Promise.all(optimizerLogPromises);

        res.status(200).send({ success: true, message: "Logs created successfully" });

    } catch (error) {
        console.error(error);
        res.status(404).send({ success: false, message: error.message });
    }
}

exports.passwordCheck = async (req, res) => {
    const { password, username } = req.body;
    const isStrong = isStrongPassword(password);
    const isLength = isPasswordLength(password);
    const isUsernameSame = containsUsername(password, username);
    console.log({ isStrong, isUsernameSame, isLength });

    let response = {};

    if (!isStrong) {
        response.success = false;
        response.message = "Password must contain at least one uppercase letter, one special character, and one number.";
    } else if (!isLength) {
        response.success = false;
        response.message = "Password must be at least 8 characters long.";
    } else if (isUsernameSame) {
        response.success = false;
        response.message = "Password cannot contain the username or its variations.";
    } else {
        response.success = true;
        response.message = "Password is strong and meets all criteria.";
    }

    res.send(response);
}

function isPasswordLength(password) {
    return password.length >= 8;
}

function isStrongPassword(password) {
    // Define your password strength criteria here
    const uppercaseRegex = /[A-Z]/;
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    const numberRegex = /[0-9]/;

    return (
        uppercaseRegex.test(password) &&
        specialCharRegex.test(password) &&
        numberRegex.test(password)
    );
}


function containsUsername(password, username) {
    const usernameVariations = [username, username.toLowerCase(), username.toUpperCase()];

    // Check if any part of the password contains the username or its variations
    return usernameVariations.some(variation => password.toLowerCase().includes(variation.toLowerCase()));
}
