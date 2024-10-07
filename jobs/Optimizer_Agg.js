
const OptimizerLogModel = require('../models/OptimizerLog.model');
const OptimizerAgg = require('../models/Optimizersagg');
const mongoose = require('mongoose');
const moment = require('moment');

module.exports = function (agenda) {
    agenda.define('Optimizer_Agg_job', async (job) => {
        try {
            // await runAggregationInIntervals(); // Run the aggregation and handle inserts
            const latestRecord = await findonoffRecord();

            const getLastRecordForOptimizer = async (optimizerId) => {
                return await OptimizerAgg.findOne({ optimizerId })
                    .sort({ createdAt: -1 }) // Sort by createdAt in descending order to get the most recent record
                    .exec();
            };

            const optimizerRecords = [];
            // Iterate through latest records
            for (const entry of latestRecord) {
                if (entry.optimizers && entry.optimizers.list && entry.optimizers.list.length > 0) {
                    const firstItem = entry.optimizers.list[0];

                    // Ensure the item has 'from' property
                    if (firstItem && firstItem.from) {

                        const lastRecord = await getLastRecordForOptimizer(firstItem.oid);
                        console.log({ from: firstItem.from }, "First 'from' value of optimizer list:");
                        // console.log(lastRecord.from, "Last record 'from' value:");

                        // If lastRecord exists and its 'from' time is greater or equal to the current 'from' time, skip the entire entry
                        if (lastRecord && lastRecord.from >= firstItem.from) {
                            console.log(`Skipping entry as it is a duplicate or older data. Entry 'from': ${firstItem.from}, Last record 'from': ${lastRecord.from}`);
                            break; // Exit the loop for this entry, continue to the next one
                        }
                        // Process each optimizer's list
                        for (const item of entry.optimizers.list) {
                            if (item && item.from) {
                                optimizerRecords.push({
                                    oid: item.oid,
                                    gid: item.gid,
                                    compStatus: item.compstatus,
                                    optmode: item.optmode,
                                    acstatus: item.acstatus,
                                    rtempfrom: item.rtempfrom,
                                    rtempto: item.rtempto,
                                    ctempfrom: item.ctempfrom,
                                    ctempto: item.ctempto,
                                    humfrom: item.humfrom,
                                    humto: item.humto,
                                    from: item.from,
                                    to: item.to,
                                    counts: item.counts
                                });
                            }
                        }
                    } else {
                        console.error("Missing 'from' property in entry.optimizers.list[0]", entry.optimizers.list[0]);
                    }
                } else {
                    console.error("Missing optimizers or list in entry: ", entry);
                }
            }
            // Insert all records at once using insertMany
            if (optimizerRecords.length > 0) {
                // console.log(JSON.stringify(optimizerRecords));

                await OptimizerAgg.insertMany(optimizerRecords);

                console.log("All optimizer data inserted successfully!");
            } else {
                console.log("No optimizer data to insert.");
            }
        } catch (error) {
            console.log(error);
        }
    })


    //Record from optimizerlogs

    async function findonoffRecord(startTime, endTime) {
        try {


            const threeHoursAgo = new Date(new Date().getTime() - 3 * 60 * 60 * 1000); // 3 hours ago
            const currentTime = new Date(); // Current time


            const pipeline = [
                {
                    $match: {
                        createdAt: {
                            $gt: threeHoursAgo,
                            $lt: currentTime
                        }

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
                            oid: "$OptimizerID",
                            gid: "$GatewayID"
                        },
                        activities: {
                            $push: {
                                oid: "$OptimizerID",
                                gid: "$GatewayID",
                                compstatus: {
                                    $ifNull: ["$CompStatus", "--"]
                                },
                                rtemp: "$RoomTemperature",
                                ctemp: "$CoilTemperature",
                                hum: "$Humidity",
                                optmode: "$OptimizerMode",
                                acstatus: "$DeviceStatus",
                                time: {
                                    $toLong: "$TimeStamp"
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        activitiesWithIndexes: {
                            $reduce: {
                                input: {
                                    $map: {
                                        input: {
                                            $range: [
                                                0,
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
                                            previousIndex: {
                                                $cond: {
                                                    if: {
                                                        $gt: ["$$idx", 0]
                                                    },
                                                    then: {
                                                        $subtract: ["$$idx", 1]
                                                    },
                                                    else: -1
                                                }
                                            },
                                            index: "$$idx"
                                        }
                                    }
                                },
                                initialValue: {
                                    list: [],
                                    previous: null
                                },
                                in: {
                                    list: {
                                        $concatArrays: [
                                            "$$value.list",
                                            [
                                                {
                                                    current: "$$this.current",
                                                    previous: {
                                                        $cond: {
                                                            if: {
                                                                $ne: [
                                                                    "$$this.previousIndex",
                                                                    -1
                                                                ]
                                                            },
                                                            then: {
                                                                $arrayElemAt: [
                                                                    "$activities",
                                                                    "$$this.previousIndex"
                                                                ]
                                                            },
                                                            else: null
                                                        }
                                                    },
                                                    index: "$$this.index"
                                                }
                                            ]
                                        ]
                                    },
                                    previous: "$$this.current"
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        firstOccurrences: {
                            $reduce: {
                                input: "$activitiesWithIndexes.list",
                                initialValue: [],
                                in: {
                                    $let: {
                                        vars: {
                                            isFirstInSequence: {
                                                $or: [
                                                    {
                                                        $eq: [
                                                            "$$this.previous",
                                                            null
                                                        ]
                                                    },
                                                    {
                                                        $or: [
                                                            {
                                                                $ne: [
                                                                    "$$this.current.compstatus",
                                                                    "$$this.previous.compstatus"
                                                                ]
                                                            },
                                                            {
                                                                $ne: [
                                                                    "$$this.current.optmode",
                                                                    "$$this.previous.optmode"
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                ]
                                            },
                                            isLast: {
                                                $cond: {
                                                    if: {
                                                        $eq: [
                                                            "$$this.index",
                                                            {
                                                                $subtract: [
                                                                    {
                                                                        $size:
                                                                            "$activitiesWithIndexes.list"
                                                                    },
                                                                    1
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    then: true,
                                                    else: false
                                                }
                                            }
                                        },
                                        in: {
                                            $cond: {
                                                if: "$$isFirstInSequence",
                                                then: {
                                                    $concatArrays: [
                                                        "$$value",
                                                        [
                                                            {
                                                                compstatus:
                                                                    "$$this.previous.compstatus",
                                                                optmode:
                                                                    "$$this.previous.optmode",
                                                                acstatus:
                                                                    "$$this.previous.acstatus",
                                                                time: "$$this.previous.time",
                                                                rtemp:
                                                                    "$$this.previous.rtemp",
                                                                ctemp:
                                                                    "$$this.previous.ctemp",
                                                                hum: "$$this.previous.hum",
                                                                oid: "$_id.oid",
                                                                gid: "$_id.gid",
                                                                index: "$$this.index"
                                                            },
                                                            {
                                                                compstatus:
                                                                    "$$this.current.compstatus",
                                                                optmode:
                                                                    "$$this.current.optmode",
                                                                acstatus:
                                                                    "$$this.current.acstatus",
                                                                time: "$$this.current.time",
                                                                rtemp:
                                                                    "$$this.current.rtemp",
                                                                ctemp:
                                                                    "$$this.current.rtemp",
                                                                hum: "$$this.current.hum",
                                                                oid: "$_id.oid",
                                                                gid: "$_id.gid",
                                                                index: "$$this.index"
                                                            }
                                                        ]
                                                    ]
                                                },
                                                else: {
                                                    $cond: {
                                                        if: "$$isLast",
                                                        then: {
                                                            $concatArrays: [
                                                                "$$value",
                                                                [
                                                                    {
                                                                        compstatus:
                                                                            "$$this.current.compstatus",
                                                                        optmode:
                                                                            "$$this.current.optmode",
                                                                        acstatus:
                                                                            "$$this.current.acstatus",
                                                                        time: "$$this.current.time",
                                                                        rtemp:
                                                                            "$$this.current.rtemp",
                                                                        ctemp:
                                                                            "$$this.current.rtemp",
                                                                        hum: "$$this.current.hum",
                                                                        oid: "$_id.oid",
                                                                        gid: "$_id.gid",
                                                                        index:
                                                                            "$$this.index"
                                                                    }
                                                                ]
                                                            ]
                                                        },
                                                        else: "$$value"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        name: 1,
                        optimizers: {
                            $reduce: {
                                input: "$firstOccurrences",
                                initialValue: {
                                    list: [],
                                    previous: null
                                },
                                in: {
                                    list: {
                                        $cond: {
                                            if: {
                                                $and: [
                                                    {
                                                        $ne: [
                                                            "$$value.previous",
                                                            null
                                                        ]
                                                    },
                                                    {
                                                        $eq: [
                                                            "$$value.previous.compstatus",
                                                            "$$this.compstatus"
                                                        ]
                                                    },
                                                    {
                                                        $eq: [
                                                            "$$value.previous.optmode",
                                                            "$$this.optmode"
                                                        ]
                                                    },
                                                    {
                                                        $eq: [
                                                            "$$value.previous.acstatus",
                                                            "$$this.acstatus"
                                                        ]
                                                    }
                                                ]
                                            },
                                            then: {
                                                $concatArrays: [
                                                    "$$value.list",
                                                    [
                                                        {
                                                            oid: "$$value.previous.oid",
                                                            gid: "$$value.previous.gid",
                                                            compstatus:
                                                                "$$value.previous.compstatus",
                                                            optmode:
                                                                "$$value.previous.optmode",
                                                            acstatus:
                                                                "$$value.previous.acstatus",
                                                            rtempfrom:
                                                                "$$value.previous.rtemp",
                                                            rtempto: "$$this.rtemp",
                                                            ctempfrom:
                                                                "$$value.previous.ctemp",
                                                            ctempto: "$$this.ctemp",
                                                            humfrom:
                                                                "$$value.previous.hum",
                                                            humto: "$$this.hum",
                                                            from: "$$value.previous.time",
                                                            to: {
                                                                $ifNull: [
                                                                    "$$this.time",
                                                                    0
                                                                ]
                                                            },
                                                            counts: {
                                                                $subtract: [
                                                                    "$$this.index",
                                                                    "$$value.previous.index"
                                                                ]
                                                            }
                                                        }
                                                    ]
                                                ]
                                            },
                                            else: "$$value.list"
                                        }
                                    },
                                    previous: "$$this"
                                }
                            }
                        }
                    }
                }
            ];

            const latestRecords = await OptimizerLogModel.aggregate(pipeline).exec();


            return latestRecords;
        } catch (error) {
            console.log({ error });
        }
    }
}