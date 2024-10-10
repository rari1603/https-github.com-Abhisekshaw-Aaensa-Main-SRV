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
],

// this is aggregation is in optimizerlogs for optimizeragg

[
  {
    $match: {
    
      createdAt: {
        $gt: ISODate("2024-10-03T14:00:00.000Z"),
        $lt: ISODate("2024-10-03T17:00:00.000Z")
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
        oid: "$OptimizerID",
        gid: "$GatewayID"
      },
      activities: {
        $push: {
          oid: "$OptimizerID",
          gid: "$GatewayID",
          compstatus: {
            $ifNull: ["$CompStatus", "--"]
          },
          rtemp: "$RoomTemperature",
          ctemp: "$CoilTemperature",
          hum: "$Humidity",
          optmode: "$OptimizerMode",
          acstatus: "$DeviceStatus",
          time: {
            $toLong: "$TimeStamp"
          }
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
                  $or: [
                    {
                      $eq: [
                        "$$this.previous",
                        null
                      ]
                    },
                    {
                      $or: [
                        {
                          $ne: [
                            "$$this.current.compstatus",
                            "$$this.previous.compstatus"
                          ]
                        },
                        {
                          $ne: [
                            "$$this.current.optmode",
                            "$$this.previous.optmode"
                          ]
                        }
                      ]
                    }
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
                    $concatArrays: [
                      "$$value",
                      [
                        {
                          compstatus:
                            "$$this.previous.compstatus",
                          optmode:
                            "$$this.previous.optmode",
                          acstatus:
                            "$$this.previous.acstatus",
                          time: "$$this.previous.time",
                          rtemp:
                            "$$this.previous.rtemp",
                          ctemp:
                            "$$this.previous.ctemp",
                          hum: "$$this.previous.hum",
                          oid: "$_id.oid",
                          gid: "$_id.gid",
                          index: "$$this.index"
                        },
                        {
                          compstatus:
                            "$$this.current.compstatus",
                          optmode:
                            "$$this.current.optmode",
                          acstatus:
                            "$$this.current.acstatus",
                          time: "$$this.current.time",
                          rtemp:
                            "$$this.current.rtemp",
                          ctemp:
                            "$$this.current.rtemp",
                          hum: "$$this.current.hum",
                          oid: "$_id.oid",
                          gid: "$_id.gid",
                          index: "$$this.index"
                        }
                      ]
                    ]
                  },
                  else: {
                    $cond: {
                      if: "$$isLast",
                      then: {
                        $concatArrays: [
                          "$$value",
                          [
                            {
                              compstatus:
                                "$$this.current.compstatus",
                              optmode:
                                "$$this.current.optmode",
                              acstatus:
                                "$$this.current.acstatus",
                              time: "$$this.current.time",
                              rtemp:
                                "$$this.current.rtemp",
                              ctemp:
                                "$$this.current.rtemp",
                              hum: "$$this.current.hum",
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
  },
  {
    $project: {
      name: 1,
      optimizers: {
        $reduce: {
          input: "$firstOccurrences",
          initialValue: {
            list: [],
            previous: null
          },
          in: {
            list: {
              $cond: {
                if: {
                  $and: [
                    {
                      $ne: [
                        "$$value.previous",
                        null
                      ]
                    },
                    {
                      $eq: [
                        "$$value.previous.compstatus",
                        "$$this.compstatus"
                      ]
                    },
                    {
                      $eq: [
                        "$$value.previous.optmode",
                        "$$this.optmode"
                      ]
                    },
                    {
                      $eq: [
                        "$$value.previous.acstatus",
                        "$$this.acstatus"
                      ]
                    }
                  ]
                },
                then: {
                  $concatArrays: [
                    "$$value.list",
                    [
                      {
                        oid: "$$value.previous.oid",
                        gid: "$$value.previous.gid",
                        compstatus:
                          "$$value.previous.compstatus",
                        optmode:
                          "$$value.previous.optmode",
                        acstatus:
                          "$$value.previous.acstatus",
                        rtempfrom:
                          "$$value.previous.rtemp",
                        rtempto: "$$this.rtemp",
                        ctempfrom:
                          "$$value.previous.ctemp",
                        ctempto: "$$this.ctemp",
                        humfrom:
                          "$$value.previous.hum",
                        humto: "$$this.hum",
                        from: "$$value.previous.time",
                        to: {
                          $ifNull: [
                            "$$this.time",
                            0
                          ]
                        },
                        counts: {
                          $subtract: [
                            "$$this.index",
                            "$$value.previous.index"
                          ]
                        }
                      }
                    ]
                  ]
                },
                else: "$$value.list"
              }
            },
            previous: "$$this"
          }
        }
      }
    }
  }
],

// db aggregation in optimizerAgg for Ac on off-----------------------------------------

[
  {
    $match: {
      createdAt: {
        $gt: ISODate("2024-09-11T14:00:00.000Z"),
        $lt: ISODate("2024-09-18T20:00:00.000Z")
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

// this is the data of ludhiana for mahendra ji for optimizerlogs collection aggredation

[
  {
    $match: {
      GatewayID: new ObjectId(
        "66d6fd6b45f6f6ca63851bad"
      ),
      createdAt: {
        $gte: ISODate("2024-09-04T00:00:00Z"), // Start of 4th September 2024
        $lte: ISODate("2024-09-25T23:59:59Z") // End of 25th September 2024
      },
      TimeStamp: {
        $gt: "1725388200"
      }
    }
  },
  {
    $sort: {
      TimeStamp: 1
    }
  },
  {
    $lookup: {
      from: "optimizers",
      localField: "OptimizerID",
      foreignField: "_id",
      as: "optimizerData"
    }
  },
  {
    $lookup: {
      from: "gateways",
      localField: "GatewayID",
      foreignField: "_id",
      as: "gatewayData"
    }
  },
  {
    $unwind: {
      path: "$optimizerData",
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $unwind: {
      path: "$gatewayData",
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $addFields: {
      OptimizerID: "$optimizerData.OptimizerID",
      GatewayID: "$gatewayData.GatewayID",
      TimestampIST: {
        $dateToString: {
          format: "%Y-%m-%d %H:%M:%S",
          date: {
            $toDate: {
              $multiply: [
                { $toLong: "$TimeStamp" },
                1000
              ]
            }
          },
          timezone: "+05:30"
        }
      }
    }
  },
  {
    $project: {
      optimizerData: 0,
      GatewayLogID: 0,
      DeviceStatus: 0,
      gatewayData: 0,
      createdAt: 0,
      updatedAt: 0,
      TimeStamp: 0,
      isDelete: 0,
      _id: 0,
      __v: 0
    }
  }
]