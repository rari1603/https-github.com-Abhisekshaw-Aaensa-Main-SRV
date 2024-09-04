const EnterpriseModel = require('../models/enterprise.model');
const StateModel = require('../models/enterprise_state.model');
const LocationModel = require('../models/enterprise_state_location.model');
const GatewayModel = require('../models/gateway.model');
const OptimizerModel = require('../models/optimizer.model');
const fs = require('fs');
const path = require('path');

exports.CreateClone = async (req, res) => {
    const libPath = path.join(__dirname, '../lib');

    // Check if the 'lib' directory exists
    if (!fs.existsSync(libPath)) {
        // Create the directory with recursive option (equivalent to -R in shell)
        fs.mkdirSync(libPath, { recursive: true });
    }
    const DataCloneEnterprise = await CloneEnterprise();
    const DataCloneState = await CloneState();
    const DataCloneLocation = await CloneLocation();
    const DataCloneGateway = await CloneGateway();
    const DataCloneOptimizer = await CloneOptimizer();
    return res.status(200).json({
        DataCloneEnterprise,
        DataCloneState,
        DataCloneLocation,
        DataCloneGateway,
        DataCloneOptimizer
    });
}

const CloneEnterprise = async () => {
    try {
        const ENT = await EnterpriseModel.find();

        // Convert the data to a JSON string
        const jsonData = JSON.stringify(ENT, null, 2);

        // Define the path for the JSON file
        const filePath = path.join(__dirname, '../lib', 'enterprise.json');

        // Write the JSON string to a file
        fs.writeFileSync(filePath, jsonData);

        console.log('Data successfully written to enterprise.json');
        return { message: "Data successfully written to enterprise.json" };
    } catch (error) {
        console.error('Error while creating enterprise.json:', error);
        return { message: 'Error while creating enterprise.json:', error };
    }
};

const CloneState = async () => {
    try {
        const ENT = await StateModel.find().populate({
            path: 'Enterprise_ID'
        }).populate({
            path: 'State_ID'
        });

        // Convert the data to a JSON string
        const jsonData = JSON.stringify(ENT, null, 2);

        // Define the path for the JSON file
        const filePath = path.join(__dirname, '../lib', 'state.json');

        // Write the JSON string to a file
        fs.writeFileSync(filePath, jsonData);

        console.log('Data successfully written to state.json');
        return { message: "Data successfully written to state.json" };
    } catch (error) {
        console.error('Error while creating state.json:', error);
        return { message: 'Error while creating state.json:', error };
    }
};

const CloneLocation = async () => {
    try {
        const ENT = await LocationModel.find().populate({
            path: 'Enterprise_ID'
        }).populate({
            path: 'State_ID'
        });

        // Convert the data to a JSON string
        const jsonData = JSON.stringify(ENT, null, 2);

        // Define the path for the JSON file
        const filePath = path.join(__dirname, '../lib', 'location.json');

        // Write the JSON string to a file
        fs.writeFileSync(filePath, jsonData);

        console.log('Data successfully written to location.json');
        return { message: "Data successfully written to location.json" };
    } catch (error) {
        console.error('Error while creating location.json:', error);
        return { message: 'Error while creating location.json:', error };
    }
};

const CloneGateway = async () => {
    try {
        const ENT = await GatewayModel.find().populate({
            path: 'EnterpriseInfo',
            populate: [
                {
                    path: 'Enterprise_ID',
                },
                {
                    path: 'State_ID',
                },
            ]
        });

        // Convert the data to a JSON string
        const jsonData = JSON.stringify(ENT, null, 2);

        // Define the path for the JSON file
        const filePath = path.join(__dirname, '../lib', 'gateway.json');

        // Write the JSON string to a file
        fs.writeFileSync(filePath, jsonData);

        console.log('Data successfully written to gateway.json');
        return { message: "Data successfully written to gateway.json" };
    } catch (error) {
        console.error('Error while creating gateway.json:', error);
        return { message: 'Error while creating gateway.json:', error };
    }
};

const CloneOptimizer = async () => {
    try {
        const ENT = await OptimizerModel.find()
            .populate({
                path: 'GatewayId',
                populate: {
                    path: 'EnterpriseInfo',
                    populate: [
                        { path: 'Enterprise_ID' },
                        { path: 'State_ID' },
                    ]
                }
            });

        // Convert the data to a JSON string
        const jsonData = JSON.stringify(ENT, null, 2);

        // Define the path for the JSON file
        const filePath = path.join(__dirname, '../lib', 'optimizer.json');

        // Write the JSON string to a file
        fs.writeFileSync(filePath, jsonData);

        console.log('Data successfully written to optimizer.json');
        return { message: "Data successfully written to optimizer.json" };
    } catch (error) {
        console.error('Error while creating optimizer.json:', error);
        return { message: 'Error while creating optimizer.json:', error };
    }
};