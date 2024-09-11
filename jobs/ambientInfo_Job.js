const AmbientModel = require('../models/ambientInfoModel')
const OptimizerLogModel = require('../models/OptimizerLog.model');
const { SendAudit } = require('../controllers/Delloite/action');
const { Data } = require('../Test/RetriveId');
const mongoose = require('mongoose');
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
            // Process each state and location directly
            for (const item of data) {
                const { locations } = item;

                for (const location of locations) {
                    const { latitude, longitude, gateways } = location;
                    const key = await LocationKey(latitude, longitude);
                    const weather = await Accuweather(key);

                    const temp = weather.data[0].Temperature.Metric.Value; // Temperature in Celsius
                    const humidity = weather.data[0].RelativeHumidity;
                    const optimizerIdArr = [];

                    for (const gateway of gateways) {
                       
                        gateway.optimizers.forEach(optimizer => {
                            // Normalize optimizer data structure
                            const normalizedOptimizer = {
                                OptimizerID: optimizer.OptimizerID || optimizer.id,
                                optimizerName: optimizer.optimizerName || optimizer.name
                            };

                            // Check if optimizer has the expected properties
                            if (normalizedOptimizer.OptimizerID ) {
                                optimizerIdArr.push(normalizedOptimizer.OptimizerID);
                            }
                        });
                    }
                    
                    const latestRecord = await findLatestRecords(optimizerIdArr);
                
                    if (latestRecord && latestRecord.length > 0) {
                        const lastRunRecord = await AmbientModel.findOne().sort({ RunID: -1 });
                        const runId = lastRunRecord && !isNaN(Number(lastRunRecord.RunID)) ? Number(lastRunRecord.RunID) + 1 : 1;
                        const chunkSize = 2;

                        for (let i = 0; i < latestRecord.length; i += chunkSize) {
                            const batchId = i / chunkSize + 1; 
                            const recordsToInsert = [];

                            for (const entry of latestRecord) {

                                const newRecord = {
                                    GID: entry.GatewayID,
                                    OID: entry.OptimizerID,
                                    TimeStamp: entry.TimeStamp,
                                    TempUT: entry.RoomTemperature,
                                    AmbTemp: temp,
                                    AmbHum: humidity,
                                    HumUT: entry.Humidity,
                                    RunID: runId,
                                    BatchID: batchId,
                                    Type: "AmbientInfo"
                                };
                                recordsToInsert.push(newRecord);
                            }
                             // Insert all records ---------
                            const insertedRecords = await AmbientModel.insertMany(recordsToInsert);
            
                            // Generate a single groupId for the entire chunk
                            const groupId = `${insertedRecords[0].RunID}-${insertedRecords[0].BatchID}`;

                            //create the `Message` array
                            const chunk = {
                                groupId: groupId, // Same groupId for all records in this chunk
                                Message: insertedRecords.map(record => {
                                    // Convert Unix timestamp to human-readable format using moment.js
                                    const humanReadableTimeStamp = moment.unix(record.TimeStamp).format('YYYY-MM-DD HH:mm:ss'); // Adjust format as needed

                                    return {
                                        MessageId: record._id.toString(),
                                        OptimizerId: record.OID,      // Include the _id of newRecord
                                        GatewayId: record.GID,
                                        TempUnit: record.TempUT,
                                        AmbientTemp: record.AmbTemp,
                                        AmbientHumidity: record.AmbHum,
                                        HumidityUnit: record.HumUT,
                                        Time: humanReadableTimeStamp, // Human-readable timestamp
                                        MessageTime: record.createdAt,
                                        Type: record.Type
                                    };
                                })
                            };
                            // Send the chunk with the _id, groupId, and other fields to SendAudit
                            const SendAuditResp = await SendAudit(chunk); // Assuming SendAudit accepts the chunk with groupId
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
            return response;
        } catch (error) {
            console.log(error);
            throw error;
        }

    }

    async function findLatestRecords(optimizerIdArr) {
        try {
            const objectIdArray = optimizerIdArr.map(id => new mongoose.Types.ObjectId(id));
      
            // Get the current Unix timestamp and 5 minutes back
            const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
            const fiveMinutesAgo = currentTime - (25 * 60); // 5 minutes ago in seconds

            const recordPipeline = [
                {
                    $match: {

                        OptimizerID: { $in: objectIdArray },
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
                        _id: "$OptimizerID",
                        latestRecord: { $first: "$$ROOT" } // Get the first record after sorting
                    }
                },
                {
                    $replaceRoot: { newRoot: "$latestRecord" } // Replace root with the latest record
                },
                {
                    $lookup:{
                        from:"optimizers",
                        localField: "OptimizerID",
                        foreignField: "_id",
                        as:"OptimizerIDs"
                    }
                },
                {
                    $unwind: "$OptimizerIDs" // Converts optimizerData array into an object
                },
                {
                    $lookup:{
                        from:"gateways",
                        localField: "GatewayID",
                        foreignField: "_id",
                        as:"GatewayIDs"
                    }
                },
                {
                    $unwind: "$GatewayIDs" // Converts optimizerData array into an object
                },
                {
                    $project: {
                        _id: 1,
                        OptimizerID: "$OptimizerIDs.OptimizerID",
                        OptimizerName: "$OptimizerIDs.OptimizerName",
                        GatewayID: "$GatewayIDs.GatewayID",
                        TimeStamp: 1,
                        RoomTemperature: 1,
                        Humidity: 1,
                    }
                }
            ];
            const latestRecords = await OptimizerLogModel.aggregate(recordPipeline).exec();
            return latestRecords;
        } catch (error) {
            console.error('Error finding latest records:', error);
        }
    }
};