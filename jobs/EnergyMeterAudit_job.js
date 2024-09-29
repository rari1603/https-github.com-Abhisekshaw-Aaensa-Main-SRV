const { Enterprise } = require('../middleware/lib/roles');
const EnergyMeterAuditModel = require('../models/EnergyMeter_Audit');
const GatewayLogModel = require('../models/GatewayLog.model');
const { SendAudit } = require('../controllers/Delloite/action');
const { Data } = require('../Test/RetriveId');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');
const moment = require('moment');


module.exports = function (agenda) {

    // Job 1: Find the latest record in ModelA and store it in ModelB
    agenda.define('EnergyMeterAudit', async (job) => {
        try {
            const id = await Data();
            const { gatewayIds } = id;

            const latestRecord = await findLatestRecords(gatewayIds);

            // const id = await Data();
            // const latestRecord = await findLatestRecords(id);

            if (latestRecord && latestRecord.length > 0) {
                // Fetch the latest runId from the collection, ensuring it's a valid number
                const lastRunRecord = await EnergyMeterAuditModel.findOne().sort({ runId: -1 });

                const runId = lastRunRecord && !isNaN(Number(lastRunRecord.runId)) ? Number(lastRunRecord.runId) + 1 : 1;

                const chunkSize = 50;

                for (let i = 0; i < latestRecord.length; i += chunkSize) {
                    const batchId = i / chunkSize + 1; // BatchId starts from 1 for each new runId

                    const recordsToInsert = []; // Array to hold all records to insert

                    for (const entry of latestRecord) {

                        // Create the new record with runId and batchId
                        const newRecord = {
                            GatewayId: entry.GatewayID,
                            TimeStamp: entry.TimeStamp,
                            KWH: entry.KWH,
                            KVAH: entry.KVAH,
                            PF: entry.PF,
                            runId: runId,  // Ensure runId is a valid number
                            batchId: batchId,
                            Type: "Energy-Meter"
                        };
                        recordsToInsert.push(newRecord);
                    }

                    // Insert all records in one go
                    const insertedRecords = await EnergyMeterAuditModel.insertMany(recordsToInsert);

                    // Generate a single groupId for the entire chunk
                    const groupId = `${insertedRecords[0].runId}-${insertedRecords[0].batchId}`;

                    // Map over the records to create the `Message` array
                    const chunk = {
                        GroupMsgId: groupId, // Same groupId for all records in this chunk
                        Messages: insertedRecords.map(record => {
                            // Convert Unix timestamp to human-readable format using moment.js
                            const humanReadableTimeStamp = moment.unix(record.TimeStamp).format('YYYY-MM-DD HH:mm:ss'); // Adjust format as needed
                            // Convert createdAt to human-readable format
                            const humanReadableCreatedAt = moment(record.createdAt).format('YYYY-MM-DD HH:mm:ss'); // Adjust format as needed

                            return {
                                MessageId: record._id.toString(),       // Include the _id of newRecord
                                GatewayId: record.GatewayId,
                                KWH: record.KWH,
                                KVAH: record.KVAH,
                                PF: record.PF,
                                Time: humanReadableTimeStamp, // Human-readable timestamp
                                MessageTime: humanReadableCreatedAt,
                                Type: record.Type
                            };
                        })
                    };


                    // Send the chunk with the _id, groupId, and other fields to SendAudit
                    const SendAuditResp = await SendAudit(chunk); // Assuming SendAudit accepts the chunk with groupId
                }
            } else {
                console.log('No records found in EnterpriseMeterAudit');
            }
        } catch (err) {
            console.error('Error while storing record:', err);
        }
    });


    async function findLatestRecords(gatewayIDs) {
        try {
            // const gatewayIDs = ["683684623863", "863923874936", "97849820347234"]; // Your GatewayIDs
            // Convert string IDs to ObjectId
            const objectIdArray = gatewayIDs.map(id => new mongoose.Types.ObjectId(id));
            // Get the current Unix timestamp and 5 minutes back
            const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
            const fiveMinutesAgo = currentTime - (25 * 60); // 5 minutes ago in seconds

            const pipeline = [
                {
                    $match: {
                        GatewayID: { $in: objectIdArray },
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
                },
                {
                    $lookup: {
                        from: "gateways", // Name of the GatewayModel collection (plural of the model name)
                        localField: "GatewayID", // Field from GatewayLogModel
                        foreignField: "_id", // Corresponding field in GatewayModel
                        as: "gatewayInfo" // Name of the field to store the result
                    }
                },
                {
                    $unwind: "$gatewayInfo" // Unwind to flatten the result
                },
                {
                    $project: {
                        _id: 1,
                        TimeStamp: 1,
                        KVAH: 1,
                        KWH: 1,
                        PF: 1,
                        // Include fields from the GatewayModel
                        GatewayID: "$gatewayInfo.GatewayID"
                    }
                }
            ];

            const latestRecords = await GatewayLogModel.aggregate(pipeline).exec();

            return latestRecords;
        } catch (error) {
            console.error('Error finding latest records:', error);
        }
    }
};