const EnterpriseDetailsModel = require('../models/enterpriseDetails');
const EnterpriseModel = require('../models/enterprise.model');
const moment = require('moment');
const logger = require('../configs/pino_logger');

module.exports = function (agenda) {
    agenda.define('dailyEnterprise_Job', async (job) => {
        try {
            // 1. Get the most recent entry's updatedAt field from EnterpriseDetailsModel
            const latestEntry = await EnterpriseDetailsModel.findOne()
                .sort({ updatedAt: -1 })  // Get the most recent record
                .select('updatedAt');      // Only select the updatedAt field

            let lastRunDate = latestEntry ? latestEntry.updatedAt : moment().subtract(1, 'days').toISOString(); // Default to 1 day ago if no records

            // 2. Get the current data from the DailyEnterpriseUpdate function
            const AllData = await DailyEnterpriseUpdate();

            if (!AllData || AllData.length === 0) {
                return;
            }

            // 3. Filter records based on createdAt/updatedAt > lastRunDate
            const newRecords = AllData.filter(item => {
                const itemUpdatedAt = item.updatedAt || item.createdAt; // Use updatedAt if available, else createdAt
                return moment(itemUpdatedAt).isAfter(lastRunDate);      // Compare with last run date
            });

            if (newRecords.length === 0) {
               
                return;
            }

            // 4. Insert new records into EnterpriseDetailsModel
            await EnterpriseDetailsModel.insertMany(newRecords.map(record => ({
                enterpriseId: record.enterpriseId,
                enterprisename: record.enterprisename,
                stateId: record.stateId,
                statename: record.state,
                locationId: record.locationId,
                locationname: record.location,
                gatewayId: record.gatewayId,
                gatewayname: record.gateway,
                optimizerId: record.optimizerId,
                optimizername: record.optimizername,
                TimeStamp: moment().toISOString(), // Add a timestamp for when this record is inserted
            })));


        } catch (err) {
           
        }
    });

    async function DailyEnterpriseUpdate() {
        const pipeline = [
            {
                $lookup: {
                    from: "enterprisestates",
                    localField: "_id",
                    foreignField: "Enterprise_ID",
                    as: "stateData"
                }
            },
            {
                $unwind: {
                    path: "$stateData",
                }
            },
            {
                $lookup: {
                    from: "enterprisestatelocations",
                    localField: "stateData.Enterprise_ID",
                    foreignField: "Enterprise_ID",
                    as: "locationData"
                }
            },
            {
                $unwind: {
                    path: "$locationData"
                }
            },
            {
                $match: {
                    $expr: {
                        $eq: [
                            "$locationData.State_ID",
                            "$stateData.State_ID"
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "states",
                    localField: "stateData.State_ID",
                    foreignField: "_id",
                    as: "stateInfo"
                }
            },
            {
                $unwind: {
                    path: "$stateInfo"
                }
            },
            {
                $lookup: {
                    from: "gateways",
                    localField: "locationData._id",
                    foreignField: "EnterpriseInfo",
                    as: "gatewayInfo"
                }
            },
            {
                $unwind: {
                    path: "$gatewayInfo"
                }
            },
            {
                $lookup: {
                    from: "optimizers",
                    localField: "gatewayInfo._id",
                    foreignField: "GatewayId",
                    as: "optimizerInfo"
                }
            },
            {
                $unwind: {
                    path: "$optimizerInfo",
                }
            },
            {
                $project: {
                    _id: 0,
                    entepriseId: "$_id",
                    enterprisename: "$EnterpriseName",
                    stateId: "$stateData.State_ID",
                    state: "$stateInfo.name",
                    locationId: "$locationData._id",
                    location: "$locationData.LocationName",
                    gatewayId: "$gatewayInfo._id",
                    gateway: "$gatewayInfo.GatewayID",
                    optimizerId: "$optimizerInfo.OptimizerID",
                    optimizername: "$optimizerInfo.OptimizerName",
                }
            }
        ];

        // Execute the aggregation pipeline
        const data = await EnterpriseModel.aggregate(pipeline).exec();
        return data;
    }

};
