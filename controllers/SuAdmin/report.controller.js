const EnterpriseModel = require('../../models/enterprise.model');
const EnterpriseStateModel = require('../../models/enterprise_state.model');
const EnterpriseStateLocationModel = require('../../models/enterprise_state_location.model');
const GatewayLogModel = require('../../models/GatewayLog.model');
const GatewayModel = require('../../models/gateway.model');
const OptimizerModel = require('../../models/optimizer.model');
const OptimizerLogModel = require('../../models/OptimizerLog.model');
const StateModel = require('../../models/state.model');


exports.AllDeviceLog = async (req, res) => {
    const { enterprise_id, state_id, location_id, gateway_id, startDate, endDate } = req.body;
    // console.log(req.body);
    try {
        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);

        // Adjust the time zone offset for India Standard Time (IST)
        // parsedStartDate.setMinutes(parsedStartDate.getMinutes() + 330); // 5 hours 30 minutes
        // parsedEndDate.setMinutes(parsedEndDate.getMinutes() + 330); // 5 hours 30 minutes

        // Check if parsing was successful
        if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid date format' });
        }

        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 50;
        const skip = (page - 1) * pageSize;

        const query = {
            'Enterprise_ID': enterprise_id
        };

        if (state_id) {
            query['States.State_ID'] = state_id;
        }

        if (location_id) {
            query['States.Location_ID'] = location_id;
        }

        if (gateway_id) {
            query['States.Gateways.Gateway_ID'] = gateway_id;
        }

        const Enterprise = await EnterpriseModel.findOne({ _id: enterprise_id });
        const enterpriseStateQuery = state_id ? { Enterprise_ID: Enterprise._id, State_ID: state_id } : { Enterprise_ID: Enterprise._id };
        const EntStates = await EnterpriseStateModel.find(enterpriseStateQuery);

        const DATA = await Promise.all(EntStates.map(async (State) => {
            const locationQuery = location_id ? { _id: location_id } : { Enterprise_ID: State.Enterprise_ID, State_ID: State.State_ID };

            const Location = await EnterpriseStateLocationModel.find(locationQuery);

            const state = await StateModel.findOne({ _id: State.State_ID });

            if (Location.length > 0) {
                return {
                    stateName: state.name,
                    state_ID: state._id,
                    location: await Promise.all(Location.map(async (loc) => {

                        const gatewayQuery = gateway_id ? { GatewayID: gateway_id } : { EnterpriseInfo: loc._id };
                        const Gateways = await GatewayModel.find(gatewayQuery);

                        return {
                            locationName: loc.LocationName,
                            location_ID: loc._id,
                            gateway: await Promise.all(Gateways.map(async (gateway) => {
                                const Optimizers = await OptimizerModel.find({
                                    GatewayId: gateway._id
                                });

                                return {
                                    GatewayName: gateway.GatewayID,
                                    Gateway_ID: gateway._id,

                                    optimizer: await Promise.all(Optimizers.map(async (optimizer) => {
                                        const query = {
                                            OptimizerID: optimizer._id,
                                            createdAt: { $gte: parsedStartDate, $lte: parsedEndDate }
                                        };
                                        // console.log(query);

                                        const OptimizerLogs = await OptimizerLogModel.find(query);

                                        return {
                                            optimizerName: optimizer.OptimizerID,
                                            optimizer_ID: optimizer._id,
                                            optimizerLogs: OptimizerLogs.map(optimizerLog => (optimizerLog))
                                        };
                                    }))
                                };
                            }))
                        };
                    }))
                };
            } else {
                return null;
            }
        }));

        const responseData = [{
            Enterprise: Enterprise.EnterpriseName,
            Enterprise_ID: Enterprise._id,
            States: DATA.filter(state => state !== null)
        }];

        return res.send(responseData);

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: 'Internal Server Error', err: error.message });
    }
};




exports.AllDataLogDemo = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 50;
        const skip = (page - 1) * pageSize;

        const pipeline = [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: pageSize },
            {
                $lookup: {
                    from: 'optimizerlogs',
                    localField: '_id',
                    foreignField: 'GatewayLogID',
                    as: 'OptimizerLogDetails'
                }
            },
            {
                $lookup: {
                    from: 'gateways',
                    localField: 'GatewayID',
                    foreignField: '_id',
                    as: 'GatewayDetails'
                }
            },
            {
                $lookup: {
                    from: 'optimizers',
                    localField: 'OptimizerLogDetails.OptimizerID',
                    foreignField: '_id',
                    as: 'OptimizerDetails'
                }
            },
            {
                $project: {
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
                }
            }
        ];

        const allData = await GatewayLogModel.aggregate(pipeline);

        return res.status(200).json({ success: true, message: 'Data fetched successfully', data: allData });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error', err: error.message });
    }
};