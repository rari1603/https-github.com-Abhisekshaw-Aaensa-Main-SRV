const GatewayLogModel = require('../../models/GatewayLog.model');
const OptimizerLogModel = require('../../models/OptimizerLog.model');
const OptimizerDefaultSettingValueModel = require('../../models/OptimizerDefaultSettingValue.model');
const OptimizerSettingValueModel = require('../../models/OptimizerSettingValue.model');
const OptimizerModel = require('../../models/optimizer.model');
const GatewayModel = require('../../models/gateway.model');
const LocationModel = require('../../models/enterprise_state_location.model');
const StateModel = require('../../models/enterprise_state.model');
const EnterpriseModel = require('../../models/enterprise.model');
const EnterpriseStateLocationModel = require('../../models/enterprise_state_location.model');
const UpdateSettings = require('../../utility/UpdateSetting');
const NewApplianceLogModel = require('../../models/NewApplianceLog.model');
// const logger = require('../../configs/pino_logger').createLogger(__filename);
const logger = require('../../configs/pino_logger');
const fs = require('fs');
const path = require('path');
const DeviceStatusModel = require('../../models/deviceStatusModel')
const DeviceRebootStatusModel = require('../../models/deviceRebootModel');

const OptimizerByPassModel = require('../../models/OptimizerByPassModel');


// console.log({logger});

// Device ready to config
exports.DeviceReadyToConfig = async (req, res) => {
    const { gateway_id } = req.params;
    try {
        const Gateway = await GatewayModel.findOne({ GatewayID: gateway_id });
        if (Gateway) {
            const UpdatedGateway = await GatewayModel.findByIdAndUpdate({ _id: Gateway._id },
                { $set: { is_Ready_toConfig: true } }
            );
            if (!UpdatedGateway) {
                return res.status(500).send({ success: false, message: "Something went wrong, please try again" });
            }
            return res.status(200).json({ success: true, message: "Gateway is ready to config." });
        } else {
            return res.status(404).json({ success: false, message: "Gateway not found." });
        }

    } catch (error) {
        console.error({ DeviceReadyToConfigError: error.message });
        return res.status(500).send({ success: false, message: `Internal Server Error: ${error.message}` });
    }
};

// CheckAllDevicesOnlineStatus
exports.CheckAllDevicesOnlineStatus = async (req, res) => {
    const { gateway_id, onlineOptimizers } = req.body;
    try {
        const Gateway = await GatewayModel.findOne({ GatewayID: gateway_id });
        if (Gateway) {
            const associateOptimizers = await OptimizerModel.find({ GatewayId: Gateway._id });

            const OnlineOptimizerCount = onlineOptimizers.filter(optimizer => optimizer !== "").length;
            const AssociateOptimizerCount = associateOptimizers.length;

            if (AssociateOptimizerCount === OnlineOptimizerCount) {
                await GatewayModel.findByIdAndUpdate({ _id: Gateway._id },
                    {
                        isConfigure: true,
                        is_Ready_toConfig: false,
                    },
                    { new: true } // This option returns the modified document rather than the original
                );
                return res.status(200).json({ success: true, message: "All Optimizers Are Online." });
            } else {
                return res.status(503).send({ success: false, message: "All Optimizers are not online.Please try again.", key: "optimizer_status" });
            }

        } else {
            return res.status(404).send({ success: false, message: "Gateway not found", key: "gateway" });
        }

    } catch (error) {
        console.error({ CheckAllDevicesOnlineStatusError: error.message });
        return res.status(500).send({ success: false, message: `Internal Server Error: ${error.message}` });
    }
};

// // ConfigureableData
// exports.ConfigureableData = async (req, res) => {
//     try {
//         const { gateway_id } = req.params;

//         const Gateway = await GatewayModel.findOne({ GatewayID: gateway_id });
//         console.log({ Gateway_id: gateway_id, ConfigureableData: Gateway });

//         if (!Gateway) {
//             return res.status(401).json({ success: false, message: "Gateway ID not found!" });
//         };

//         const Optimizers = await OptimizerModel.find({ GatewayId: Gateway._id });
//         const optObject = await Promise.all(Optimizers.map(async (element) => {
//             const OptimizerSettings = await OptimizerSettingValueModel.findOne({ optimizerID: element._id });
//             var bypassType = "default";
//             if (element.isBypass.type === "true") {
//                 if (element.isBypass.is_schedule) {
//                     //  check current time with bypass time
//                     var currentTimestamp = Math.floor(Date.now() / 1000);
//                     var scheduleTimestamp = new Date(element.isBypass.time).getTime() / 1000;
//                     if (currentTimestamp >= scheduleTimestamp) {
//                         bypassType = element.isBypass.type;
//                     } else {
//                         bypassType = "default";
//                     }
//                 } else {
//                     bypassType = element.isBypass.type;
//                 }

//             } else if (element.isBypass.type === "false") {
//                 bypassType = "false"
//             }

//             return {
//                 "optimizer_id": element.OptimizerID,
//                 "is_bypass": bypassType,
//                 "is_reset": element.isReset,
//                 "is_setting": element.isSetting,
//                 "settings": element.isSetting ? {
//                     firstPowerOnObservationTime: OptimizerSettings?.firstPowerOnObservationTime,
//                     maxObservatioTime: OptimizerSettings?.maxObservatioTime,
//                     OptimizationOnTime: OptimizerSettings?.OptimizationOnTime,
//                     thermostatMonitoringInterval: OptimizerSettings?.thermostatMonitoringInterval,
//                     thermostatMonitoringTimeIncrement: OptimizerSettings?.thermostatMonitoringTimeIncrement,
//                     steadyStateTimeRoomTempTolerance: OptimizerSettings?.steadyStateTimeRoomTempTolerance,
//                     steadyStateCoilTempTolerance: OptimizerSettings?.steadyStateCoilTempTolerance
//                 } : {}
//             };
//         }));

//         const NewObj = {
//             "gatewayID": Gateway.GatewayID,
//             "config": Gateway.isConfigure,
//             "is_Ready_toConfig": Gateway.is_Ready_toConfig,
//             "optimizer": optObject

//         };
//         // console.log({ ConfigureableData: NewObj });
//         // console.log({ Optimizers: NewObj.optimizer });
//         return res.status(200).send(NewObj);
//         // return res.status(200).json({ success: true, message: "Data fetched successfully.", data: NewObj });

//     } catch (error) {
//         console.log({ ConfigureableDataError: error.message });
//         return res.status(500).json({ success: false, message: error.message });
//     }
// };

// ConfigureableData
exports.ConfigureableData = async (req, res) => {
    try {

        const { gateway_id } = req.params;

        const Gateway = await GatewayModel.findOne({ GatewayID: gateway_id });
        // logger.info({ Gateway_id: gateway_id, ConfigureableData: Gateway });


        if (!Gateway) {
            return res.status(401).json({ success: false, message: "Gateway ID not found!" });
        };

        const Optimizers = await OptimizerModel.find({ GatewayId: Gateway._id });
        const optObject = await Promise.all(Optimizers.map(async (element) => {
            const OptimizerSettings = await OptimizerSettingValueModel.findOne({ optimizerID: element._id });

            let bypassType = "default";
            const OptimizerByPass = await OptimizerByPassModel.find({
                OptimizerId: element.OptimizerID,
                deviceStatus: {
                    $ne: "inactive"
                }
            });
            
            const now = Math.floor(Date.now() / 1000);
            // Process each optimizer
            OptimizerByPass.map(async (byPassElement) => {
                // Check if ByPassTime is within the schedule
                if (now >= byPassElement.startTime && byPassElement.deviceStatus === null && byPassElement.Status === "active") {
                    console.log("status updated");

                    bypassType = "true";
                } else if (now >= byPassElement.endTime && byPassElement.deviceStatus === "active") {
                    bypassType = "false";
                    if (byPassElement.Status === "active") {
                        // Update ByPass status in the database
                        await OptimizerByPassModel.updateOne(
                            { _id: byPassElement._id }, // Find by the element's ID
                            { Status: "inactive" } // Update the Status field
                        );
                    }
                }
            }
            );

            return {
                "optimizer_id": element.OptimizerID,
                "is_bypass": bypassType,
                "is_reset": element.isReset,
                "is_setting": element.isSetting,
                "settings": element.isSetting ? {
                    firstPowerOnObservationTime: OptimizerSettings?.firstPowerOnObservationTime,
                    maxObservatioTime: OptimizerSettings?.maxObservatioTime,
                    OptimizationOnTime: OptimizerSettings?.OptimizationOnTime,
                    thermostatMonitoringInterval: OptimizerSettings?.thermostatMonitoringInterval,
                    thermostatMonitoringTimeIncrement: OptimizerSettings?.thermostatMonitoringTimeIncrement,
                    steadyStateTimeRoomTempTolerance: OptimizerSettings?.steadyStateTimeRoomTempTolerance,
                    steadyStateCoilTempTolerance: OptimizerSettings?.steadyStateCoilTempTolerance
                } : {}
            };
        }));

        const NewObj = {
            "gatewayID": Gateway.GatewayID,
            "config": Gateway.isConfigure,
            "is_Ready_toConfig": Gateway.is_Ready_toConfig,
            "optimizer": optObject

        };
        return res.status(200).send(NewObj);
    } catch (error) {
        logger.info({ ConfigureableDataError: error.message });
        return res.status(500).json({ success: false, message: error.message });
    }
};

const gatewayReceivedTimes = new Map();
const gatewayStoredTimes = new Map();
const errorCounts = new Map();
// Store Gateway & Optimizer Log data 
exports.Store = async (req, res) => {
    const data = req.body;
    const gateway_id = req.body.GatewayID;
    const optimizers = req.body.OptimizerDetails;

    console.log({ Body: JSON.stringify(req.body) });
    // logger.info("info-write", req.body);

    if (gateway_id === "NGCS2023011022") {
        try {
            const jsonObject = req.body;
            console.log('JSON file saved successfully.');
        } catch (err) {
            console.error("Error writing file:", err);
        }
    }


    // Helper function to handle "nan" values
    const handleNaN = (value) => {
        return isNaN(parseFloat(value)) ? 0 : parseFloat(value);
    };

    try {
        const gateway = await GatewayModel.findOne({ GatewayID: gateway_id });
        if (!gateway) {
            return res.status(404).send(`Gateway with ID ${req.body.GatewayID} not found`);
        }
        const AssignedOptimizers = await OptimizerModel.find({ GatewayId: gateway._id });
        // console.log({ AssignedOptimizers });
        const AssignedOptimizerIDs = AssignedOptimizers.map(optimizer => optimizer.OptimizerID.trim());
        // console.log({ AssignedOptimizerIDs });

        const OnlineOptimizers = optimizers;
        // console.log({ OnlineOptimizers });


        const OnlineOptimizerIDs = OnlineOptimizers.map(optimizer => optimizer.OptimizerID.trim());
        // console.log({ OnlineOptimizerIDs });

        const OfflineOptimizerIDs = AssignedOptimizerIDs.filter(id => !OnlineOptimizerIDs.includes(id));
        // console.log({ OfflineOptimizerIDs });

        // First, mark all optimizers as offline
        await OptimizerModel.updateMany(
            { OptimizerID: { $in: AssignedOptimizerIDs } },
            { $set: { isOnline: false } }
        );

        // Then, mark online optimizers
        await OptimizerModel.updateMany(
            { OptimizerID: { $in: OnlineOptimizerIDs } },
            { $set: { isOnline: true } }
        );


        const gatewayId = gateway._id;
        let { TimeStamp, Phases, KVAH, KWH, PF } = data;

        // Convert "nan" values to 0
        const sanitizedPhases = Object.keys(Phases).reduce((acc, phase) => {
            acc[phase] = {
                Voltage: handleNaN(Phases[phase].Voltage).toFixed(2),
                Current: handleNaN(Phases[phase].Current).toFixed(2),
                ActivePower: handleNaN(Phases[phase].ActivePower).toFixed(2),
                PowerFactor: handleNaN(Phases[phase].PowerFactor).toFixed(2),
                ApparentPower: handleNaN(Phases[phase].ApparentPower).toFixed(2),
            };
            return acc;
        }, {});

        //----------Check for Gateway Time Problems------------------//
        const currentServerTimeStamp = Math.floor(new Date().getTime() / 1000);
        const previousServerTimeStamp = gatewayStoredTimes.get(gateway_id) ? gatewayStoredTimes.get(gateway_id) : "0";

        const currentMessageTimeStamp = TimeStamp;
        const lastMessageTime = gatewayReceivedTimes.get(gateway_id) ? gatewayReceivedTimes.get(gateway_id) : "0";

        const gatewayTimeDiff = (currentMessageTimeStamp - lastMessageTime);
        const messageTimeDiff = (currentServerTimeStamp - previousServerTimeStamp);
        let GatewayTimeChanged = false;
        if (Math.abs(gatewayTimeDiff - messageTimeDiff) > 7200) {

            errorCounts.set(gateway_id, 0);
            const deviceStatus = new DeviceRebootStatusModel({
                GatewayID: gateway_id,
                storeTime: currentServerTimeStamp * 1000,  // Set storeTime as the currentServerTimeStamp in millis
                receivedTime: TimeStamp * 1000  // Set receivedTime as the TimeStamp in millis
            });
            // Save the document to the database
            await deviceStatus.save()
            GatewayTimeChanged = true;
            TimeStamp = currentServerTimeStamp;

        }
        //--------------Check for Gateway Time Problems end--------------//

        const gatewayLog = await GatewayLogModel({
            GatewayID: gatewayId,
            TimeStamp: TimeStamp,
            Phases: sanitizedPhases,
            KVAH: handleNaN(KVAH).toFixed(2),
            KWH: handleNaN(KWH).toFixed(2),
            PF: handleNaN(PF).toFixed(2),
        }).save();

        // Store online optimizer's data
        const optimizerLogPromises = optimizers.map(async element => {
            const optimizer = await OptimizerModel.findOne({ OptimizerID: element.OptimizerID });

            if (!optimizer) {
                console.log(`Optimizer with ID ${req.body.OptimizerID} not found`);
            }


            if (optimizer) {
                const data = {
                    Opt_id: optimizer._id,
                    OptimizerID: element.OptimizerID,
                    DeviceStatus: true,
                    CompStatus: element.CompStatus,
                    OptimizerMode: element.OptimizerMode,
                    TimeStamp: TimeStamp, // Unix timestamp
                    Flag: "ONLINE",
                    Ac_Status: element.Ac_Status,
                }

                await CounterFlag(data);

                // logger.info({
                //     OptimizerID: optimizer._id,
                //     GatewayID: gatewayId,
                //     GatewayLogID: gatewayLog._id,
                //     DeviceStatus: true, // optimizer.isOnline,
                //     TimeStamp: TimeStamp,
                //     RoomTemperature: element.RoomTemperature,
                //     Humidity: (element.Humidity).toFixed(2),
                //     CoilTemperature: element.CoilTemperature,
                //     OptimizerMode: element.OptimizerMode,
                //     CompStatus: element.CompStatus,
                //     Ac_Status: element.Ac_Status
                // });

                return OptimizerLogModel({
                    OptimizerID: optimizer._id,
                    GatewayID: gatewayId,
                    GatewayLogID: gatewayLog._id,
                    DeviceStatus: true, // optimizer.isOnline,
                    TimeStamp: TimeStamp,
                    RoomTemperature: element.RoomTemperature,
                    Humidity: (element.Humidity).toFixed(2),
                    CoilTemperature: element.CoilTemperature,
                    OptimizerMode: element.OptimizerMode,
                    CompStatus: element.CompStatus,
                    Ac_Status: element.Ac_Status,
                }).save();
            }
        });

        await Promise.all(optimizerLogPromises);

        // Store offline optimizer's data
        await Promise.all(OfflineOptimizerIDs.map(async id => {
            const optimizer = await OptimizerModel.findOne({ OptimizerID: id });

            if (!optimizer) {
                console.log(`Optimizer with ID ${id} not found`);
            }

            if (optimizer) {
                const data = {
                    Opt_id: optimizer._id,
                    OptimizerID: optimizer.OptimizerID,
                    DeviceStatus: false,
                    CompStatus: "--",
                    OptimizerMode: "--",
                    TimeStamp: Math.floor(new Date().getTime() / 1000), // Unix timestamp
                    Flag: "OFFLINE",
                    Ac_Status: "OFF",
                }

                await CounterFlag(data);
                // logger.info({
                //     OptimizerID: optimizer._id,
                //     GatewayID: gatewayId,
                //     GatewayLogID: gatewayLog._id,
                //     DeviceStatus: false, // optimizer.isOnline,
                //     TimeStamp: TimeStamp,
                //     RoomTemperature: 0,
                //     Humidity: 0,
                //     CoilTemperature: 0,
                //     OptimizerMode: "N/A",
                //     CompStatus: "--",
                //     Ac_Status: "--",
                // });

                return OptimizerLogModel({
                    OptimizerID: optimizer._id,
                    GatewayID: gatewayId,
                    GatewayLogID: gatewayLog._id,
                    DeviceStatus: false, // optimizer.isOnline,
                    TimeStamp: TimeStamp,
                    RoomTemperature: 0,
                    Humidity: 0,
                    CoilTemperature: 0,
                    OptimizerMode: "N/A",
                    CompStatus: "--",
                    Ac_Status: "--",
                }).save();
            }
        }));

        console.log({ success: true, message: "Logs created successfully", gatewayLog, OptimizerLogModel });

        gatewayReceivedTimes.set(gateway_id, currentServerTimeStamp);
        gatewayStoredTimes.set(gateway_id, TimeStamp);
        if (GatewayTimeChanged) {
            gatewayReceivedTimes.set(gateway_id, TimeStamp);
            gatewayStoredTimes.set(gateway_id, TimeStamp);

            return res.status(200).json({
                status: "TMS",
                errorcode: "G-003",
                timestamp: currentServerTimeStamp,
                // gatewayLog,

            });


        } else {

            errorCounts.set(gateway_id, 0);
            // Return success response
            return res.status(200).send({
                success: true, status: "OK", timestamp: currentServerTimeStamp,
                //  gatewayLog
            });
        }

        //return res.status(200).send({ success: true, message: "Logs created successfully", gatewayLog });

    } catch (error) {
        console.error({ StoreError: error.message });
        res.status(404).send({ success: false, message: error.message });
    }
};

// Counter function

async function CounterFlag(params) {
    // console.log(params, "------------------");

    const {
        Opt_id,
        OptimizerID,
        DeviceStatus,
        CompStatus,
        OptimizerMode,
        TimeStamp,
        Flag,
        Ac_Status
    } = params;


    const COUNTERS_FILE = '../counters.json';

    // Function to read the counters from the JSON file
    function readCounters() {
        if (!fs.existsSync(COUNTERS_FILE)) {
            fs.writeFileSync(COUNTERS_FILE, JSON.stringify([]));
        }
        return JSON.parse(fs.readFileSync(COUNTERS_FILE, 'utf8'));
    }

    // Function to write the counters to the JSON file
    function writeCounters(counters) {
        fs.writeFileSync(COUNTERS_FILE, JSON.stringify(counters, null, 2));
    }

    if (!OptimizerID) {
        return { error: 'Missing required fields' };
    }

    let counters = readCounters();

    let counterIndex = counters.findIndex(c => c[OptimizerID] !== undefined);
    if (counterIndex === -1) {
        // Counter not found, add new counter
        let newCounter = { [OptimizerID]: 0 };
        counters.push(newCounter);
        counterIndex = counters.length - 1;
    }
    if (DeviceStatus === false) {
        // console.log("FALSE");
        counters[counterIndex][OptimizerID]++;
        if (counters[counterIndex][OptimizerID] >= 5) {
            counters.splice(counterIndex, 1);
            // ACFUN('OFF'); // set AC offline
            compressor({ Opt_id, OptimizerID, DeviceStatus, CompStatus, OptimizerMode, TimeStamp, Flag, Ac_Status });
        }
    }
    if (DeviceStatus === true) {
        // console.log("TRUE");
        counters.splice(counterIndex, 1);
        // ACFUN('OFF'); // set AC online

        compressor({ Opt_id, OptimizerID, DeviceStatus, CompStatus, OptimizerMode, TimeStamp, Flag, Ac_Status });
    }

    writeCounters(counters);
    return { success: 'Status updated successfully' };
}

// Installation property
exports.InstallationProperty = async (req, res) => {
    const { gateway_id } = req.params;

    const Gateway = await GatewayModel.findOne({ GatewayID: gateway_id });
    if (!Gateway) {
        return res.status(404).json({ success: false, message: "Gateway not found." });
    }

    const Optimizers = await OptimizerModel.find({ GatewayId: Gateway._id });

    const optObject = Optimizers.map(element =>
        element.OptimizerID,
    );

    if (Gateway.isConfigure) {
        var NewObj = {
            "gatewayID": Gateway.GatewayID,
            "ssid": Gateway.NetworkSSID,
            "password": Gateway.NetworkPassword,
            "optimizer_list": optObject
        };

    } else {
        var NewObj = {
            "gatewayID": Gateway.GatewayID,
            "property": null

        };
    }
    return res.send(NewObj);
};

// Acknowledgement from the configured gateway
exports.AcknowledgeFromConfGateway = async (req, res) => {
    const { gateway_id } = req.params;
    try {
        const Gateway = await GatewayModel.findOne({ GatewayID: gateway_id });
        if (Gateway) {
            const UpdatedGateway = await GatewayModel.findByIdAndUpdate({ _id: Gateway._id },
                {
                    isConfigure: false,
                },
                { new: true } // This option returns the modified document rather than the original
            );
            return res.status(200).json({ success: true, message: "Gateway updated successfully.", UpdatedGateway });

        } else {
            return res.status(404).send({ success: false, message: "Gateway not found", key: "gateway" });
        }
    } catch (error) {
        console.error(error.message);
        return res.status(500).send({ success: false, message: `Internal Server Error: ${error.message}` });
    }
};

// OptimizerDefaultSetting
exports.OptimizerDefaultSettingValue = async (req, res) => {

    const newValues = {
        firstPowerOnObservationTime: req.body.firstPowerOnObservationTime,
        maxObservatioTime: req.body.maxObservatioTime,
        OptimizationOnTime: req.body.OptimizationOnTime,
        thermostatMonitoringInterval: req.body.thermostatMonitoringInterval,
        thermostatMonitoringTimeIncrement: req.body.thermostatMonitoringTimeIncrement,
        steadyStateTimeRoomTempTolerance: req.body.steadyStateTimeRoomTempTolerance,
        steadyStateCoilTempTolerance: req.body.steadyStateCoilTempTolerance,
    };

    try {
        // Try to find an existing document
        const existingRecord = await OptimizerDefaultSettingValueModel.findOne();
        if (req.params.flag === "get") {
            return res.send({ success: true, message: "Date fetch successfully", data: existingRecord });
        }
        if (req.params.flag === "set") {
            if (existingRecord) {
                // If the record exists, update it
                await OptimizerDefaultSettingValueModel.updateOne({}, newValues);
                res.send({ success: true, message: 'Record updated.' });
            } else {
                // If the record doesn't exist, create a new one
                const defaultValue = new OptimizerDefaultSettingValueModel(newValues);
                await defaultValue.save();
                res.send({ success: true, message: 'Record inserted.' });
            }
        } else {
            res.status(400).send({ success: false, message: 'Bad Request' });
        }

    } catch (error) {
        // Handle any errors that may occur during the process
        console.error(error);
        res.status(500).send({ success: false, message: 'Internal Server Error' });
    }
};

// SetOptimizerSettingValue 
exports.SetOptimizerSettingValue = async (req, res) => {
    try {
        const data = {
            firstPowerOnObservationTime: req.body.firstPowerOnObservationTime,
            maxObservatioTime: req.body.maxObservatioTime,
            OptimizationOnTime: req.body.OptimizationOnTime,
            thermostatMonitoringInterval: req.body.thermostatMonitoringInterval,
            thermostatMonitoringTimeIncrement: req.body.thermostatMonitoringTimeIncrement,
            steadyStateTimeRoomTempTolerance: req.body.steadyStateTimeRoomTempTolerance,
            steadyStateCoilTempTolerance: req.body.steadyStateCoilTempTolerance,
        };

        // set particular optimizer
        if (req.body.group === 'optimizer') {
            console.log(`Resetting to default value particular optimizer ${req.body.id}`);
            const optimizerIDS = [req.body.id]
            const Optmizer = await OptimizerModel.findOne({ _id: req.body.id });

            if (Optmizer.isOnline) {
                result = await UpdateSettings(optimizerIDS, data);
            } else {
                return res.status(503).json({ success: false, message: "Device is not online. Please try again.", key: "optimizer_status" });
            }
        }

        // set all optimizer assign with the gateway => optimizers
        if (req.body.group === 'gateway') {
            console.log(`Resetting to default value gateway => optimizers`);
            const gateway_id = req.body.id;
            const allOptimizer = await OptimizerModel.find({ GatewayId: gateway_id });

            // Check if any optimizer is offline
            const offlineOptimizer = allOptimizer.find(optimizer => !optimizer.isOnline);

            if (offlineOptimizer) {
                return res.status(503).json({ success: false, message: "Not all optimizers under this gateway are online. Please try again.", key: "optimizer_status" });
            }

            const optimizerIDS = allOptimizer.map(item => item._id);
            result = await UpdateSettings(optimizerIDS, data);
        }

        // set all optimizer assign with the location => gateways => optimizers
        if (req.body.group === 'location') {
            console.log(`Resetting to default value location => gateways => optimizers`);
            const location_id = req.body.id;
            const Location = await LocationModel.findOne({ _id: location_id });
            const allGateway = await GatewayModel.find({ EnterpriseInfo: Location._id });

            // Array to hold offline optimizers
            const offlineOptimizers = [];

            // Iterate through each gateway to retrieve optimizers
            const optimizerIDS = await Promise.all(allGateway.map(async (gateway) => {
                const allOptimizer = await OptimizerModel.find({ GatewayId: gateway._id });

                // Check if any optimizer is offline and push it to the offlineOptimizers array
                const offline = allOptimizer.some(optimizer => !optimizer.isOnline);
                if (offline) {
                    offlineOptimizers.push(...allOptimizer.filter(optimizer => !optimizer.isOnline).map(optimizer => optimizer._id));
                }

                return allOptimizer.map((item) => item._id);
            }));

            // If there are offline optimizers, return an appropriate response
            if (offlineOptimizers.length > 0) {
                return res.status(503).json({ success: false, message: "Not all optimizers under all gateways in this location are online. Please try again.", key: "optimizer_status" });
            }

            // Flatten the optimizerIDS array and update settings for all optimizers
            result = await UpdateSettings(optimizerIDS.flat(), data);
        }

        // set all optimizer assign with the state => locations => gateways => optimizers
        if (req.body.group === 'state') {
            console.log(`Resetting to default value state => locations => gateways => optimizers`);
            const state_id = req.body.id;
            const State = await StateModel.findOne({ _id: state_id });

            const allLocation = await LocationModel.find({ Enterprise_ID: State.Enterprise_ID, State_ID: State.State_ID });

            // Array to hold offline optimizers
            const offlineOptimizers = [];

            // Iterate through each location to retrieve gateways and their associated optimizers
            const optimizerIDS = await Promise.all(allLocation.map(async (location) => {
                const allGateway = await GatewayModel.find({ EnterpriseInfo: location._id });

                // Using Promise.all to wait for all OptimizerModel.find() queries to complete
                const optimizerPromises = allGateway.map(async (gateway) => {
                    const allOptimizer = await OptimizerModel.find({ GatewayId: gateway._id });

                    // Check if any optimizer is offline and push it to the offlineOptimizers array
                    const offline = allOptimizer.some(optimizer => !optimizer.isOnline);
                    if (offline) {
                        offlineOptimizers.push(...allOptimizer.filter(optimizer => !optimizer.isOnline).map(optimizer => optimizer._id));
                    }

                    return allOptimizer.map((item) => item._id);
                });

                return Promise.all(optimizerPromises);
            }));

            // If there are offline optimizers, return an appropriate response
            // console.log({offlineOptimizers});

            if (offlineOptimizers.length > 0) {
                return res.status(503).json({ success: false, message: "One or more optimizers are offline under this state. Please try again.", key: "optimizer_status" });
            }

            const flattenedOptimizerIDs = optimizerIDS.flat();
            result = await UpdateSettings(flattenedOptimizerIDs.flat(), data);
        }

        // set all optimizer assign with the enterprise => states => locations => gateways => optimizers
        if (req.body.group === 'enterprise') {
            console.log(`Resetting to default value enterprise => states => locations => gateways => optimizers`);

            const enterprise_id = req.body.id;
            const Enterprise = await EnterpriseModel.findOne({ _id: enterprise_id });
            const allState = await StateModel.find({ Enterprise_ID: Enterprise._id });

            // Array to hold offline optimizers
            const offlineOptimizers = [];

            // Iterate through each state to retrieve locations, gateways, and their associated optimizers
            const optimizerIDS = await Promise.all(allState.map(async (state) => {
                const allLocation = await LocationModel.find({ Enterprise_ID: state.Enterprise_ID, State_ID: state.State_ID });

                // Using Promise.all to wait for all OptimizerModel.find() queries to complete
                const optimizerPromises = await Promise.all(allLocation.map(async (location) => {
                    const allGateway = await GatewayModel.find({ EnterpriseInfo: location._id });

                    // Using Promise.all to wait for all OptimizerModel.find() queries to complete
                    const gatewayPromises = allGateway.map(async (gateway) => {
                        const allOptimizer = await OptimizerModel.find({ GatewayId: gateway._id });

                        // Check if any optimizer is offline and push it to the offlineOptimizers array
                        const offline = allOptimizer.some(optimizer => !optimizer.isOnline);
                        if (offline) {
                            offlineOptimizers.push(...allOptimizer.filter(optimizer => !optimizer.isOnline).map(optimizer => optimizer._id));
                        }

                        return allOptimizer.map((item) => item._id);
                    });

                    return Promise.all(gatewayPromises);
                }));

                return optimizerPromises.flat();
            }));

            // If there are offline optimizers, return an appropriate response
            if (offlineOptimizers.length > 0) {
                return res.status(503).json({ success: false, message: "One or more optimizers are offline under this enterprise. Please try again.", key: "optimizer_status" });
            }

            // Flatten the array of arrays containing optimizer IDS
            const flattenedOptimizerIDs = optimizerIDS.flat();
            result = await UpdateSettings(flattenedOptimizerIDs.flat(), data);
        }

        if (result) {
            return res.send({ success: true, message: `Optimizer Settings values Set successfully.` });
        } else {
            return res.status(500).send({ success: false, message: 'Internal Server Error: Unable to set result.' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ success: false, message: `Internal Server Error: ${error.message}` });
    }
};

// ResetOptimizerSettingValue
exports.ResetOptimizerSettingValue = async (req, res) => {
    var result = "";
    var data = "";
    try {
        // reset particular optimizer
        if (req.body.group === 'optimizer') {
            console.log(`Resetting to default value particular optimizer ${req.body.id}`);
            const optimizerIDS = [req.body.id]
            const Optmizer = await OptimizerModel.findOne({ _id: req.body.id });

            if (Optmizer.isOnline) {
                result = await UpdateSettings(optimizerIDS, data);
            } else {
                return res.status(503).json({ success: false, message: "Device is not online. Please try again.", key: "optimizer_status" });
            }
        }

        // reset all optimizer assign with the gateway => optimizers
        if (req.body.group === 'gateway') {
            console.log(`Resetting to default value gateway => optimizers`);
            const gateway_id = req.body.id;
            const allOptimizer = await OptimizerModel.find({ GatewayId: gateway_id });

            // Check if any optimizer is offline
            const offlineOptimizer = allOptimizer.find(optimizer => !optimizer.isOnline);

            if (offlineOptimizer) {
                return res.status(503).json({ success: false, message: "Not all optimizers under this gateway are online. Please try again.", key: "optimizer_status" });
            }

            const optimizerIDS = allOptimizer.map(item => item._id);
            result = await UpdateSettings(optimizerIDS, data);
        }

        // reset all optimizer assign with the location => gateways => optimizers
        if (req.body.group === 'location') {
            console.log(`Resetting to default value location => gateways => optimizers`);
            const location_id = req.body.id;
            const Location = await LocationModel.findOne({ _id: location_id });
            const allGateway = await GatewayModel.find({ EnterpriseInfo: Location._id });

            // Array to hold offline optimizers
            const offlineOptimizers = [];

            // Iterate through each gateway to retrieve optimizers
            const optimizerIDS = await Promise.all(allGateway.map(async (gateway) => {
                const allOptimizer = await OptimizerModel.find({ GatewayId: gateway._id });

                // Check if any optimizer is offline and push it to the offlineOptimizers array
                const offline = allOptimizer.some(optimizer => !optimizer.isOnline);
                if (offline) {
                    offlineOptimizers.push(...allOptimizer.filter(optimizer => !optimizer.isOnline).map(optimizer => optimizer._id));
                }

                return allOptimizer.map((item) => item._id);
            }));

            // If there are offline optimizers, return an appropriate response
            if (offlineOptimizers.length > 0) {
                return res.status(503).json({ success: false, message: "Not all optimizers under all gateways in this location are online. Please try again.", key: "optimizer_status" });
            }

            // Flatten the optimizerIDS array and update settings for all optimizers
            result = await UpdateSettings(optimizerIDS.flat(), data);
        }

        // reset all optimizer assign with the state => locations => gateways => optimizers
        if (req.body.group === 'state') {
            console.log(`Resetting to default value state => locations => gateways => optimizers`);
            const state_id = req.body.id;
            const State = await StateModel.findOne({ _id: state_id });

            const allLocation = await LocationModel.find({ Enterprise_ID: State.Enterprise_ID, State_ID: State.State_ID });

            // Array to hold offline optimizers
            const offlineOptimizers = [];

            // Iterate through each location to retrieve gateways and their associated optimizers
            const optimizerIDS = await Promise.all(allLocation.map(async (location) => {
                const allGateway = await GatewayModel.find({ EnterpriseInfo: location._id });

                // Using Promise.all to wait for all OptimizerModel.find() queries to complete
                const optimizerPromises = allGateway.map(async (gateway) => {
                    const allOptimizer = await OptimizerModel.find({ GatewayId: gateway._id });

                    // Check if any optimizer is offline and push it to the offlineOptimizers array
                    const offline = allOptimizer.some(optimizer => !optimizer.isOnline);
                    if (offline) {
                        offlineOptimizers.push(...allOptimizer.filter(optimizer => !optimizer.isOnline).map(optimizer => optimizer._id));
                    }

                    return allOptimizer.map((item) => item._id);
                });

                return Promise.all(optimizerPromises);
            }));

            // If there are offline optimizers, return an appropriate response
            // console.log({offlineOptimizers});

            if (offlineOptimizers.length > 0) {
                return res.status(503).json({ success: false, message: "One or more optimizers are offline under this state. Please try again.", key: "optimizer_status" });
            }

            const flattenedOptimizerIDs = optimizerIDS.flat();
            result = await UpdateSettings(flattenedOptimizerIDs.flat(), data);
        }

        // reset all optimizer assign with the enterprise => states => locations => gateways => optimizers
        if (req.body.group === 'enterprise') {
            console.log(`Resetting to default value enterprise => states => locations => gateways => optimizers`);

            const enterprise_id = req.body.id;
            const Enterprise = await EnterpriseModel.findOne({ _id: enterprise_id });
            const allState = await StateModel.find({ Enterprise_ID: Enterprise._id });

            // Array to hold offline optimizers
            const offlineOptimizers = [];

            // Iterate through each state to retrieve locations, gateways, and their associated optimizers
            const optimizerIDS = await Promise.all(allState.map(async (state) => {
                const allLocation = await LocationModel.find({ Enterprise_ID: state.Enterprise_ID, State_ID: state.State_ID });

                // Using Promise.all to wait for all OptimizerModel.find() queries to complete
                const optimizerPromises = await Promise.all(allLocation.map(async (location) => {
                    const allGateway = await GatewayModel.find({ EnterpriseInfo: location._id });

                    // Using Promise.all to wait for all OptimizerModel.find() queries to complete
                    const gatewayPromises = allGateway.map(async (gateway) => {
                        const allOptimizer = await OptimizerModel.find({ GatewayId: gateway._id });

                        // Check if any optimizer is offline and push it to the offlineOptimizers array
                        const offline = allOptimizer.some(optimizer => !optimizer.isOnline);
                        if (offline) {
                            offlineOptimizers.push(...allOptimizer.filter(optimizer => !optimizer.isOnline).map(optimizer => optimizer._id));
                        }

                        return allOptimizer.map((item) => item._id);
                    });

                    return Promise.all(gatewayPromises);
                }));

                return optimizerPromises.flat();
            }));

            // If there are offline optimizers, return an appropriate response
            if (offlineOptimizers.length > 0) {
                return res.status(503).json({ success: false, message: "One or more optimizers are offline under this enterprise. Please try again.", key: "optimizer_status" });
            }

            // Flatten the array of arrays containing optimizer IDS
            const flattenedOptimizerIDs = optimizerIDS.flat();
            result = await UpdateSettings(flattenedOptimizerIDs.flat(), data);
        }

        if (result) {
            return res.send({ success: true, message: `Optimizer Settings values Reset successfully.` });
        } else {
            return res.status(500).send({ success: false, message: 'Internal Server Error: Unable to set result.' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ success: false, message: `Internal Server Error: ${error.message}` });
    }
};



// -----------------------------------------------------------------------------------------
///API 1-----schedule

exports.ScheduleByPass = async (req, res) => {
    logger.info("----------bypass optimizer api is running-------");
    const { OptimizerId, startTime, endTime, GatewayID } = req.body;

    const now = Math.floor(Date.now() / 1000);

    // Check if required fields are present in the request body
    if (!startTime || !endTime || !GatewayID && (endTime > startTime)) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields: startTime, endTime, or GatewayID"
        });
    }
    // Ensure startTime is greater than or equal to the current time (now)
    if (startTime < now) {
        return res.status(400).json({
            success: false,
            message: "startTime should be greater than or equal to the current time"
        });
    }

    // Ensure startTime is less than endTime
    if (startTime >= endTime) {
        return res.status(400).json({
            success: false,
            message: "startTime should be less  endTime"
        });
    }


    const Status = "active";
    const ByPassType = "schedule";
    try {
        let optimizerIds = [];
        if (!OptimizerId) {

            // If GatewayID is provided but OptimizerId is not, fetch optimizer IDs from the GatewayModel
            const optids = await GatewayModel.aggregate([
                {
                    $match: {
                        GatewayID: GatewayID,
                    }
                },
                {
                    $lookup: {
                        from: "optimizers",
                        localField: "_id",
                        foreignField: "GatewayId",
                        as: "optimizerInfo"
                    }
                },
                {
                    $unwind: "$optimizerInfo"
                },
                {
                    $group: {
                        _id: "$GatewayID",
                        optimizerIds: {
                            $addToSet: "$optimizerInfo.OptimizerID"
                        }
                    }
                }
            ]).exec();

            if (!optids.length) {
                return res.status(200).json({
                    success: true,
                    message: "No optimizer IDs found for the given Gateway ID",
                    data: []
                });
            }

            optimizerIds = optids[0].optimizerIds;
        } else {
            optimizerIds = [OptimizerId];
        }

        console.log(optimizerIds, "+++++++++++++++++++");

        // Check if any existing bypass with Status "active" exists for the same GatewayID and OptimizerId
        const existingByPass = await OptimizerByPassModel.find({
            GatewayID: GatewayID,
            OptimizerId: { $in: optimizerIds },
            Status: "active"
        });


        // If the existingByPass array contains documents, a bypass already exists
        if (existingByPass.length > 0) {
            return res.status(400).json({
                success: false,
                message: "A bypass with Status 'active' already exists for the provided GatewayID and OptimizerId(s)."
            });
        }
        const optimizerByPassDataArray = optimizerIds.map(optimizerId => ({
            GatewayID: GatewayID,
            OptimizerId: optimizerId,
            ByPassType,
            Status,
            startTime,
            endTime,
            deviceStatus: null
        }));
        console.log("this is working !!!!!!!!!!!!!");

        await OptimizerByPassModel.insertMany(optimizerByPassDataArray);

        return res.status(200).json({ success: true, message: "Bypass schedule created successfully." });

    } catch (error) {
        logger.error({ error: error.message });
        return res.status(500).json({ success: false, message: `Internal Server Error: ${error.message}` });
    }
};
///for instant bypass on/off---------API 2--
exports.TurnByPassOnOff = async (req, res) => {
    const { OptimizerId, Status, GatewayID } = req.body;

    if (!Status || !GatewayID) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields: Status or GatewayID"
        });
    }

    const ByPassType = "instant";
    let optimizerIds = [];
    let message = "";

    try {
        // Fetch optimizerIds if not provided
        if (!OptimizerId) {
            const optids = await GatewayModel.aggregate([
                { $match: { GatewayID: GatewayID } },

                {
                    $lookup: {
                        from: "optimizers",
                        localField: "_id",
                        foreignField: "GatewayId",
                        as: "optimizerInfo"
                    }
                },
                { $unwind: "$optimizerInfo" },

                {

                    $group: {
                        _id: "$GatewayID",
                        optimizerIds: { $addToSet: "$optimizerInfo.OptimizerID" }
                    }
                }
            ]).exec();

            if (!optids.length) {
                return res.status(200).json({
                    success: true,
                    message: "No optimizer IDs found for the given Gateway ID",
                    data: []
                });

            }

            optimizerIds = optids[0].optimizerIds;
        } else {
            optimizerIds = [OptimizerId];
        }

        // Handle turning bypass on (Status: "on")
        if (Status === "on") {
            const existingActiveRecords = await OptimizerByPassModel.find({
                OptimizerId: { $in: optimizerIds },
                GatewayID: GatewayID,
                Status: "active"
            });

            if (existingActiveRecords.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "A bypass with Status 'active' already exists for the provided GatewayID and OptimizerId(s)."
                });
            }

            const now = Math.floor(Date.now() / 1000);
            const newByPassRecords = optimizerIds.map(optimizerId => ({
                GatewayID: GatewayID,
                OptimizerId: optimizerId,
                ByPassType,
                Status: "active",
                startTime: now,
                endTime: ""
            }));

            await OptimizerByPassModel.insertMany(newByPassRecords);
            message = "Bypass created successfully with startTime as 'now'.";
        }

        // Handle turning bypass off (Status: "off")
        else if (Status === "off") {
            const activeRecords = await OptimizerByPassModel.find({
                OptimizerId: { $in: optimizerIds },
                GatewayID: GatewayID,
                Status: "active"
            });

            if (activeRecords.length > 0) {
                const now = Math.floor(Date.now() / 1000);
                await OptimizerByPassModel.updateMany(
                    { _id: { $in: activeRecords.map(record => record._id) } },
                    { $set: { endTime: now, Status: "inactive" } }
                );
                message = "Active bypasses updated successfully with endTime as 'now'.";
            } else {
                return res.status(400).json({
                    success: false,
                    message: "No active bypasses found for the provided GatewayID and OptimizerId(s)."
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid Status value. It must be either 'on' or 'off'."
            });
        }

        // Return success response
        return res.status(200).json({
            success: true,
            message: message
        });

    } catch (error) {
        logger.error({ error: error.message });
        return res.status(500).json({ success: false, message: `Internal Server Error: ${error.message}` });
    }
};

//for schedule delete ----API 3
exports.DeleteScheduleByPass = async (req, res) => {
    logger.info("----------bypass optimizer delete API is running-------");

    const { OptimizerId, GatewayID } = req.body;
    // console.log(OptimizerId, "+++++++++++++++");

    // Check if required fields are present in the request body
    if (!GatewayID) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields:  GatewayID"
        });
    }

    try {

        let optimizerIds = [];
        if (!OptimizerId) {
            // If GatewayID is provided but OptimizerId is not, fetch optimizer IDs from the GatewayModel
            const optids = await GatewayModel.aggregate([
                {
                    $match: {
                        GatewayID: GatewayID,
                    }
                },
                {
                    $lookup: {
                        from: "optimizers",
                        localField: "_id",
                        foreignField: "GatewayId",
                        as: "optimizerInfo"
                    }
                },
                {
                    $unwind: "$optimizerInfo"
                },
                {
                    $group: {
                        _id: "$GatewayID",
                        optimizerIds: {
                            $addToSet: "$optimizerInfo.OptimizerID"
                        }
                    }
                }
            ]).exec();

            if (!optids.length) {
                return res.status(200).json({
                    success: true,
                    message: "No optimizer IDs found for the given Gateway ID",
                    data: []

                });
            }

            optimizerIds = optids[0].optimizerIds;
        } else {
            optimizerIds = [OptimizerId];
        }
        const now = Math.floor(Date.now() / 1000)

        // Check if there is an active record with ByPassType = "schedule" and Status = "on"
        const activeBypassRecord = await OptimizerByPassModel.find({
            OptimizerId: { $in: optimizerIds },
            GatewayID: GatewayID,
            ByPassType: "schedule",
            deviceStatus: null,
            Status: "active"
        });

        // If an active bypass record exists, update it with endTime as "now"
        if (activeBypassRecord.length === optimizerIds.length) {
            // Update the record's endTime and Status to "off"
            await OptimizerByPassModel.updateMany(
                { OptimizerId: { $in: optimizerIds }, Status: "active" },  // Match active bypass records by OptimizerId
                { $set: { endTime: now, Status: "inactive" } }
            );

            return res.status(200).json({
                success: true,
                message: "Scheduled bypass canceled successfully. EndTime set to 'now'."
            });
        } else {
            return res.status(404).json({
                success: false,
                message: "No active scheduled bypass found for the given OptimizerId and GatewayID."
            });
        }

        return res.status(400).json({
            success: false,
            message: "Status must be 'active' or 'inactive', and a valid condition must be met to update."
        });

    } catch (error) {
        logger.error({ error: error.message });
        return res.status(500).json({ success: false, message: `Internal Server Error: ${error.message}` });
    }
};
// ----------------------------------------------------------------------------------------

//for schedule delete ----API 3
exports.BypassDelete = async (req, res) => {
    logger.info("----------bypass optimizer delete API is running-------");

    const { OptimizerId, GatewayID, ByPassType, Status } = req.body;

    // Check if required fields are present in the request body
    if (!ByPassType || !Status || !OptimizerId || !GatewayID) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields: ByPassType, Status, OptimizerId, or GatewayID"
        });
    }
    try {
        // Check if there is an active record with ByPassType = "schedule" and Status = "on"
        const activeBypassRecord = await OptimizerByPassModel.find({
            OptimizerId: { $in: OptimizerId },
            GatewayID: GatewayID,
            ByPassType: "schedule",
            Status: "active"
        });

        // If an active bypass record exists, update it with endTime as "now"
        if (activeBypassRecord) {
            const now = Math.floor(Date.now() / 1000)

            // Update the record's endTime and Status to "off"
            await OptimizerByPassModel.updateMany(
                { _id: activeBypassRecord._id },
                { $set: { endTime: now} }
            );

            return res.status(200).json({
                success: true,
                message: "Active bypass canceled successfully. EndTime set to 'now'."
            });
        } else {
            return res.status(404).json({
                success: false,
                message: "No active scheduled bypass found for the given OptimizerId and GatewayID."
            });
        }

    } catch (error) {
        logger.error({ error: error.message });
        return res.status(500).json({ success: false, message: `Internal Server Error: ${error.message}` });
    }
};
// Settings acknowledgement after set/rest
exports.BypassSetRestSettingsAcknowledgement = async (req, res) => {
    console.log(req.body);

    const DATA = req.body;
    console.log({ Acknowledgement: DATA });
    try {
        const gatewayLocationMap = {};
        let purpose;

        const results = await Promise.all(DATA.map(async item => {
            const { OptimizerID } = item;
            purpose = item.purpose;
            console.log({ BypassSetRestSettingsAcknowledgement: OptimizerID });
            if (purpose === "set") {
                const Optimizer = await OptimizerModel.findOne({ OptimizerID: OptimizerID });

                if (Optimizer) {
                    await OptimizerModel.findByIdAndUpdate(
                        { _id: Optimizer._id },
                        { isSetting: false },
                        { new: true }
                    );
                    return { success: true, message: `IsSetting updated successfully for '${OptimizerID}' this Optimizer.` };
                } else {
                    return { success: false, message: "No document found for this OptimizerID." };
                }
            }
            if (purpose === "reset") {
                const Optimizer = await OptimizerModel.findOne({ OptimizerID: OptimizerID });

                if (Optimizer) {
                    await OptimizerModel.findByIdAndUpdate(
                        { _id: Optimizer._id },
                        { isReset: false },
                        { new: true }
                    );
                    return { success: true, message: `IsReset updated successfully for '${OptimizerID}' this Optimizer.` };
                } else {
                    return { success: false, message: "No document found for this OptimizerID." };
                }
            }
            if (purpose === "bypass_on") {
                await OptimizerByPassModel.updateOne(
                    { OptimizerId: OptimizerID, Status: "active" }, // Query condition to find the document
                    { $set: { deviceStatus: "active" } } // Update the Status to "Inactive"
                );
                return { success: true, message: `bypass_on updated successfully for '${OptimizerID}' this Optimizer.` };

            } else if (purpose === "bypass_off") {
                console.log("This is not working");

                await OptimizerByPassModel.updateOne(
                    { OptimizerId: OptimizerID, Status: "inactive", deviceStatus: "active" }, // Query condition to find the document
                    { $set: { deviceStatus: "inactive" } } // Update the Status to "Inactive"
                );
                return { success: true, message: `bypass_off updated successfully for '${OptimizerID}' this Optimizer.` };
            }
            return { success: false, message: "Invalid purpose." };
        }));



        const isSuccess = results.every(result => result.success);
        const statusCode = isSuccess ? 200 : 500;

        return res.status(statusCode).send({ success: isSuccess, results });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ success: false, message: `Internal Server Error: ${error.message}` });
    }
};


// GetOptimizerCurrentSettingValue 

exports.GetOptimizerCurrentSettingValue = async (req, res) => {
    const { optimzerID } = req.params;
    try {
        const Optmizer = await OptimizerModel.findOne({ OptimizerID: optimzerID });
        if (Optmizer) {
            const LatestOptimizerSettingsValue = await OptimizerSettingValueModel
                .findOne({ optimizerID: Optmizer._id })
                .sort({ updatedAt: -1 });

            return res.status(200).json({ success: true, message: "Data fetched successfully.", data: LatestOptimizerSettingsValue ?? "No previous data" });
        } else {
            return res.status(404).json({ success: false, message: "Optimizer Not Found.", key: "optimizer" });
        }

        // if (Optmizer.isOnline) {
        //     result = await UpdateSettings(optimizerIDS, data);
        // } else {
        //     return res.status(503).json({ success: false, message: "Device is not online. Please try again.", key: "optimizer_status" });
        // }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ success: false, message: `Internal Server Error: ${error.message}` });
    }
};



const compressor = async (data) => {
    const { Opt_id, OptimizerID, CompStatus, OptimizerMode, TimeStamp, Flag, Ac_Status } = data;

    let newData = {
        Opt_id,
        OptimizerID,
        CompStatus: Ac_Status === "OFF" ? "--" : CompStatus,
        OptimizationMode: Ac_Status === "OFF" ? "--" : OptimizerMode,
        TimeStamp,
        Flag,
        ACStatus: Ac_Status
    };

    const lastLog = await NewApplianceLogModel.findOne({ OptimizerID }).sort({ createdAt: -1 });
    const OptlastLog = await OptimizerLogModel.find({ OptimizerID: Opt_id }).sort({ createdAt: -1 }).limit(2);
    const secondLastLog = OptlastLog.length > 1 ? OptlastLog[1] : null;

    if (lastLog) {
        const timeDiffSeconds = Number(newData.TimeStamp) - Number(secondLastLog?.TimeStamp) || 0;
        const offlineData = {
            Opt_id,
            OptimizerID,
            CompStatus: "--",
            OptimizationMode: "--",
            TimeStamp: Number(secondLastLog?.TimeStamp) + 1, // Increment last log timestamp by 1 second
            Flag: "OFFLINE",
            ACStatus: "OFF"
        };

        if (timeDiffSeconds > 300 && lastLog.ACStatus !== "OFF") {



            // Add offline data entry
            const offlineLog = new NewApplianceLogModel(offlineData);

            await offlineLog.save();



            // Save new data entry
            const newAllApplianceLog = new NewApplianceLogModel(newData);
            await newAllApplianceLog.save();
            return;
        }

        // Handle different cases for saving the new data
        if (lastLog.Flag !== "OFFLINE" && Flag === "OFFLINE" && lastLog.ACStatus !== Ac_Status) {



            const newAllApplianceLog = new NewApplianceLogModel(newData);
            await newAllApplianceLog.save();
            return;
        }
        if ((newData.OptimizationMode !== lastLog.OptimizationMode || newData.CompStatus !== lastLog.CompStatus) && Flag !== "OFFLINE") {



            const newAllApplianceLog = new NewApplianceLogModel(newData);
            await newAllApplianceLog.save();
        } else if (newData.OptimizationMode === lastLog.OptimizationMode && newData.CompStatus !== lastLog.CompStatus) {

            const newAllApplianceLog = new NewApplianceLogModel(newData);
            await newAllApplianceLog.save();
        } else if (newData.OptimizationMode !== lastLog.OptimizationMode && newData.CompStatus === lastLog.CompStatus) {
            console.log({ success: false, message: "Unable to Save Data", data });
        }
    } else {



        // Save new data entry if there's no previous log
        const newAllApplianceLog = new NewApplianceLogModel(newData);
        await newAllApplianceLog.save();
    }

    // console.log({ success: true, message: "Data Saved Successfully", data: newData });
};


// const saveToFileSystem = (OptimizerID, data) => {
//     const filePath = path.join(__dirname, 'logs', `${OptimizerID}.json`);

//     // Ensure the logs directory exists
//     fs.mkdirSync(path.dirname(filePath), { recursive: true });

//     // Append data to the file
//     fs.appendFileSync(filePath, JSON.stringify(data, null, 2) + '\n', (err) => {
//         if (err) {
//             console.error('Failed to write to file', err);
//         } else {
//             console.log('Data successfully saved to file');
//         }
//     });
// };


exports.deviceStatus = async (req, res) => {

    const data = req.body;
    const { HardwareID, DeviceStatus, Type, TimeStamp } = data;

    try {
        // Create a new instance of DeviceStatusModel
        const newDeviceStatus = new DeviceStatusModel({
            HardwareID,
            DeviceStatus,
            Type,
            TimeStamp
        });

        // Save the instance to the database
        await newDeviceStatus.save();
        console.log(newDeviceStatus.createdAt); // Log createdAt in UTC

        // Convert createdAt (UTC) to IST
        const dateInUTC = new Date(newDeviceStatus.createdAt);
        const unixTimestampIST = dateInUTC.getTime() + (5.5 * 60 * 60 * 1000); // Add IST offset
        const unixTimestampInSecondsIST = Math.floor(unixTimestampIST / 1000); // Convert to seconds

        // Send a success response
        res.status(200).send({
            success: true,
            message: `Device status saved successfully set at ${unixTimestampInSecondsIST}`
        });
    } catch (error) {
        console.error({ StoreError: error.message });
        res.status(404).send({ success: false, message: error.message });
    }
}; 
