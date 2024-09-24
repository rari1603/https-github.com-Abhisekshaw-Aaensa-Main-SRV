
const OptimizerLogModel = require('../models/OptimizerLog.model');
const OptimizerAgg = require('../models/Optimizersagg');
const mongoose = require('mongoose');
const moment = require('moment');

module.exports = function (agenda) {
    agenda.define('Optimizer_Agg_job', async (job) => {
        try {
            // console.log("this is optimizer_Agg===========");
            // return;
            // await runAggregationInIntervals(); // Run the aggregation and handle inserts
            const latestRecord = await findonoffRecord();

            const optimizerRecords = [];
            latestRecord.map(entry => {
                entry.optimizers.list.map(item => {
                    optimizerRecords.push({
                        oid: item.oid,
                        gid: item.gid,
                        compStatus: item.compStatus,
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

                })
            })
            // Insert all records at once using insertMany
            if (optimizerRecords.length > 0) {
                await OptimizerAgg.insertMany(optimizerRecords);

                console.log("All optimizer data inserted successfully!");
            } else {
                console.log("No optimizer data to insert.");
            }
        } catch (error) {
            console.log(error);
        }
    })


    // const runAggregationInIntervals = async () => {
    //     const date = '2023-09-20'; // Specify the target date

    //     const intervals = [
    //         { start: '00:00:00', end: '03:00:00' },
    //         { start: '03:00:00', end: '06:00:00' },
    //         { start: '06:00:00', end: '09:00:00' },
    //         { start: '09:00:00', end: '12:00:00' },
    //         { start: '12:00:00', end: '15:00:00' },
    //         { start: '15:00:00', end: '18:00:00' },
    //         { start: '18:00:00', end: '21:00:00' },
    //         { start: '21:00:00', end: '23:59:59' }
    //     ];

    //     for (const interval of intervals) {
    //         const startTime = `${date}T${interval.start}.000Z`;
    //         const endTime = `${date}T${interval.end}.999Z`;

    //         const results = await findonoffRecord(startTime, endTime);
    //         console.log(`Results for interval ${interval.start} to ${interval.end}:`, results);

    //         // Process and insert records within the same loop
    //         if (results.length > 0) {
    //             const optimizerRecords = [];

    //             results.forEach(entry => {
    //                 entry.optimizers.list.forEach(item => {
    //                     optimizerRecords.push({
    //                         oid: item.oid,
    //                         gid: item.gid,
    //                         compStatus: item.compStatus,
    //                         optmode: item.optmode,
    //                         acstatus: item.acstatus,
    //                         rtempfrom: item.rtempfrom,
    //                         rtempto: item.rtempto,
    //                         ctempfrom: item.ctempfrom,
    //                         ctempto: item.ctempto,
    //                         humfrom: item.humfrom,
    //                         humto: item.humto,
    //                         from: item.from,
    //                         to: item.to,
    //                         counts: item.counts
    //                     });
    //                 });
    //             });

    //             // Insert records in bulk for each interval
    //             if (optimizerRecords.length > 0) {
    //                 // await OptimizerAgg.insertMany(optimizerRecords);
    //                 console.log(`Optimizer data for ${interval.start} to ${interval.end} inserted successfully!`);
    //             } else {
    //                 console.log(`No optimizer data to insert for ${interval.start} to ${interval.end}.`);
    //             }
    //         }
    //     }
    // };

    async function findonoffRecord() {
        try {

            // console.log({ startTime });
            // console.log({ endTime });

            const threeHoursAgo = new Date(new Date().getTime() - 3 * 60 * 60 * 1000); // 3 hours ago
            const currentTime = new Date(); // Current time
            const ObjectId = mongoose.Types.ObjectId;
            const pipeline = [
                {
                    $match: {
                        // OptimizerID: new ObjectId("6697d070dcf2f4839149aef2"),
                        // GatewayID: new ObjectId("66ed1e8f14c36cb6547a410d"),
                        createdAt: {

                            $gt: threeHoursAgo,
                            // $lt: currentTime
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
                                compStatus: {
                                    $ifNull: ["$CompStatus", "--"]
                                },
                                rtemp: "$RoomTemperature",
                                ctemp: "$CoilTemperature",
                                hum: "$Humidity",
                                optmode: "$OptimizerMode",
                                acstatus: "$DeviceStatus",
                                time: "$TimeStamp"

                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        firstOccurrences: {
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
                                            previous: {
                                                $cond: {
                                                    if: {
                                                        $eq: ["$$idx", 0]
                                                    },
                                                    then: null,
                                                    else: {
                                                        $arrayElemAt: [
                                                            "$activities",
                                                            {
                                                                $subtract: ["$$idx", 1]
                                                            }
                                                        ]
                                                    }
                                                }
                                            },
                                            index: "$$idx"
                                        }
                                    }
                                },
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
                                                                    "$$this.current.compStatus",
                                                                    "$$this.previous.compStatus"
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
                                                                        $size: "$activities"
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
                                                                compStatus:
                                                                    "$$this.previous.compStatus",
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
                                                                compStatus:
                                                                    "$$this.current.compStatus",
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
                                                                        compStatus:
                                                                            "$$this.current.compStatus",
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
                                    previous: null,
                                    index: -1
                                },
                                in: {
                                    $let: {
                                        vars: {
                                            current: "$$this",
                                            previousRow: "$$value.previous",
                                            currentIndex: {
                                                $add: ["$$value.index", 1]
                                            }
                                        },
                                        in: {
                                            list: {
                                                $cond: {
                                                    if: {
                                                        $and: [
                                                            {
                                                                $gt: [
                                                                    "$$currentIndex",
                                                                    1
                                                                ]
                                                            },
                                                            {
                                                                $eq: [
                                                                    "$$previousRow.compStatus",
                                                                    "$$current.compStatus"
                                                                ]
                                                            },
                                                            {
                                                                $eq: [
                                                                    "$$previousRow.optmode",
                                                                    "$$current.optmode"
                                                                ]
                                                            },
                                                            {
                                                                $eq: [
                                                                    "$$previousRow.acstatus",
                                                                    "$$current.acstatus"
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    then: {
                                                        $concatArrays: [
                                                            "$$value.list",
                                                            [
                                                                {
                                                                    oid: "$$previousRow.oid",
                                                                    gid: "$$previousRow.gid",
                                                                    compStatus:
                                                                        "$$previousRow.compStatus",
                                                                    optmode:
                                                                        "$$previousRow.optmode",
                                                                    acstatus:
                                                                        "$$previousRow.acstatus",
                                                                    rtempfrom:
                                                                        "$$previousRow.rtemp",
                                                                    rtempto:
                                                                        "$$current.rtemp",
                                                                    ctempfrom:
                                                                        "$$previousRow.ctemp",
                                                                    ctempto:
                                                                        "$$current.ctemp",
                                                                    humfrom:
                                                                        "$$previousRow.hum",
                                                                    humto:
                                                                        "$$current.hum",
                                                                    from: "$$previousRow.time",
                                                                    to: {
                                                                        $ifNull: [
                                                                            "$$current.time",
                                                                            0
                                                                        ]
                                                                    },
                                                                    counts: {
                                                                        $subtract: [
                                                                            "$$current.index",
                                                                            "$$previousRow.index"
                                                                        ]
                                                                    }
                                                                }
                                                            ]
                                                        ]
                                                    },
                                                    else: "$$value.list"
                                                }
                                            },
                                            previous: "$$current",
                                            index: "$$currentIndex"
                                        }
                                    }
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