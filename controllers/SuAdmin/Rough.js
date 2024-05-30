const NewApplianceLogModel = require('../../models/NewApplianceLog.model');
const moment = require('moment-timezone');

// Convert IST date string to a timestamp
function istToTimestamp(dateString) {
  const date = new Date(dateString);
  return date.getTime();
}

exports.UsageTrends = async (req, res) => {
  try {
    const { Optimizerid, startDate, endDate } = req.body;
    const startIstTimestamp = new Date(startDate).getTime() / 1000;
    const endIstTimestamp = new Date(endDate).getTime() / 1000;

    const istOffsetSeconds = 5.5 * 60 * 60; // Offset for IST in seconds
    const startIstTimestampUTC = startIstTimestamp - istOffsetSeconds;
    const endIstTimestampUTC = endIstTimestamp - istOffsetSeconds;

    console.log(startIstTimestampUTC, "---", endIstTimestampUTC, "--", Optimizerid);

    const pipeline = [
      {
        $match: {
          OptimizerID: Optimizerid,
          TimeStamp: { $gte: startIstTimestampUTC.toString(), $lte: endIstTimestampUTC.toString() }
        }
      },
      { $sort: { TimeStamp: 1 } },
      {
        $set: {
          TimeStamp: { $toLong: '$TimeStamp' }
        }
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
                            { $eq: ['$$this.CompStatus', 'COMPON'] },
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
                          cutoffTime: { $subtract: ['$$this.TimeStamp', '$$value.previous.TimeStamp'] },
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

    const result = await NewApplianceLogModel.aggregate(pipeline);

    if (result.length > 0) {
      const { thermostatCutoffTimes } = result[0];

      console.log('Thermostat Cutoff Times:', thermostatCutoffTimes);

      res.status(200).json({
        message: 'Successfully calculated cutoff times',
        thermostatCutoffTimes
      });
    } else {
      res.status(404).json({ message: 'No data found' });
    }

  } catch (error) {
    console.log(error, "ERROR LOG");
    res.status(500).send('Internal Server Error');
  }
};

