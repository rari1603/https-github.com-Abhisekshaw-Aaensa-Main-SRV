const EnterpriseModel = require('../../models/enterprise.model');
const EnterpriseStateModel = require('../../models/enterprise_state.model');
const EnterpriseStateLocationModel = require('../../models/enterprise_state_location.model');
const GatewayLogModel = require('../../models/GatewayLog.model');
const GatewayModel = require('../../models/gateway.model');
const OptimizerModel = require('../../models/optimizer.model');
const OptimizerLogModel = require('../../models/OptimizerLog.model');
const StateModel = require('../../models/state.model');
const { parse } = require('json2csv');
const istToTimestamp = require('../../utility/TimeStamp');



// AllDeviceData report
exports.AllDeviceData = async (req, res) => {
    const { enterprise_id, state_id, location_id, gateway_id, startDate, endDate } = req.body;
    const { page, pageSize } = req.query;

    try {
        // Validate the mandatory filters
        // if (!enterprise_id) {
        //     return res.status(400).json({ success: false, message: "Missing required field: Customer", key: "customer" });
        // }
        // if (!(startDate & endDate)) {
        //     return res.status(400).json({ success: false, message: "Missing required field: Date Range", key: "date" });
        // }

        // const startUtcTimestamp = new Date(startDate).getTime() / 1000;
        // const endUtcTimestamp = new Date(endDate).getTime() / 1000;

        const startIstTimestamp = istToTimestamp(startDate) / 1000;
        const endIstTimestamp = istToTimestamp(endDate) / 1000;

        const istOffsetSeconds = 5.5 * 60 * 60; // Offset for IST in seconds
        // Adjust timestamps for IST
        const startIstTimestampUTC = startIstTimestamp - istOffsetSeconds;
        const endIstTimestampUTC = endIstTimestamp - istOffsetSeconds;

        const validatedPage = Math.max(1, parseInt(page, 10)) || 1;
        const validatedPageSize = Math.max(1, parseInt(pageSize, 10)) || 10;
        const skip = (validatedPage - 1) * validatedPageSize;

        const Enterprise = await EnterpriseModel.findOne({ _id: enterprise_id });
        const enterpriseStateQuery = state_id ? { Enterprise_ID: Enterprise._id, State_ID: state_id } : { Enterprise_ID: Enterprise._id };

        const EntStates = await EnterpriseStateModel.find(enterpriseStateQuery);

        const responseData = [{
            EnterpriseName: Enterprise.EnterpriseName,
            State: [],
        }];

        let totalResults; // Initialize total count

        for (const State of EntStates) {
            const Location = await EnterpriseStateLocationModel.find(location_id ? { _id: location_id } : { Enterprise_ID: State.Enterprise_ID, State_ID: State.State_ID });
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

                        // Object to store optimizer logs grouped by timestamp
                        const groupedOptimizerLogs = {};

                        for (const optimizer of Optimizers) {
                            const query = {
                                OptimizerID: optimizer._id,
                                TimeStamp: { $gte: startIstTimestampUTC, $lte: endIstTimestampUTC },
                            };

                            const OptimizerLogs = await OptimizerLogModel.find(query)
                                .populate({
                                    path: "OptimizerID",
                                    OptimizerModel: "Optimizer",
                                    options: { lean: true }
                                })
                                .sort({ TimeStamp: 1 })
                                .skip(skip)
                                .limit(pageSize)
                                .lean();

                            // Group optimizer logs based on their timestamps
                            for (const optimizerLog of OptimizerLogs) {
                                const timestamp = optimizerLog.TimeStamp;
                                if (!groupedOptimizerLogs[timestamp]) {
                                    groupedOptimizerLogs[timestamp] = [];
                                }
                                groupedOptimizerLogs[timestamp].push(optimizerLog);
                            }

                            // Increment totalCount for each optimizer log
                            totalResults = await OptimizerLogModel.find({
                                OptimizerID: optimizer._id,
                                TimeStamp: { $gte: startIstTimestampUTC, $lte: endIstTimestampUTC },
                            });
                        }

                        // Create optimizer data for each unique timestamp and push grouped logs into it
                        for (const timestamp in groupedOptimizerLogs) {
                            const optimizerLogsForTimestamp = groupedOptimizerLogs[timestamp];
                            const optimizerData = {
                                timestamp: timestamp,
                                optimizerLogs: optimizerLogsForTimestamp
                            };
                            gatewayData.optimizer.push(optimizerData);
                        }

                        locationData.gateway.push(gatewayData);
                    }

                    stateData.location.push(locationData);
                }

                responseData[0].State.push(stateData);
            }
        }

        return res.send({
            success: true,
            message: "Data fetched successfully",
            data: responseData,
            pagination: {
                page: validatedPage,
                pageSize: validatedPageSize,
                totalResults: totalResults.length, // You may need to adjust this based on your actual total count
            },
        });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: 'Internal Server Error', err: error.message });
    }
};


// AllMeterData report
exports.AllMeterData = async (req, res) => {
    try {
        const { Customer, Stateid, Locationid, Gatewayid, startDate, endDate, Interval } = req.body;
        const { page, pageSize } = req.query;

        // Validate the mandatory filters
        // if (!Customer) {
        //     return res.status(400).json({ success: false, message: "Missing required field: Customer", key: "customer" });
        // }
        // if (!(startDate & endDate)) {
        //     return res.status(400).json({ success: false, message: "Missing required field: Date Range", key: "date" });
        // }

        // const startUtcTimestamp = new Date(startDate).getTime() / 1000;
        // const endUtcTimestamp = new Date(endDate).getTime() / 1000;

        const startIstTimestamp = istToTimestamp(startDate) / 1000;
        const endIstTimestamp = istToTimestamp(endDate) / 1000;

        const istOffsetSeconds = 5.5 * 60 * 60; // Offset for IST in seconds
        // Adjust timestamps for IST
        const startIstTimestampUTC = startIstTimestamp - istOffsetSeconds;
        const endIstTimestampUTC = endIstTimestamp - istOffsetSeconds;

        // Validate page and pageSize parameters
        const validatedPage = Math.max(1, parseInt(page, 10)) || 1;
        const validatedPageSize = Math.max(1, parseInt(pageSize, 10)) || 100;
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


        // Aggregation Pipeline
        let aggregationPipeline = [];
        const enterpriseStateQuery = Stateid ? { Enterprise_ID: enterprise._id, State_ID: Stateid } : { Enterprise_ID: enterprise._id };

        const EntStates = await EnterpriseStateModel.find(enterpriseStateQuery);

        const responseData = [];

        let totalResults;

        for (const States of EntStates) {
            const locationQuery = Locationid ? { _id: Locationid } : { Enterprise_ID: States.Enterprise_ID, State_ID: States.State_ID };
            const Location = await EnterpriseStateLocationModel.find(locationQuery);

            const state = await StateModel.findOne({ _id: States.State_ID });

            if (Location.length > 0) {

                const stateData = {
                    EnterpriseName: enterprise.EnterpriseName,
                    State: [
                        {
                            stateName: state.name,
                            state_ID: state._id,
                            location: []
                        }
                    ]
                };

                for (const loc of Location) {
                    const gatewayQuery = Gatewayid ? { _id: Gatewayid } : { EnterpriseInfo: loc._id };
                    const GatewayData = await GatewayModel.find(gatewayQuery);
                    const locationData = {
                        locationName: loc.LocationName,
                        location_ID: loc._id,
                        gateway: []
                    };

                    for (const gateway of GatewayData) {
                        let GatewayLogData = await GatewayLogModel.find({
                            GatewayID: gateway._id,
                            TimeStamp: { $gte: startIstTimestampUTC, $lte: endIstTimestampUTC },
                        })
                            .skip(skip)
                            .limit(validatedPageSize);

                        totalResults = await GatewayLogModel.find({
                            GatewayID: gateway._id,
                            TimeStamp: { $gte: startIstTimestampUTC, $lte: endIstTimestampUTC },
                        });

                        if (GatewayLogData.length > 0) {
                            locationData.gateway.push({
                                GatewayName: gateway.GatewayID,
                                Gateway_ID: gateway._id,
                                GatewayLogs: GatewayLogData
                            });
                        }
                    }

                    stateData.State[0].location.push(locationData);
                }

                responseData.push(stateData);
            }
        }




        return res.send({
            success: true,
            message: "Data fetched successfully",
            response: responseData,
            pagination: {
                page: validatedPage,
                pageSize: validatedPageSize,
                totalResults: totalResults.length, // You may need to adjust this based on your actual total count
            },
        });
    } catch (error) {
        console.error("Error fetching data:", error);
        return res.status(500).json({ success: false, message: "Internal server error", err: error });
    }
};




/******************************* R E P O R T  D O W N L O A D *********************************/
// DownloadDeviceDataReport
exports.DownloadDeviceDataReport = async (req, res) => {
    try {
        const { enterprise_id, state_id, location_id, gateway_id, startDate, endDate } = req.body;

        const startIstTimestamp = istToTimestamp(startDate) / 1000;
        const endIstTimestamp = istToTimestamp(endDate) / 1000;

        const istOffsetSeconds = 5.5 * 60 * 60; // Offset for IST in seconds
        // Adjust timestamps for IST
        const startIstTimestampUTC = startIstTimestamp - istOffsetSeconds;
        const endIstTimestampUTC = endIstTimestamp - istOffsetSeconds;

        const Enterprise = await EnterpriseModel.findOne({ _id: enterprise_id });
        if (!Enterprise) {
            return res.status(404).json({
                success: false,
                message: "Enterprise not found",
            });
        }

        const enterpriseStateQuery = state_id ? { Enterprise_ID: Enterprise._id, State_ID: state_id } : { Enterprise_ID: Enterprise._id };
        const EntStates = await EnterpriseStateModel.find(enterpriseStateQuery);

        const allData = [];

        for (const State of EntStates) {
            const Location = await EnterpriseStateLocationModel.find(location_id ? { _id: location_id } : { Enterprise_ID: State.Enterprise_ID, State_ID: State.State_ID });

            for (const loc of Location) {
                const gatewayQuery = gateway_id ? { GatewayID: gateway_id } : { EnterpriseInfo: loc._id };
                const Gateways = await GatewayModel.find(gatewayQuery);

                for (const gateway of Gateways) {
                    const Optimizers = await OptimizerModel.find({ GatewayId: gateway._id });

                    for (const optimizer of Optimizers) {
                        const query = {
                            OptimizerID: optimizer._id,
                            TimeStamp: { $gte: startIstTimestampUTC, $lte: endIstTimestampUTC },
                        };

                        const OptimizerLogs = await OptimizerLogModel.find(query).sort({ TimeStamp: 1 }).lean();

                        const mappedData = OptimizerLogs.map(log => ({
                            OptimizerID: optimizer.OptimizerID, // Assuming OptimizerID is the field you want from the Optimizer model
                            GatewayID: `'${gateway.GatewayID}'`, // Prepend apostrophe to GatewayID
                            Date: new Date(log.TimeStamp * 1000).toLocaleDateString(),
                            Time: new Date(log.TimeStamp * 1000).toLocaleTimeString(),
                            RoomTemperature: log.RoomTemperature,
                            Humidity: log.Humidity,
                            CoilTemperature: log.CoilTemperature,
                            OptimizerMode: log.OptimizerMode
                        }));

                        allData.push(...mappedData);
                    }
                }
            }
        }

        // Group data by timestamp
        const groupedData = {};
        allData.forEach(item => {
            const timestamp = item.Time;
            if (!groupedData[timestamp]) {
                groupedData[timestamp] = [];
            }
            groupedData[timestamp].push(item);
        });

        // Fields that are included in the CSV output
        const fields = ['OptimizerID', 'GatewayID', 'Date', 'Time', 'RoomTemperature', 'Humidity', 'CoilTemperature', 'OptimizerMode'];

        // Generate CSV sections
        const csvSections = Object.keys(groupedData).map(timestamp => {
            return groupedData[timestamp];
        });

        // Generate filename dynamically
        const currentDate = new Date();
        const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
        const formattedTime = `${currentDate.getHours().toString().padStart(2, '0')}-${currentDate.getMinutes().toString().padStart(2, '0')}`;
        const filename = `Report_${formattedDate}_${formattedTime}.csv`;

        // Set headers for file download with dynamic filename
        res.setHeader('Content-disposition', `attachment; filename=${filename}`);
        res.set('Content-Type', 'text/csv');

        // Convert data to CSV
        const csvData = parse(csvSections.flat(), { header: false });

        // Add header row at H1
        const headerRow = fields.map(field => `"${field}"`).join(',') + '\r\n';
        const finalCsvData = headerRow + csvData;

        // Send CSV data as response
        return res.status(200).send(finalCsvData);

    } catch (error) {
        console.error("Error:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

// DownloadMeterDataReport
exports.DownloadMeterDataReport = async (req, res) => {
    try {
        const { Customer, Stateid, Locationid, Gatewayid, startDate, endDate, Interval } = req.body;

        const startIstTimestamp = istToTimestamp(startDate) / 1000;
        const endIstTimestamp = istToTimestamp(endDate) / 1000;

        const istOffsetSeconds = 5.5 * 60 * 60; // Offset for IST in seconds
        // Adjust timestamps for IST
        const startIstTimestampUTC = startIstTimestamp - istOffsetSeconds;
        const endIstTimestampUTC = endIstTimestamp - istOffsetSeconds;

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

        // Aggregation Pipeline
        let aggregationPipeline = [];
        const enterpriseStateQuery = Stateid ? { Enterprise_ID: enterprise._id, State_ID: Stateid } : { Enterprise_ID: enterprise._id };

        const EntStates = await EnterpriseStateModel.find(enterpriseStateQuery);

        const allData = [];

        for (const States of EntStates) {
            const locationQuery = Locationid ? { _id: Locationid } : { Enterprise_ID: States.Enterprise_ID, State_ID: States.State_ID };
            const Location = await EnterpriseStateLocationModel.find(locationQuery);

            for (const loc of Location) {
                const gatewayQuery = Gatewayid ? { _id: Gatewayid } : { EnterpriseInfo: loc._id };
                const GatewayData = await GatewayModel.find(gatewayQuery);

                for (const gateway of GatewayData) {
                    let GatewayLogData = await GatewayLogModel.find({
                        GatewayID: gateway._id,
                        TimeStamp: { $gte: startIstTimestampUTC, $lte: endIstTimestampUTC },
                    });

                    // Map GatewayLogData to include only desired fields
                    const mappedData = GatewayLogData.map(log => ({
                        GatewayID: `'${gateway.GatewayID}'`, // Prepend apostrophe to GatewayID
                        Date: new Date(log.TimeStamp * 1000).toLocaleDateString(),
                        Time: new Date(log.TimeStamp * 1000).toLocaleTimeString(),
                        'Ph1:Voltage': log.Phases.Ph1.Voltage,
                        'Ph1:Current': log.Phases.Ph1.Current,
                        'Ph1:ActivePower': log.Phases.Ph1.ActivePower,
                        'Ph1:PowerFactor': log.Phases.Ph1.PowerFactor,
                        'Ph1:ApparentPower': log.Phases.Ph1.ApparentPower,

                        'Ph2:Voltage': log.Phases.Ph2.Voltage,
                        'Ph2:Current': log.Phases.Ph2.Current,
                        'Ph2:ActivePower': log.Phases.Ph2.ActivePower,
                        'Ph2:PowerFactor': log.Phases.Ph2.PowerFactor,
                        'Ph2:ApparentPower': log.Phases.Ph2.ApparentPower,

                        'Ph3:Voltage': log.Phases.Ph3.Voltage,
                        'Ph3:Current': log.Phases.Ph3.Current,
                        'Ph3:ActivePower': log.Phases.Ph3.ActivePower,
                        'Ph3:PowerFactor': log.Phases.Ph3.PowerFactor,
                        'Ph3:ApparentPower': log.Phases.Ph3.ApparentPower,

                        'KVAH': log.KVAH,
                        'KWH': log.KWH,
                        'PF': log.PF,
                    }));

                    // Push mappedData into allData array
                    allData.push(...mappedData);
                }
            }
        }
        // Fields that are included in the CSV output
        const fields = [
            'GatewayID',
            'Date',
            'Time',
            'Ph1:Voltage', 'Ph1:Current', 'Ph1:ActivePower', 'Ph1:PowerFactor', 'Ph1:ApparentPower',
            'Ph2:Voltage', 'Ph2:Current', 'Ph2:ActivePower', 'Ph2:PowerFactor', 'Ph2:ApparentPower',
            'Ph3:Voltage', 'Ph3:Current', 'Ph3:ActivePower', 'Ph3:PowerFactor', 'Ph3:ApparentPower',
            'KVAH', 'KWH', 'PF'
        ];


        // Add a heading to the CSV data
        const heading = [`Device Meter Report from ${startDate} to ${endDate}`];
        const csvData = parse([heading, ...allData], { fields, header: true });

        // Generate filename dynamically
        const currentDate = new Date();
        const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
        const formattedTime = `${currentDate.getHours().toString().padStart(2, '0')}-${currentDate.getMinutes().toString().padStart(2, '0')}`;
        const filename = `MeterData_${formattedDate}_${formattedTime}.csv`;

        // Set headers for file download with dynamic filename
        res.setHeader('Content-disposition', `attachment; filename=${filename}`);
        res.set('Content-Type', 'text/csv');

        // Send CSV data as response
        return res.status(200).send(csvData);

    } catch (error) {
        console.error("Error fetching data:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error", err: error });
    }
};





/********************** NOT IN USE************************/
// AllDataLogDemo
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
