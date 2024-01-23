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
        if (!Gateway) {
            return res.status(401).json({ success: false, message: "Gateway ID not found!" });
        };

        const Optimizers = await OptimizerModel.find({ GatewayId: Gateway._id });
        const optObject = await Promise.all(Optimizers.map(async (element) => {
            const OptimizerSettings = await OptimizerSettingValueModel.findOne({ optimizerID: element._id });

            return {
                "optimizer_id": element.OptimizerID,
                "is_bypass": element.isBypass,
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
        // return res.status(200).json({ success: true, message: "Data fetched successfully.", data: NewObj });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Store Gatewat & Optimizer Loga data 
exports.Store = async (req, res) => {
    const data = req.body;
    const optimizers = req.body.OptimizerDetails;

    // Helper function to handle "nan" values
    const handleNaN = (value) => {
        return isNaN(parseFloat(value)) ? 0 : parseFloat(value);
    };

    try {
        const gateway = await GatewayModel.findOne({ GatewayID: req.body.GatewayID });
        // return console.log(gateway);
        if (!gateway) {
            throw new Error(`Gateway with ID ${req.body.GatewayID} not found`);
        }

        const gatewayId = gateway._id;
        const { Phases, KVAH, KWH, PF } = data;

        // Convert "nan" values to 0
        const sanitizedPhases = Object.keys(Phases).reduce((acc, phase) => {
            acc[phase] = {
                Voltage: handleNaN(Phases[phase].Voltage),
                Current: handleNaN(Phases[phase].Current),
                ActivePower: handleNaN(Phases[phase].ActivePower),
                PowerFactor: handleNaN(Phases[phase].PowerFactor),
                ApparentPower: handleNaN(Phases[phase].ApparentPower),
            };
            return acc;
        }, {});

        const gatewayLog = await GatewayLogModel({
            GatewayID: gatewayId,
            Phases: sanitizedPhases,
            KVAH: handleNaN(KVAH),
            KWH: handleNaN(KWH),
            PF: handleNaN(PF),
        }).save();

        const optimizerLogPromises = optimizers.map(async element => {
            const optimizer = await OptimizerModel.findOne({ OptimizerID: element.OptimizerID });
            // return console.log(optimizer);
            if (!optimizer) {
                console.log(`Optimizer with ID ${req.body.OptimizerID} not found`);
            }

            // if (!optimizer.GatewayId.equals(gateway._id)) {
            //     console.log(`The Optimizer with ID ${req.body.OptimizerID} is not associated with the Gateway with ID ${req.body.GatewayID}. Please verify with the system administrator.`);
            // }

            if (optimizer) {
                return OptimizerLogModel({
                    OptimizerID: optimizer._id,
                    GatewayID: gatewayId,
                    GatewayLogID: gatewayLog._id,
                    TimeStamp: element.TimeStamp,
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

        // reset particular optimizer
        if (req.body.group === 'optimizer') {
            console.log(`Setting value particular optimizer ${req.body.id}`);
            const optimizerIDS = [req.body.id]
            result = await UpdateSettings(optimizerIDS, data);
        }

        // reset all optimizer assign with the gateway => optimizers
        if (req.body.group == 'gateway') {
            console.log(`Setting value gateway => optimizers`);
            const gateway_id = req.body.id;
            const allOptimizer = await OptimizerModel.find({ GatewayId: gateway_id });
            const optimizerIDS = await Promise.all(allOptimizer.map(async (item) => {
                return item._id;
            }));

            result = await UpdateSettings(optimizerIDS, data);
        }

        // reset all optimizer assign with the location => gateways => optimizers
        if (req.body.group == 'location') {
            console.log(`Setting value location => gateways => optimizers`);
            const location_id = req.body.id;
            const Location = await LocationModel.findOne({ _id: location_id });
            const allGateway = await GatewayModel.find({ EnterpriseInfo: Location._id });

            const optimizerIDS = await Promise.all(allGateway.map(async (gateway) => {
                const allOptimizer = await OptimizerModel.find({ GatewayId: gateway._id });
                return allOptimizer.map((item) => item._id);
            }));

            result = await UpdateSettings(optimizerIDS.flat(), data);
        }

        // reset all optimizer assign with the state => locations => gateways => optimizers
        if (req.body.group == 'state') {
            console.log(`Setting value state => locations => gateways => optimizers`);
            const state_id = req.body.id;
            const State = await StateModel.findOne({ _id: state_id });
            const allLocation = await LocationModel.find({ State_ID: State.State_ID });
            const optimizerIDS = await Promise.all(allLocation.map(async (location) => {
                const allGateway = await GatewayModel.find({ EnterpriseInfo: location._id });

                // Using Promise.all to wait for all OptimizerModel.find() queries to complete
                const optimizerPromises = allGateway.map(async (gateway) => {
                    const allOptimizer = await OptimizerModel.find({ GatewayId: gateway._id });
                    return allOptimizer.map((item) => item._id);
                });

                return Promise.all(optimizerPromises);
            }));
            const flattenedOptimizerIDs = optimizerIDS.flat();
            // console.log(flattenedOptimizerIDs.flat());
            result = await UpdateSettings(flattenedOptimizerIDs.flat(), data);
        }

        // reset all optimizer assign with the enterprise => states => locations => gateways => optimizers
        if (req.body.group === 'enterprise') {
            console.log(`Setting value enterprise => states => locations => gateways => optimizers`);

            const enterprise_id = req.body.id;
            const Enterprise = await EnterpriseModel.findOne({ _id: enterprise_id });
            const allState = await StateModel.find({ Enterprise_ID: Enterprise._id });

            const optimizerIDS = await Promise.all(allState.map(async (state) => {
                const allLocation = await LocationModel.find({ State_ID: state.State_ID });

                // Using Promise.all to wait for all OptimizerModel.find() queries to complete
                const optimizerPromises = await Promise.all(allLocation.map(async (location) => {
                    const allGateway = await GatewayModel.find({ EnterpriseInfo: location._id });

                    const gatewayPromises = allGateway.map(async (gateway) => {
                        const allOptimizer = await OptimizerModel.find({ GatewayId: gateway._id });
                        return allOptimizer.map((item) => item._id);
                    });

                    return Promise.all(gatewayPromises);
                }));

                return optimizerPromises.flat();
            }));
            // Flatten the array of arrays containing optimizer IDS
            const flattenedOptimizerIDs = optimizerIDS.flat();
            // console.log(flattenedOptimizerIDs.flat());
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
            result = await UpdateSettings(optimizerIDS, data);
        }

        // reset all optimizer assign with the gateway => optimizers
        if (req.body.group == 'gateway') {
            console.log(`Resetting to default value gateway => optimizers`);
            const gateway_id = req.body.id;
            const allOptimizer = await OptimizerModel.find({ GatewayId: gateway_id });
            const optimizerIDS = await Promise.all(allOptimizer.map(async (item) => {
                return item._id;
            }));

            result = await UpdateSettings(optimizerIDS, data);
        }

        // reset all optimizer assign with the location => gateways => optimizers
        if (req.body.group == 'location') {
            console.log(`Resetting to default value location => gateways => optimizers`);
            const location_id = req.body.id;
            const Location = await LocationModel.findOne({ _id: location_id });
            const allGateway = await GatewayModel.find({ EnterpriseInfo: Location._id });

            const optimizerIDS = await Promise.all(allGateway.map(async (gateway) => {
                const allOptimizer = await OptimizerModel.find({ GatewayId: gateway._id });
                return allOptimizer.map((item) => item._id);
            }));

            result = await UpdateSettings(optimizerIDS.flat(), data);
        }

        // reset all optimizer assign with the state => locations => gateways => optimizers
        if (req.body.group == 'state') {
            console.log(`Resetting to default value state => locations => gateways => optimizers`);
            const state_id = req.body.id;
            const State = await StateModel.findOne({ _id: state_id });
            const allLocation = await LocationModel.find({ State_ID: State.State_ID });
            const optimizerIDS = await Promise.all(allLocation.map(async (location) => {
                const allGateway = await GatewayModel.find({ EnterpriseInfo: location._id });

                // Using Promise.all to wait for all OptimizerModel.find() queries to complete
                const optimizerPromises = allGateway.map(async (gateway) => {
                    const allOptimizer = await OptimizerModel.find({ GatewayId: gateway._id });
                    return allOptimizer.map((item) => item._id);
                });

                return Promise.all(optimizerPromises);
            }));
            const flattenedOptimizerIDs = optimizerIDS.flat();
            // console.log(flattenedOptimizerIDs.flat());
            result = await UpdateSettings(flattenedOptimizerIDs.flat(), data);
        }

        // reset all optimizer assign with the enterprise => states => locations => gateways => optimizers
        if (req.body.group === 'enterprise') {
            console.log(`Resetting to default value enterprise => states => locations => gateways => optimizers`);

            const enterprise_id = req.body.id;
            const Enterprise = await EnterpriseModel.findOne({ _id: enterprise_id });
            const allState = await StateModel.find({ Enterprise_ID: Enterprise._id });

            const optimizerIDS = await Promise.all(allState.map(async (state) => {
                const allLocation = await LocationModel.find({ State_ID: state.State_ID });

                // Using Promise.all to wait for all OptimizerModel.find() queries to complete
                const optimizerPromises = await Promise.all(allLocation.map(async (location) => {
                    const allGateway = await GatewayModel.find({ EnterpriseInfo: location._id });

                    const gatewayPromises = allGateway.map(async (gateway) => {
                        const allOptimizer = await OptimizerModel.find({ GatewayId: gateway._id });
                        return allOptimizer.map((item) => item._id);
                    });

                    return Promise.all(gatewayPromises);
                }));

                return optimizerPromises.flat();
            }));
            // Flatten the array of arrays containing optimizer IDS
            const flattenedOptimizerIDs = optimizerIDS.flat();
            // console.log(flattenedOptimizerIDs.flat());
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
    const { group, id } = req.body;
    try {
        // bypass from device level
        if (group === "optimizer") {
            const Optimizer = await OptimizerModel.findOne({ OptimizerID: id });
            if (Optimizer) {
                await OptimizerModel.findByIdAndUpdate({ _id: Optimizer._id },
                    { Switch: true },
                    { new: true } // This option returns the modified document rather than the original
                );
                return res.status(200).json({ success: true, message: "Optimizer updated successfully." });
            } else {
                return res.status(404).json({ success: false, message: "Optimizer not found." });
            }
        }

        // bypass from gateway level
        if (group === "gateway") {
            const Gateway = await GatewayModel.findOne({ GatewayID: id });
            if (Gateway) {
                // Find all optimizers related to the gateway
                const Optimizers = await OptimizerModel.find({ GatewayId: Gateway._id });
                if (Optimizers) {
                    // Update the "Switch" field for all optimizers
                    await OptimizerModel.updateMany({ GatewayId: Gateway._id },
                        { $set: { Switch: true } }
                    );
                    return res.status(200).json({ success: true, message: "Optimizers updated successfully. Optimizer bypass operation completed." });
                } else {
                    return res.status(404).json({ success: false, message: "Optimizers not found." });
                }
            } else {
                return res.status(404).json({ success: false, message: "Gateway not found." });
            }
        }

        // bypass from location level
        if (group === "location") {
            const Location = await EnterpriseStateLocationModel.findOne({ _id: id });
            if (Location) {
                // Find all gateways related to the location
                const Gateways = await GatewayModel.find({ EnterpriseInfo: Location._id });
                // Loop through all gateways and find associated optimizers
                for (const Gateway of Gateways) {
                    // Update the "Switch" field for all optimizers
                    await OptimizerModel.updateMany({ GatewayId: Gateway._id },
                        { $set: { Switch: true } }
                    );
                }

                return res.status(200).json({ success: true, message: "Optimizers updated successfully." });
            } else {
                return res.status(404).json({ success: false, message: "Location not found." });
            }
        }

    } catch (error) {
        console.error(error);
        return res.status(500).send({ success: false, message: `Internal Server Error: ${error.message}` });
    }
};

// Settings acknowledgement after set/rest
exports.SetRestSettingsAcknowledgement = async (req, res) => {
    const { purpose, optimizerIDS } = req.body;
    try {
        if (purpose === "set") {
            const OptimizerisSettingUpdate = await Promise.all(optimizerIDS.map(async id => {
                const Optimizer = await OptimizerModel.findOne({ OptimizerID: id });
                // Check if Optimizer exists before attempting to update
                if (Optimizer) {
                    await OptimizerModel.findByIdAndUpdate(
                        { _id: Optimizer._id },
                        { isSetting: false },
                        { new: true }
                    );
                    return true;  // Indicate successful update for this OptimizerID
                } else {
                    return false; // Indicate that no document was found for this OptimizerID
                }
            }));

            if (OptimizerisSettingUpdate.every(update => update !== false)) {
                return res.status(200).send({ success: true, message: "IsSetting updated successfully." });
            } else {
                return res.status(500).send({ success: false, message: "Failed to update IsSetting." });
            }
        }

        if (purpose === "reset") {
            const OptimizerisResetUpdate = await Promise.all(optimizerIDS.map(async id => {
                const Optimizer = await OptimizerModel.findOne({ OptimizerID: id });
                // Check if Optimizer exists before attempting to update
                if (Optimizer) {
                    await OptimizerModel.findByIdAndUpdate(
                        { _id: Optimizer._id },
                        { isReset: false },
                        { new: true }
                    );
                    return true;  // Indicate successful update for this OptimizerID
                } else {
                    return false; // Indicate that no document was found for this OptimizerID
                }
            }));

            if (OptimizerisResetUpdate.every(update => update !== false)) {
                return res.status(200).send({ success: true, message: "IsReset updated successfully." });
            } else {
                return res.status(500).send({ success: false, message: "Failed to update IsReset." });
            }
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ success: false, message: `Internal Server Error: ${error.message}` });
    }
};