const { Enterprise } = require('../middleware/lib/roles');
const OptimizerLogModel = require('../models/OptimizerLog.model');
const { SendAudit } = require('../controllers/Delloite/action');
const { Data } = require('../Test/RetriveId');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');
const moment = require('moment');

module.exports = function (agenda) {
    agenda.define('acon/off_Job', async (job) => {
        try {
            const id = await Data();
            const { gatewayIds } = id;
            console.log(gatewayIds);
            const latestRecord = await findonoffRecord(gatewayIds);
            console.log({latestRecord},"++++++++++++");
            

        } catch (error) {

        }

    })


    async function findonoffRecord(gatewayIds) {
        const pipeline = [
            {
                $match: {
                    TimeStamp: {
                        $gt: "1725167702"
                    },
                    GatewayID: { $in: gatewayIds },
                }
            },
            {
                $sort: {
                    TimeStamp: 1
                }
            },
            {
                $group: {
                    _id: {
                        optimizerId: "$OptimizerID",
                        gatewayId: "$GatewayID"
                    },
                    activities: {
                        $push: {
                            compStatus: "$CompStatus",
                            optmode: "$OptimizerMode",
                            time: {
                                $convert: {
                                    input: "$TimeStamp",
                                    to: "double",
                                    onError: null,
                                    onNull: null
                                }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    name: "$_id",
                    timeDiffs: {
                        $reduce: {
                            input: {
                                $map: {
                                    input: {
                                        $range: [
                                            1,
                                            {
                                                $size: "$activities"
                                            }
                                        ]
                                    },
                                    as: "idx",
                                    in: {
                                        current: {
                                            $arrayElemAt: [
                                                "$activities",
                                                "$$idx"
                                            ]
                                        },
                                        previous: {
                                            $arrayElemAt: [
                                                "$activities",
                                                {
                                                    $subtract: ["$$idx", 1]
                                                }
                                            ]
                                        }
                                    }
                                }
                            },
                            // -------------------------
                            initialValue: [],
                            in: {
                                $concatArrays: [
                                    "$$value",
                                    [
                                        {
                                            activity:
                                                "$$this.previous.compStatus",
                                            status:
                                                "$$this.previous.optmode",
                                            timeDiff: {
                                                $subtract: [
                                                    "$$this.current.time",
                                                    "$$this.previous.time"
                                                ]
                                            }
                                        }
                                    ]
                                ]
                            }
                        }
                    }
                }
            },
            {
                $unwind: "$timeDiffs"
            },
            {
                $group: {
                    _id: {
                        name: "$name",
                        activity: "$timeDiffs.activity",
                        status: "$timeDiffs.status"
                    },
                    totalTime: {
                        $sum: "$timeDiffs.timeDiff"
                    },
                    mc: {
                        $sum: 1
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: "$_id.name",
                    activity: "$_id.activity",
                    status: "$_id.status",
                    totalTime: "$totalTime",
                    mc: "$mc"
                }
            },
            {
                $group: {
                    _id: "$name",
                    values: {
                        $addToSet: {
                            activity: "$activity",
                            status: "$status",
                            totalTime: "$totalTime",
                            msgcount: "$mc"
                        }
                    }
                }
            }
        ]
        const latestRecords = await OptimizerLogModel.aggregate(pipeline).exec();
        // console.log({latestRecords});
        

        return latestRecords;
    }
}