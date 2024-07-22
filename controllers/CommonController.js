const StateModel = require('../models/state.model');
const EnterpriseModel = require('../models/enterprise.model');
const EnterpriseStateModel = require('../models/enterprise_state.model');
const EnterpriseStateLocationModel = require('../models/enterprise_state_location.model');
const GatewayModel = require('../models/gateway.model');
const OptimizerModel = require('../models/optimizer.model');
const EnterpriseUserModel = require('../models/enterprise_user.model');
const NewApplianceLogModel = require('../models/NewApplianceLog.model');

exports.getStates = async (req, res) => {
    try {
        const allStatesData = await StateModel.find().sort({ name: 1 }); // Sort by name in ascending order
        return res.status(200).json({ success: true, message: 'Data fetched successfully', data: allStatesData });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: 'Server error!', err: error.message });
    }
};

// Get dashboard details 
exports.DashboardDetails = async (req, res) => {

    // List of optimizer IDs to delete
    const optimizerIDs = [
        "NGCSE732B495BC", "NGCSE2E3E1AA44", "NGCSE732B49508", "NGCSE732B56AD4",
        "NGCSE732B495BC", "NGCSE732B49508", "NGCSE732B4956C", "NGCSE732B486B0",
        "NGCSE732B56B98", "NGCSE732B49524", "NGCSE7BD21551C", "NGCSEB146DB9D0",
        "NGCSE732B56354", "NGCSE732B563E4", "NGCSE2E3E1AA00", "NGCSE7BD2118E0",
        "NGCSE732B49560", "NGCSE732B49560", "NGCSEB146BE4E0", "NGCSEB146BE4E0"
    ];

    // The cutoff timestamp (in seconds)
    const cutoffTimestamp = 1720981800;

    // Convert the cutoff timestamp to a date object
    const cutoffDate = new Date(cutoffTimestamp * 1000);
    // const { user,
    //     path,
    //     baseUrl,
    //     originalUrl,
    //     route, decodedData } = req;
    // console.log({
    //     user,
    //     path,
    //     baseUrl,
    //     originalUrl,
    //     route, decodedData
    // });
    try {
        // Delete documents that match the given optimizer IDs and are older than the cutoff timestamp
        const deleteResult = await NewApplianceLogModel.deleteMany({
            OptimizerID: { $in: optimizerIDs },
            createdAt: { $lt: cutoffDate }
        });
        console.log(`Deleted ${deleteResult.deletedCount} documents`);

        var EnterpriseQuery = {};
        var EnterpriseStateQuery = {};
        var GatewayQuery = {};
        var OptimizerQuery = {};
        // if (user.role == "Enterprise") {
        //     const enterpriseUserId = decodedData.user.enterpriseUserId
        //     const ENT = await this.findEnterprise({ _id: enterpriseUserId });
        //     console.log({ ENT });
        //     EnterpriseQuery = { _id: ENT.EnterpriseID };
        //     EnterpriseStateQuery = { Enterprise_ID: ENT.EnterpriseID };
        // }
        // if (user.role == "SystemInt") {
        //     const enterpriseUserId = decodedData.user.enterpriseUserId
        //     const ENT = await this.findEnterprise({ systemIntegratorId: enterpriseUserId });
        //     console.log({ ENT });
        //     EnterpriseQuery = { _id: ENT.EnterpriseID };
        // }
        const TotalEnterpriseCount = await EnterpriseModel.countDocuments(EnterpriseQuery);
        const TotalEnterpriseStateCount = await EnterpriseStateModel.countDocuments(EnterpriseStateQuery);
        const TotalGatewayCount = await GatewayModel.countDocuments(GatewayQuery);
        const TotalOptimizerCount = await OptimizerModel.countDocuments(OptimizerQuery);

        return res.send({
            TotalEnterprise: TotalEnterpriseCount,
            TotalEnterpriseState: TotalEnterpriseStateCount,
            TotalGateway: TotalGatewayCount,
            TotalOptimizer: TotalOptimizerCount
        });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: 'Internal Server error!', err: error.message });
    }
};



exports.findEnterprise = async (enterpriseUserId) => {
    return await EnterpriseUserModel.findOne(enterpriseUserId);
}

// exports.DashboardDetails = async (req, res) => {
//     try {

//         const { startDate, endDate, enterpriseId, stateId } = req.query;

//         const enterpriseQuery = enterpriseId ? { _id: enterpriseId } : {};
//         const stateQuery = stateId ? { _id: stateId } : {};

//         const EnterpriseState = await EnterpriseStateModel.find(stateQuery);
//         const locationQuery = (stateId && enterpriseId) ? { Enterprise_ID: enterpriseId, State_ID: EnterpriseState[0].State_ID } : {};

//         const EnterpriseStateLocation = await EnterpriseStateLocationModel.find(locationQuery);
//         const gatewayQuary = { EnterpriseInfo: EnterpriseStateLocation[0]._id };

//         const Gateway = await GatewayModel.find(gatewayQuary);
//         const optimizerQuary = { GatewayId: Gateway[0]._id };

//         const dateQuery = {
//             createdAt: {
//                 $gte: startDate ? new Date(startDate) : new Date(0),
//                 $lte: endDate ? new Date(endDate) : new Date()
//             }
//         };


//         const TotalEnterpriseCount = await EnterpriseModel.countDocuments(enterpriseQuery);
//         const TotalEnterpriseStateCount = await EnterpriseStateModel.countDocuments(stateQuery);
//         const TotalGatewayCount = await GatewayModel.countDocuments(gatewayQuary);
//         const TotalOptimizerCount = await OptimizerModel.countDocuments(optimizerQuary);

//         const data = {
//             TotalCustomer: TotalEnterpriseCount,
//             TotalEnterpriseStates: TotalEnterpriseStateCount,
//             TotalGateway: TotalGatewayCount,
//             TotalOptimizers: TotalOptimizerCount
//         };

//         return res.status(200).json({ success: true, message: "Data fetched successfully.", data: data });

//     } catch (error) {
//         console.error(error.message);
//         return res.status(500).json({ success: false, message: 'Internal Server error!', err: error.message });
//     }
// };


// exports.DashboardDetails = async (req, res) => {
//     try {
//         const { startDate, endDate, enterpriseId, stateId } = req.query;

//         const enterpriseQuery = enterpriseId ? { _id: enterpriseId } : {};
//         const stateQuery = stateId ? { _id: stateId } : {};

//         const enterpriseStates = await EnterpriseStateModel.find(stateQuery);

//         // Initialize counts
//         let totalEnterpriseCount = 0;
//         let totalEnterpriseStateCount = 0;
//         let totalGatewayCount = 0;
//         let totalOptimizerCount = 0;

//         await Promise.all(enterpriseStates.map(async (enterpriseState) => {
//             const locationQuery = (stateId && enterpriseId) ? { Enterprise_ID: enterpriseId, State_ID: enterpriseState.State_ID } : {};
//             const enterpriseStateLocations = await EnterpriseStateLocationModel.find(locationQuery);

//             await Promise.all(enterpriseStateLocations.map(async (enterpriseStateLocation) => {
//                 const gatewayQuary = { EnterpriseInfo: enterpriseStateLocation._id };
//                 const gateways = await GatewayModel.find(gatewayQuary);

//                 totalEnterpriseCount += 1;
//                 totalEnterpriseStateCount += 1;
//                 totalGatewayCount += gateways.length;

//                 await Promise.all(gateways.map(async (gateway) => {
//                     const optimizerQuary = { GatewayId: gateway._id };
//                     const optimizers = await OptimizerModel.find(optimizerQuary);
//                     totalOptimizerCount += optimizers.length;
//                 }));
//             }));
//         }));

//         const data = {
//             TotalCustomer: totalEnterpriseCount,
//             TotalEnterpriseStates: totalEnterpriseStateCount,
//             TotalGateway: totalGatewayCount,
//             TotalOptimizers: totalOptimizerCount
//         };

//         return res.status(200).json({ success: true, message: "Data fetched successfully.", data: data });

//     } catch (error) {
//         console.error(error.message);
//         return res.status(500).json({ success: false, message: 'Internal Server error!', err: error.message });
//     }
// };






