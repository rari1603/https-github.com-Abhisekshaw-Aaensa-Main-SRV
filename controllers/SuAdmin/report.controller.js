const EnterpriseModel = require('../../models/enterprise.model');
const EnterpriseStateModel = require('../../models/enterprise_state.model');
const EnterpriseStateLocationModel = require('../../models/enterprise_state_location.model');
const GatewayLogModel = require('../../models/GatewayLog.model');
const GatewayModel = require('../../models/gateway.model');
const OptimizerModel = require('../../models/optimizer.model');
const OptimizerLogModel = require('../../models/OptimizerLog.model');
const StateModel = require('../../models/state.model');
const NewApplianceLogModel = require('../../models/NewApplianceLog.model');
const OptimizerOnOff = require('../../models/OptimizerOnOff');
const { parse } = require('json2csv');
const istToTimestamp = require('../../utility/TimeStamp');
const moment = require('moment-timezone');
const OptimizerOnOffModel = require('../../models/OptimizerOnOff');
const mongoose = require('mongoose');

const objectId = mongoose.Types.ObjectId;





const UtilInter = require('../../utility/Interval');
const UtilDown = require('../../utility/Download');
const fs = require('fs');
const { log } = require('console');

const INTERVAL_ARRAY = {
    "Actual": '--',
    "15s": 15,
    "30s": 30,
    "1m": 60,
    "5m": 5 * 60,
    "10m": 10 * 60,
    "15m": 15 * 60,
    "30m": 30 * 60,
    "1h": 60 * 60,
    "2h": 2 * 60 * 60,
    "4h": 4 * 60 * 60,
    "8h": 8 * 60 * 60,
    "12h": 12 * 60 * 60
};

// AllDeviceData report
exports.AllDeviceData = async (req, res) => {
    console.log(JSON.stringify(req.body));
    const { enterprise_id, state_id, location_id, gateway_id, startDate, endDate, Interval, FirstRef, LastRef } = req.body;
    const { page, flag, PrevTimeStamp } = req.query;

    let pageSize = 100;
    if (Interval == '12h') {
        pageSize = 5000000;
    } else if (Interval == '8h') {
        pageSize = 100000;

    } else if (Interval == '4h') {
        pageSize = 50000;

    } else if (Interval == '2h') {
        pageSize = 10000;

    } else if (Interval == '1h') {
        pageSize = 5000;

    } else if (Interval == '30m') {
        pageSize = 1000;

    }
    const INTERVAL_IN_SEC = INTERVAL_ARRAY[Interval];

    try {
        const startTimestamp = parseISTDateString(startDate);


        const startIstTimestamp = istToTimestamp(startDate) / 1000;
        const endIstTimestamp = istToTimestamp(endDate) / 1000;


        const istOffsetSeconds = 5.5 * 60 * 60; // Offset for IST in seconds
        // Adjust timestamps for IST
        let startIstTimestampUTC;

        startIstTimestampUTC = startIstTimestamp - istOffsetSeconds;
        const endIstTimestampUTC = endIstTimestamp - istOffsetSeconds;
        const countPoint = startIstTimestamp - istOffsetSeconds;
        // Validate page and pageSize parameters
        let validatedPage = Math.max(1, parseInt(page, 10)) || 1;
        let validatedPageSize;
        validatedPageSize = Math.max(1, parseInt(pageSize, 10)) || 100;

        let skip = (validatedPage - 1) * validatedPageSize;

        console.log(validatedPage, "77");
        let pageWiseTimestamp = {};
        let pageReset = false;


        if (page > 1 && INTERVAL_IN_SEC != '--' && req.body.current_interval == Interval) {

            pageWiseTimestamp.interval = Interval; // Assuming Interval is defined elsewhere
            pageWiseTimestamp.page = {};

            pageWiseTimestamp.page[page - 1] = FirstRef;

            if (flag == "Prev") {
                startIstTimestampUTC = PrevTimeStamp
            } else {
                startIstTimestampUTC = LastRef;
            }
            skip = 0;
        } else if (req.body?.current_interval != Interval && INTERVAL_IN_SEC != '--') {

            validatedPage = 1
            startIstTimestampUTC = startIstTimestamp - istOffsetSeconds;
            pageReset = true;
            skip = 0;
        }
        else if (req.body?.current_interval != Interval && INTERVAL_IN_SEC === '--') {

            validatedPage = 1
            startIstTimestampUTC = startIstTimestamp - istOffsetSeconds;
            pageReset = true;
            skip = 0;
        }


        const Enterprise = await EnterpriseModel.findById(enterprise_id).lean();

        const enterpriseStateQuery = state_id ? { Enterprise_ID: Enterprise._id, State_ID: state_id } : { Enterprise_ID: Enterprise._id };
        const EntStates = await EnterpriseStateModel.find(enterpriseStateQuery).lean();

        const stateIds = EntStates.map(state => state.State_ID);
        const states = await StateModel.find({ _id: { $in: stateIds } }).lean();

        const stateIdToState = states.reduce((acc, state) => {
            acc[state._id] = state;
            return acc;
        }, {});




        const locationQueries = EntStates.map(State => {
            return location_id ? { _id: location_id } : { Enterprise_ID: State.Enterprise_ID, State_ID: State.State_ID };
        });

        const Locations = await EnterpriseStateLocationModel.find({ $or: locationQueries }).lean();

        const locationIds = Locations.map(loc => loc._id);
        const gatewayQuery = gateway_id ? { _id: gateway_id } : { EnterpriseInfo: { $in: locationIds } };
        const Gateways = await GatewayModel.find(gatewayQuery).lean();

        const locationIdToGateways = Gateways.reduce((acc, gateway) => {
            const locId = gateway.EnterpriseInfo.toString();
            if (!acc[locId]) acc[locId] = [];
            acc[locId].push(gateway);
            return acc;
        }, {});

        const optimizerLogQueries = Gateways.map(gateway => {
            return {
                GatewayID: gateway._id,
                TimeStamp: { $gte: startIstTimestampUTC, $lte: endIstTimestampUTC },
            };
        });
        console.log(JSON.stringify(optimizerLogQueries));

        const OptimizerLogs = await OptimizerLogModel.find({ $or: optimizerLogQueries })
            .populate({
                path: "OptimizerID",
                OptimizerModel: "Optimizer",
                // options: { lean: true }
            })
            .sort({ TimeStamp: 1 })
            .skip(skip)
            .limit(validatedPageSize)
            .lean();



        const gatewayIdToLogs = OptimizerLogs.reduce((acc, log) => {
            if (!acc[log.GatewayID]) acc[log.GatewayID] = [];
            acc[log.GatewayID].push(log);
            return acc;
        }, {});

        const DEVICE_LOG = [];
        let totalResults;
        const stateIdToLocations = Locations.reduce((acc, loc) => {
            if (!acc[loc.State_ID]) acc[loc.State_ID] = [];
            acc[loc.State_ID].push(loc);
            return acc;
        }, {});

        const responseData = [{
            EnterpriseName: Enterprise.EnterpriseName,
            State: stateIds.map(stateId => {
                const state = stateIdToState[stateId];
                const locations = stateIdToLocations[stateId] || [];
                const stateData = {
                    stateName: state.name,
                    state_ID: state._id,
                    location: locations.map(loc => {
                        const gateways = locationIdToGateways[loc._id.toString()] || [];
                        const locationData = {
                            locationName: loc.LocationName,
                            location_ID: loc._id,
                            gateway: gateways.map(gateway => {
                                const logs = gatewayIdToLogs[gateway._id] || [];
                                const modifiedOptimizerLogs = logs.map(log => ({
                                    ...log,
                                    EnterpriseName: Enterprise.EnterpriseName,
                                    stateName: state.name,
                                    state_ID: state._id,
                                    Gateway: gateway,
                                    locationName: loc.LocationName,
                                    location_ID: loc._id
                                }));

                                const optimizerData = {
                                    timestamp: 0, // Set actual timestamp if required
                                    optimizerLogs: modifiedOptimizerLogs
                                };

                                DEVICE_LOG.push({ optimizerLogs: modifiedOptimizerLogs });
                                return optimizerData;
                            })
                        };
                        return locationData;
                    })
                };
                return stateData;
            })
        }];

        // At this point, responseData and DEVICE_LOG are built and can be used further.


        // At this point, responseData and DEVICE_LOG are built and can be used further.


        // fs.writeFileSync("response.json", JSON.stringify(responseData));

        if (INTERVAL_IN_SEC != '--') {
            const NewResponseData = await UtilInter.DeviceData(INTERVAL_IN_SEC, DEVICE_LOG);
            // fs.writeFileSync("response.json", JSON.stringify(NewResponseData));

            return res.send({
                success: true,
                message: "Data fetched successfully",
                responseType: "Interval",
                // data: DEVICE_LOG,
                data: NewResponseData,
                pagination: {
                    page: validatedPage,
                    pageSize: validatedPageSize,
                    totalResults: totalResults,
                },
                pageWiseTimestamp,
                flag,
                current_interval: Interval,
                pageReset
            });
        }
        console.log("response send to client ");
        return res.send({
            success: true,
            message: "Data fetched successfully",
            responseType: "Actual",
            data: responseData,
            pagination: {
                page: validatedPage,
                pageSize: validatedPageSize,
                totalResults: totalResults
            },
            pageWiseTimestamp,
            flag,
            current_interval: Interval,
            pageReset
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal Server Error', err: error.message });
    }
};


function parseISTDateString(dateString) {
    // Parse the date string into a Date object
    const date = new Date(dateString);
    // Return the Unix timestamp in seconds
    return date.getTime() / 1000;
}


// console.log({
//     startIstTimestampUTC: { unix: startIstTimestampUTC, humanReadable: new Date(startIstTimestampUTC * 1000).toLocaleString() },
//     endIstTimestampUTC: { unix: endIstTimestampUTC, humanReadable: new Date(endIstTimestampUTC * 1000).toLocaleString() },
//     FirstRef: { unix: FirstRef, humanReadable: new Date(FirstRef * 1000).toLocaleString() },
//     LastRef: { unix: LastRef, humanReadable: new Date(LastRef * 1000).toLocaleString() },
//     query: req.query,
//     body: req.body,
//     current_interval: req.body?.current_interval,
//     interval: Interval,
//     skip
// });

// AllMeterData report

exports.AllMeterData = async (req, res) => {
    try {
        const { Customer, Stateid, Locationid, Gatewayid, startDate, endDate, Interval, FirstRef, LastRef } = req.body;
        const { page, flag, PrevTimeStamp } = req.query;
        let pageSize = 100;
        if (Interval == '12h') {
            pageSize = 5000000;
        } else if (Interval == '8h') {
            pageSize = 100000;

        } else if (Interval == '4h') {
            pageSize = 50000;

        } else if (Interval == '2h') {
            pageSize = 10000;

        } else if (Interval == '1h') {
            pageSize = 5000;

        } else if (Interval == '30m') {
            pageSize = 1000;

        }
        const INTERVAL_IN_SEC = INTERVAL_ARRAY[Interval];

        const startIstTimestamp = istToTimestamp(startDate) / 1000;
        const endIstTimestamp = istToTimestamp(endDate) / 1000;
        console.log({ startIstTimestamp });
        const istOffsetSeconds = 5.5 * 60 * 60; // Offset for IST in seconds
        // Adjust timestamps for IST
        let startIstTimestampUTC = startIstTimestamp - istOffsetSeconds;
        const endIstTimestampUTC = endIstTimestamp - istOffsetSeconds;

        console.log({ startIstTimestampUTC });

        const countPoint = startIstTimestamp - istOffsetSeconds;
        // Validate page and pageSize parameters
        let validatedPage = Math.max(1, parseInt(page, 10)) || 1;
        let validatedPageSize;
        validatedPageSize = Math.max(1, parseInt(pageSize, 10)) || 100;
        // Pagination
        let skip = (validatedPage - 1) * validatedPageSize;



        let pageWiseTimestamp = {};
        let pageReset = false;
        if (page > 1 && INTERVAL_IN_SEC != '--' && req.body.current_interval == Interval) {

            pageWiseTimestamp.interval = Interval; // Assuming Interval is defined elsewhere
            pageWiseTimestamp.page = {};

            pageWiseTimestamp.page[page - 1] = FirstRef;

            if (flag == "Prev") {


                startIstTimestampUTC = PrevTimeStamp
            } else {


                startIstTimestampUTC = LastRef;
            }
            skip = 0;
        } else if (req.body.current_interval != Interval && INTERVAL_IN_SEC != '--') {


            startIstTimestampUTC = startIstTimestamp - istOffsetSeconds;
            pageReset = true;
            skip = 0;
        }



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


        // let totalResults;
        const enterpriseStateQuery = Stateid ? { Enterprise_ID: enterprise._id, State_ID: Stateid } : { Enterprise_ID: enterprise._id };
        const EntStates = await EnterpriseStateModel.find(enterpriseStateQuery).lean();

        const stateIds = EntStates.map(state => state.State_ID);
        const states = await StateModel.find({ _id: { $in: stateIds } }).lean();
        const stateIdToState = states.reduce((acc, state) => {
            acc[state._id] = state;
            return acc;
        }, {});

        const locationQueries = EntStates.map(States => {
            return Locationid ? { _id: Locationid } : { Enterprise_ID: States.Enterprise_ID, State_ID: States.State_ID };
        });
        const Locations = await EnterpriseStateLocationModel.find({ $or: locationQueries }).lean();

        const locationIds = Locations.map(loc => loc._id);
        const gatewayQuery = Gatewayid ? { _id: Gatewayid } : { EnterpriseInfo: { $in: locationIds } };
        const Gateways = await GatewayModel.find(gatewayQuery).lean();

        const locationIdToGateways = Gateways.reduce((acc, gateway) => {
            const locId = gateway.EnterpriseInfo.toString();
            if (!acc[locId]) acc[locId] = [];
            acc[locId].push(gateway);
            return acc;
        }, {});

        const gatewayLogQueries = Gateways.map(gateway => {
            return {
                GatewayID: gateway._id,
                TimeStamp: { $gte: startIstTimestampUTC, $lte: endIstTimestampUTC },
            };
        });
        const GatewayLogs = await GatewayLogModel.find({ $or: gatewayLogQueries })
            .sort({ TimeStamp: 1 })
            .skip(skip)
            .limit(validatedPageSize)
            .lean();

        const gatewayIdToLogs = GatewayLogs.reduce((acc, log) => {
            if (!acc[log.GatewayID]) acc[log.GatewayID] = [];
            acc[log.GatewayID].push(log);
            return acc;
        }, {});

        const totalResults = await GatewayLogModel.countDocuments({
            GatewayID: { $in: Gateways.map(gateway => gateway._id) },
            TimeStamp: { $gte: countPoint, $lte: endIstTimestampUTC },
        });

        const responseData = EntStates.map(States => {
            const state = stateIdToState[States.State_ID];
            const locations = Locations.filter(loc => loc.State_ID.toString() === States.State_ID.toString());

            const stateData = {
                EnterpriseName: enterprise.EnterpriseName,
                State: [{
                    stateName: state.name,
                    state_ID: state._id,
                    location: locations.map(loc => {
                        const gateways = locationIdToGateways[loc._id.toString()] || [];
                        const locationData = {
                            locationName: loc.LocationName,
                            location_ID: loc._id,
                            gateway: gateways.map(gateway => {
                                const logs = gatewayIdToLogs[gateway._id] || [];
                                return {
                                    GatewayName: gateway.GatewayID,
                                    Gateway_ID: gateway._id,
                                    GatewayLogs: logs
                                };
                            })
                        };
                        return locationData;
                    })
                }]
            };
            return stateData;
        });

        // At this point, responseData and totalResults are built and can be used further.

        if (INTERVAL_IN_SEC != '--') {
            const NewResponseData = await UtilInter.MeterData(INTERVAL_IN_SEC, {
                success: true,
                message: "Data fetched successfully",
                response: responseData
            });
            return res.send({
                success: true,
                message: "Data fetched successfully",
                response: NewResponseData.response,
                pagination: {
                    page: validatedPage,
                    pageSize: validatedPageSize,
                    totalResults: totalResults,
                },
                pageWiseTimestamp,
                flag,
                current_interval: Interval,
                pageReset
            });
        }

        return res.send({
            success: true,
            message: "Data fetched successfully",
            response: responseData,
            pagination: {
                page: validatedPage,
                pageSize: validatedPageSize,
                totalResults: totalResults,
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
        const { enterprise_id, state_id, location_id, gateway_id, startDate, endDate, } = req.body;
        const Interval = 'Actual';
        const INTERVAL_IN_SEC = INTERVAL_ARRAY[Interval];


        const startIstTimestamp = istToTimestamp(startDate) / 1000;
        const endIstTimestamp = istToTimestamp(endDate) / 1000;

        const istOffsetSeconds = 5.5 * 60 * 60; // Offset for IST in seconds
        // Adjust timestamps for IST
        const startIstTimestampUTC = startIstTimestamp - istOffsetSeconds;
        const endIstTimestampUTC = endIstTimestamp - istOffsetSeconds;

        const Enterprise = await EnterpriseModel.findById(enterprise_id).lean();

        const enterpriseStateQuery = state_id ? { Enterprise_ID: Enterprise._id, State_ID: state_id } : { Enterprise_ID: Enterprise._id };
        const EntStates = await EnterpriseStateModel.find(enterpriseStateQuery).lean();

        const stateIds = EntStates.map(state => state.State_ID);
        const states = await StateModel.find({ _id: { $in: stateIds } }).lean();

        const stateIdToState = states.reduce((acc, state) => {
            acc[state._id] = state;
            return acc;
        }, {});

        const locationQueries = EntStates.map(State => {
            return location_id ? { _id: location_id } : { Enterprise_ID: State.Enterprise_ID, State_ID: State.State_ID };
        });

        const Locations = await EnterpriseStateLocationModel.find({ $or: locationQueries }).lean();

        const locationIds = Locations.map(loc => loc._id);
        const gatewayQuery = gateway_id ? { _id: gateway_id } : { EnterpriseInfo: { $in: locationIds } };
        const Gateways = await GatewayModel.find(gatewayQuery).lean();

        const locationIdToGateways = Gateways.reduce((acc, gateway) => {
            const locId = gateway.EnterpriseInfo.toString();
            if (!acc[locId]) acc[locId] = [];
            acc[locId].push(gateway);
            return acc;
        }, {});

        const optimizerLogQueries = Gateways.map(gateway => {
            return {
                GatewayID: gateway._id,
                TimeStamp: { $gte: startIstTimestampUTC, $lte: endIstTimestampUTC },
            };
        });

        const OptimizerLogs = await OptimizerLogModel.find({ $or: optimizerLogQueries })
            .populate({
                path: "OptimizerID",
                OptimizerModel: "Optimizer",
                options: { lean: true }
            })
            // .sort({ TimeStamp: 1 })
            .lean();

        const gatewayIdToLogs = OptimizerLogs.reduce((acc, log) => {
            if (!acc[log.GatewayID]) acc[log.GatewayID] = [];
            acc[log.GatewayID].push(log);
            return acc;
        }, {});

        const DEVICE_LOG = [];

        const stateIdToLocations = Locations.reduce((acc, loc) => {
            if (!acc[loc.State_ID]) acc[loc.State_ID] = [];
            acc[loc.State_ID].push(loc);
            return acc;
        }, {});

        const responseData = [{
            EnterpriseName: Enterprise.EnterpriseName,
            State: stateIds.map(stateId => {
                const state = stateIdToState[stateId];
                const locations = stateIdToLocations[stateId] || [];
                const stateData = {
                    stateName: state.name,
                    state_ID: state._id,
                    location: locations.map(loc => {
                        const gateways = locationIdToGateways[loc._id.toString()] || [];
                        const locationData = {
                            locationName: loc.LocationName,
                            location_ID: loc._id,
                            gateway: gateways.map(gateway => {
                                const logs = gatewayIdToLogs[gateway._id] || [];
                                const modifiedOptimizerLogs = logs.map(log => ({
                                    ...log,
                                    EnterpriseName: Enterprise.EnterpriseName,
                                    stateName: state.name,
                                    state_ID: state._id,
                                    Gateway: gateway,
                                    locationName: loc.LocationName,
                                    location_ID: loc._id
                                }));

                                const optimizerData = {
                                    timestamp: 0, // Set actual timestamp if required
                                    optimizerLogs: modifiedOptimizerLogs
                                };

                                DEVICE_LOG.push({ optimizerLogs: modifiedOptimizerLogs });
                                return optimizerData;
                            })
                        };
                        return locationData;
                    })
                };
                return stateData;
            })
        }];

        if (INTERVAL_IN_SEC != '--') {
            const NewResponseData = await UtilInter.DeviceData(INTERVAL_IN_SEC, {
                success: true,
                message: "Data fetched successfully",
                response: responseData
            });
            const download = await UtilDown.DeviceDownloadCSV(NewResponseData.data, Interval);
            // Set the headers for the response
            const filename = `file_${Interval}.csv`;
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);


            // Write the CSV content to the response stream
            return res.send(download);

        }
        const download = await UtilDown.DeviceDownloadCSV(responseData, Interval);
        // Set the headers for the response
        const filename = `file_${Interval}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Write the CSV content to the response stream
        return res.send(download);


    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal Server Error', err: error.message });
    }
};

// DownloadMeterDataReport
exports.DownloadMeterDataReport = async (req, res) => {
    try {
        const { Customer, Stateid, Locationid, Gatewayid, startDate, endDate, Interval } = req.body;
        // const Interval = "Actual";
        const INTERVAL_IN_SEC = INTERVAL_ARRAY[Interval];

        console.log({ endDate });
        const startIstTimestamp = istToTimestamp(startDate) / 1000;
        const endIstTimestamp = istToTimestamp(endDate) / 1000;

        console.log({ endIstTimestamp });
        const istOffsetSeconds = 5.5 * 60 * 60; // Offset for IST in seconds

        // Adjust timestamps for IST
        const startIstTimestampUTC = startIstTimestamp - istOffsetSeconds;
        const endIstTimestampUTC = endIstTimestamp - istOffsetSeconds;
        console.log({ endIstTimestampUTC });

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

        console.log({
            startIstTimestampUTC: { unix: startIstTimestampUTC, humanReadable: new Date(startIstTimestampUTC * 1000).toLocaleString() },
            endIstTimestampUTC: { unix: endIstTimestampUTC, humanReadable: new Date(endIstTimestampUTC * 1000).toLocaleString() }
        });

        // Aggregation Pipeline
        let aggregationPipeline = [];
        const enterpriseStateQuery = Stateid ? { Enterprise_ID: enterprise._id, State_ID: Stateid } : { Enterprise_ID: enterprise._id };

        const EntStates = await EnterpriseStateModel.find(enterpriseStateQuery).lean();

        const stateIds = EntStates.map(state => state.State_ID);
        const states = await StateModel.find({ _id: { $in: stateIds } }).lean();
        const stateIdToState = states.reduce((acc, state) => {
            acc[state._id] = state;
            return acc;
        }, {});

        const locationQueries = EntStates.map(States => {
            return Locationid ? { _id: Locationid } : { Enterprise_ID: States.Enterprise_ID, State_ID: States.State_ID };
        });
        const Locations = await EnterpriseStateLocationModel.find({ $or: locationQueries }).lean();

        const locationIds = Locations.map(loc => loc._id);
        const gatewayQuery = Gatewayid ? { _id: Gatewayid } : { EnterpriseInfo: { $in: locationIds } };
        const Gateways = await GatewayModel.find(gatewayQuery).lean();

        const locationIdToGateways = Gateways.reduce((acc, gateway) => {
            const locId = gateway.EnterpriseInfo.toString();
            if (!acc[locId]) acc[locId] = [];
            acc[locId].push(gateway);
            return acc;
        }, {});

        const gatewayLogQueries = Gateways.map(gateway => ({
            GatewayID: gateway._id,
            TimeStamp: { $gte: startIstTimestampUTC.toString(), $lte: endIstTimestampUTC.toString() }
        }));
        const GatewayLogs = await GatewayLogModel.aggregate([
            {
                $match: {
                    $or: gatewayLogQueries
                }
            },
            {
                $sort: { TimeStamp: 1 }
            }
        ]);


        const gatewayIdToLogs = GatewayLogs.reduce((acc, log) => {
            if (!acc[log.GatewayID]) acc[log.GatewayID] = [];
            acc[log.GatewayID].push(log);
            return acc;
        }, {});



        const responseData = EntStates.map(States => {
            const state = stateIdToState[States.State_ID];
            const locations = Locations.filter(loc => loc.State_ID.toString() === States.State_ID.toString());

            const stateData = {
                EnterpriseName: enterprise.EnterpriseName,
                State: [{
                    stateName: state.name,
                    state_ID: state._id,
                    location: locations.map(loc => {
                        const gateways = locationIdToGateways[loc._id.toString()] || [];
                        const locationData = {
                            locationName: loc.LocationName,
                            location_ID: loc._id,
                            gateway: gateways.map(gateway => {
                                const logs = gatewayIdToLogs[gateway._id] || [];
                                return {
                                    GatewayName: gateway.GatewayID,
                                    Gateway_ID: gateway._id,
                                    GatewayLogs: logs
                                };
                            })
                        };
                        return locationData;
                    })
                }]
            };
            return stateData;
        });

        // At this point, responseData and totalResults are built and can be used further.
        console.log(responseData);


        if (INTERVAL_IN_SEC != '--') {
            const NewResponseData = await UtilInter.MeterData(INTERVAL_IN_SEC, {
                success: true,
                message: "Data fetched successfully",
                response: responseData
            });
            const download = await UtilDown.MeterDownloadCSV(NewResponseData.response, Interval);
            // console.log("INTERVAL", download);
            // return res.send(download);
            // Format the dates for the filename
            const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
            const formattedEndDate = new Date(endDate).toISOString().split('T')[0];

            // Set the headers for the response
            const filename = `${formattedStartDate}-${formattedEndDate}.csv`;
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);


            // Write the CSV content to the response stream
            return res.send(download);

        }

        const download = await UtilDown.MeterDownloadCSV(responseData, Interval);

        // Format the dates for the filename
        const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
        const formattedEndDate = new Date(endDate).toISOString().split('T')[0];

        // Set the headers for the response
        const filename = `${formattedStartDate}-${formattedEndDate}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Write the CSV content to the response stream
        return res.send(download);
    } catch (error) {
        console.error("Error fetching data:", error);
        return res.status(500).json({ success: false, message: "Internal server error", err: error });
    }
};

exports.DownloadUsageTrendsReport = async (req, res) => {
    const { enterprise_id, state_id, location_id, gateway_id, Optimizerid, startDate, endDate, Interval } = req.body;
    const INTERVAL_IN_SEC = TREND_INTERVAL_ARRAY[Interval];

    if (!enterprise_id) {
        return res.status(400).json({
            success: false,
            message: 'enterprise_id is required'
        });
    }

    try {
        // Fetch the Enterprise based on enterprise_id
        const Enterprise = await EnterpriseModel.findOne({ _id: enterprise_id });
        if (!Enterprise) {
            return res.status(404).json({
                success: false,
                message: 'Enterprise not found'
            });
        }

        // Prepare the query for EnterpriseStateModel based on state_id and enterprise_id
        const enterpriseStateQuery = {
            Enterprise_ID: Enterprise._id,
            ...(state_id && { State_ID: state_id })
        };

        // Fetch the states
        const EntStates = await EnterpriseStateModel.find(enterpriseStateQuery);
        if (EntStates.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'States not found'
            });
        }
        const stateIds = EntStates.map(state => state.State_ID);

        // Prepare the query for EnterpriseStateLocationModel based on stateIds and optional location_id
        const locationQuery = {
            State_ID: { $in: stateIds },
            Enterprise_ID: enterprise_id,
            ...(location_id && { _id: location_id })
        };

        // Fetch the locations
        const locations = await EnterpriseStateLocationModel.find(locationQuery);
        if (locations.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Locations not found'
            });
        }
        const locationIds = locations.map(location => location._id);
        // Prepare the query for GatewayModel based on locationIds and optional gateway_id
        const gatewayQuery = {
            EnterpriseInfo: { $in: locationIds },
            ...(gateway_id && { _id: gateway_id })
        };

        // Fetch the gateways
        const Gateways = await GatewayModel.find(gatewayQuery);
        if (Gateways.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Gateways not found'
            });
        }
        const GatewayIds = Gateways.map(gateway => gateway._id);
        // Prepare the query for OptimizerModel based on GatewayIds and optional Optimizerid
        const optimizerQuery = {
            GatewayId: { $in: GatewayIds },
            ...(Optimizerid && { _id: Optimizerid })
        };

        // Fetch the optimizers
        const optimizers = await OptimizerModel.find(optimizerQuery);
        if (optimizers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Optimizers not found'
            });
        }
        const optimizerIds = optimizers.map(optimizer => optimizer.OptimizerID);

        const startIstTimestamp = istToTimestamp(startDate) / 1000;
        const endIstTimestamp = istToTimestamp(endDate) / 1000;

        let istOffsetSeconds = 5.5 * 60 * 60; // Offset for IST in seconds

        let currentStart = new Date(startIstTimestamp * 1000);
        let currentEnd;

        // let endIstTimestampUTC = endIstTimestamp - istOffsetSeconds;
        // let startIstTimestampUTC = startIstTimestamp - istOffsetSeconds;
        // console.log(startIstTimestampUTC, "---", endIstTimestampUTC, "--", Optimizerid);
        let data = [];

        while (currentStart.getTime() / 1000 <= endIstTimestamp) {
            switch (Interval) {
                case "Day":
                    currentEnd = new Date(currentStart);
                    currentEnd.setUTCHours(23, 59, 59, 999);
                    break;
                case "Week":
                    currentEnd = new Date(currentStart);
                    currentEnd.setUTCDate(currentStart.getUTCDate() + 6);
                    currentEnd.setUTCHours(23, 59, 59, 999);
                    break;
                case "Month":
                    currentEnd = new Date(currentStart);
                    currentEnd.setUTCMonth(currentStart.getUTCMonth() + 1);
                    currentEnd.setUTCDate(0); // Set to the last day of the previous month
                    currentEnd.setUTCHours(23, 59, 59, 999);
                    break;
                case "Year":
                    currentEnd = new Date(currentStart);
                    currentEnd.setUTCFullYear(currentStart.getUTCFullYear() + 1);
                    currentEnd.setUTCDate(0); // Set to the last day of the previous year
                    currentEnd.setUTCHours(23, 59, 59, 999);
                    break;
            }

            let startIstTimestampInterval = Math.floor(currentStart.getTime() / 1000);
            let endIstTimestampInterval = Math.floor(currentEnd.getTime() / 1000);

            if (endIstTimestampInterval > endIstTimestamp) {
                endIstTimestampInterval = endIstTimestamp;
            }

            let startIstTimestampUTC = startIstTimestampInterval - istOffsetSeconds;
            let endIstTimestampUTC = endIstTimestampInterval - istOffsetSeconds;
            // Step 1: Fetch the initial previous value


            for (let i = 0; i < optimizerIds.length; i++) {


                const Optimizerid = optimizerIds[i];
                const initialPrevious = await NewApplianceLogModel.aggregate([
                    {
                        $match: {
                            OptimizerID: Optimizerid,
                            TimeStamp: { $lt: startIstTimestampUTC.toString() }
                        },
                    },
                    {
                        $sort: { TimeStamp: -1 }
                    },
                    {
                        $limit: 1
                    }
                ]).exec();


                const pipeline = [
                    {
                        $match: {
                            OptimizerID: Optimizerid,
                            TimeStamp: { $gte: startIstTimestampUTC.toString(), $lte: endIstTimestampUTC.toString() }
                        }
                    },
                    { $sort: { TimeStamp: 1 } },
                    {
                        $addFields: {
                            TimeStamp: { $toLong: '$TimeStamp' }
                        }
                    },
                    {
                        $group: {
                            _id: Optimizerid,
                            entries: { $push: '$$ROOT' }
                        }
                    },
                    {
                        $project: {
                            ThermostatCutoffTimes: {
                                $reduce: {
                                    input: '$entries',
                                    initialValue: { previous: null, result: [] },
                                    in: {
                                        previous: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $or: [{ $eq: ['$$this.CompStatus', 'COMPOFF'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+THRMO'] }] },
                                                        { $or: [{ $eq: ['$$this.OptimizationMode', 'NON-OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', 'OPTIMIZATION'] }] }
                                                    ]
                                                },
                                                '$$this',
                                                {
                                                    $cond: [
                                                        {
                                                            $and: [
                                                                { $or: [{ $eq: ['$$this.CompStatus', 'COMPON'] }, { $eq: ['$$this.CompStatus', '--'] }] },
                                                                { $ne: ['$$value.previous', null] }
                                                            ]
                                                        },
                                                        null,
                                                        '$$value.previous'
                                                    ]
                                                }
                                            ]
                                        },
                                        result: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $or: [{ $eq: ['$$this.CompStatus', 'COMPON'] }, { $eq: ['$$this.CompStatus', '--'] }] },
                                                        { $or: [{ $eq: ['$$this.OptimizationMode', 'NON-OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', 'OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', '--'] }] },
                                                        { $ne: ['$$value.previous', null] }
                                                    ]
                                                },
                                                {
                                                    $concatArrays: [
                                                        '$$value.result',
                                                        [{
                                                            cutoffTimeThrm: { $subtract: ['$$this.TimeStamp', '$$value.previous.TimeStamp'] },
                                                            timestamp: '$$this.TimeStamp'
                                                        }]
                                                    ]
                                                },
                                                '$$value.result'
                                            ]
                                        }
                                    }
                                }
                            },
                            DeviceCutoffTimes: {
                                $reduce: {
                                    input: '$entries',
                                    initialValue: { previous: null, result: [] },
                                    in: {
                                        previous: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $eq: ['$$this.CompStatus', 'COMPOFF+OPT'] },
                                                        { $eq: ['$$this.OptimizationMode', 'OPTIMIZATION'] }
                                                    ]
                                                },
                                                '$$this',
                                                {
                                                    $cond: [
                                                        {
                                                            $and: [
                                                                { $or: [{ $eq: ['$$this.CompStatus', 'COMPON'] }, { $eq: ['$$this.CompStatus', '--'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+THRMO'] }] },
                                                                { $ne: ['$$value.previous', null] }
                                                            ]
                                                        },
                                                        null,
                                                        '$$value.previous'
                                                    ]
                                                }
                                            ]
                                        },
                                        result: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $or: [{ $eq: ['$$this.CompStatus', 'COMPON'] }, { $eq: ['$$this.CompStatus', '--'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+THRMO'] }] },
                                                        { $or: [{ $eq: ['$$this.OptimizationMode', 'NON-OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', 'OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', '--'] }] },
                                                        { $ne: ['$$value.previous', null] }
                                                    ]
                                                },
                                                {
                                                    $concatArrays: [
                                                        '$$value.result',
                                                        [{
                                                            cutoffTimeOpt: { $subtract: ['$$this.TimeStamp', '$$value.previous.TimeStamp'] },
                                                            timestamp: '$$this.TimeStamp'
                                                        }]
                                                    ]
                                                },
                                                '$$value.result'
                                            ]
                                        }
                                    }
                                }
                            },
                            RemainingRunTimes: {
                                $reduce: {
                                    input: '$entries',
                                    initialValue: { previous: null, result: [] },
                                    in: {
                                        previous: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $eq: ['$$this.CompStatus', 'COMPON'] },
                                                        { $or: [{ $eq: ['$$this.CompStatus', 'COMPON'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+THRMO'] }] }
                                                    ]
                                                },
                                                '$$this',
                                                {
                                                    $cond: [
                                                        {
                                                            $and: [
                                                                { $or: [{ $eq: ['$$this.CompStatus', 'COMPOFF'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+OPT'] }, { $eq: ['$$this.CompStatus', '--'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+THRMO'] }] },
                                                                { $ne: ['$$value.previous', null] }
                                                            ]
                                                        },
                                                        null,
                                                        '$$value.previous'
                                                    ]
                                                }
                                            ]
                                        },
                                        result: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $or: [{ $eq: ['$$this.CompStatus', 'COMPOFF'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+OPT'] }, { $eq: ['$$this.CompStatus', '--'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+THRMO'] }] },
                                                        { $or: [{ $eq: ['$$this.OptimizationMode', 'NON-OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', 'OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', '--'] }] },
                                                        { $ne: ['$$value.previous', null] }
                                                    ]
                                                },
                                                {
                                                    $concatArrays: [
                                                        '$$value.result',
                                                        [{
                                                            RemainingTime: { $subtract: ['$$this.TimeStamp', '$$value.previous.TimeStamp'] },
                                                            timestamp: '$$this.TimeStamp'
                                                        }]
                                                    ]
                                                },
                                                '$$value.result'
                                            ]
                                        }
                                    }
                                }
                            },
                            LastEdgeCases: {
                                $reduce: {
                                    input: '$entries',
                                    initialValue: { previous: { $arrayElemAt: ['$entries', -1] }, result: [] },
                                    in: {

                                        result: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $or: [{ $eq: ['$$value.previous.CompStatus', 'COMPOFF'] }, { $eq: ['$$value.previous.CompStatus', 'COMPOFF+THRMO'] }] },
                                                        { $or: [{ $eq: ['$$value.previous.OptimizationMode', 'NON-OPTIMIZATION'] }, { $eq: ['$$value.previous.OptimizationMode', 'OPTIMIZATION'] }] },
                                                    ]
                                                },
                                                {
                                                    $concatArrays: [
                                                        '$$value.result',
                                                        [{
                                                            cutoffTimeThrm: { $subtract: [endIstTimestampUTC, '$$value.previous.TimeStamp'] },
                                                            timestamp: endIstTimestampUTC
                                                        }]
                                                    ]
                                                },
                                                {
                                                    $cond: [
                                                        {
                                                            $and: [
                                                                { $eq: ['$$value.previous.CompStatus', 'COMPOFF+OPT'] },
                                                                { $eq: ['$$value.previous.OptimizationMode', 'OPTIMIZATION'] },
                                                            ]
                                                        },
                                                        {
                                                            $concatArrays: [
                                                                '$$value.result',
                                                                [{
                                                                    cutoffTimeOpt: { $subtract: [endIstTimestampUTC, '$$value.previous.TimeStamp'] },
                                                                    timestamp: endIstTimestampUTC
                                                                }]
                                                            ]
                                                        },
                                                        {
                                                            $cond: [
                                                                {
                                                                    $and: [
                                                                        { $eq: ['$$value.previous.CompStatus', 'COMPON'] },
                                                                        { $or: [{ $eq: ['$$value.previous.OptimizationMode', 'NON-OPTIMIZATION'] }, { $eq: ['$$value.previous.OptimizationMode', 'OPTIMIZATION'] }] }
                                                                    ]
                                                                },
                                                                {
                                                                    $concatArrays: [
                                                                        '$$value.result',
                                                                        [{
                                                                            RemainingTime: { $subtract: [endIstTimestampUTC, '$$value.previous.TimeStamp'] },
                                                                            timestamp: endIstTimestampUTC
                                                                        }]
                                                                    ]
                                                                },
                                                                '$$value.result'
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]

                                        }
                                    }
                                }
                            },
                            FirstEdgeCases: {
                                $reduce: {
                                    input: '$entries',
                                    initialValue: { lastprevious: initialPrevious[0], result: [], previous: { $arrayElemAt: ['$entries', 0] } },
                                    in: {

                                        result: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $or: [{ $eq: ['$$value.lastprevious.CompStatus', 'COMPOFF'] }, { $eq: ['$$value.lastprevious.CompStatus', 'COMPOFF+THRMO'] }] },
                                                        { $or: [{ $eq: ['$$value.lastprevious.OptimizationMode', 'NON-OPTIMIZATION'] }, { $eq: ['$$value.lastprevious.OptimizationMode', 'OPTIMIZATION'] }] },
                                                    ]
                                                },
                                                {
                                                    $concatArrays: [
                                                        '$$value.result',
                                                        [{
                                                            cutoffTimeThrm: { $subtract: ['$$value.previous.TimeStamp', startIstTimestampUTC] },
                                                            timestamp: '$$value.previous.TimeStamp'
                                                        }]
                                                    ]
                                                },
                                                {
                                                    $cond: [
                                                        {
                                                            $and: [
                                                                { $eq: ['$$value.lastprevious.CompStatus', 'COMPOFF+OPT'] },
                                                                { $eq: ['$$value.lastprevious.OptimizationMode', 'OPTIMIZATION'] },
                                                            ]
                                                        },
                                                        {
                                                            $concatArrays: [
                                                                '$$value.result',
                                                                [{
                                                                    cutoffTimeOpt: { $subtract: ['$$value.previous.TimeStamp', startIstTimestampUTC] },
                                                                    timestamp: '$$value.previous.TimeStamp'
                                                                }]
                                                            ]
                                                        },
                                                        {
                                                            $cond: [
                                                                {
                                                                    $and: [
                                                                        { $eq: ['$$value.lastprevious.CompStatus', 'COMPON'] },
                                                                        { $or: [{ $eq: ['$$value.lastprevious.OptimizationMode', 'NON-OPTIMIZATION'] }, { $eq: ['$$value.lastprevious.OptimizationMode', 'OPTIMIZATION'] }] }
                                                                    ]
                                                                },
                                                                {
                                                                    $concatArrays: [
                                                                        '$$value.result',
                                                                        [{
                                                                            RemainingTime: { $subtract: ['$$value.previous.TimeStamp', startIstTimestampUTC] },
                                                                            timestamp: '$$value.previous.TimeStamp'
                                                                        }]
                                                                    ]
                                                                },
                                                                '$$value.result'
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]

                                        }
                                    }
                                }
                            },
                        }
                    },
                    {
                        $project: {
                            FirstEdgeCase: '$FirstEdgeCases.result',
                            lastedge: '$LastEdgeCases.result',
                            StartTime: startIstTimestampUTC.toString(),
                            EndTime: endIstTimestampUTC.toString(),
                            totalCutoffTimeThrm: {
                                $sum: [
                                    { $sum: '$ThermostatCutoffTimes.result.cutoffTimeThrm' },
                                    { $cond: [{ $gt: [{ $size: '$LastEdgeCases.result' }, 0] }, { $arrayElemAt: ['$LastEdgeCases.result.cutoffTimeThrm', 0] }, 0] },
                                    { $cond: [{ $gt: [{ $size: '$FirstEdgeCases.result' }, 0] }, { $arrayElemAt: ['$FirstEdgeCases.result.cutoffTimeThrm', 0] }, 0] }
                                ]
                            },
                            totalCutoffTimeOpt: {
                                $sum: [
                                    { $sum: '$DeviceCutoffTimes.result.cutoffTimeOpt' },
                                    { $cond: [{ $gt: [{ $size: '$LastEdgeCases.result' }, 0] }, { $arrayElemAt: ['$LastEdgeCases.result.cutoffTimeOpt', 0] }, 0] },
                                    { $cond: [{ $gt: [{ $size: '$FirstEdgeCases.result' }, 0] }, { $arrayElemAt: ['$FirstEdgeCases.result.cutoffTimeOpt', 0] }, 0] }
                                ]
                            },
                            totalRemainingTime: {
                                $sum: [
                                    { $sum: '$RemainingRunTimes.result.RemainingTime' },
                                    { $cond: [{ $gt: [{ $size: '$LastEdgeCases.result' }, 0] }, { $arrayElemAt: ['$LastEdgeCases.result.RemainingTime', 0] }, 0] },
                                    { $cond: [{ $gt: [{ $size: '$FirstEdgeCases.result' }, 0] }, { $arrayElemAt: ['$FirstEdgeCases.result.RemainingTime', 0] }, 0] }
                                ]
                            }
                        }
                    }
                ];


                const PD = await PipelineData(pipeline);


                if (PD.length !== 0) {
                    const Optimizer = await OptimizerModel.findOne({ OptimizerID: Optimizerid });

                    if (Optimizer) {
                        PD.forEach(entry => {
                            entry.OptimizerName = Optimizer.OptimizerName;
                            entry.ACTonnage = Optimizer.ACTonnage;
                        });
                        if (Interval === "Day") {


                            var Twelve = await TwelveHour(startIstTimestampUTC);
                            let startIstTimestampsUTC;
                            if (!Twelve) {
                                startIstTimestampsUTC = setToMidnight(startIstTimestampUTC);
                            } else {
                                startIstTimestampsUTC = startIstTimestampUTC;
                            }
                            const newPipeline = [
                                {
                                    $match: {
                                        OptimizerID: Optimizerid,
                                        TimeStamp: { $gte: startIstTimestampsUTC.toString(), $lte: endIstTimestampUTC.toString() }
                                    }
                                },
                                { $sort: { TimeStamp: 1 } },
                                {
                                    $addFields: {
                                        TimeStamp: { $toLong: '$TimeStamp' }
                                    }
                                },
                                {
                                    $group: {
                                        _id: Optimizerid,
                                        entries: { $push: '$$ROOT' }
                                    }
                                },
                                {
                                    $project: {
                                        ACCutoffTimes: {
                                            $reduce: {
                                                input: '$entries',
                                                initialValue: { previous: null, result: [], expectingNextOn: true },
                                                in: {
                                                    previous: {
                                                        $cond: [
                                                            {
                                                                $and: [
                                                                    { $eq: ['$$this.ACStatus', 'ON'] },
                                                                    '$$value.expectingNextOn',
                                                                    { $eq: ['$$value.previous', null] }
                                                                ]
                                                            },
                                                            '$$this',
                                                            {
                                                                $cond: [
                                                                    { $eq: ['$$this.ACStatus', 'OFF'] },
                                                                    '$$this',
                                                                    {
                                                                        $cond: [
                                                                            {
                                                                                $and: [
                                                                                    { $eq: ['$$this.ACStatus', 'ON'] },
                                                                                    '$$value.expectingNextOn',
                                                                                    { $eq: ['$$value.previous.ACStatus', 'OFF'] }
                                                                                ]
                                                                            },
                                                                            '$$this',
                                                                            '$$value.previous'
                                                                        ]
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    expectingNextOn: {
                                                        $cond: [
                                                            { $eq: ['$$this.ACStatus', 'OFF'] },
                                                            true,
                                                            { $cond: [{ $eq: ['$$this.ACStatus', 'ON'] }, false, '$$value.expectingNextOn'] }
                                                        ]
                                                    },
                                                    result: {
                                                        $cond: [
                                                            {
                                                                $and: [
                                                                    { $eq: ['$$this.ACStatus', 'OFF'] },
                                                                    { $ne: ['$$value.previous', null] },
                                                                    { $eq: ['$$value.previous.ACStatus', 'ON'] }
                                                                ]
                                                            },
                                                            {
                                                                $concatArrays: [
                                                                    '$$value.result',
                                                                    [{

                                                                        ACOffTime: '$$this.TimeStamp'
                                                                    }]
                                                                ]
                                                            },
                                                            {
                                                                $cond: [
                                                                    {
                                                                        $and: [
                                                                            { $eq: ['$$this.ACStatus', 'ON'] },
                                                                            { $ne: ['$$value.previous', null] },
                                                                            { $eq: ['$$value.previous.ACStatus', 'OFF'] }
                                                                        ]
                                                                    },
                                                                    {
                                                                        $concatArrays: [
                                                                            '$$value.result',
                                                                            [{
                                                                                // ACOnTime: '$$value.previous.TimeStamp',
                                                                                ACOnTime: '$$this.TimeStamp',
                                                                            }]
                                                                        ]
                                                                    },
                                                                    {
                                                                        $cond: [
                                                                            {
                                                                                $and: [
                                                                                    { $eq: ['$$this.ACStatus', 'ON'] },
                                                                                    { $eq: ['$$value.previous', null] },

                                                                                ]
                                                                            },
                                                                            {
                                                                                $concatArrays: [
                                                                                    '$$value.result',
                                                                                    [{
                                                                                        ACOnTime: '$$this.TimeStamp'
                                                                                    }]
                                                                                ]
                                                                            },
                                                                            '$$value.result'
                                                                        ]
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                {
                                    $project: {
                                        ACCutoffTimes: '$ACCutoffTimes.result'
                                    }
                                }
                            ];



                            const newPD = await PipelineData(newPipeline);
                            PD.forEach(entry => {
                                const newEntry = newPD.find(item => item._id === entry._id);
                                if (newEntry) {
                                    entry.ACCutoffTimes = newEntry.ACCutoffTimes;
                                }
                            });

                            data.push(...PD);
                        } else {
                            data.push(...PD);
                        }
                    }
                }

            }

            switch (Interval) {
                case "Day":
                    currentStart.setUTCDate(currentStart.getUTCDate() + 1);
                    currentStart.setUTCHours(0, 0, 0, 0);
                    break;
                case "Week":
                    currentStart.setUTCDate(currentStart.getUTCDate() + 7);
                    currentStart.setUTCHours(0, 0, 0, 0);
                    break;
                case "Month":
                    currentStart.setUTCMonth(currentStart.getUTCMonth() + 1);
                    currentStart.setUTCDate(1);
                    currentStart.setUTCHours(0, 0, 0, 0);
                    break;
                case "Year":
                    currentStart.setUTCFullYear(currentStart.getUTCFullYear() + 1);
                    currentStart.setUTCDate(1);
                    currentStart.setUTCMonth(0);
                    currentStart.setUTCHours(0, 0, 0, 0);
                    break;
            }
        }
        const Download = await UtilDown.UsageTrendDownload(data, Interval);

        return res.send(Download);
    } catch (error) {
        // Handle errors appropriately
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching data',
            error: error.message
        });
    }
}


const TREND_INTERVAL_ARRAY = {
    "Actual": '--',
    "Day": 1 * 24 * 60 * 60,
    "Week": 7 * 24 * 60 * 60,
    "Month": 30 * 24 * 60 * 60,
    "Year": 365 * 24 * 60 * 60
};



exports.UsageTrends = async (req, res) => {
    const { enterprise_id, state_id, location_id, gateway_id, optimizer_id, startDate, endDate, Interval } = req.body;
    const INTERVAL_IN_SEC = TREND_INTERVAL_ARRAY[Interval];
    try {
        // Fetch the Enterprise based on enterprise_id
        const Enterprise = await EnterpriseModel.findOne({ _id: enterprise_id });
        if (!Enterprise) {
            return res.status(404).json({
                success: false,
                message: 'Enterprise not found'
            });
        }

        // Prepare the query for EnterpriseStateModel based on state_id and enterprise_id
        const enterpriseStateQuery = {
            Enterprise_ID: Enterprise._id,
            ...(state_id && { State_ID: state_id })
        };

        // Fetch the states
        const EntStates = await EnterpriseStateModel.find(enterpriseStateQuery);
        if (EntStates.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'States not found'
            });
        }
        const stateIds = EntStates.map(state => state.State_ID);

        // Prepare the query for EnterpriseStateLocationModel based on stateIds and optional location_id
        const locationQuery = {
            State_ID: { $in: stateIds },
            Enterprise_ID: enterprise_id,
            ...(location_id && { _id: location_id })
        };

        // Fetch the locations
        const locations = await EnterpriseStateLocationModel.find(locationQuery);
        if (locations.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Locations not found'
            });
        }
        const locationIds = locations.map(location => location._id);
        // Prepare the query for GatewayModel based on locationIds and optional gateway_id
        const gatewayQuery = {
            EnterpriseInfo: { $in: locationIds },
            ...(gateway_id && { _id: gateway_id })
        };

        // Fetch the gateways
        const Gateways = await GatewayModel.find(gatewayQuery);
        if (Gateways.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Gateways not found'
            });
        }
        const GatewayIds = Gateways.map(gateway => gateway._id);
        // Prepare the query for OptimizerModel based on GatewayIds and optional Optimizerid
        const optimizerQuery = {
            GatewayId: { $in: GatewayIds },
            ...(optimizer_id && { _id: optimizer_id })
        };

        console.log(JSON.stringify(optimizerQuery));
        // Fetch the optimizers
        const optimizers = await OptimizerModel.find(optimizerQuery);
        if (optimizers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Optimizers not found'
            });
        }



        const optimizerIds = optimizers.map(optimizer => optimizer.OptimizerID);

        const startIstTimestamp = parseISTDateString(startDate);
        const endIstTimestamp = parseISTDateString(endDate);

        let istOffsetSeconds = 5.5 * 60 * 60; // Offset for IST in seconds

        let currentStart = new Date(startIstTimestamp * 1000);
        let currentEnd;

        // let endIstTimestampUTC = endIstTimestamp - istOffsetSeconds;
        // let startIstTimestampUTC = startIstTimestamp - istOffsetSeconds;
        // console.log(startIstTimestampUTC, "---", endIstTimestampUTC, "--", Optimizerid);
        let data = [];
        var count = 0;

        while (currentStart.getTime() / 1000 <= endIstTimestamp) {
            switch (Interval) {
                case "Day":
                    currentEnd = new Date(currentStart);
                    currentEnd.setUTCHours(23, 59, 59, 999);
                    break;
                case "Week":
                    currentEnd = new Date(currentStart);
                    currentEnd.setUTCDate(currentStart.getUTCDate() + 6);
                    currentEnd.setUTCHours(23, 59, 59, 999);
                    break;
                case "Month":
                    currentEnd = new Date(currentStart);
                    currentEnd.setUTCMonth(currentStart.getUTCMonth() + 1);
                    currentEnd.setUTCDate(0); // Set to the last day of the previous month
                    currentEnd.setUTCHours(23, 59, 59, 999);
                    break;
                case "Year":
                    currentEnd = new Date(currentStart);
                    currentEnd.setUTCFullYear(currentStart.getUTCFullYear() + 1);
                    currentEnd.setUTCDate(0); // Set to the last day of the previous year
                    currentEnd.setUTCHours(23, 59, 59, 999);
                    break;
            }

            let startIstTimestampInterval = Math.floor(currentStart.getTime() / 1000);
            let endIstTimestampInterval = Math.floor(currentEnd.getTime() / 1000);

            if (endIstTimestampInterval > endIstTimestamp) {
                endIstTimestampInterval = endIstTimestamp;
            }

            let startIstTimestampUTC = startIstTimestampInterval - istOffsetSeconds;
            let endIstTimestampUTC = endIstTimestampInterval - istOffsetSeconds;
            // Step 1: Fetch the initial previous value

            for (let i = 0; i < optimizerIds.length; i++) {


                const Optimizerid = optimizerIds[i];
                const initialPrevious = await NewApplianceLogModel.aggregate([
                    {
                        $match: {
                            OptimizerID: Optimizerid,
                            TimeStamp: { $lt: startIstTimestampUTC.toString() }
                        },
                    },
                    {
                        $sort: { TimeStamp: -1 }
                    },
                    {
                        $limit: 1
                    }
                ]).exec();


                const pipeline = [
                    {
                        $match: {
                            OptimizerID: Optimizerid,
                            TimeStamp: { $gte: startIstTimestampUTC.toString(), $lte: endIstTimestampUTC.toString() }
                        }
                    },
                    { $sort: { TimeStamp: 1 } },
                    {
                        $addFields: {
                            TimeStamp: { $toLong: '$TimeStamp' }
                        }
                    },
                    {
                        $group: {
                            _id: Optimizerid,
                            entries: { $push: '$$ROOT' }
                        }
                    },
                    {
                        $project: {
                            ThermostatCutoffTimes: {
                                $reduce: {
                                    input: '$entries',
                                    initialValue: { previous: null, result: [] },
                                    in: {
                                        previous: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $or: [{ $eq: ['$$this.CompStatus', 'COMPOFF'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+THRMO'] }] },
                                                        { $or: [{ $eq: ['$$this.OptimizationMode', 'NON-OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', 'OPTIMIZATION'] }] }
                                                    ]
                                                },
                                                '$$this',
                                                {
                                                    $cond: [
                                                        {
                                                            $and: [
                                                                { $or: [{ $eq: ['$$this.CompStatus', 'COMPON'] }, { $eq: ['$$this.CompStatus', '--'] }] },
                                                                { $ne: ['$$value.previous', null] }
                                                            ]
                                                        },
                                                        null,
                                                        '$$value.previous'
                                                    ]
                                                }
                                            ]
                                        },
                                        result: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $or: [{ $eq: ['$$this.CompStatus', 'COMPON'] }, { $eq: ['$$this.CompStatus', '--'] }] },
                                                        { $or: [{ $eq: ['$$this.OptimizationMode', 'NON-OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', 'OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', '--'] }] },
                                                        { $ne: ['$$value.previous', null] }
                                                    ]
                                                },
                                                {
                                                    $concatArrays: [
                                                        '$$value.result',
                                                        [{
                                                            cutoffTimeThrm: { $subtract: ['$$this.TimeStamp', '$$value.previous.TimeStamp'] },
                                                            timestamp: '$$this.TimeStamp'
                                                        }]
                                                    ]
                                                },
                                                '$$value.result'
                                            ]
                                        }
                                    }
                                }
                            },
                            DeviceCutoffTimes: {
                                $reduce: {
                                    input: '$entries',
                                    initialValue: { previous: null, result: [] },
                                    in: {
                                        previous: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $eq: ['$$this.CompStatus', 'COMPOFF+OPT'] },
                                                        { $eq: ['$$this.OptimizationMode', 'OPTIMIZATION'] }
                                                    ]
                                                },
                                                '$$this',
                                                {
                                                    $cond: [
                                                        {
                                                            $and: [
                                                                { $or: [{ $eq: ['$$this.CompStatus', 'COMPON'] }, { $eq: ['$$this.CompStatus', '--'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+THRMO'] }] },
                                                                { $ne: ['$$value.previous', null] }
                                                            ]
                                                        },
                                                        null,
                                                        '$$value.previous'
                                                    ]
                                                }
                                            ]
                                        },
                                        result: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $or: [{ $eq: ['$$this.CompStatus', 'COMPON'] }, { $eq: ['$$this.CompStatus', '--'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+THRMO'] }] },
                                                        { $or: [{ $eq: ['$$this.OptimizationMode', 'NON-OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', 'OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', '--'] }] },
                                                        { $ne: ['$$value.previous', null] }
                                                    ]
                                                },
                                                {
                                                    $concatArrays: [
                                                        '$$value.result',
                                                        [{
                                                            cutoffTimeOpt: { $subtract: ['$$this.TimeStamp', '$$value.previous.TimeStamp'] },
                                                            timestamp: '$$this.TimeStamp'
                                                        }]
                                                    ]
                                                },
                                                '$$value.result'
                                            ]
                                        }
                                    }
                                }
                            },
                            RemainingRunTimes: {
                                $reduce: {
                                    input: '$entries',
                                    initialValue: { previous: null, result: [] },
                                    in: {
                                        previous: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $eq: ['$$this.CompStatus', 'COMPON'] },
                                                        { $or: [{ $eq: ['$$this.CompStatus', 'COMPON'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+THRMO'] }] }
                                                    ]
                                                },
                                                '$$this',
                                                {
                                                    $cond: [
                                                        {
                                                            $and: [
                                                                { $or: [{ $eq: ['$$this.CompStatus', 'COMPOFF'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+OPT'] }, { $eq: ['$$this.CompStatus', '--'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+THRMO'] }] },
                                                                { $ne: ['$$value.previous', null] }
                                                            ]
                                                        },
                                                        null,
                                                        '$$value.previous'
                                                    ]
                                                }
                                            ]
                                        },
                                        result: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $or: [{ $eq: ['$$this.CompStatus', 'COMPOFF'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+OPT'] }, { $eq: ['$$this.CompStatus', '--'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+THRMO'] }] },
                                                        { $or: [{ $eq: ['$$this.OptimizationMode', 'NON-OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', 'OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', '--'] }] },
                                                        { $ne: ['$$value.previous', null] }
                                                    ]
                                                },
                                                {
                                                    $concatArrays: [
                                                        '$$value.result',
                                                        [{
                                                            RemainingTime: { $subtract: ['$$this.TimeStamp', '$$value.previous.TimeStamp'] },
                                                            timestamp: '$$this.TimeStamp'
                                                        }]
                                                    ]
                                                },
                                                '$$value.result'
                                            ]
                                        }
                                    }
                                }
                            },
                            LastEdgeCases: {
                                $reduce: {
                                    input: '$entries',
                                    initialValue: { previous: { $arrayElemAt: ['$entries', -1] }, result: [] },
                                    in: {

                                        result: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $or: [{ $eq: ['$$value.previous.CompStatus', 'COMPOFF'] }, { $eq: ['$$value.previous.CompStatus', 'COMPOFF+THRMO'] }] },
                                                        { $or: [{ $eq: ['$$value.previous.OptimizationMode', 'NON-OPTIMIZATION'] }, { $eq: ['$$value.previous.OptimizationMode', 'OPTIMIZATION'] }] },
                                                    ]
                                                },
                                                {
                                                    $concatArrays: [
                                                        '$$value.result',
                                                        [{
                                                            cutoffTimeThrm: { $subtract: [endIstTimestampUTC, '$$value.previous.TimeStamp'] },
                                                            timestamp: endIstTimestampUTC
                                                        }]
                                                    ]
                                                },
                                                {
                                                    $cond: [
                                                        {
                                                            $and: [
                                                                { $eq: ['$$value.previous.CompStatus', 'COMPOFF+OPT'] },
                                                                { $eq: ['$$value.previous.OptimizationMode', 'OPTIMIZATION'] },
                                                            ]
                                                        },
                                                        {
                                                            $concatArrays: [
                                                                '$$value.result',
                                                                [{
                                                                    cutoffTimeOpt: { $subtract: [endIstTimestampUTC, '$$value.previous.TimeStamp'] },
                                                                    timestamp: endIstTimestampUTC
                                                                }]
                                                            ]
                                                        },
                                                        {
                                                            $cond: [
                                                                {
                                                                    $and: [
                                                                        { $eq: ['$$value.previous.CompStatus', 'COMPON'] },
                                                                        { $or: [{ $eq: ['$$value.previous.OptimizationMode', 'NON-OPTIMIZATION'] }, { $eq: ['$$value.previous.OptimizationMode', 'OPTIMIZATION'] }] }
                                                                    ]
                                                                },
                                                                {
                                                                    $concatArrays: [
                                                                        '$$value.result',
                                                                        [{
                                                                            RemainingTime: { $subtract: [endIstTimestampUTC, '$$value.previous.TimeStamp'] },
                                                                            timestamp: endIstTimestampUTC
                                                                        }]
                                                                    ]
                                                                },
                                                                '$$value.result'
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]

                                        }
                                    }
                                }
                            },
                            FirstEdgeCases: {
                                $reduce: {
                                    input: '$entries',
                                    initialValue: { lastprevious: initialPrevious[0], result: [], previous: { $arrayElemAt: ['$entries', 0] } },
                                    in: {

                                        result: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $or: [{ $eq: ['$$value.lastprevious.CompStatus', 'COMPOFF'] }, { $eq: ['$$value.lastprevious.CompStatus', 'COMPOFF+THRMO'] }] },
                                                        { $or: [{ $eq: ['$$value.lastprevious.OptimizationMode', 'NON-OPTIMIZATION'] }, { $eq: ['$$value.lastprevious.OptimizationMode', 'OPTIMIZATION'] }] },
                                                    ]
                                                },
                                                {
                                                    $concatArrays: [
                                                        '$$value.result',
                                                        [{
                                                            cutoffTimeThrm: { $subtract: ['$$value.previous.TimeStamp', startIstTimestampUTC] },
                                                            timestamp: '$$value.previous.TimeStamp'
                                                        }]
                                                    ]
                                                },
                                                {
                                                    $cond: [
                                                        {
                                                            $and: [
                                                                { $eq: ['$$value.lastprevious.CompStatus', 'COMPOFF+OPT'] },
                                                                { $eq: ['$$value.lastprevious.OptimizationMode', 'OPTIMIZATION'] },
                                                            ]
                                                        },
                                                        {
                                                            $concatArrays: [
                                                                '$$value.result',
                                                                [{
                                                                    cutoffTimeOpt: { $subtract: ['$$value.previous.TimeStamp', startIstTimestampUTC] },
                                                                    timestamp: '$$value.previous.TimeStamp'
                                                                }]
                                                            ]
                                                        },
                                                        {
                                                            $cond: [
                                                                {
                                                                    $and: [
                                                                        { $eq: ['$$value.lastprevious.CompStatus', 'COMPON'] },
                                                                        { $or: [{ $eq: ['$$value.lastprevious.OptimizationMode', 'NON-OPTIMIZATION'] }, { $eq: ['$$value.lastprevious.OptimizationMode', 'OPTIMIZATION'] }] }
                                                                    ]
                                                                },
                                                                {
                                                                    $concatArrays: [
                                                                        '$$value.result',
                                                                        [{
                                                                            RemainingTime: { $subtract: ['$$value.previous.TimeStamp', startIstTimestampUTC] },
                                                                            timestamp: '$$value.previous.TimeStamp'
                                                                        }]
                                                                    ]
                                                                },
                                                                '$$value.result'
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]

                                        }
                                    }
                                }
                            },
                        }
                    },
                    {
                        $project: {
                            // FirstEdgeCase: '$FirstEdgeCases.result',
                            // lastedge: '$LastEdgeCases.result',
                            StartTime: startIstTimestampUTC.toString(),
                            EndTime: endIstTimestampUTC.toString(),
                            totalCutoffTimeThrm: {
                                $sum: [
                                    { $sum: '$ThermostatCutoffTimes.result.cutoffTimeThrm' },
                                    { $cond: [{ $gt: [{ $size: '$LastEdgeCases.result' }, 0] }, { $arrayElemAt: ['$LastEdgeCases.result.cutoffTimeThrm', 0] }, 0] },
                                    { $cond: [{ $gt: [{ $size: '$FirstEdgeCases.result' }, 0] }, { $arrayElemAt: ['$FirstEdgeCases.result.cutoffTimeThrm', 0] }, 0] }
                                ]
                            },
                            totalCutoffTimeOpt: {
                                $sum: [
                                    { $sum: '$DeviceCutoffTimes.result.cutoffTimeOpt' },
                                    { $cond: [{ $gt: [{ $size: '$LastEdgeCases.result' }, 0] }, { $arrayElemAt: ['$LastEdgeCases.result.cutoffTimeOpt', 0] }, 0] },
                                    { $cond: [{ $gt: [{ $size: '$FirstEdgeCases.result' }, 0] }, { $arrayElemAt: ['$FirstEdgeCases.result.cutoffTimeOpt', 0] }, 0] }
                                ]
                            },
                            totalRemainingTime: {
                                $sum: [
                                    { $sum: '$RemainingRunTimes.result.RemainingTime' },
                                    { $cond: [{ $gt: [{ $size: '$LastEdgeCases.result' }, 0] }, { $arrayElemAt: ['$LastEdgeCases.result.RemainingTime', 0] }, 0] },
                                    { $cond: [{ $gt: [{ $size: '$FirstEdgeCases.result' }, 0] }, { $arrayElemAt: ['$FirstEdgeCases.result.RemainingTime', 0] }, 0] }
                                ]
                            }
                        }
                    }
                ];


                const PD = await PipelineData(pipeline);


                if (PD.length !== 0) {
                    const Optimizer = await OptimizerModel.findOne({ OptimizerID: Optimizerid });

                    if (Optimizer) {
                        PD.forEach(entry => {
                            entry.OptimizerName = Optimizer.OptimizerName;
                            entry.ACTonnage = Optimizer.ACTonnage;
                        });
                        if (Interval === "Day") {



                            var Twelve = await TwelveHour(startIstTimestampUTC);
                            let startIstTimestampsUTC;
                            if (!Twelve) {
                                startIstTimestampsUTC = setToMidnight(startIstTimestampUTC);
                            } else {
                                startIstTimestampsUTC = startIstTimestampUTC;
                            }

                            const newPipeline = [
                                {
                                    $match: {
                                        OptimizerID: Optimizerid,
                                        TimeStamp: { $gte: startIstTimestampsUTC.toString(), $lte: endIstTimestampUTC.toString() }
                                    }
                                },
                                { $sort: { TimeStamp: 1 } },
                                {
                                    $addFields: {
                                        TimeStamp: { $toLong: '$TimeStamp' }
                                    }
                                },
                                {
                                    $group: {
                                        _id: Optimizerid,
                                        entries: { $push: '$$ROOT' }
                                    }
                                },
                                {
                                    $project: {
                                        ACCutoffTimes: {
                                            $reduce: {
                                                input: '$entries',
                                                initialValue: { previous: null, result: [], expectingNextOn: true },
                                                in: {
                                                    previous: {
                                                        $cond: [
                                                            {
                                                                $and: [
                                                                    { $eq: ['$$this.ACStatus', 'ON'] },
                                                                    '$$value.expectingNextOn',
                                                                    { $eq: ['$$value.previous', null] }
                                                                ]
                                                            },
                                                            '$$this',
                                                            {
                                                                $cond: [
                                                                    { $eq: ['$$this.ACStatus', 'OFF'] },
                                                                    '$$this',
                                                                    {
                                                                        $cond: [
                                                                            {
                                                                                $and: [
                                                                                    { $eq: ['$$this.ACStatus', 'ON'] },
                                                                                    '$$value.expectingNextOn',
                                                                                    { $eq: ['$$value.previous.ACStatus', 'OFF'] }
                                                                                ]
                                                                            },
                                                                            '$$this',
                                                                            '$$value.previous'
                                                                        ]
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    expectingNextOn: {
                                                        $cond: [
                                                            { $eq: ['$$this.ACStatus', 'OFF'] },
                                                            true,
                                                            { $cond: [{ $eq: ['$$this.ACStatus', 'ON'] }, false, '$$value.expectingNextOn'] }
                                                        ]
                                                    },
                                                    result: {
                                                        $cond: [
                                                            {
                                                                $and: [
                                                                    { $eq: ['$$this.ACStatus', 'OFF'] },
                                                                    { $ne: ['$$value.previous', null] },
                                                                    { $eq: ['$$value.previous.ACStatus', 'ON'] }
                                                                ]
                                                            },
                                                            {
                                                                $concatArrays: [
                                                                    '$$value.result',
                                                                    [{

                                                                        ACOffTime: '$$this.TimeStamp'
                                                                    }]
                                                                ]
                                                            },
                                                            {
                                                                $cond: [
                                                                    {
                                                                        $and: [
                                                                            { $eq: ['$$this.ACStatus', 'ON'] },
                                                                            { $ne: ['$$value.previous', null] },
                                                                            { $eq: ['$$value.previous.ACStatus', 'OFF'] }
                                                                        ]
                                                                    },
                                                                    {
                                                                        $concatArrays: [
                                                                            '$$value.result',
                                                                            [{
                                                                                // ACOnTime: '$$value.previous.TimeStamp',
                                                                                ACOnTime: '$$this.TimeStamp',
                                                                            }]
                                                                        ]
                                                                    },
                                                                    {
                                                                        $cond: [
                                                                            {
                                                                                $and: [
                                                                                    { $eq: ['$$this.ACStatus', 'ON'] },
                                                                                    { $eq: ['$$value.previous', null] },

                                                                                ]
                                                                            },
                                                                            {
                                                                                $concatArrays: [
                                                                                    '$$value.result',
                                                                                    [{
                                                                                        ACOnTime: '$$this.TimeStamp'
                                                                                    }]
                                                                                ]
                                                                            },
                                                                            '$$value.result'
                                                                        ]
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                {
                                    $project: {
                                        ACCutoffTimes: '$ACCutoffTimes.result'
                                    }
                                }
                            ];
                            const newPD = await PipelineData(newPipeline);



                            // const newPipeline = [{
                            //     optimizerId: optimizers[i]._id,
                            //     starttime: { $gte: startIstTimestampsUTC },
                            //     $or: [
                            //         { endtime: { $lte: endIstTimestampUTC } },
                            //         { endtime: null }
                            //     ]
                            // }]

                            // const newPD = await OptimizerOnOffModel.aggregate(newPipeline);

                            //  console.log(newPD, "+++++++++++++++++++");


                            PD.forEach(entry => {
                                const newEntry = newPD.find(item => item._id === entry._id);
                                if (newEntry) {
                                    entry.ACCutoffTimes = newEntry.ACCutoffTimes;
                                }
                            });

                            data.push(...PD);
                        } else {
                            data.push(...PD);
                        }
                    }
                }

            }

            switch (Interval) {
                case "Day":
                    currentStart.setUTCDate(currentStart.getUTCDate() + 1);
                    currentStart.setUTCHours(0, 0, 0, 0);
                    break;
                case "Week":
                    currentStart.setUTCDate(currentStart.getUTCDate() + 7);
                    currentStart.setUTCHours(0, 0, 0, 0);
                    break;
                case "Month":
                    currentStart.setUTCMonth(currentStart.getUTCMonth() + 1);
                    currentStart.setUTCDate(1);
                    currentStart.setUTCHours(0, 0, 0, 0);
                    break;
                case "Year":
                    currentStart.setUTCFullYear(currentStart.getUTCFullYear() + 1);
                    currentStart.setUTCDate(1);
                    currentStart.setUTCMonth(0);
                    currentStart.setUTCHours(0, 0, 0, 0);
                    break;
            }
        }

        if (Interval === "Day") {
            const rearrangeACCutoffTimes = (data) => {
                data.forEach(item => {
                    const newCutoffTimes = [];
                    let currentCutoff = {};

                    item.ACCutoffTimes.forEach(time => {
                        if (time.hasOwnProperty('ACOnTime')) {
                            if (Object.keys(currentCutoff).length > 0) {
                                newCutoffTimes.push(currentCutoff);
                                currentCutoff = {};
                            }
                            currentCutoff.ACOnTime = time.ACOnTime;
                        } else if (time.hasOwnProperty('ACOffTime')) {
                            currentCutoff.ACOffTime = time.ACOffTime;
                            newCutoffTimes.push(currentCutoff);
                            currentCutoff = {};
                        }
                    });

                    if (Object.keys(currentCutoff).length > 0) {
                        newCutoffTimes.push(currentCutoff);
                    }

                    item.ACCutoffTimes = newCutoffTimes;
                });
            };

            rearrangeACCutoffTimes(data);
            return res.status(200).json({
                success: true,
                data: data
            });

        }



        return res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        // Handle errors appropriately
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching data',
            error: error.message
        });
    }

};


exports.AcOnOff = async (req, res) => {
    try {
        const { gateway_id, Optimizerid, startDate, endDate } = req.body;
        const timeZone = 'Asia/Kolkata';
        const startIstTimestamp = parseISTDateString(startDate);
        const endIstTimestamp = parseISTDateString(endDate);
        
        let optimizerIds = [];

        if (!Optimizerid) {
            // If gateway_id is provided but Optimizerid is not, fetch optimizer IDs from the GatewayModel
            const optids = await GatewayModel.aggregate([
                {
                    $match: {
                        _id: new objectId(gateway_id)
                    }
                },
                {
                    $lookup: {
                        from: "optimizers",
                        localField: "_id",
                        foreignField: "GatewayId",
                        as: "optimizerInfo"
                    }
                },
                {
                    $unwind: "$optimizerInfo"
                },
                {
                    $group: {
                        _id: "$GatewayID",
                        optimizerIds: {
                            $addToSet: "$optimizerInfo._id"
                        }
                    }
                }
            ]).exec();

            if (!optids.length) {
                //return res.status(404).json({ message: "No optimizer IDs found for the given Gateway ID" });
                return res.status(200).json({
                    success: true,
                    message: "No optimizer IDs found for the given Gateway ID",
                    data: []
                })
            }

            optimizerIds = optids[0].optimizerIds;
        } else {
            optimizerIds = [new objectId(Optimizerid)];
        }

        console.log("optimizerIds:" + optimizerIds + ", starttime:" + startIstTimestamp +", endtime:" + endIstTimestamp);
        const data = await OptimizerOnOff.aggregate(    
        [
            {
              $match: {
                $and: [
                  
                  { optimizerId: { $in: optimizerIds }},
                  { starttime: { $gte: startIstTimestamp } },
                  {
                    $or: [
                      { endtime: { $lte: endIstTimestamp } },
                      { endtime: null }
                    ]
                  }
                ]
              }
            }
          ]);
        if (!data.length) {
            return res.status(200).json({
                success: true,
                message: "No data found for the given criteria",
                data: []
            })
           // return res.status(404).json({ message: "No data found for the given criteria" });
        }

        const splitDataAcrossDays = (data) => {
        
            const updatedData = [];
        
            // Function to convert UTC timestamp to IST
            const convertToIST = (timestamp) => {
                const date = new Date(timestamp * 1000); // Convert to Date object
                const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30 in milliseconds
                return new Date(date.getTime() + istOffset); // Return IST Date object
            };
            
            // Loop through each record in the data array
            data.forEach((item) => {
                
                const recordEndTime = item.endtime? item.endtime: item.lastmsgtime;
                const windows = getTimeWindows(item.starttime, recordEndTime, timeZone);
                windows.map(window => {
                    updatedData.push({
                        optimizerId: item.optimizerId,
                        starttime: Math.floor(window.startTime/1000),
                        endtime: Math.floor(window.endTime/1000),
                        acstatus: item.acstatus,
                        duration: window.seconds,
                        date: window.date
                    });
                })
            });
        
            return updatedData;
        };
  
        splitDataAcrossDays(data);

        // Send the data as a JSON response
        return res.status(200).json({
            success: true,
            message: "Ac data fetched successfully",
            data: splitDataAcrossDays(data)
        });

    } catch (error) {
        console.error(error);
        // Handle errors and send a response
        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching Ac Data",
            error: error.message
        });
    }
};


function getTimeWindows(startTime, endTime, timeZone) {
    const results = [];

    // Convert startTime and endTime to the given timezone
    let start = moment.tz(startTime * 1000, timeZone); // startTime is assumed to be in epoch seconds
    let end = moment.tz(endTime * 1000, timeZone); // endTime is assumed to be in epoch seconds

    // Extract the date parts
    let startDate = start.clone().startOf('day');
    let endDate = end.clone().startOf('day');

    // Calculate the first day's time part up to midnight
    if (!start.isSame(end, 'day')) {
        let midnight = start.clone().endOf('day');
        results.push({
            date: start.format('YYYY-MM-DD'),
            startTime: start.valueOf(),
            endTime: midnight.valueOf(),
            seconds: (midnight.unix() - start.unix()) // Duration in seconds for the first day
        });

        // Increment the current date to the next day
        let currentDate = startDate.clone().add(1, 'day');

        // Loop through all the full days between start and end date
        while (currentDate.isBefore(endDate)) {
            let dayStart = currentDate.clone().startOf('day');
            let dayEnd = currentDate.clone().endOf('day');
            results.push({
                date: dayStart.format('YYYY-MM-DD'),
                startTime: dayStart.valueOf(),
                endTime: dayEnd.valueOf(),
                seconds: 86400 // Full day duration in seconds
            });
            currentDate.add(1, 'day');
        }

        // Handle the final day's time part
        results.push({
            date: endDate.format('YYYY-MM-DD'),
            startTime: endDate.valueOf(),
            endTime: end.valueOf(),
            seconds: end.unix() - endDate.unix() // Duration in seconds for the last day
        });
    } else {
        // If start and end are on the same day
        results.push({
            date: start.format('YYYY-MM-DD'),
            startTime: start.valueOf(),
            endTime: end.valueOf(),
            seconds: end.unix() - start.unix() // Duration in seconds for the same day
        });
    }

    return results;
}



async function TwelveHour(timestamp) {

    // Convert timestamp to a moment object and format it to IST
    const istTime = moment.unix(timestamp).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
    const times = istTime.split(" ");
    if (times[1] === "00:00:00") {
        return true
    } else {
        return false
    }
}
// Function to set time to 00:00:00 of a given timestamp
function setToMidnight(timestamp) {
    const date = new Date(timestamp * 1000); // Convert to Date object
    date.setHours(0, 0, 0, 0); // Set time to 00:00:00
    return Math.floor(date.getTime() / 1000); // Convert back to Unix timestamp
}



async function PipelineData(pipeline) {
    // console.log(pipeline);
    return await NewApplianceLogModel.aggregate(pipeline);
}



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


exports.PaginationData = async (req, res) => {
    try {
        const { page, pageSize } = req.query;
        console.log({ page, pageSize });

        // Validate page and pageSize parameters
        const validatedPage = Math.max(1, parseInt(page, 10)) || 1;
        const validatedPageSize = Math.max(1, parseInt(pageSize, 10)) || 100;
        console.log({ validatedPage, validatedPageSize });

        // Pagination
        const skip = (validatedPage - 1) * validatedPageSize;



        let GatewayLogData = await GatewayLogModel
            .find({})
            .sort({ TimeStamp: 1 })
            .skip(skip)
            .limit(validatedPageSize);
        const totalResults = await GatewayLogModel.countDocuments({});

        return res.send({
            success: true,
            message: "Data fetched successfully",
            response: GatewayLogData,
            pagination: {
                page: validatedPage,
                pageSize: validatedPageSize,
                totalResults: totalResults,
            },
        });
    } catch (error) {
        console.error("Error fetching data:", error);
        return res.status(500).json({ success: false, message: "Internal server error", err: error });
    }
};
