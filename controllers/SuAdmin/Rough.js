exports.UsageTrends = async (req, res) => {
    const { enterprise_id, state_id, location_id, gateway_id, Optimizerid, startDate, endDate, Interval } = req.body;
    const INTERVAL_IN_SEC = TREND_INTERVAL_ARRAY[Interval];

    if (!enterprise_id) {
        return res.status(400).json({
            success: false,
            message: 'enterprise_id is required'
        });
    }

    try {
        // Fetch the Enterprise based on enterprise_id
        const Enterprise = await EnterpriseModel.findOne({ _id: enterprise_id });
        if (!Enterprise) {
            return res.status(404).json({
                success: false,
                message: 'Enterprise not found'
            });
        }

        // Prepare the query for EnterpriseStateModel based on state_id and enterprise_id
        const enterpriseStateQuery = {
            Enterprise_ID: Enterprise._id,
            ...(state_id && { State_ID: state_id })
        };

        // Fetch the states
        const EntStates = await EnterpriseStateModel.find(enterpriseStateQuery);
        if (EntStates.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'States not found'
            });
        }
        const stateIds = EntStates.map(state => state.State_ID);

        // Prepare the query for EnterpriseStateLocationModel based on stateIds and optional location_id
        const locationQuery = {
            State_ID: { $in: stateIds },
            Enterprise_ID: enterprise_id,
            ...(location_id && { _id: location_id })
        };

        // Fetch the locations
        const locations = await EnterpriseStateLocationModel.find(locationQuery);
        if (locations.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Locations not found'
            });
        }
        const locationIds = locations.map(location => location._id);

        // Prepare the query for GatewayModel based on locationIds and optional gateway_id
        const gatewayQuery = {
            EnterpriseInfo: { $in: locationIds },
            ...(gateway_id && { GatewayID: gateway_id })
        };

        // Fetch the gateways
        const Gateways = await GatewayModel.find(gatewayQuery);
        if (Gateways.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Gateways not found'
            });
        }
        const GatewayIds = Gateways.map(gateway => gateway._id);

        // Prepare the query for OptimizerModel based on GatewayIds and optional Optimizerid
        const optimizerQuery = {
            GatewayId: { $in: GatewayIds },
            ...(Optimizerid && { OptimizerID: Optimizerid })
        };

        // Fetch the optimizers
        const optimizers = await OptimizerModel.find(optimizerQuery);
        if (optimizers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Optimizers not found'
            });
        }
        const optimizerIds = optimizers.map(optimizer => optimizer.OptimizerID);

        let startIstTimestamp = istToTimestamp(startDate) / 1000;
        let endIstTimestamp = istToTimestamp(endDate) / 1000;

        let istOffsetSeconds = 5.5 * 60 * 60; // Offset for IST in seconds

        let currentStart = new Date(startIstTimestamp * 1000);
        let currentEnd;

        let data = [];

        while (currentStart.getTime() / 1000 <= endIstTimestamp) {
            switch (Interval) {
                case "Day":
                    currentEnd = new Date(currentStart);
                    currentEnd.setUTCHours(23, 59, 59, 999);
                    break;
                case "Week":
                    currentEnd = new Date(currentStart);
                    currentEnd.setUTCDate(currentStart.getUTCDate() + 6);
                    currentEnd.setUTCHours(23, 59, 59, 999);
                    break;
                case "Month":
                    currentEnd = new Date(currentStart);
                    currentEnd.setUTCMonth(currentStart.getUTCMonth() + 1);
                    currentEnd.setUTCDate(0); // Set to the last day of the previous month
                    currentEnd.setUTCHours(23, 59, 59, 999);
                    break;
                case "Year":
                    currentEnd = new Date(currentStart);
                    currentEnd.setUTCFullYear(currentStart.getUTCFullYear() + 1);
                    currentEnd.setUTCDate(0); // Set to the last day of the previous year
                    currentEnd.setUTCHours(23, 59, 59, 999);
                    break;
            }

            let startIstTimestampInterval = Math.floor(currentStart.getTime() / 1000);
            let endIstTimestampInterval = Math.min(Math.floor(currentEnd.getTime() / 1000), endIstTimestamp);

            let startIstTimestampUTC = startIstTimestampInterval - istOffsetSeconds;
            let endIstTimestampUTC = endIstTimestampInterval - istOffsetSeconds;

            for (let i = 0; i < optimizerIds.length; i++) {
                const Optimizerid = optimizerIds[i];
                const pipeline = [
                    {
                        $match: {
                            OptimizerID: Optimizerid,
                            TimeStamp: { $gte: startIstTimestampUTC.toString(), $lte: endIstTimestampUTC.toString() }
                        }
                    },
                    { $sort: { TimeStamp: 1 } },
                    {
                        $addFields: {
                            TimeStamp: { $toLong: '$TimeStamp' }
                        }
                    },
                    {
                        $group: {
                            _id: Optimizerid,
                            entries: { $push: '$$ROOT' }
                        }
                    },
                    {
                        $project: {
                            ThermostatCutoffTimes: {
                                $reduce: {
                                    input: '$entries',
                                    initialValue: { previous: null, result: [] },
                                    in: {
                                        previous: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $or: [{ $eq: ['$$this.CompStatus', 'COMPOFF'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+THRMO'] }] },
                                                        { $or: [{ $eq: ['$$this.OptimizationMode', 'NON-OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', 'OPTIMIZATION'] }] }
                                                    ]
                                                },
                                                '$$this',
                                                {
                                                    $cond: [
                                                        {
                                                            $and: [
                                                                { $or: [{ $eq: ['$$this.CompStatus', 'COMPON'] }, { $eq: ['$$this.CompStatus', '--'] }] },
                                                                { $ne: ['$$value.previous', null] }
                                                            ]
                                                        },
                                                        null,
                                                        '$$value.previous'
                                                    ]
                                                }
                                            ]
                                        },
                                        result: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $or: [{ $eq: ['$$this.CompStatus', 'COMPON'] }, { $eq: ['$$this.CompStatus', '--'] }] },
                                                        { $or: [{ $eq: ['$$this.OptimizationMode', 'NON-OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', 'OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', '--'] }] },
                                                        { $ne: ['$$value.previous', null] }
                                                    ]
                                                },
                                                {
                                                    $concatArrays: [
                                                        '$$value.result',
                                                        [{
                                                            cutoffTimeThrm: { $subtract: ['$$this.TimeStamp', '$$value.previous.TimeStamp'] },
                                                            timestamp: '$$this.TimeStamp'
                                                        }]
                                                    ]
                                                },
                                                '$$value.result'
                                            ]
                                        }
                                    }
                                }
                            },
                            DeviceCutoffTimes: {
                                $reduce: {
                                    input: '$entries',
                                    initialValue: { previous: null, result: [] },
                                    in: {
                                        previous: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $eq: ['$$this.CompStatus', 'COMPOFF+OPT'] },
                                                        { $eq: ['$$this.OptimizationMode', 'OPTIMIZATION'] }
                                                    ]
                                                },
                                                '$$this',
                                                {
                                                    $cond: [
                                                        {
                                                            $and: [
                                                                { $or: [{ $eq: ['$$this.CompStatus', 'COMPON'] }, { $eq: ['$$this.CompStatus', '--'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+THRMO'] }] },
                                                                { $ne: ['$$value.previous', null] }
                                                            ]
                                                        },
                                                        null,
                                                        '$$value.previous'
                                                    ]
                                                }
                                            ]
                                        },
                                        result: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $or: [{ $eq: ['$$this.CompStatus', 'COMPON'] }, { $eq: ['$$this.CompStatus', '--'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+THRMO'] }] },
                                                        { $or: [{ $eq: ['$$this.OptimizationMode', 'NON-OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', 'OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', '--'] }] },
                                                        { $ne: ['$$value.previous', null] }
                                                    ]
                                                },
                                                {
                                                    $concatArrays: [
                                                        '$$value.result',
                                                        [{
                                                            cutoffTimeDev: { $subtract: ['$$this.TimeStamp', '$$value.previous.TimeStamp'] },
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
                ];

                const results = await DataRecordModel.aggregate(pipeline);
                data.push(...results);

                if (Interval === "Day") {
                    const newPipeline = [
                        {
                            $match: {
                                OptimizerID: Optimizerid,
                                TimeStamp: { $gte: startIstTimestampUTC.toString(), $lte: endIstTimestampUTC.toString() }
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    $dateToString: {
                                        format: "%Y-%m-%d",
                                        date: {
                                            $add: [
                                                new Date(0),
                                                { $multiply: [{ $toLong: "$TimeStamp" }, 1000] }
                                            ]
                                        },
                                        timezone: "Asia/Kolkata"
                                    }
                                },
                                data: { $push: "$$ROOT" }
                            }
                        },
                        {
                            $addFields: {
                                TimeStamp: { $toLong: "$TimeStamp" }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                Date: "$_id",
                                ThermostatCutoffTimes: {
                                    $filter: {
                                        input: "$data",
                                        as: "entry",
                                        cond: {
                                            $and: [
                                                { $or: [{ $eq: ["$$entry.CompStatus", "COMPOFF"] }, { $eq: ["$$entry.CompStatus", "COMPOFF+THRMO"] }] },
                                                { $or: [{ $eq: ["$$entry.OptimizationMode", "NON-OPTIMIZATION"] }, { $eq: ["$$entry.OptimizationMode", "OPTIMIZATION"] }] }
                                            ]
                                        }
                                    }
                                },
                                DeviceCutoffTimes: {
                                    $filter: {
                                        input: "$data",
                                        as: "entry",
                                        cond: {
                                            $and: [
                                                { $eq: ["$$entry.CompStatus", "COMPOFF+OPT"] },
                                                { $eq: ["$$entry.OptimizationMode", "OPTIMIZATION"] }
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    ];
                    const newResults = await DataRecordModel.aggregate(newPipeline);
                    data.push(...newResults);
                }
            }

            switch (Interval) {
                case "Day":
                    currentStart.setUTCDate(currentStart.getUTCDate() + 1);
                    break;
                case "Week":
                    currentStart.setUTCDate(currentStart.getUTCDate() + 7);
                    break;
                case "Month":
                    currentStart.setUTCMonth(currentStart.getUTCMonth() + 1);
                    break;
                case "Year":
                    currentStart.setUTCFullYear(currentStart.getUTCFullYear() + 1);
                    break;
            }
        }

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// const newPipeline = [
//     {
//         $match: {
//             OptimizerID: Optimizerid,
//             TimeStamp: { $gte: startIstTimestampUTC.toString(), $lte: endIstTimestampUTC.toString() }
//         }
//     },
//     { $sort: { TimeStamp: 1 } },
//     {
//         $addFields: {
//             TimeStamp: { $toLong: '$TimeStamp' }
//         }
//     },
//     {
//         $group: {
//             _id: Optimizerid,
//             entries: { $push: '$$ROOT' }
//         }
//     },
//     {
//         $project: {
//             ACCutoffTimes: {
//                 $reduce: {
//                     input: '$entries',
//                     initialValue: { previous: null, result: [], expectingNextOn: true },
//                     in: {
//                         previous: {
//                             $cond: [
//                                 {
//                                     $and: [
//                                         { $eq: ['$$this.ACStatus', 'ON'] },
//                                         '$$value.expectingNextOn',
//                                         { $eq: ['$$value.previous', null] }
//                                     ]
//                                 },
//                                 '$$this',
//                                 {
//                                     $cond: [
//                                         { $eq: ['$$this.ACStatus', 'OFF'] },
//                                         null,
//                                         '$$value.previous'
//                                     ]
//                                 }
//                             ]
//                         },
//                         expectingNextOn: {
//                             $cond: [
//                                 { $eq: ['$$this.ACStatus', 'OFF'] },
//                                 true,
//                                 { $cond: [{ $eq: ['$$this.ACStatus', 'ON'] }, false, '$$value.expectingNextOn'] }
//                             ]
//                         },
//                         result: {
//                             $cond: [
//                                 {
//                                     $and: [
//                                         { $eq: ['$$this.ACStatus', 'OFF'] },
//                                         { $ne: ['$$value.previous', null] },
//                                         { $eq: ['$$value.previous.ACStatus', 'ON'] }
//                                     ]
//                                 },
//                                 {
//                                     $concatArrays: [
//                                         '$$value.result',
//                                         [{
//                                             ACOnTime: '$$value.previous.TimeStamp',
//                                             ACOffTime: '$$this.TimeStamp'
//                                         }]
//                                     ]
//                                 },
//                                 '$$value.result'
//                             ]
//                         }
//                     }
//                 }
//             }
//         }
//     },
//     {
//         $project: {
//             ACCutoffTimes: '$ACCutoffTimes.result'
//         }
//     }
// ];

// const newPD =  await  PipelineData(newPipeline);