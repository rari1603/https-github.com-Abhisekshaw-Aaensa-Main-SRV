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
const fs = require('fs');



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
        console.error(error);
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
        console.error(error.message);
        return res.status(500).send({ success: false, message: `Internal Server Error: ${error.message}` });
    }
};

// ConfigureableData
exports.ConfigureableData = async (req, res) => {
    try {
        const { gateway_id } = req.params;

        const Gateway = await GatewayModel.findOne({ GatewayID: gateway_id });
        console.log({ Gateway });
        if (!Gateway) {
            return res.status(401).json({ success: false, message: "Gateway ID not found!" });
        };

        const Optimizers = await OptimizerModel.find({ GatewayId: Gateway._id });
        const optObject = await Promise.all(Optimizers.map(async (element) => {
            const OptimizerSettings = await OptimizerSettingValueModel.findOne({ optimizerID: element._id });
            var bypassType = "default";
            if (element.isBypass.type === "true") {
                if (element.isBypass.is_schedule) {
                    //  check current time with bypass time
                    var currentTimestamp = Math.floor(Date.now() / 1000);
                    var scheduleTimestamp = new Date(element.isBypass.time).getTime() / 1000;
                    if (currentTimestamp >= scheduleTimestamp) {
                        bypassType = element.isBypass.type;
                    } else {
                        bypassType = "default";
                    }
                } else {
                    bypassType = element.isBypass.type;
                }

            } else if (element.isBypass.type === "false") {
                bypassType = "false"
            }

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
        console.log({ ConfigureableData: NewObj });
        return res.status(200).send(NewObj);
        // return res.status(200).json({ success: true, message: "Data fetched successfully.", data: NewObj });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Store Gateway & Optimizer Log data 
exports.Store = async (req, res) => {
    const data = req.body;
    const gateway_id = req.body.GatewayID;
    const optimizers = req.body.OptimizerDetails;

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
        const AssignedOptimizerIDs = AssignedOptimizers.map(optimizer => optimizer.OptimizerID.trim());

        const OnlineOptimizers = optimizers;

        // First, mark all optimizers as offline
        await OptimizerModel.updateMany(
            { OptimizerID: { $in: AssignedOptimizerIDs } },
            { $set: { isOnline: false } }
        );

        // Then, mark online optimizers
        await Promise.all(OnlineOptimizers.map(async optimizer => {
            const isAssigned = AssignedOptimizerIDs.includes(optimizer.OptimizerID);

            await OptimizerModel.updateOne(
                { OptimizerID: optimizer.OptimizerID },
                {
                    $set: {
                        isOnline: isAssigned
                    }
                },
                { new: true }
            );
        }));


        const gatewayId = gateway._id;
        const { TimeStamp, Phases, KVAH, KWH, PF } = data;

        // Convert "nan" values to 0
        const sanitizedPhases = Object.keys(Phases).reduce((acc, phase) => {
            acc[phase] = {
                Voltage: handleNaN(Phases[phase].Voltage).toFixed(5),
                Current: handleNaN(Phases[phase].Current).toFixed(5),
                ActivePower: handleNaN(Phases[phase].ActivePower).toFixed(5),
                PowerFactor: handleNaN(Phases[phase].PowerFactor).toFixed(5),
                ApparentPower: handleNaN(Phases[phase].ApparentPower).toFixed(5),
            };
            return acc;
        }, {});

        const gatewayLog = await GatewayLogModel({
            GatewayID: gatewayId,
            TimeStamp: TimeStamp,
            Phases: sanitizedPhases,
            KVAH: handleNaN(KVAH).toFixed(5),
            KWH: handleNaN(KWH).toFixed(5),
            PF: handleNaN(PF).toFixed(5),
        }).save();

        const optimizerLogPromises = optimizers.map(async element => {
            const optimizer = await OptimizerModel.findOne({ OptimizerID: element.OptimizerID });

            if (!optimizer) {
                console.log(`Optimizer with ID ${req.body.OptimizerID} not found`);
            }


            if (optimizer) {
                return OptimizerLogModel({
                    OptimizerID: optimizer._id,
                    GatewayID: gatewayId,
                    GatewayLogID: gatewayLog._id,
                    TimeStamp: TimeStamp,
                    RoomTemperature: element.RoomTemperature,
                    Humidity: element.Humidity,
                    CoilTemperature: element.CoilTemperature,
                    OptimizerMode: element.OptimizerMode,
                }).save();
            }
        });

        await Promise.all(optimizerLogPromises);

        return res.status(200).send({ success: true, message: "Logs created successfully", gatewayLog });

    } catch (error) {
        console.error(error);
        res.status(404).send({ success: false, message: error.message });
    }
};

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

// Optimizer switch bypass
exports.BypassOptimizers = async (req, res) => {
    const { is_schedule, schedule_time, state, group, id } = req.body;
    try {
        if (!(state === true || state === false) || !group || !id) {
            return res.status(404).json({ success: false, message: "Oops, there is a problem with updating!" });
        }

        // bypass from device level
        if (group === "optimizer") {
            const Optimizer = await OptimizerModel.findOne({ OptimizerID: id });

            if (Optimizer) {
                if (Optimizer?.isOnline) {
                    await OptimizerModel.findByIdAndUpdate(
                        { _id: Optimizer._id },
                        {
                            $set: {
                                BypassMode: "IN_PROGRESS",
                                isBypass: state ? { is_schedule, type: "true", time: schedule_time } : { is_schedule, type: "false", time: "" }
                            }
                        },
                        { new: true } // This option returns the modified document rather than the original
                    );
                    return res.status(200).json({ success: true, message: state ? "Bypass mode is in on state" : "Bypass mode is in off state" });
                } else {
                    return res.status(503).json({ success: false, message: "Device is not online. Please try again.", key: "optimizer_status" });
                }
            } else {
                return res.status(404).json({ success: false, message: "Optimizers not found." });
            }
        }

        // bypass from gateway level
        if (group === "gateway") {
            const Gateway = await GatewayModel.findOne({ GatewayID: id });

            if (Gateway) {
                // Find all optimizers related to the gateway
                const Optimizers = await OptimizerModel.find({ GatewayId: Gateway._id });

                if (Optimizers.length > 0) {
                    const allOptimizersOnline = Optimizers.every(optimizer => optimizer.isOnline);

                    if (allOptimizersOnline) {
                        // // Update the gateway model bypass mode
                        // await GatewayModel.findByIdAndUpdate(
                        //     { _id: Gateway._id },
                        //     {
                        //         $set: {
                        //             BypassMode: "IN_PROGRESS",
                        //         }
                        //     },
                        //     { new: true }
                        // );
                        // If all optimizers are online, update bypass mode for each optimizer
                        await Promise.all(Optimizers.map(async optimizer => {
                            await OptimizerModel.findByIdAndUpdate(
                                { _id: optimizer._id },
                                {
                                    $set: {
                                        BypassMode: "IN_PROGRESS",
                                        isBypass: state ? { is_schedule, type: "true", time: schedule_time } : { is_schedule, type: "false", time: "" }
                                    }
                                },
                                { new: true }
                            );
                        }));
                        return res.status(200).json({ success: true, message: state ? "Bypass mode is in on state" : "Bypass mode is in off state" });
                    } else {
                        return res.status(503).json({ success: false, message: "Not all optimizers under this gateway are online. Please try again.", key: "optimizer_status" });
                    }
                } else {
                    return res.status(404).json({ success: false, message: "Optimizers not found for this gateway." });
                }
            } else {
                return res.status(404).json({ success: false, message: "Gateway not found." });
            }
        }

        // bypass from location level
        if (group === "location") {
            const Location = await EnterpriseStateLocationModel.findOne({ _id: id });

            if (Location) {
                const Gateways = await GatewayModel.find({ EnterpriseInfo: Location._id });

                if (Gateways.length > 0) {
                    const allOptimizersOnline = await Promise.all(Gateways.map(async gateway => {
                        const Optimizers = await OptimizerModel.find({ GatewayId: gateway._id });
                        return Optimizers.every(optimizer => optimizer.isOnline);
                    }));

                    if (allOptimizersOnline.every(online => online)) {
                        // // Update the location model bypass mode
                        // await EnterpriseStateLocationModel.findByIdAndUpdate(
                        //     { _id: Location._id },
                        //     {
                        //         $set: {
                        //             BypassMode: "IN_PROGRESS",
                        //         }
                        //     },
                        //     { new: true }
                        // );
                        // If all optimizers under all gateways are online, update bypass mode for all optimizers
                        await Promise.all(Gateways.map(async gateway => {
                            const Optimizers = await OptimizerModel.find({ GatewayId: gateway._id });
                            await Promise.all(Optimizers.map(async optimizer => {
                                await OptimizerModel.findByIdAndUpdate(
                                    { _id: optimizer._id },
                                    {
                                        $set: {
                                            BypassMode: "IN_PROGRESS",
                                            isBypass: state ? { is_schedule, type: "true", time: schedule_time } : { is_schedule, type: "false", time: "" }
                                        }
                                    },
                                    { new: true }
                                );
                            }));
                        }));
                        return res.status(200).json({ success: true, message: state ? "Bypass mode is in on state" : "Bypass mode is in off state" });
                    } else {
                        return res.status(503).json({ success: false, message: "Not all optimizers under all gateways in this location are online. Please try again.", key: "optimizer_status" });
                    }
                } else {
                    return res.status(404).json({ success: false, message: "No gateways found for this location." });
                }
            } else {
                return res.status(404).json({ success: false, message: "Location not found." });
            }
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: `Internal Server Error: ${error.message}` });
    }
};

// Settings acknowledgement after set/rest
exports.BypassSetRestSettingsAcknowledgement = async (req, res) => {
    const DATA = req.body;
    console.log({ Acknowledgement: DATA });
    // writeToLog({ Acknowledgement: DATA });
    try {
        const results = await Promise.all(DATA.map(async item => {
            const { purpose, OptimizerID } = item;

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

            if (purpose === "bypass_on" || purpose === "bypass_off") {
                const Optimizer = await OptimizerModel.findOne({ OptimizerID: OptimizerID });
                console.log({ Optimizer });
                if (Optimizer) {
                    await OptimizerModel.findByIdAndUpdate(
                        { _id: Optimizer._id },
                        {
                            $set: {
                                BypassMode: (purpose === "bypass_on") ? "ON" : "OFF",
                                isBypass: { is_schedule: false, type: "default", time: "" }
                            },

                        },
                        { new: true }
                    );
                    console.log({ Optimizer });
                    // writeToLog({ Optimizer: Optimizer });
                    return { success: true, message: `IsBypass updated successfully for '${OptimizerID}' this Optimizer.` };
                } else {
                    return { success: false, message: "No document found for this OptimizerID." };
                }
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

// Function to write log to file
function writeToLog(logData) {
    const logFilePath = 'logfile.txt';

    // Convert log data to string
    const logMessage = JSON.stringify(logData, null, 2);

    // Append log message to the log file
    fs.appendFile(logFilePath, logMessage + '\n', (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        } else {
            console.log('Log message written to file:', logData);
        }
    });
}