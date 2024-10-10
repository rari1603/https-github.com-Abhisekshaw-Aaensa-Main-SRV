
const OptimizerAgg = require('../models/Optimizersagg');
const OptimizerOnOff = require('../models/OptimizerOnOff');
const mongoose = require('mongoose');
const moment = require('moment');
const { json } = require('express');
const util = require('util');
const TIME_TO_CONSIDER_AC_OFF_IN_SEC=1200;
const TIME_TO_CONSIDER_AC_ON_IN_SEC=180;

module.exports = function (agenda) {
  agenda.define('AC_ON_OFF_JOB', async (job) => {
    try {
      // await runAggregationInIntervals();
      // Check when the next execution time is for a specific job
      const nextRunOptAggJob = await agenda.jobs({ name: 'Optimizer_Agg_job' }, { nextRunAt: 1 });
      console.log(nextRunOptAggJob[0].attrs.nextRunAt);
      const startTime = nextRunOptAggJob[0].attrs.lastRunAt;
      const endTime = nextRunOptAggJob[0].attrs.nextRunAt;

      await executeOnOffLogic(startTime, endTime);
      //await executeOnOffLogic(new Date("2024-09-27T17:36:09.000+00:00"), new Date("2024-09-27T17:36:17.958+00:00"));

    } catch (error) {
      console.log(error);
    }
  })  
}

const executeOnOffLogic = async (startTime, endTime) => {  
  console.log("startTime" + startTime + " : endTime:" + endTime)
 // return
  
 
  try {
    const latestRecord = await findonoffRecord(startTime, endTime);
    console.log(JSON.stringify(latestRecord));
    // Function to get the last record for the given `oid` (optimizerId)
    const getLastRecordForOptimizer = async (optimizerId) => {
      return await OptimizerOnOff.findOne({ optimizerId })
        .sort({ createdAt: -1 }) // Sort by createdAt in descending order to get the most recent record
        .exec();
    };
    // Function to determine acstatus based on compstatus
    const determineAcStatus = (compstatus) => {
      return compstatus === "COMPOFF" || compstatus === "--" ? 'OFF' : 'ON';
    };

    for (let entry of latestRecord) {

      const { firstOccurrences } = entry;
      
      let lastRecordStartTime = null;
      let lastRecordAcStatus = null;
      let lastRecordId = null;

      for (let occurance of firstOccurrences) {
        // console.log({ occurance });
        const optimizerId = occurance.oid;
        if(lastRecordId == null){ // first record in the loop processing
          const lastRecord = await getLastRecordForOptimizer(optimizerId);
          lastRecordStartTime = lastRecord? lastRecord.starttime :null;
          lastRecordAcStatus = lastRecord? lastRecord.acstatus: null;
          lastRecordId = lastRecord? lastRecord._id: null;
        }
        //console.log({ lastRecord });

        // Determine the acstatus based on compstatus
        const newacstatus = determineAcStatus(occurance.compstatus);

        if (lastRecordId == null) { // first time processing
          // Construct new record data from `occurrence`
          const newRecord = {
            optimizerId,
            starttime: occurance.from, // Assuming 'from' is the starttime
            endtime: null,     // Assuming 'to' is the endtime
            acstatus: newacstatus, // Assuming 'compstatus' is equivalent to acstatus
            lastmsgtime: occurance.from
          };
          lastRecordAcStatus = newacstatus;
          lastRecordStartTime = occurance.from;
          lastRecordEndTime = occurance.to;
          // Insert the new record into the database
          let newInsertedRecord = await OptimizerOnOff.create(newRecord);
          lastRecordId = newInsertedRecord._id;
          console.log(`New record inserted for optimizer ${optimizerId} with Id ${lastRecordId}`);

        } else if (occurance.from > lastRecordStartTime) { // are we processing a stale record? if yes, ignore and continue
          if (lastRecordAcStatus === newacstatus) { // if the status is the same just update the lastmsgtime and continue
            await OptimizerOnOff.updateOne(
              { _id: lastRecordId }, // Find the specific last record by its ID
              { $set: { lastmsgtime: occurance.from } } // Update lastmsgtime field
            );
            console.log(`Lastmsgtime updated for optimizer ${optimizerId} line50`);
            lastRecordStartTime = occurance.from;
          } else {
            if ((newacstatus === 'OFF' || newacstatus === '--') && lastRecordAcStatus === "ON") { // if ON -> OFF
              if (occurance.to - occurance.from <= TIME_TO_CONSIDER_AC_OFF_IN_SEC) { // if the off transition is too small to consider?
                await OptimizerOnOff.updateOne(
                  { _id: lastRecordId }, // Find the specific last record by its ID
                  { $set: { lastmsgtime: occurance.from } } // Update lastmsgtime field
                );
                // Skip to the next iteration
                continue;
              } else if ((occurance.to - occurance.from) > TIME_TO_CONSIDER_AC_OFF_IN_SEC) { // if the off transition is big enough to consider it as 
                await OptimizerOnOff.updateOne(
                  { _id: lastRecordId }, // Find the specific last record by its ID
                  { $set: { endtime: occurance.from } } // Update endtime field with the new record from
                );
                console.log(`endtime updated for optimizer ${optimizerId}`);

                const newRecord = {
                  optimizerId,
                  starttime: occurance.from, // Assuming 'from' is the starttime
                  endtime: null,     // Assuming 'to' is the endtime
                  acstatus: newacstatus, // Assuming 'compstatus' is equivalent to acstatus
                  lastmsgtime: occurance.from
                };
                // Insert the new record into the database
                let newInsertedRecord = await OptimizerOnOff.create(newRecord);
                lastRecordId = newInsertedRecord._id;
                console.log(`New record inserted for optimizer ${optimizerId} with Id ${lastRecordId}`);

              }
            } else if (newacstatus === 'ON' && (lastRecordAcStatus === "--" || lastRecordAcStatus === "OFF")) { // OFF -> ON
              await OptimizerOnOff.updateOne(
                { _id: lastRecordId }, // Find the specific last record by its ID
                {
                  $set: {
                    endtime: occurance.from - TIME_TO_CONSIDER_AC_ON_IN_SEC, // Update endtime field
                    // lastmsgtime: occurance.from    // Update lastmsgtime field
                  }
                }
              );
              console.log(`endtime updated for optimizer ${optimizerId}`);

              const newRecord = {
                optimizerId,
                starttime: (occurance.from - TIME_TO_CONSIDER_AC_ON_IN_SEC), // Assuming 'from' is the starttime
                endtime: null,     // Assuming 'to' is the endtime
                acstatus: newacstatus, // Assuming 'compstatus' is equivalent to acstatus
                lastmsgtime: occurance.from
              };
              // Insert the new record into the database
              let newInsertedRecord = await OptimizerOnOff.create(newRecord);
              lastRecordId = newInsertedRecord._id;
              console.log(`New record inserted for optimizer ${optimizerId} with Id ${lastRecordId}`);

            }
            lastRecordAcStatus = newacstatus;
            lastRecordStartTime = occurance.from;
          }
        }
    }
    }
    console.log("on off completed");
  } catch (error) {
    console.log(error);
  }
}

async function findonoffRecord(startTime, endTime) {
  try {
    const threeHoursAgo = startTime; // 3 hours ago
    const currentTime = endTime; // Current time
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
          from: 1
        }
      },
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
              from: "$from",
              to: "$to"
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
                                  compstatus:
                                    "$$this.previous.compstatus",
                                  ncompstatus:
                                    "$$this.current.compstatus",
                                  from: "$$this.previous.from",
                                  to: "$$this.current.from",
                                  oid: "$_id.oid",
                                  gid: "$_id.gid",
                                  index:
                                    "$$this.index",
                                  last: "$$isLast"
                                },
                                {
                                  compstatus:
                                    "$$this.current.compstatus",
                                  from: "$$this.current.from",
                                  to: "$$this.current.to",
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
                                  compstatus:
                                    "$$this.previous.compstatus",
                                  ncompstatus:
                                    "$$this.current.compstatus",
                                  from: "$$this.previous.from",
                                  to: "$$this.current.from",
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
                                  compstatus:
                                    "$$this.current.compstatus",
                                  from: "$$this.current.from",
                                  to: "$$this.current.to",
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
    ];
    console.log(util.inspect(pipeline, { showHidden: false, depth: null, colors: true }));
    const latestRecords = await OptimizerAgg.aggregate(pipeline).exec();
    return latestRecords;
  } catch (error) {
    console.log({ error });
  }
}

//       const date = '2024-09-18'; // Specify the target dateoptimizerId
//       const intervals = [
//         { start: '00:00:00', end: '03:00:00' },
//         { start: '03:00:00', end: '06:00:00' },
//         { start: '06:00:00', end: '09:00:00' },
//         { start: '09:00:00', end: '12:00:00' },
//         { start: '12:00:00', end: '15:00:00' },
//         { start: '15:00:00', end: '18:00:00' },
//         { start: '18:00:00', end: '21:00:00' },
//         { start: '21:00:00', end: '23:59:59' }
//       ];
//       for (const interval of intervals) {
//         const startTime = `${date}T${interval.start}.000Z`;
//         const endTime = `${date}T${interval.end}.999Z`;