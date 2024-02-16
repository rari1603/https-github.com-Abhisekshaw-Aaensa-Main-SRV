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
    try {
        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);

        if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid date format' });
        }

        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 50;
        const skip = (page - 1) * pageSize;

        const Enterprise = await EnterpriseModel.findOne({ _id: enterprise_id });
        const enterpriseStateQuery = state_id ? { Enterprise_ID: Enterprise._id, State_ID: state_id } : { Enterprise_ID: Enterprise._id };

        // Fetch states for the current page only
        const EntStates = await EnterpriseStateModel.find(enterpriseStateQuery).skip(skip).limit(pageSize);

        const responseData = [];

        for (const State of EntStates) {
            const locationQuery = location_id ? { _id: location_id } : { Enterprise_ID: State.Enterprise_ID, State_ID: State.State_ID };
            const Location = await EnterpriseStateLocationModel.find(locationQuery);

            const state = await StateModel.findOne({ _id: State.State_ID });

            if (Location.length > 0) {
                const stateData = {
                    stateName: state.name,
                    state_ID: state._id,
                    location: []
                };

                for (const loc of Location) {
                    const gatewayQuery = gateway_id ? { GatewayID: gateway_id } : { EnterpriseInfo: loc._id };
                    const Gateways = await GatewayModel.find(gatewayQuery);

                    const locationData = {
                        locationName: loc.LocationName,
                        location_ID: loc._id,
                        gateway: []
                    };

                    for (const gateway of Gateways) {
                        const Optimizers = await OptimizerModel.find({ GatewayId: gateway._id });

                        const gatewayData = {
                            GatewayName: gateway.GatewayID,
                            Gateway_ID: gateway._id,
                            optimizer: []
                        };

                        for (const optimizer of Optimizers) {
                            const query = {
                                OptimizerID: optimizer._id,
                                createdAt: { $gte: parsedStartDate, $lte: parsedEndDate }
                            };

                            const OptimizerLogs = await OptimizerLogModel.find(query);

                            const optimizerData = {
                                optimizerName: optimizer.OptimizerID,
                                optimizer_ID: optimizer._id,
                                optimizerLogs: OptimizerLogs.map(optimizerLog => (optimizerLog))
                            };

                            gatewayData.optimizer.push(optimizerData);
                        }

                        locationData.gateway.push(gatewayData);
                    }

                    stateData.location.push(locationData);
                }

                responseData.push(stateData);
            }
        }

        const totalCount = await EnterpriseStateModel.countDocuments(enterpriseStateQuery);
        const totalPages = Math.ceil(totalCount / pageSize);

        return res.send({
            totalPages,
            currentPage: page,
            data: responseData
        });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: 'Internal Server Error', err: error.message });
    }
};


exports.AllMeterData = async (req, res) => {
    try {
        const { Customer, Stateid, Locationid, Gatewayid, startDate, endDate } = req.body;
        const { page = 1, pageSize = 10 } = req.query;

        if (!Customer || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "Please provide Customer ID, Start and End Date",
            });
        }

        // Convert frontend date and time format to UTC
        const startUtcTimestamp = (new Date(startDate).getTime() / 1000);
        const endUtcTimestamp = (new Date(endDate).getTime() / 1000);

        // Pagination
        const skip = (page - 1) * pageSize;

        // Fetch Enterprise data
        const enterprise = await EnterpriseModel.findOne({ _id: Customer });
        if (!enterprise) {
            return res.status(404).json({
                success: false,
                message: "Enterprise not found",
            });
        }

        // Construct query for Enterprise States
        const enterpriseStateQuery = Stateid ? { Enterprise_ID: enterprise._id, State_ID: Stateid } : { Enterprise_ID: enterprise._id };
        const EntStates = await EnterpriseStateModel.find(enterpriseStateQuery);

        const responseData = [];
        let totalResults = 0;

        for (const state of EntStates) {
            const locationQuery = Locationid ? { _id: Locationid } : { Enterprise_ID: state.Enterprise_ID, State_ID: state.State_ID };
            const locations = await EnterpriseStateLocationModel.find(locationQuery);

            if (locations.length > 0) {
                const stateData = {
                    EnterpriseName: enterprise.EnterpriseName,
                    State: [
                        {
                            stateName: state.name,
                            state_ID: state._id,
                            location: [],
                        },
                    ],
                };

                for (const location of locations) {
                    const gatewayQuery = Gatewayid ? { _id: Gatewayid } : { EnterpriseInfo: location._id };
                    const gateways = await GatewayModel.find(gatewayQuery);

                    for (const gateway of gateways) {
                        const gatewayLogCount = await GatewayLogModel.countDocuments({
                            GatewayID: gateway._id,
                            TimeStamp: { $gte: startUtcTimestamp, $lte: endUtcTimestamp },
                        });

                        totalResults += gatewayLogCount;

                        const gatewayLogData = await GatewayLogModel.find({
                            GatewayID: gateway._id,
                            TimeStamp: { $gte: startUtcTimestamp, $lte: endUtcTimestamp },
                        }).sort({ TimeStamp: -1 }).skip(skip).limit(parseInt(pageSize));

                        if (gatewayLogData.length > 0) {
                            // Sort the data in descending order of TimeStamp
                            gatewayLogData.sort((a, b) => b.TimeStamp - a.TimeStamp);

                            stateData.State[0].location.push({
                                locationName: location.LocationName,
                                location_ID: location._id,
                                gateway: {
                                    GatewayName: gateway.GatewayID,
                                    Gateway_ID: gateway._id,
                                    GatewayLogs: gatewayLogData,
                                },
                            });
                        }
                    }
                }

                responseData.push(stateData);
            }
        }

        return res.json({
            success: true,
            message: "Data fetched successfully",
            response: responseData,
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                totalResults: totalResults,
            },
        });
    } catch (error) {
        console.error("Error fetching data:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
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
                    TimeStamp: {
                        $dateToString: {
                            format: "%Y-%m-%d %H:%M:%S GMT%z", // Format the date without %I for 24-hour clock
                            date: {
                                $toDate: {
                                    $multiply: [
                                        { $toDouble: "$TimeStamp" }, // Convert to numeric type
                                        1000
                                    ]
                                }
                            },
                            timezone: "+05:30" // Set your desired timezone
                        }
                    },
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