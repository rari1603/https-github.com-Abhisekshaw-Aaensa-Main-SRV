const { Enterprise } = require('../middleware/lib/roles');
const AmbientModel = require('../models/ambientInfoModel')
const OptimizerLogModel = require('../models/OptimizerLog.model');
const { SendAudit } = require('../controllers/Delloite/action');
const { Data } = require('../Test/RetriveId');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');
const moment = require('moment');
const axios = require('axios');

module.exports = function (agenda) {

    // Job 1: Find the latest record in ModelA and store it in ModelB
    agenda.define('ambientInfo_Job', async (job) => {
        try {

            const AllData = await Data();
            const { data } = AllData;

            if (!data || data.length === 0) {
                console.log("No data found for the specified state.");
                return;
            }
            console.log(data,"+++++++++++");

            const latLData = data.map((item) => ({
                stateName: item.stateName,
                locations: item.locations.map((loc) => ({
                    locationName: loc.locationName,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    gateways: loc.gateways.map((gw) => ({
                        _id: gw._id, // Extract the _id from each gateway
                        gatewayId: gw.gatewayId,
                        optimizers: gw.optimizers.map((opt) => ({
                            optimizerName: opt.name,
                            optimizerId: opt.id
                        }))
                    }))
                }))
            }));

            // Process each state and location
            for (const state of latLData) {
                for (const location of state.locations) {
                    const { latitude, longitude } = location;

                    const key = await LocationKey(latitude, longitude);
                    const weather = await Accuweather(key);

                    const temp = weather.data[0].Temperature.Metric.Value; // Temperature in Celsius
                    const humidity = weather.data[0].RelativeHumidity;
                    const gatewayDbIdsArray = [];

                    // Log gateways and optimizers
                    location.gateways.forEach(gateway => {
                        console.log(`Gateway ID here which is used: ${gateway.gatewayId}`);

                        // Push the _id into the array
                        if (gateway._id) {
                            gatewayDbIdsArray.push(gateway._id.toString());
                        }

                        gateway.optimizers.forEach(optimizer => {
                            console.log(`  Optimizer Name: ${optimizer.optimizerName}`);
                            console.log(`  Optimizer ID: ${optimizer.optimizerId}`);
                        });
                    });

                    // At this point, gatewayDbIdsArray contains all the gateway IDs (_id) from the database
                    console.log("All Gateway _IDs:", gatewayDbIdsArray);

                    const latestRecord = await findLatestRecords(gatewayDbIdsArray); // Pass gatewayDbIdsArray here
                    console.log(latestRecord, "latestRecord");

                    // const latestRecord = await findLatestRecords(gatewayIdsArray); // Pass gatewayIds here
                    // console.log(latestRecord,"latestRecord");

                    if (latestRecord && latestRecord.length > 0) {
                        // Fetch the latest runId from the collection, ensuring it's a valid number
                        const lastRunRecord = await AmbientModel.findOne().sort({ RunID: -1 });

                        const runId = lastRunRecord && !isNaN(Number(lastRunRecord.RunID)) ? Number(lastRunRecord.RunID) + 1 : 1;

                        const chunkSize = 2;

                        for (let i = 0; i < latestRecord.length; i += chunkSize) {
                            const batchId = i / chunkSize + 1; // BatchId starts from 1 for each new runId

                            const recordsToInsert = []; // Array to hold all records to insert

                            for (const entry of latestRecord) {
                                console.log(entry, "entry");

                                // Create the new record with runId and batchId
                                const newRecord = {
                                    GID: entry.GatewayID,
                                    OID: entry.OptimizerID,
                                    TimeStamp: entry.TimeStamp,
                                    TempUT: entry.RoomTemperature,
                                    AmbTemp: temp,
                                    AmbHum: humidity,
                                    HumUT: entry.Humidity,
                                    RunID: runId,  // Ensure runId is a valid number
                                    BatchID: batchId,
                                    Type: "AmbientInfo"
                                };
                                console.log(newRecord, "newRecord");
                                //recordsToInsert.push(newRecord);
                            }
                            //console.log(newRecord, "newRecord");

                            // Insert all records in one go
                            //const insertedRecords = await AmbientModel.insertMany(recordsToInsert);
                            //console.log(insertedRecords,);

                            // Generate a single groupId for the entire chunk
                            const groupId = `${insertedRecords[0].runId}-${insertedRecords[0].batchId}`;

                            // Map over the records to create the `Message` array
                            const chunk = {
                                groupId: groupId, // Same groupId for all records in this chunk
                                Message: insertedRecords.map(record => {
                                    // Convert Unix timestamp to human-readable format using moment.js
                                    const humanReadableTimeStamp = moment.unix(record.TimeStamp).format('YYYY-MM-DD HH:mm:ss'); // Adjust format as needed

                                    return {
                                        MessageId: record._id.toString(),       // Include the _id of newRecord
                                        GatewayId: record.GatewayId,
                                        Time: humanReadableTimeStamp, // Human-readable timestamp
                                        MessageTime: record.createdAt,
                                        Type: record.Type
                                    };
                                })
                            };


                            // Send the chunk with the _id, groupId, and other fields to SendAudit
                            const SendAuditResp = await SendAudit(chunk); // Assuming SendAudit accepts the chunk with groupId
                            //console.log({ SendAuditResp, batchId });
                        }
                    } else {
                        console.log('No records found in Ambient Info');
                    }
                }
            }
        } catch (err) {
            console.error('Error while storing record:', err);
        }
    });

    const LocationKey = async (lat, long) => {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=iV4ZAgc5DoSoc3EiDciIas8ePgSn7lH5&q=${lat},${long}`,
            headers: {}
        };

        try {
            const response = await axios.request(config);
            return response.data.Key;
        } catch (error) {
            console.log(error);
            throw error;
        }

    }
    const Accuweather = async (key) => {
        const axios = require('axios');

        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `http://dataservice.accuweather.com/currentconditions/v1/${key}?apikey=iV4ZAgc5DoSoc3EiDciIas8ePgSn7lH5&details=true`,
            headers: {}
        };

        try {
            const response = await axios.request(config);
            console.log(response.data[0]);
            return response;
        } catch (error) {
            console.log(error);
            throw error;
        }

    }

    async function findLatestRecords(gatewayDbIdsArray) {
        // console.log(gatewayDbIdsArray,"gatewayIdsArray");

        try {
            const objectIdArray = gatewayDbIdsArray.map(id => new mongoose.Types.ObjectId(id));
            //console.log(objectIdArray,"objectIdArray");

            // Get the current Unix timestamp and 5 minutes back
            const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
            const fiveMinutesAgo = currentTime - (25 * 60); // 5 minutes ago in seconds

            const recordPipeline = [
                {
                    $match: {

                        GatewayID: { $in: objectIdArray },
                        // GatewayID: { $in: gatewayDbIdsArray }, // Use IDs directly
                        TimeStamp: {
                            $gte: fiveMinutesAgo.toString(), // Greater than or equal to 5 minutes ago
                            $lte: currentTime.toString() // Less than or equal to the current time
                        }
                    }
                },
                {
                    $sort: {
                        TimeStamp: -1 // Sort by TimeStamp in descending order
                    }
                },
                {
                    $group: {
                        _id: "$GatewayID",
                        latestRecord: { $first: "$$ROOT" } // Get the first record after sorting
                    }
                },
                {
                    $replaceRoot: { newRoot: "$latestRecord" } // Replace root with the latest record
                }
            ];
            const latestRecords = await OptimizerLogModel.aggregate(recordPipeline).exec();
            console.log(latestRecords, "latestRecordspipeline");
            return latestRecords;
        } catch (error) {
            console.error('Error finding latest records:', error);
        }
    }
};