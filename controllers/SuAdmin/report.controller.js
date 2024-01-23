const EnterpriseModel = require('../../models/enterprise.model');
// const EnterpriseUserModel = require('../../models/enterprise_user.model');
const EnterpriseStateModel = require('../../models/enterprise_state.model');
// const EnterpriseStateLocationModel = require('../../models/enterprise_state_location.model');
const GatewayModel = require('../../models/gateway.model');
const OptimizerLogModel = require('../../models/OptimizerLog.model');
const GatewayLogModel = require('../../models/GatewayLog.model');


exports.AllDataLog = async (req, res) => {
    const { enterprise_id, state_id, location_id, gateway_id } = req.body;

    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10; // Set your preferred page size

        const lookUpQuery = {
            from: 'optimizerlogs',
            localField: '_id',
            foreignField: 'GatewayLogID',
            as: 'OptimizerLogDetails'
        };

        const projectQuery = {
            _id: 1,
            GatewayID: 1,
            Phases: 1,
            KVAH: 1,
            KWH: 1,
            PF: 1,
            isDelete: 1,
            OptimizerLogDetails: {
                $map: {
                    input: '$OptimizerLogDetails',
                    as: 'optimizer',
                    in: {
                        OptimizerID: '$$optimizer.OptimizerID',
                        GatewayID: '$$optimizer.GatewayID',
                        GatewayLogID: '$$optimizer.GatewayLogID',
                        TimeStamp: '$$optimizer.TimeStamp',
                        RoomTemperature: '$$optimizer.RoomTemperature',
                        Humidity: '$$optimizer.Humidity',
                        CoilTemperature: '$$optimizer.CoilTemperature',
                        OptimizerMode: '$$optimizer.OptimizerMode',
                        isDelete: '$$optimizer.isDelete'
                    }
                }
            }
        };

        const skip = (page - 1) * pageSize;

        const allData = await GatewayLogModel.aggregate([
            {
                $lookup: lookUpQuery
            },
            {
                $project: projectQuery
            },
            {
                $skip: skip
            },
            {
                $limit: pageSize
            }
        ]);

        // Enterprise Level
        const Enterprise = await EnterpriseModel.findOne({ _id: enterprise_id });

        return res.status(200).json({ success: true, message: 'Data fetched successfully', data: allData });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: 'Internal Server Error', err: error.message });
    }
};

exports.AllDataLogDemo = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 50; // Set your preferred page size

        const lookUpQuery = {
            from: 'optimizerlogs',
            localField: '_id',
            foreignField: 'GatewayLogID',
            as: 'OptimizerLogDetails'
        };

        const projectQuery = {
            _id: 1,
            GatewayID: 1,
            TimeStamp: 1,
            Phases: 1,
            KVAH: 1,
            KWH: 1,
            PF: 1,
            isDelete: 1,
            OptimizerLogDetails: {
                $map: {
                    input: '$OptimizerLogDetails',
                    as: 'optimizer',
                    in: {
                        OptimizerID: '$$optimizer.OptimizerID',
                        GatewayID: '$$optimizer.GatewayID',
                        GatewayLogID: '$$optimizer.GatewayLogID',
                        // TimeStamp: '$$optimizer.TimeStamp',
                        RoomTemperature: '$$optimizer.RoomTemperature',
                        Humidity: '$$optimizer.Humidity',
                        CoilTemperature: '$$optimizer.CoilTemperature',
                        OptimizerMode: '$$optimizer.OptimizerMode',
                        isDelete: '$$optimizer.isDelete'
                    }
                }
            }
        };

        const skip = (page - 1) * pageSize;

        const allData = await GatewayLogModel.aggregate([
            {
                $lookup: lookUpQuery
            },
            {
                $project: projectQuery
            },
            {
                $sort: { TimeStamp: -1 }
            },
            {
                $skip: skip
            },
            {
                $limit: pageSize
            }
        ]);

        return res.status(200).json({ success: true, message: 'Data fetched successfully', data: allData });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error', err: error.message });
    }
};


