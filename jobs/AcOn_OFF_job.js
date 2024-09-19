
const OptimizerAgg = require('../models/Optimizersagg');
const OptimizerOnOff = require('../models/OptimizerOnOff');
const mongoose = require('mongoose');
const moment = require('moment');

module.exports = function (agenda) {
    agenda.define('AC_ON_OFF_JOB', async (job) => {
        try {
            const latestRecord = await findonoffRecord();

            // Function to get the last record for the given `oid` (optimizerId)
            const getLastRecordForOptimizer = async (optimizerId) => {
                return await OptimizerOnOff.findOne({ optimizerId })
                    .sort({ endtime: -1 }) // Sort by endtime in descending order to get the most recent record
                    .exec();
            };

            // Function to determine acstatus based on compstatus
            const determineAcStatus = (compstatus) => {
                return compstatus === "COMPOFF" || compstatus === "--" ? 'OFF' : 'ON';
            };

            for (let entry of latestRecord) {
                const { firstOccurrences } = entry;
                for (let occurance of firstOccurrences) {
                    const optimizerId = occurance.oid;
                    const lastRecord = await getLastRecordForOptimizer(optimizerId);
                    // Determine the acstatus based on compstatus
                    const newacstatus = determineAcStatus(occurance.compstatus);

                    if (!lastRecord) {
                        // Construct new record data from `occurrence`
                        const newRecord = {
                            optimizerId,
                            starttime: occurance.from, // Assuming 'from' is the starttime
                            endtime: null,     // Assuming 'to' is the endtime
                            acstatus: newacstatus, // Assuming 'compstatus' is equivalent to acstatus
                            lastmsgtime: occurance.from
                        };
                        // Insert the new record into the database
                        await OptimizerOnOff.create(newRecord);
                        console.log(`New record inserted for optimizer ${optimizerId}:`, newRecord);
                    } else if (lastRecord.acstatus === newacstatus) {

                        await OptimizerOnOff.updateOne(
                            { _id: lastRecord._id }, // Find the specific last record by its ID
                            { $set: { lastmsgtime: occurance.from } } // Update lastmsgtime field
                        );
                        console.log(`Lastmsgtime updated for optimizer ${optimizerId}`);
                    } else {
                        if ((newacstatus === 'OFF' || newacstatus === 'ON') && lastRecord.acstatus === "ON") {
                            if (occurance.from - lastRecord.starttime <= 1200) {
                                // Skip to the next iteration
                                continue;
                            } else if (occurance.from - lastRecord.starttime > 1200) {
                                await OptimizerOnOff.updateOne(
                                    { _id: lastRecord._id }, // Find the specific last record by its ID
                                    { $set: { endtime: (occurance.from - 1200) } } // Update endtime field
                                );
                                console.log(`endtime updated for optimizer ${optimizerId}`);

                                const newRecord = {
                                    optimizerId,
                                    starttime: (occurance.from - 1200), // Assuming 'from' is the starttime
                                    endtime: null,     // Assuming 'to' is the endtime
                                    acstatus: newacstatus, // Assuming 'compstatus' is equivalent to acstatus
                                    lastmsgtime: occurance.from
                                };
                                // Insert the new record into the database
                                await OptimizerOnOff.create(newRecord);
                                console.log(`New record inserted for optimizer ${optimizerId}:`, newRecord);

                            }
                        } else if (newacstatus === 'ON' && (lastRecord.acstatus === "--" || lastRecord.acstatus === "OFF")) {
                            await OptimizerOnOff.updateOne(
                                { _id: lastRecord._id }, // Find the specific last record by its ID
                                { $set: { endtime: (occurance.from - 180) } } // Update endtime field
                            );
                            console.log(`endtime updated for optimizer ${optimizerId}`);

                            const newRecord = {
                                optimizerId,
                                starttime: (occurance.from - 180), // Assuming 'from' is the starttime
                                endtime: null,     // Assuming 'to' is the endtime
                                acstatus: newacstatus, // Assuming 'compstatus' is equivalent to acstatus
                                lastmsgtime: occurance.from
                            };
                            // Insert the new record into the database
                            await OptimizerOnOff.create(newRecord);
                            console.log(`New record inserted for optimizer ${optimizerId}:`, newRecord);
                        }
                    }
                }
            }


        } catch (error) {
            console.log(error);
        }
    })

    async function findonoffRecord() {
        try {
            const threeHoursAgo = new Date(new Date().getTime() - 30 * 60 * 60 * 1000); // 3 hours ago
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

                { $sort: { to: 1 } },
                {
                    $group: {
                        _id: {
                            oid: "$oid",
                            gid: "$gid"
                        },
                        activities: {
                            $push: {
                                oid: "$oid",
                                gid: "$gid",
                                compstatus: {
                                    $cond: {
                                        if: {
                                            $or: [
                                                {
                                                    $eq: [
                                                        "$compStatus",
                                                        "COMPOFF"
                                                    ]
                                                },
                                                {
                                                    $eq: [
                                                        "$compStatus",
                                                        "COMPOFF+OPT"
                                                    ]
                                                },
                                                {
                                                    $eq: [
                                                        "$compStatus",
                                                        "COMPOFF+THERM"
                                                    ]
                                                }
                                            ]
                                        },
                                        then: "COMPOFF",
                                        else: "$compStatus"
                                    }
                                },

                                time: "$to"
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
                                                { $size: "$activities" }
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
                                                    if: { $gt: ["$$idx", 0] },
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
                                                $and: [
                                                    {
                                                        $ne: [
                                                            "$$this.previous",
                                                            null
                                                        ]
                                                    },
                                                    {
                                                        $ne: [
                                                            "$$this.current.compstatus",
                                                            "$$this.previous.compstatus"
                                                        ]
                                                    }
                                                ]
                                            },
                                            isOne: {
                                                $eq: [
                                                    {
                                                        $size:
                                                            "$activitiesWithIndexes.list"
                                                    },
                                                    1
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
                                                    $cond: {
                                                        if: "$$isLast",
                                                        then: {
                                                            $concatArrays: [
                                                                "$$value",
                                                                [
                                                                    {
                                                                        pcompstatus:
                                                                            "$$this.previous.compstatus",
                                                                        compstatus:
                                                                            "$$this.current.compstatus",
                                                                        from: "$$this.previous.time",
                                                                        to: "$$this.current.time",
                                                                        oid: "$_id.oid",
                                                                        gid: "$_id.gid",
                                                                        index:
                                                                            "$$this.index",
                                                                        last: "$$isLast"
                                                                    },
                                                                    {
                                                                        compstatus:
                                                                            "$$this.current.compstatus",
                                                                        from: "$$this.current.time",
                                                                        to: "$$this.current.time",
                                                                        oid: "$_id.oid",
                                                                        gid: "$_id.gid",
                                                                        index:
                                                                            "$$this.index",
                                                                        last: "$$isLast"
                                                                    }
                                                                ]
                                                            ]
                                                        },
                                                        else: {
                                                            $concatArrays: [
                                                                "$$value",
                                                                [
                                                                    {
                                                                        pcompstatus:
                                                                            "$$this.previous.compstatus",
                                                                        compstatus:
                                                                            "$$this.current.compstatus",
                                                                        from: "$$this.previous.time",
                                                                        to: "$$this.current.time",
                                                                        oid: "$_id.oid",
                                                                        gid: "$_id.gid",
                                                                        index:
                                                                            "$$this.index",
                                                                        last: "$$isLast"
                                                                    }
                                                                ]
                                                            ]
                                                        }
                                                    }
                                                },
                                                else: {
                                                    $cond: {
                                                        if: "$$isOne",
                                                        then: {
                                                            $concatArrays: [
                                                                "$$value",
                                                                [
                                                                    {
                                                                        pcompstatus:
                                                                            "$$this.current.compstatus",
                                                                        compstatus:
                                                                            "$$this.current.compstatus",
                                                                        from: "$$this.current.time",
                                                                        to: "$$this.current.time",
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
                }
            ]
            const latestRecords = await OptimizerAgg.aggregate(pipeline).exec();
            return latestRecords;
        } catch (error) {
            console.log({ error });


        }
    }
}