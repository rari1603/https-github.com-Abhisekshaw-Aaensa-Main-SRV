[
  {
    $match: {
      _id: ObjectId("66d6a882b7d83af6a1ba0865")
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
    $unwind: {
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
],



[
  {
    $match: {
      createdAt: {
        $gt: ISODate("2024-07-10T00:00:00.000Z")
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
        optimizerId: "$OptimizerID",
        gatewayId: "$GatewayID"
      },
      activities: {
        $push: {
          compStatus: "$CompStatus",
          optmode: "$OptimizerMode",
          time: {
            $convert: {
              input: "$TimeStamp",
              to: "double",
              onError: null,
              onNull: null
            }
          }
        }
      }
    }
  },
  {
    $project: {
      name: "$_id",
      timeDiffs: {
        $reduce: {
          input: {
            $map: {
              input: {
                $range: [
                  1,
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
                  $arrayElemAt: [
                    "$activities",
                    {
                      $subtract: ["$$idx", 1]
                    }
                  ]
                }
              }
            }
          },
          initialValue: [],
          in: {
            $concatArrays: [
              "$$value",
              [
                {
                  activity:
                    "$$this.previous.compStatus",
                  status:
                    "$$this.previous.optmode",
                  timeDiff: {
                    $subtract: [
                      "$$this.current.time",
                      "$$this.previous.time"
                    ]
                  }
                }
              ]
            ]
          }
        }
      }
    }
  },
  {
    $unwind: "$timeDiffs"
  },
  {
    $group: {
      _id: {
        name: "$name",
        activity: "$timeDiffs.activity",
        status: "$timeDiffs.status"
      },
      totalTime: {
        $sum: "$timeDiffs.timeDiff"
      },
      mc: {
        $sum: 1
      }
    }
  },
  {
    $project: {
      _id: 0,
      name: "$_id.name",
      activity: "$_id.activity",
      status: "$_id.status",
      totalTime: "$totalTime",
      mc: "$mc"
    }
  },
  {
    $group: {
      _id: "$name",
      values: {
        $addToSet: {
          activity: "$activity",
          status: "$status",
          totalTime: "$totalTime",
          msgcount: "$mc"
        }
      }
    }
  }
]