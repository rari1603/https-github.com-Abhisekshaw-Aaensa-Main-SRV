const GatewayLogModel = require('../models/GatewayLog.model');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const mongoose = require('mongoose');
const objectId = mongoose.Types.ObjectId;

module.exports = function (agenda) {
    agenda.define('Gateway_Hist_job', async (job) => {
        try {
            console.log("adding the job");
            const filesWritten = await getHistoricalData();
            console.log(filesWritten,"++++++++++++");
        } catch (error) {
            console.log(error);
        }
    })


    async function getHistoricalData() {
        try {            
            const dates = ["2024-06-01T00:00:00.000Z", "2024-06-15T00:00:00.000Z", "2024-07-01T00:00:00.000Z", "2024-07-15T00:00:00.000Z", "2024-08-01T00:00:00.000Z" , "2024-08-15T00:00:00.000Z", "2024-09-01T00:00:00.000Z", "2024-09-15T00:00:00.000Z", 
                "2024-09-30T00:00:00.000Z"    ];
            const dateRange = ["20240601-20240615","20240615-20240701","20240701-20240715","20240715-20240801","20240801-20240815","20240815-20240901","20240901-20240915","20240915-20240930"];
            // QA
            // const gatewayList = [ "66d6ae69b7d83af6a1ba09da"];
            // Prod
            const gatewayNames = ["Rajasthan_IBC_JAIPUR_302001_NGCS2023011021","Rajasthan_IBC_JAIPUR_302001_NGCS2023011022","Rajasthan_Didwana-341_303_NGCS2023011012","Punjab_Ludhiana_NGCS2023011015",
              "Gujarat_Ahmedabad_NGCS2023011035","Gujarat_JAMNAGAR_NGCS2023011019","Gujarat_Bharuch_NGCS2023011013","Gujarat_Surat_NGCS2023011029","Gujarat_Surat_NGCS2023011037"];   
                      
            const gatewayList = ["6667e9469c543a305014e3f6","66686375ac5166bb00436e29","666ace66fc68aa898168d2a3","66d6fd6b45f6f6ca63851bad","6694f88511a2fc4e19c8e09e",
             "66963f41c6e8436e94a0f0a7","6698dfe948997e7dbf6741c1","669b6b0021795d9feae874ab","669de44121795d9feae88b88"];

            let counter = 1;
            for (let i = 0; i < dates.length - 1; i++) {
                for (let j = 0; j < gatewayList.length; j++){
                    let optid = gatewayList[j];
                    console.log("running job: " + optid +"_"+dates[i]);                    
                    let pipeline = [
                        {
                          $match: {
                            createdAt: {
                              $gt: new Date(dates[i]),
                              $lt: new Date(dates[i+1])
                            },
                            GatewayID: new objectId(optid)
                          }
                        },
                        {
                            $addFields: {
                                truncatedTime: {
                                $subtract: [
                                    "$createdAt",
                                    {
                                    $mod: [
                                        {
                                        $subtract: [
                                            "$createdAt",
                                            new Date(0)
                                        ]
                                        }, // Time difference in milliseconds from epoch
                                        1000 * 60 * 60* 6 // 6 hours in milliseconds
                                    ]
                                    }
                                ]
                                }
                            }
                        },
                        {
                          $group: {
                            _id: "$truncatedTime",
                            latestRecord: {
                              $last: "$$ROOT"
                            },
                            earliestRecord: {
                              $first: "$$ROOT"
                            }
                          }
                        },
                        {
                          $project: {
                            _id: 0,
                            gatewayId: "$latestRecord.GatewayID",
                            window_start_time: {$dateToString: { 
                              format: "%Y-%m-%d %H:%M:%S", 
                              date: "$latestRecord.truncatedTime"
                            }},
                            window_end_time: {$dateToString: { 
                              format: "%Y-%m-%d %H:%M:%S", 
                              date: {$add: ["$latestRecord.truncatedTime", 1000 * 60 * 60* 6]}
                            }},
                            last_kvah: "$latestRecord.KVAH",                                                        
                            last_end: "$latestRecord.KWH",                                                        
                            last_pf: "$latestRecord.PF",
                            last_msg_time: {$dateToString: { 
                              format: "%Y-%m-%d %H:%M:%S", 
                              date: "$latestRecord.createdAt"
                            }}                            
                          }
                        },
                        {
                          $sort: {
                            window_start_time: -1
                          }
                        }
                      ];
                    console.log(JSON.stringify(pipeline));
                    const latestRecords = await GatewayLogModel.aggregate(pipeline).exec();
                    console.log("latestRecords size:" +latestRecords.length);
                    const dynamicHeader = Object.keys(latestRecords[0] || {}).map(key => ({
                        id: key,
                        title: key.charAt(0).toUpperCase() + key.slice(1) // Capitalize the first letter
                      }));
                      
                      const csvWriter = createCsvWriter({
                        path: "/var/tmp/" + gatewayNames[j] +"_"+dateRange[i]+ ".csv",
                        header: dynamicHeader
                      });

                      await csvWriter.writeRecords(latestRecords);
                      counter++;
                }
            }            
            return counter;
        } catch (error) {
            console.log({ error });
            console.log({ error });
        }
    }
}

/*
[
  {
    $match: {
      createdAt: {
        $gt: ISODate("2024-07-01T00:00:00.000Z"),
        $lt: ISODate("2024-09-15T00:00:00.000Z")
        
      },
      GatewayID: ObjectId("66d6ae69b7d83af6a1ba09da")
    }
  },
  {
    $addFields: {
      truncatedTime: {
        $subtract: [
          "$createdAt",
          {
            $mod: [
              {
                $subtract: [
                  "$createdAt",
                  new Date(0)
                ]
              }, // Time difference in milliseconds from epoch
              1000 * 60 * 60 * 6 // 5 minutes in milliseconds
            ]
          }
        ]
      }
    }
  },
  {
    $group: {
      _id: "$truncatedTime",
      earliestRecord:{$last: "$$ROOT"},
      latestRecord: { $first: "$$ROOT" }      
    }
  },
  {
    $project: {
      _id: 0,
      gatewayId: "$latestRecord.GatewayID",
      kvahstart: "$latestRecord.KVAH",
      kvahend: "$earliestRecord.KVAH",
      kwhstart: "$latestRecord.KVAH",
      kwhend: "$earliestRecord.KVAH",
      pfstart: "$latestRecord.KVAH",
      pfend: "$earliestRecord.KVAH",
      startTime: "$latestRecord.createdAt",
      endTime: "$earliestRecord.createdAt",
      sampleTime: "$latestRecord.truncatedTime"
    }
  },
  { $sort: { sampleTime: -1 } }  
]
  */