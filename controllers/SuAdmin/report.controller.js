const EnterpriseModel = require('../../models/enterprise.model');
const GatewayLogModel = require('../../models/GatewayLog.model');


exports.AllDataLog = async (req, res) => {
    const { enterprise_id, state_id, location_id, gateway_id } = req.body;

    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 50;

        const lookUpQuery = {
            from: 'optimizerlogs',
            localField: '_id',
            foreignField: 'GatewayLogID',
            as: 'OptimizerLogDetails'
        };

        const gatewayLookup = {
            from: 'gateways', // GatewayModel collection is named 'gateways'
            localField: 'GatewayID',
            foreignField: '_id',
            as: 'GatewayDetails'
        };

        const optimizerLookup = {
            from: 'optimizers', // OptimizerModel collection is named 'optimizers'
            localField: 'OptimizerLogDetails.OptimizerID',
            foreignField: '_id',
            as: 'OptimizerDetails'
        };

        const projectQuery = {
            _id: 1,
            GatewayID: { $arrayElemAt: ['$GatewayDetails.GatewayID', 0] },
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
                        OptimizerID: {
                            $ifNull: [
                                { $ifNull: [{ $arrayElemAt: ['$OptimizerDetails.OptimizerID', 0] }, '$$optimizer.OptimizerID'] },
                                null
                            ]
                        },
                        GatewayID: { $arrayElemAt: ['$GatewayDetails.GatewayID', 0] },
                        GatewayLogID: '$$optimizer.GatewayLogID',
                        RoomTemperature: '$$optimizer.RoomTemperature',
                        CoilTemperature: '$$optimizer.CoilTemperature',
                        OptimizerMode: '$$optimizer.OptimizerMode',
                        isDelete: '$$optimizer.isDelete',
                        OptimizerDetails: '$$optimizer.OptimizerDetails'
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
                $lookup: gatewayLookup
            },
            {
                $lookup: optimizerLookup
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
        const pageSize = parseInt(req.query.pageSize) || 50;

        const lookUpQuery = {
            from: 'optimizerlogs',
            localField: '_id',
            foreignField: 'GatewayLogID',
            as: 'OptimizerLogDetails'
        };

        const gatewayLookup = {
            from: 'gateways', // GatewayModel collection is named 'gateways'
            localField: 'GatewayID',
            foreignField: '_id',
            as: 'GatewayDetails'
        };

        const optimizerLookup = {
            from: 'optimizers', // OptimizerModel collection is named 'optimizers'
            localField: 'OptimizerLogDetails.OptimizerID',
            foreignField: '_id',
            as: 'OptimizerDetails'
        };

        const projectQuery = {
            _id: 1,
            GatewayID: { $arrayElemAt: ['$GatewayDetails.GatewayID', 0] },
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
                        OptimizerID: {
                            $ifNull: [
                                { $ifNull: [{ $arrayElemAt: ['$OptimizerDetails.OptimizerID', 0] }, '$$optimizer.OptimizerID'] },
                                null
                            ]
                        },
                        GatewayID: { $arrayElemAt: ['$GatewayDetails.GatewayID', 0] },
                        GatewayLogID: '$$optimizer.GatewayLogID',
                        RoomTemperature: '$$optimizer.RoomTemperature',
                        Humidity: '$$optimizer.Humidity',
                        CoilTemperature: '$$optimizer.CoilTemperature',
                        OptimizerMode: '$$optimizer.OptimizerMode',
                        isDelete: '$$optimizer.isDelete',
                        OptimizerDetails: '$$optimizer.OptimizerDetails'
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
                $lookup: gatewayLookup
            },
            {
                $lookup: optimizerLookup
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