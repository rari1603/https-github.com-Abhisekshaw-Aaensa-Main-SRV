const mongoose = require('mongoose');
const GatewayModel = require('../models/gateway.model');
const Enterprise = require('../models/enterprise.model')
const { ObjectId } = require('mongodb');

const reportCompanyId = process.env.REPORT_COMPANY_ID;
const EnterpriseID = new mongoose.Types.ObjectId(reportCompanyId); // Correctly use new keyword

exports.Data = async () => {
    try {

        const latLongPipeline =   [
            {
              $match: {
                _id: EnterpriseID
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
              $unwind: "$stateData"
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
              $unwind: "$locationData"
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
              $unwind: "$stateInfo"
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
              $unwind: "$gatewayInfo"
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
              $unwind:  {
              path: "$optimizerInfo",
              preserveNullAndEmptyArrays: true  // Ensures gateways with no optimizers are still included
            }
            },
            {
              $group: {
                _id: {
                  enterpriseId: "$_id",
                  stateId: "$stateData.State_ID",
                  locationId: "$locationData._id",
                  gtId: "$gatewayInfo._id"
                },
                enterpriseName: {
                  $first: "$EnterpriseName"
                },
                stateName: {
                  $first: "$stateInfo.name"
                },
                locationName: {
                  $first: "$locationData.LocationName"
                },
                latitude: {
                  $first: "$locationData.Lat"
                },
                longitude: {
                  $first: "$locationData.Long"
                },
                gatewayId: {
                  $first: "$gatewayInfo.GatewayID"
                },
                ssid: {
                  $first: "$gatewayInfo.NetworkSSID"
                },
                bypassmode: {
                  $first: "$gatewayInfo.BypassMode"
                },
                optimizers: {
                  $addToSet: {
                    name: "$optimizerInfo.OptimizerName",
                    id: "$optimizerInfo._id"
                  }
                }
              }
            },
            {
              $group: {
                _id: {
                  enterpriseId: "$_id.enterpriseId",
                  stateId: "$_id.stateId",
                  locationId: "$_id.locationId"
                },
                enterpriseName: {
                  $first: "$enterpriseName"
                },
                stateName: {
                  $first: "$stateName"
                },
                locationName: {
                  $first: "$locationName"
                },
                latitude: {
                  $first: "$latitude"
                },
                longitude: {
                  $first: "$longitude"
                },
                gates: {
                  $addToSet: {
                    _id: "$_id.gtId",
                    gatewayId: "$gatewayId",
                    ssid: "$ssid",
                    bypassmode: "$bypassmode",
                    optimizers: "$optimizers"
                  }
                }
              }
            },
            {
              $group: {
                _id: {
                  enterpriseId: "$_id.enterpriseId",
                  stateId: "$_id.stateId"
                },
                enterpriseName: {
                  $first: "$enterpriseName"
                },
                stateName: {
                  $first: "$stateName"
                },
                locations: {
                  $push: {
                    locationName: "$locationName",
                    locId: "$_id.locationId",
                    latitude: "$latitude",
                    longitude: "$longitude",
                    gateways: "$gates"
                  }
                }
              }
            },
            {
              $project: {
                _id: 0,
                stateName: "$stateName",
                stateId: "$_id.stateId",
                locations: "$locations"
              }
            }
          ]

        const gateways = await GatewayModel.find({
            EnterpriseUserID: EnterpriseID
        });

        const data = await Enterprise.aggregate(latLongPipeline).exec();


        // Check if gateways were found
        if (gateways.length === 0) {
            console.log('No gateways found for the given EnterpriseID.');
            return []; // Return empty array if no gateways
        }

        // Extract the _id fields and return them as an array
        
        const gatewayIds = gateways.map(gateway => gateway._id);
        return {gatewayIds,data};
        
    } catch (error) {
        console.error('Error fetching gateways:', error);
        return []; // Return an empty array in case of error
    }
};
