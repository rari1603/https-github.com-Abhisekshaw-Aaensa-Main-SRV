const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const EnterpriseModel = require('../../models/enterprise.model');
const logger = require('../../configs/pino_logger');

/// API 1: Get the bypass data for enterprises level---
exports.EnterpriseBypassStatus = async (req, res) => {
  logger.info("---------- EnterpriseBypassStatus is running -------");

  try {
    const { enterprise_id } = req.params;
      const bypassData = await EnterpriseModel.aggregate(
        [
          {
            $match: {
              _id: new ObjectId(enterprise_id)
            }
          },
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
            $lookup: {
              from: "optimizerbypasses",
              let: {
                gatewayId: "$gatewayInfo.GatewayID"
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: [
                            "$GatewayID",
                            "$$gatewayId"
                          ]
                        },
                        {
                          $ne: ["$deviceStatus", "inactive"]
                        }
                      ]
                    }
                  }
                }
              ],
              as: "bypassData"
            }
          },
          {
            $unwind: {
              path: "$bypassData"
            }
          },
          {
            $project: {
              _id: 0,
              entepriseId: "$_id",
              enterprisename: "$EnterpriseName",
              state: "$stateInfo.name",
              location:"$locationData.LocationName",
              gatewayId:"$gatewayInfo._id",
              gateway:"$gatewayInfo.GatewayID",
              optimizername:"$optimizerInfo.OptimizerName",
              optimizerId:"$bypassData.OptimizerId",
              bypasstype:"$bypassData.ByPassType",
              starttime:"$bypassData.startTime",
              endtime:"$bypassData.endTime",
              devicestatus:"$bypassData.deviceStatus",
              status:"$bypassData.Status"
            }
          }
        ]);
           // If no bypass data is found, return a 400 response
    if (!bypassData.length) {
      return res.status(400).json({
        message: "No data found for the specified enterprise"
      });
    }

    // Return successful response with bypass data
    return res.status(200).json({
      data: bypassData
    });

  } catch (error) {
      logger.error({ error: error.message });
      return res.status(500).json({ success: false, message: `Internal Server Error: ${error.message}` });
  }
};