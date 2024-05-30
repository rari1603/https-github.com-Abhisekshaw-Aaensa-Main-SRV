const mongoose = require('mongoose');
const NewApplianceLogModel = require('../../models/NewApplianceLog.model');

exports.UsageTrends = async (req, res) => {
    try {
        const { Optimizerid, startDate, endDate } = req.body;
        const startIstTimestamp = new Date(startDate).getTime() / 1000;
        const endIstTimestamp = new Date(endDate).getTime() / 1000;

        const istOffsetSeconds = 5.5 * 60 * 60; // Offset for IST in seconds
        const startIstTimestampUTC = startIstTimestamp - istOffsetSeconds;
        const endIstTimestampUTC = endIstTimestamp - istOffsetSeconds;

        console.log(startIstTimestampUTC, "---", endIstTimestampUTC, "--", Optimizerid);

        const data = await NewApplianceLogModel.aggregate([
            {
                $match: {
                    OptimizerID: Optimizerid,
                    TimeStamp: { $gte: startIstTimestampUTC.toString(), $lte: endIstTimestampUTC.toString() }
                }
            },
            {
                $sort: { TimeStamp: 1 }
            },
            {
                $group: {
                    _id: null,
                    entries: { $push: '$$ROOT' }
                }
            },
            {
                $project: {
                    thermostatCutoffTimes: {
                        $reduce: {
                            input: '$entries',
                            initialValue: { previousCompoff: null, result: [] },
                            in: {
                                previousCompoff: {
                                    $cond: [
                                        {
                                            $and: [
                                                { $or: [ { $eq: ['$$this.CompStatus', 'COMPOFF'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+THRMO'] } ] },
                                                { $or: [ { $eq: ['$$this.OptimizationMode', 'NON-OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', 'OPTIMIZATION'] } ] }
                                            ]
                                        },
                                        '$$this',
                                        '$$value.previousCompoff'
                                    ]
                                },
                                result: {
                                    $cond: [
                                        {
                                            $and: [
                                                { $eq: ['$$this.CompStatus', 'COMPON'] },
                                                { $or: [ { $eq: ['$$this.OptimizationMode', 'NON-OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', 'OPTIMIZATION'] } ] },
                                                { $ne: ['$$value.previousCompoff', null] }
                                            ]
                                        },
                                        {
                                            $concatArrays: [
                                                '$$value.result',
                                                [{
                                                    cutoffTime: { $subtract: [Number('$$this.TimeStamp'), Number('$$value.previousCompoff.TimeStamp')] },
                                                    timestamp: '$$this.TimeStamp'
                                                }]
                                            ]
                                        },
                                        '$$value.result'
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        ]);

        console.log(data[0].thermostatCutoffTimes, "==================");
        res.json(data[0].thermostatCutoffTimes);
    } catch (error) {
        console.log(error, "ERROR LOG");
        res.status(500).send('Internal Server Error');
    }
};



// $cond: [
//     {
//       $and: [
//         {
//           $eq: ['$$this.CompStatus', 'COMPON']
//         },
//         {
//           $eq: ['$$this.OptimizationMode', 'OPTIMIZATION']
//         }
//       ]
//     },
//     '$$this',
//     {
//       $cond: [
//         {
//           $and: [
//             {
//               $eq: ['$$this.CompStatus', 'COMPOFF+THRMO']
//             },
//             {
//               $eq: ['$$this.OptimizationMode', 'OPTIMIZATION']
//             }
//           ]
//         },
//         '$$this',
//         '$$value.previous'
//       ]
//     }
//   ]