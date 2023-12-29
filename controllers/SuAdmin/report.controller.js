const EnterpriseModel = require('../../models/enterprise.model');
const EnterpriseUserModel = require('../../models/enterprise_user.model');
const EnterpriseStateModel = require('../../models/enterprise_state.model');
const EnterpriseStateLocationModel = require('../../models/enterprise_state_location.model');
const GatewayModel = require('../../models/gateway.model');
const OptimizerLogModel = require('../../models/OptimizerLog.model');
const GatewayLogModel = require('../../models/GatewayLog.model');


exports.AllDataLog = async (req, res) => {
    const { enterprise_id, TimeStamp } = req.body;
    try {
        if (enterprise_id) {
            const EnterpriseUser = await EnterpriseUserModel.find({ EnterpriseID: enterprise_id });
            return res.status(200).json({ success: true, message: 'Data fetched successfully', data: EnterpriseUser });
        }
        if (TimeStamp) {
            const OptimizerLogData = await OptimizerLogModel.find({ TimeStamp: TimeStamp });
            return res.status(200).json({ success: true, message: 'Data fetched successfully', data: OptimizerLogData });
        }
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: 'Internal Server Error', err: error.message });
    }
};

exports.AllDataLogDemo = async (req, res) => {
    try {
        const AllGetway = await GatewayModel.find();
        const GatewaysWithOptimizerLogs = await Promise.all(AllGetway.map(async (gateway) => {
            const GatewayLogs = await GatewayLogModel.findOne(
                { GatewayID: gateway._id },
                { Phases: 1, KVAH: 1, KWH: 1, PF: 1, _id: 0 }
            );

            const OptimizerLogsForGateway = await OptimizerLogModel.find(
                { GatewayID: gateway._id },
                { TimeStamp: 1, RoomTemperature: 1, Humidity: 1, CoilTemperature: 1, OptimizerID: 1, OptimizerMode: 1, _id: 0 }
            );

            // Transform OptimizerLogsForGateway array to include only specific fields
            const TransformedOptimizerLogs = OptimizerLogsForGateway.map(log => ({
                TimeStamp: log.TimeStamp,
                RoomTemperature: log.RoomTemperature,
                Humidity: log.Humidity,
                CoilTemperature: log.CoilTemperature,
                OptimizerID: log.OptimizerID,
                OptimizerMode: log.OptimizerMode
            }));

            const gatewayData = { GatewayID: gateway.GatewayID, OptimizerLogDetails: TransformedOptimizerLogs, ...GatewayLogs?._doc };
            return gatewayData;
        }));

        // Filter out gateways without OptimizerLogDetails and GatewayLogs._doc
        const filteredGateways = GatewaysWithOptimizerLogs.filter(gateway => gateway.OptimizerLogDetails.length > 0);
        return res.status(200).json({ success: true, message: 'Data fetched successfully', data: filteredGateways });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: 'Internal Server Error', err: error.message });
    }
};

