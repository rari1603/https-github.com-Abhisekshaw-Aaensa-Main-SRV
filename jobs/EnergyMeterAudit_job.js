const { Enterprise } = require('../middleware/lib/roles');
const EnergyMeterAuditModel = require('../models/EnergyMeter_Audit');
const GatewayLogModel = require('../models/GatewayLog.model');
const mongoose = require('mongoose');

module.exports = function (agenda) {

    // Job 1: Find the latest record in ModelA and store it in ModelB
    agenda.define('EnergyMeterAudit', async (job) => {
        try {
            const latestRecord = await findLatestRecords(["66d6a8f5b7d83af6a1ba089c", "66d6ae69b7d83af6a1ba09da"]);
            // const EnterpriseID =
            // console.log(latestRecord,"--------------------");
            // const latestRecord = await GatewayLogModel.findOne().sort({ createdAt: -1 });
            if (latestRecord && latestRecord.length > 0) {
                for (const entry of latestRecord) {
                    const newRecord = new EnergyMeterAuditModel({
                        GatewayId: entry.GatewayID,
                        KWH: entry.KWH,
                        KVAH: entry.KVAH,
                        PF: entry.PF,
                    });
                    await newRecord.save();
                    // console.log('Record stored in EnergyMeterAuditModel:', newRecord);
                }
            } else {
                console.log('No records found in ModelA');
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


};