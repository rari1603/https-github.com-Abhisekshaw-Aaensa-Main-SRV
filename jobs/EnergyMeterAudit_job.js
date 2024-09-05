const { Enterprise } = require('../middleware/lib/roles');
const EnergyMeterAuditModel = require('../models/EnergyMeter_Audit');
const GatewayLogModel = require('../models/GatewayLog.model');
const { SendAudit } = require('../controllers/Delloite/action');
const { Data } = require('../Test/RetriveId');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');


module.exports = function (agenda) {

    // Job 1: Find the latest record in ModelA and store it in ModelB
    agenda.define('EnergyMeterAudit', async (job) => {
        try {
            const id = await Data();
            const latestRecord = await findLatestRecords(id);

            if (latestRecord && latestRecord.length > 0) {
                // Fetch the latest runId from the collection, ensuring it's a valid number
                const lastRunRecord = await EnergyMeterAuditModel.findOne().sort({ runId: -1 });
                const runId = lastRunRecord && !isNaN(Number(lastRunRecord.runId)) ? Number(lastRunRecord.runId) + 1 : 1;

                const chunkSize = 20;

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
                        };
                        recordsToInsert.push(newRecord);
                    }
                    console.log({ runId });

                    // Insert all records in one go
                    const insertedRecords = await EnergyMeterAuditModel.insertMany(recordsToInsert);

                    // Process the inserted records to add groupId
                    const chunk = insertedRecords.map(record => {
                        const groupId = `${record.runId}-${record.batchId}`;

                        return {
                            _id: record._id,       // Include the _id of newRecord
                            GatewayId: record.GatewayId,
                            TimeStamp: record.TimeStamp,
                            KWH: record.KWH,
                            KVAH: record.KVAH,
                            PF: record.PF,
                            groupId: groupId,
                        };
                    });


                    // Send the chunk with the _id, groupId, and other fields to SendAudit
                    const SendAuditResp = await SendAudit(chunk); // Assuming SendAudit accepts the chunk with groupId
                    console.log({ SendAuditResp, batchId });
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
                }
            ];

            const latestRecords = await GatewayLogModel.aggregate(pipeline).exec();
            return latestRecords;
        } catch (error) {
            console.error('Error finding latest records:', error);
        }
    }





    async function generateStaticData() {
        const data = [];
        const baseTimestamp = 1725361073; // Starting timestamp

        for (let i = 0; i < 60; i++) {
            const record = {
                _id: new ObjectId(),
                GatewayID: new ObjectId(),
                TimeStamp: (baseTimestamp + i).toString(),
                Phases: {
                    Ph1: { voltage: 230 + Math.random(), current: 10 + Math.random() },
                    Ph2: { voltage: 230 + Math.random(), current: 10 + Math.random() },
                    Ph3: { voltage: 230 + Math.random(), current: 10 + Math.random() },
                },
                KVAH: parseFloat((440 + i * 5).toFixed(2)),
                KWH: parseFloat((433 + i * 5).toFixed(2)),
                PF: 0.99,
                isDelete: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                __v: 0,
            };
            data.push(record);
        }

        return data;
    }
};