const TREND_INTERVAL_ARRAY = {
  "Actual": '--',
  "Day": 1 * 24 * 60 * 60,
  "Week": 7 * 24 * 60 * 60,
  "Month": 30 * 24 * 60 * 60,
  "Year": 365 * 24 * 60 * 60
};

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
      const Enterprise = await EnterpriseModel.findOne({ _id: enterprise_id });
      if (!Enterprise) {
          return res.status(404).json({
              success: false,
              message: 'Enterprise not found'
          });
      }

      const enterpriseStateQuery = {
          Enterprise_ID: Enterprise._id,
          ...(state_id && { State_ID: state_id })
      };

      const EntStates = await EnterpriseStateModel.find(enterpriseStateQuery);
      if (EntStates.length === 0) {
          return res.status(404).json({
              success: false,
              message: 'States not found'
          });
      }
      const stateIds = EntStates.map(state => state.State_ID);

      const locationQuery = {
          State_ID: { $in: stateIds },
          Enterprise_ID: enterprise_id,
          ...(location_id && { _id: location_id })
      };

      const locations = await EnterpriseStateLocationModel.find(locationQuery);
      if (locations.length === 0) {
          return res.status(404).json({
              success: false,
              message: 'Locations not found'
          });
      }
      const locationIds = locations.map(location => location._id);

      const gatewayQuery = {
          EnterpriseInfo: { $in: locationIds },
          ...(gateway_id && { GatewayID: gateway_id })
      };

      const Gateways = await GatewayModel.find(gatewayQuery);
      if (Gateways.length === 0) {
          return res.status(404).json({
              success: false,
              message: 'Gateways not found'
          });
      }
      const GatewayIds = Gateways.map(gateway => gateway._id);

      const optimizerQuery = {
          GatewayId: { $in: GatewayIds },
          ...(Optimizerid && { OptimizerID: Optimizerid })
      };

      const optimizers = await OptimizerModel.find(optimizerQuery);
      if (optimizers.length === 0) {
          return res.status(404).json({
              success: false,
              message: 'Optimizers not found'
          });
      }
      const optimizerIds = optimizers.map(optimizer => optimizer.OptimizerID);

      const istOffsetSeconds = 5.5 * 60 * 60;

      let data = [];

      const startTimestamp = new Date(startDate * 1000);
      const endTimestamp = new Date(endDate * 1000);

      let currentStart = new Date(startTimestamp);
      let currentEnd;

      while (currentStart <= endTimestamp) {
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

          let startIstTimestamp = Math.floor(currentStart.getTime() / 1000);
          let endIstTimestamp = Math.min(Math.floor(currentEnd.getTime() / 1000), Math.floor(endTimestamp.getTime() / 1000));

          let startIstTimestampUTC = startIstTimestamp - istOffsetSeconds;
          let endIstTimestampUTC = endIstTimestamp - istOffsetSeconds;

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
                      $set: {
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
                                                          cutoffTimeOpt: { $subtract: ['$$this.TimeStamp', '$$value.previous.TimeStamp'] },
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
                          RemainingRunTimes: {
                              $reduce: {
                                  input: '$entries',
                                  initialValue: { previous: null, result: [] },
                                  in: {
                                      previous: {
                                          $cond: [
                                              {
                                                  $and: [
                                                      { $eq: ['$$this.CompStatus', 'COMPON'] },
                                                      { $or: [{ $eq: ['$$this.CompStatus', 'COMPON'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+THRMO'] }] }
                                                  ]
                                              },
                                              '$$this',
                                              {
                                                  $cond: [
                                                      {
                                                          $and: [
                                                              { $or: [{ $eq: ['$$this.CompStatus', 'COMPOFF'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+OPT'] }, { $eq: ['$$this.CompStatus', '--'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+THRMO'] }] },
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
                                                      { $or: [{ $eq: ['$$this.CompStatus', 'COMPOFF'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+OPT'] }, { $eq: ['$$this.CompStatus', '--'] }, { $eq: ['$$this.CompStatus', 'COMPOFF+THRMO'] }] },
                                                      { $or: [{ $eq: ['$$this.OptimizationMode', 'NON-OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', 'OPTIMIZATION'] }, { $eq: ['$$this.OptimizationMode', '--'] }] },
                                                      { $ne: ['$$value.previous', null] }
                                                  ]
                                              },
                                              {
                                                  $concatArrays: [
                                                      '$$value.result',
                                                      [{
                                                          RemainingTime: { $subtract: ['$$this.TimeStamp', '$$value.previous.TimeStamp'] },
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
                      }
                  },
                  {
                      $project: {
                          ThermostatCutoffTimes: '$ThermostatCutoffTimes.result',
                          DeviceCutoffTimes: '$DeviceCutoffTimes.result',
                          RemainingRunTimes: '$RemainingRunTimes.result',
                          totalCutoffTimeThrm: { $sum: '$ThermostatCutoffTimes.result.cutoffTimeThrm' },
                          totalCutoffTimeOpt: { $sum: '$DeviceCutoffTimes.result.cutoffTimeOpt' },
                          totalRemainingTime: { $sum: '$RemainingRunTimes.result.RemainingTime' }
                      }
                  }
              ];
              const PD = await PipelineData(pipeline);

              if (PD.length !== 0) {
                  data.push(...PD);
              }
          }

          switch (Interval) {
              case "Day":
                  currentStart.setUTCDate(currentStart.getUTCDate() + 1);
                  currentStart.setUTCHours(0, 0, 0, 0);
                  break;
              case "Week":
                  currentStart.setUTCDate(currentStart.getUTCDate() + 7);
                  currentStart.setUTCHours(0, 0, 0, 0);
                  break;
              case "Month":
                  currentStart.setUTCMonth(currentStart.getUTCMonth() + 1);
                  currentStart.setUTCDate(1);
                  currentStart.setUTCHours(0, 0, 0, 0);
                  break;
              case "Year":
                  currentStart.setUTCFullYear(currentStart.getUTCFullYear() + 1);
                  currentStart.setUTCDate(1);
                  currentStart.setUTCMonth(0);
                  currentStart.setUTCHours(0, 0, 0, 0);
                  break;
          }
      }

      return res.status(200).json({
          success: true,
          data: data
      });
  } catch (error) {
      res.status(500).json({
          success: false,
          message: 'An error occurred while fetching data',
          error: error.message
      });
  }
};

async function PipelineData(pipeline) {
  return await NewApplianceLogModel.aggregate(pipeline);
}

