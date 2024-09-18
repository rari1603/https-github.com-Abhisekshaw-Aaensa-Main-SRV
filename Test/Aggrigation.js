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

// this is aggregation for ACoff-jobs where its giving segrigated data 

[{
  $match: {
    createdAt: {
      $gt: ISODate("2024-09-11T14:00:00.000Z"),
      $lt: ISODate("2024-09-11T20:00:00.000Z")
    }
  }
},
{ $sort: { TimeStamp: 1 } },
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
        compStatus: {
          $ifNull: ["$CompStatus", "--"]
        },
        rtemp: "$RoomTemperature",
        ctemp: "$CoilTemperature",
        hum: "$Humidity",
        optmode: "$OptimizerMode",
        acstatus: "$DeviceStatus",
        time: { $toLong: "$TimeStamp" }
      }
    }
  }
},
{
  $project: {
    _id: 0,
    firstOccurrences: {
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
              previous: {
                $cond: {
                  if: { $eq: ["$$idx", 0] },
                  then: null,
                  else: {
                    $arrayElemAt: [
                      "$activities",
                      { $subtract: ["$$idx", 1] }
                    ]
                  }
                }
              },
              index: "$$idx"
            }
          }
        },
        initialValue: [],
        in: {
          $let: {
            vars: {
              isFirstInSequence: {
                $or: [
                  {
                    $eq: ["$$this.previous", null]
                  },
                  {
                    $or: [
                      {
                        $ne: [
                          "$$this.current.compStatus",
                          "$$this.previous.compStatus"
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
                            $size: "$activities"
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
                        compStatus:
                          "$$this.previous.compStatus",
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
                        compStatus:
                          "$$this.current.compStatus",
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
                            compStatus:
                              "$$this.current.compStatus",
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
          previous: null,
          index: -1
        },
        in: {
          $let: {
            vars: {
              current: "$$this",
              previousRow: "$$value.previous",
              currentIndex: {
                $add: ["$$value.index", 1]
              }
            },
            in: {
              list: {
                $cond: {
                  if: {
                    $and: [
                      {
                        $gt: ["$$currentIndex", 1]
                      },
                      {
                        $eq: [
                          "$$previousRow.compStatus",
                          "$$current.compStatus"
                        ]
                      },
                      {
                        $eq: [
                          "$$previousRow.optmode",
                          "$$current.optmode"
                        ]
                      },
                      {
                        $eq: [
                          "$$previousRow.acstatus",
                          "$$current.acstatus"
                        ]
                      }
                    ]
                  },
                  then: {
                    $concatArrays: [
                      "$$value.list",
                      [
                        {
                          oid: "$$previousRow.oid",
                          gid: "$$previousRow.gid",
                          compStatus:
                            "$$previousRow.compStatus",
                          optmode:
                            "$$previousRow.optmode",
                          acstatus:
                            "$$previousRow.acstatus",
                          rtempfrom:
                            "$$previousRow.rtemp",
                          rtempto:
                            "$$current.rtemp",
                          ctempfrom:
                            "$$previousRow.ctemp",
                          ctempto:
                            "$$current.ctemp",
                          humfrom:
                            "$$previousRow.hum",
                          humto: "$$current.hum",
                          from: "$$previousRow.time",
                          to: {
                            $ifNull: [
                              "$$current.time",
                              0
                            ]
                          },
                          counts: {
                            $subtract: [
                              "$$current.index",
                              "$$previousRow.index"
                            ]
                          }
                        }
                      ]
                    ]
                  },
                  else: "$$value.list"
                }
              },
              previous: "$$current",
              index: "$$currentIndex"
            }
          }
        }
      }
    }
  }
}],

// db of optimizerAgg-----------------------------------------

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
        oid: "$OptimizerID",
        gid: "$GatewayID"
      },
      activities: {
        $push: {
          oid: "oid",
          gid: "gid",
          compStatus: {
            $ifNull: ["$compStatus", "--"]
          },
          optmode: "$optmode",
          acstatus: "$acstatus",
          time: "$to"
        }
      }
    }
  },
  {
    $project: {
      _id: 0,
      firstOccurrences: {
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
                previous: {
                  $cond: {
                    if: { $eq: ["$$idx", 0] },
                    then: null,
                    else: {
                      $arrayElemAt: [
                        "$activities",
                        {
                          $subtract: ["$$idx", 1]
                        }
                      ]
                    }
                  }
                },
                index: "$$idx"
              }
            }
          },
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
                            "$$this.current.compStatus",
                            "$$this.previous.compStatus"
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
                              $size: "$activities"
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
                          compStatus:
                            "$$this.current.compStatus",
                          optmode:
                            "$$this.current.optmode",
                          acstatus:
                            "$$this.current.acstatus",
                          time: "$$this.current.time",
                          oid: "$_id.oid",
                          gid: "$_id.gid"
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
                              compStatus:
                                "$$this.current.compStatus",
                              optmode:
                                "$$this.current.optmode",
                              acstatus:
                                "$$this.current.acstatus",
                              time: "$$this.current.time",
                              oid: "$_id.oid",
                              gid: "$_id.gid"
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
            previous: null,
            index: -1
          },
          in: {
            $let: {
              vars: {
                current: "$$this",
                previousRow: "$$value.previous",
                currentIndex: {
                  $add: ["$$value.index", 1]
                }
              },
              in: {
                list: {
                  $cond: {
                    if: {
                      $ne: ["$$currentIndex", 0]
                    },
                    then: {
                      $concatArrays: [
                        "$$value.list",
                        [
                          {
                            oid: "$$previousRow.oid",
                            gid: "$$previousRow.gid",
                            compStatus:
                              "$$previousRow.compStatus",
                            optmode:
                              "$$previousRow.optmode",
                            acstatus:
                              "$$previousRow.acstatus",
                            nextcompStatus: {
                              $ifNull: [
                                "$$current.compStatus",
                                "N/A"
                              ]
                            },
                            nextoptmode: {
                              $ifNull: [
                                "$$current.optmode",
                                "N/A"
                              ]
                            },
                            nextacstatus: {
                              $ifNull: [
                                "$$current.acstatus",
                                "N/A"
                              ]
                            },
                            from: "$$previousRow.time",
                            to: {
                              $ifNull: [
                                "$$current.time",
                                0
                              ]
                            },
                            index: "$$value.index"
                          }
                        ]
                      ]
                    },
                    else: "$$value.list"
                  }
                },
                previous: "$$current",
                index: "$$currentIndex"
              }
            }
          }
        }
      }
    }
  }
]