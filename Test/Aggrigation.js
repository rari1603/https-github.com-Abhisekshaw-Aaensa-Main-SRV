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