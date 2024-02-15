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
        const { Customer, Stateid, Locationid, Gatewayid, startDate, endDate, Interval } = req.body;
        const { page, pageSize } = req.query;
        // console.log(Interval, "++++++++++++++++++");
        // return;
        // Create a Date object with the given string
        const startDateObject = new Date(startDate);
        const endDateObject = new Date(endDate);

        // Get the timestamp in milliseconds
        const startTimeStamp = startDateObject.getTime().toString();
        const endTimeStamp = endDateObject.getTime().toString();


        // Validate page and pageSize parameters
        const validatedPage = Math.max(1, parseInt(page, 10)) || 1;
        const validatedPageSize = Math.max(1, parseInt(pageSize, 10)) || 10;



        // Fetch Enterprise data
        const enterprise = await EnterpriseModel.findOne({ _id: Customer });
        if (!enterprise) {
            return res.status(404).json({
                success: false,
                message: "This enterprise is not available",
            });
        } else if (!startDate || !endDate) {
            return res.status(404).json({
                success: false,
                message: "Please provide Start and End Date and time ",
            });
        }

        // Pagination
        const skip = (validatedPage - 1) * validatedPageSize;
        // const skip = (page - 1) * pageSize;

        // Aggregation Pipeline
        let aggregationPipeline = [];

        if (Stateid && Locationid && Gatewayid) {

            const gatewayLogData = await GatewayLogModel.find({
                GatewayID: [Gatewayid],
                TimeStamp: { $gte: startTimeStamp, $lte: endTimeStamp },
            })
                .skip(skip)
                .limit(validatedPageSize);
            const totalgatewaydata = await GatewayLogModel.find({
                GatewayID: [Gatewayid],
                TimeStamp: { $gte: startTimeStamp, $lte: endTimeStamp },
            })

            // console.log(gatewayLogData, " gatewaylog data ");
            const responseData = [];
            const locationData = await EnterpriseStateLocationModel.findOne({
                State_ID: Stateid,
                _id: Locationid,
                Enterprise_ID: Customer,
            });
            const stateData = await StateModel.findOne({ _id: Stateid });
            const gatewayName = await GatewayModel.findOne({ _id: Gatewayid });
            const state = {
                stateName: stateData.name,
                location: [],
            };
            const location = {
                locationName: locationData.LocationName,
                Gateway: [],
            };

            if (gatewayLogData.length > 0 && locationData && stateData) {
                if (gatewayLogData.length > 0) {
                    location.Gateway.push({
                        GatewayName: gatewayName.GatewayID,
                        Gatewaylog: gatewayLogData,
                    });
                }
                if (location.Gateway.length > 0) {
                    state.location.push(location);
                }
                if (state.location.length > 0) {
                    responseData.push({
                        EnterpriseName: enterprise.EnterpriseName,
                        State: [state],
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Data fetched successfully",
                    response: responseData,
                    pagination: {
                        page: validatedPage,
                        pageSize: validatedPageSize,
                        totalResults: totalgatewaydata.length, // You may need to adjust this based on your actual total count
                    },
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: "No data available for the provided parameters",
                });
            }
        } else if (Stateid && Locationid) {
            const locationData = await EnterpriseStateLocationModel.findOne({
                State_ID: Stateid,
                _id: Locationid,
                Enterprise_ID: Customer,
            });
            const stateData = await StateModel.findOne({ _id: Stateid });
            const gatewayData = await GatewayModel.find({ EnterpriseInfo: Locationid });
            const gatewayIDs = gatewayData.map((data) => data._id);

            aggregationPipeline = [
                {
                    $match: {
                        GatewayID: { $in: gatewayIDs },
                        TimeStamp: { $gte: startTimeStamp, $lte: endTimeStamp },
                    },
                },
            ];
            // Add pagination to the pipeline
            aggregationPipeline.push(
                { $skip: skip },
                { $limit: validatedPageSize }
            );

            // Execute Aggregation Pipeline
            const gatewayLogData = await GatewayLogModel.aggregate(aggregationPipeline);
            // console.log(gatewayLogData,"___________________");

            const responseData = [];
            const state = {
                stateName: stateData.name,
                location: [],
            };
            const location = {
                locationName: locationData.LocationName,
                Gateway: [],
            };
            // responseData[stateData.name] = responseData[stateData.name] || { locations: {} };
            // responseData[stateData.name].locations[Locationid] = { gateways: {} };

            for (const gateway of gatewayData) {
                const gatewayName = gateway.GatewayID;
                const gatewayLogsForGateway = gatewayLogData.filter((log) => log.GatewayID.equals(gateway._id));

                if (gatewayLogsForGateway.length > 0) {
                    location.Gateway.push({
                        GatewayName: gatewayName,
                        Gatewaylog: gatewayLogsForGateway,
                    });
                }
            }
            if (location.Gateway.length > 0) {
                state.location.push(location);
            }

            if (state.location.length > 0) {
                responseData.push({
                    EnterpriseName: enterprise.EnterpriseName,
                    State: [state],
                });
            }





            return res.status(200).json({
                success: true,
                message: "Data fetched successfully",
                response: responseData,
            });
        } else if (Stateid) {
            // -------------====================================================
            const locationData = await EnterpriseStateLocationModel.find({
                State_ID: Stateid,
                Enterprise_ID: Customer,
            });
            const stateData = await StateModel.findOne({ _id: Stateid });

            const responseData = [];
            const state = {
                stateName: stateData.name,
                location: [],
            };
            if (!locationData) {
                return res.status(404).json({
                    success: false,
                    message: "No location data available for the selected state",
                });
            }

            const locationIDs = locationData.map((data) => data._id);
            let gatewayLogDataPresent = false;

            for (const locationID of locationIDs) {
                const gatewayData = await GatewayModel.find({ EnterpriseInfo: locationID });
                const gatewayIDs = gatewayData.map((data) => data._id);
                aggregationPipeline = [
                    {
                        $match: {
                            GatewayID: { $in: gatewayIDs },
                            TimeStamp: { $gte: startTimeStamp, $lte: endTimeStamp },
                        },
                    },
                ];
                // Add pagination to the pipeline
                aggregationPipeline.push(
                    { $skip: skip },
                    { $limit: validatedPageSize }
                );

                // Execute Aggregation Pipeline
                const gatewayLogData = await GatewayLogModel.aggregate(aggregationPipeline);


                if (gatewayLogData.length > 0) {
                    gatewayLogDataPresent = true;
                    const location = {

                        // Include state name

                        locationName: locationData.find((loc) => loc._id.equals(locationID)).LocationName,
                        Gateway: [],
                    };
                    for (const gateway of gatewayData) {
                        const gatewayName = gateway.GatewayID;

                        if (gatewayLogData.some((log) => log.GatewayID.equals(gateway._id))) {
                            location.Gateway.push({
                                GatewayName: gatewayName,
                                Gatewaylog: gatewayLogData.filter((log) => log.GatewayID.equals(gateway._id)),
                            });
                        }
                    }
                    if (location.Gateway.length > 0) {
                        state.location.push(location);
                    }
                }
            }
            if (state.location.length > 0) {
                responseData.push({
                    EnterpriseName: enterprise.EnterpriseName,
                    State: [state],
                });
            }
            if (!gatewayLogDataPresent) {
                return res.status(404).json({
                    success: false,
                    message: "No data available for the selected State",
                });
            }
            return res.status(200).json({
                success: true,
                message: "Data fetched successfully",
                response: responseData,
            });
            // ----------------------------------------------------------
        } else {
            const enterpriseStateData = await EnterpriseStateModel.find({ Enterprise_ID: Customer });

            if (enterpriseStateData.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No states available for this enterprise",
                });
            }

            const responseData = {
                EnterpriseName: enterprise.EnterpriseName,
                State: [],
            };

            const stateIDs = enterpriseStateData.map((stateData) => stateData.State_ID);

            for (const stateID of stateIDs) {
                const stateData = await StateModel.findOne({ _id: stateID });
                const locationData = await EnterpriseStateLocationModel.find({ State_ID: stateID, Enterprise_ID: Customer });
                const locationIDs = locationData.map((data) => data._id);
                let gatewayLogDataPresent = false;

                const state = {
                    stateName: stateData.name,
                    location: [],
                };

                for (const locationID of locationIDs) {
                    const locationDataName = await EnterpriseStateLocationModel.findOne({ _id: locationID });
                    const location = {
                        locationName: locationDataName.LocationName,
                        Gateway: [],
                    };
                    const gatewayData = await GatewayModel.find({ EnterpriseInfo: locationID });
                    // const gatewayIDs = gatewayData.map((data) => data._id);
                    for (const gateway of gatewayData) {
                        const gatewayName = gateway.GatewayID;

                        aggregationPipeline = [
                            {
                                $match: {
                                    GatewayID: { $in: [gateway._id] },
                                    TimeStamp: { $gte: startTimeStamp, $lte: endTimeStamp },
                                },
                            },
                        ];
                        aggregationPipeline.push(
                            { $skip: skip },
                            { $limit: validatedPageSize }
                        );
                        // Execute Aggregation Pipeline
                        const gatewayLogData = await GatewayLogModel.aggregate(aggregationPipeline);

                        if (gatewayLogData.length > 0) {
                            location.Gateway.push({
                                GatewayName: gatewayName,
                                Gatewaylog: gatewayLogData,
                            });
                        }
                    }
                    if (location.Gateway.length > 0) {
                        state.location.push(location);
                    }

                }

                if (state.location.length > 0) {
                    responseData.State.push(state);
                }
            }

            if (Object.keys(responseData).length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No data available for the selected date and time range",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Data fetched successfully ",
                response: [responseData],
                pagination: {
                    page: validatedPage,
                    pageSize: validatedPageSize,
                    // totalResults: totalgatewaydata.length, // You may need to adjust this based on your actual total count
                },
            });
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        return res.status(500).json("Internal server error");
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