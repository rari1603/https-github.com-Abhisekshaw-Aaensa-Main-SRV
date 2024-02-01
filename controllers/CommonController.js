const StateModel = require('../models/state.model');
const EnterpriseModel = require('../models/enterprise.model');
const EnterpriseStateModel = require('../models/enterprise_state.model');
const EnterpriseStateLocationModel = require('../models/enterprise_state_location.model');
const GatewayModel = require('../models/gateway.model');
const OptimizerModel = require('../models/optimizer.model');

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
    try {
        const TotalEnterpriseCount = await EnterpriseModel.countDocuments({});
        const TotalEnterpriseStateCount = await EnterpriseStateModel.countDocuments({});
        const TotalGatewayCount = await GatewayModel.countDocuments({});
        const TotalOptimizerCount = await OptimizerModel.countDocuments({});

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






