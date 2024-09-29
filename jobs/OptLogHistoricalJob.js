
const OptimizerLogModel = require('../models/OptimizerLog.model');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const mongoose = require('mongoose');
const objectId = mongoose.Types.ObjectId;

module.exports = function (agenda) {
    agenda.define('Optimizer_Hist_job', async (job) => {
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
            // const optimizerList = [ "66d6b53eb7d83af6a1ba0b9e"];
            // Prod
            const optimizerNames = ["IBC_JAIPUR_302001_Server_Room","IBC_JAIPUR_302001_Visiting_Room","IBC_JAIPUR_302001_Cassette_Ac_Seat_No_1&2","IBC_JAIPUR_302001_Cassette_Ac_Conference_Room","IBC_JAIPUR_302001_Mathur_Sir_Cabine",
              "IBC_JAIPUR_302001_Cassette_Ac_Seat_No_5","IBC_JAIPUR_302001_Pantry","IBC_JAIPUR_302001_Seat_no_39","IBC_JAIPUR_302001_Cassette_Ac_Seat_no_27&28",
              "IBC_JAIPUR_302001_Seat_no_41&42","IBC_JAIPUR_302001_RECEPTION","Didwana-341_303_Office-2_Right","Didwana-341_303_Office-1_left","Ludhiana_office_area",
              "Ludhiana_Cabin-1","Ludhiana_Meeting_room","Ludhiana_Reception","Ahmedabad_Conference_room","Ahmedabad_customers_meting_room","Ahmedabad_Server_Room-1",
              "Ahmedabad_Server_Room-2","JAMNAGAR_BACK_CABIN","JAMNAGAR_CENTER_CABIN","JAMNAGAR_RECEPTION_AREA","Bharuch_Manager_Cabin","Surat_Cabin_AC-11","Surat_Cabin_AC-4",
              "Surat_Server_Room_AC-2","Surat_Cabin_AC-5","Surat_Cabin_AC-12","Surat_Cabin_Ac-9","Surat_Cabin_Ac-8","Surat_Cabin_Ac-6","Surat_Cabin_Ac-7","Surat_RECEPTION_AC_1"];   

            const optimizerList = ["6667ea3a9c543a305014e487","6667ec9bb544085aa449a48d","6667eb59b544085aa449a41b","6667ed58b544085aa449a4f7","666948b2375782851dd9d82f",
            "6669c3b79d220382669c44ad","66686403375782851dd9c7d6","6668648d375782851dd9c7f1","66ad022e2b921e100b5e97f5","66686446375782851dd9c7e3","66b1a804ed0b52614ea19a92",
            "66ab2a906b88aa570e70bb35","666acf0fc5bb74d5263aa9b7","66d712e9cb887bc88588a92d","66d709b345f6f6ca63851cc9","66d7128245f6f6ca63851d4c","66d7008ecb887bc88588a7f8",
            "66951d7011a2fc4e19c8e4b9","66951e0cf1f41a8578efa2bf","66951c4bf1f41a8578efa24b","66951cbf11a2fc4e19c8e468","66965a07c6e8436e94a0f4d2","66965a7211a2fc4e19c8f330",
            "66965ad411a2fc4e19c8f374","6698e0a6f430f3793c2c106c","669b703c48997e7dbf6759f3","669b6e8a48997e7dbf6759e6","669b710348997e7dbf675a12","669b6f2221795d9feae874d1",
            "669b707c48997e7dbf675a02","66a8e6d86b88aa570e7083d2","669de49821795d9feae88b94","669df8d048997e7dbf6779de","669decb748997e7dbf677273","66a8b1449c37da485db7f77d"];
                        
            let counter = 1;
            for (let i = 0; i < dates.length - 1; i++) {
                for (let j = 0; j < optimizerList.length; j++){
                    let optid = optimizerList[j];
                    console.log("running job: " + optid +"_"+dates[i]);                    
                    let pipeline = [
                        {
                          $match: {
                            createdAt: {
                              $gt: new Date(dates[i]),
                              $lt: new Date(dates[i+1])
                            },
                            OptimizerID: new objectId(optimizerList[j])
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
                                        1000 * 60 * 5 // 5 minutes in milliseconds
                                    ]
                                    }
                                ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: "$truncatedTime",
                                latestRecord: { $last: "$$ROOT" } // Get the first document in the group
                            }
                        },
                        { $sort: { _id: -1 } }, // Sort by the truncated timestamp
                        {
                            $project: {
                                _id: 0,
                                OptimizerID: "$latestRecord.OptimizerID",
                                GatewayID: "$latestRecord.GatewayID",
                                TimeStamp: "$latestRecord.TimeStamp",
                                CompStatus: "$latestRecord.CompStatus",
                                OptimizerMode:"$latestRecord.OptimizerMode",
                                Ac_Status: "$latestRecord.Ac_Status",
                                RoomTemperature: "$latestRecord.RoomTemperature",
                                CoilTemperature:"$latestRecord.CoilTemperature",
                                Humidity: "$latestRecord.Humidity",                                                               
                                MsgTime:{$dateToString: { 
                                  format: "%Y-%m-%d %H:%M:%S", 
                                  date: "$latestRecord.createdAt"
                                }} ,
                                Window_Start_Time:{$dateToString: { 
                                  format: "%Y-%m-%d %H:%M:%S", 
                                  date: "$latestRecord.truncatedTime"
                                }},
                                window_End_time: {$dateToString: { 
                                  format: "%Y-%m-%d %H:%M:%S", 
                                  date: {$add: ["$latestRecord.truncatedTime", 1000 * 60 * 5]}
                                }}                                                               
                            }
                        }
                      ];
                    console.log(JSON.stringify(pipeline));
                    const latestRecords = await OptimizerLogModel.aggregate(pipeline).exec();
                    console.log("latestRecords size:" +latestRecords.length);
                    const dynamicHeader = Object.keys(latestRecords[0] || {}).map(key => ({
                        id: key,
                        title: key.charAt(0).toUpperCase() + key.slice(1) // Capitalize the first letter
                      }));
                      
                      const csvWriter = createCsvWriter({
                        path: "/var/tmp/" + optimizerNames[j] +"_"+dateRange[i]+ ".csv",
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