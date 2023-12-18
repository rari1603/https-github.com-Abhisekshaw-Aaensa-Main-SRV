const { faker } = require('@faker-js/faker');
const Gateway = require('../../models/gateway.model');
const Optimizer = require('../../models/optimizer.model');
const DataLogModel = require('../../models/dataLog.model');
const UserModel = require('../../models/user.model');
const EnterpriseModel = require('../../models/enterprise.model');
const EnterpriseUserModel = require('../../models/enterprise_user.model');
const StateModel = require('../../models/state.model');
const LocationModel = require('../../models/location.model');

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
    // await Gateway.updateMany({}, { $set: { isDelete: false } });
    // await Optimizer.updateMany({}, { $set: { isDelete: false } });
    // await DataLogModel.updateMany({}, { $set: { isDelete: false } });
    // await UserModel.updateMany({}, { $set: { isDelete: false } });
    // await EnterpriseModel.updateMany({}, { $set: { isDelete: false } });
    // await EnterpriseUserModel.updateMany({}, { $set: { isDelete: false } });
    await StateModel.updateMany({}, { $set: { isDelete: false } });
    // await LocationModel.updateMany({}, { $set: { isDelete: false } });
    return res.send("Done...")
}
