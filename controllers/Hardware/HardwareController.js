const GatewayLogModel = require('../../models/GatewayLog.model');
const OptimizerLogModel = require('../../models/OptimizerLog.model');
const GatewayModel = require('../../models/gateway.model');
const OptimizerModel = require('../../models/optimizer.model');
const OptimizerDefaultSettingValueModel = require('../../models/OptimizerDefaultSettingValue.model');
const OptimizerSettingValueModel = require('../../models/OptimizerSettingValue.model');

exports.Config = async (req, res) => {
    // NGCS2023011003
    try {
        const { gateway_id } = req.params;

        const Gateway = await GatewayModel.findOne({ GatewayID: gateway_id });
        if (!Gateway) {
            return res.status(401).json({ success: false, message: "Gateway ID not found!" });
        }
        console.log(Gateway.GatewayID);

        // const GatewayUniqueID = Gateway._id;
        const Optimizers = await OptimizerModel.find({ GatewayId: Gateway._id });
        const optObject = Optimizers.map(element => ({
            "optimizer_id": element.OptimizerID,
            "is_bypass": element.Switch,
            "is_reset": true,
            "is_setting": true,
            "settings": {
                "FIRST POWERON OBSERVATION": "",
                "MAX COMPRESSOR TURNOFF COUNT PER HOUR": "",
                "OPTIMIZATION TIME": "",
                "STEADY STATEROOM TEMPERATURE TOLERANCE": "",
                "STEADY STATECOIL TEMPERATURE TOLERANCE": "",
                "STEADY STATE SAMPLING DURATION": "",
                "MIN AIR CONDITIONER OFF DURATION": "",
                "AIR CONDITIONER OFF DECLARATION MINPERIOD": "",
                "MAX OBSERVATION TIME": "",
                "THERMO STATE TIME INCREASE": "",
                "THERMO STATE INTERVAL": ""
            }
        }));

        var property;

        // if (Gateway.isConfigure) {
        //     property = {
        //         "flag": Gateway.isConfigure,
        //         "ssid": Gateway.NetworkSSID,
        //         "password": Gateway.NetworkPassword
        //     };
        // } else {
        //     property = {
        //         "flag": Gateway.isConfigure,
        //         "ssid": null,
        //         "password": null
        //     };
        // }
        const NewObj = {
            "gatewayID": Gateway.GatewayID,
            "config": Gateway.isConfigure,
            "optimizer": optObject

        };
        return res.send(NewObj);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: error.message });
    }
}


exports.Store = async (req, res) => {
    const data = req.body;
    const optimizers = req.body.OptimizerDetails;

    try {
        const gateway = await GatewayModel.findOne({ GatewayID: req.body.GatewayID });
        // return console.log(gateway);
        if (!gateway) {
            throw new Error(`Gateway with ID ${req.body.GatewayID} not found`);
        }

        const gatewayId = gateway._id;
        const { Phases, KVAH, KWH, PF } = data;

        const gatewayLog = await GatewayLogModel({
            GatewayID: gatewayId,
            Phases,
            KVAH,
            KWH,
            PF
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

        res.status(200).send({ success: true, message: "Logs created successfully", gatewayLog });

    } catch (error) {
        console.error(error);
        res.status(404).send({ success: false, message: error.message });
    }
};


// not in use
exports.Property = async (req, res) => {
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
}

exports.Feedback = async (req, res) => {

    var jlkj = OptimizerSettingValueModel({
        optimizerID: '6582fb2f1980116c336a10fb',
        powerOnObservation: 0,
        maxCompressorTurnoffCountPerHour: 0,
        optimizationTime: 0,
        steadyStateRoomTemperatureTolerance: 0,
        steadyStateCoilTemperatureTolerance: 0,
        steadyStateSamplingDuration: 0,
        minAirConditionerOffDuration: 0,
        airConditionerOffDeclarationMinPeriod: 0,
        maxObservationTime: 0,
        thermoStateTimeIncrease: 0,
        thermoStateInterval: 0
    });
    await jlkj.save();
    res.send(req.params);
}

exports.OptimizerDefaultSettingValue = async (req, res) => {

    const newValues = {
        powerOnObservation: req.body.powerOnObservation,
        maxCompressorTurnoffCountPerHour: req.body.maxCompressorTurnoffCountPerHour,
        optimizationTime: req.body.optimizationTime,
        steadyStateRoomTemperatureTolerance: req.body.steadyStateRoomTemperatureTolerance,
        steadyStateCoilTemperatureTolerance: req.body.steadyStateCoilTemperatureTolerance,
        steadyStateSamplingDuration: req.body.steadyStateSamplingDuration,
        minAirConditionerOffDuration: req.body.minAirConditionerOffDuration,
        airConditionerOffDeclarationMinPeriod: req.body.airConditionerOffDeclarationMinPeriod,
        maxObservationTime: req.body.maxObservationTime,
        thermoStateTimeIncrease: req.body.thermoStateTimeIncrease,
        thermoStateInterval: req.body.thermoStateInterval
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

exports.SetOptimizerSettingValue = async (req, res) => {
    try {
        const {
            optimizerID,
            powerOnObservation,
            maxCompressorTurnoffCountPerHour,
            optimizationTime,
            steadyStateRoomTemperatureTolerance,
            steadyStateCoilTemperatureTolerance,
            steadyStateSamplingDuration,
            minAirConditionerOffDuration,
            airConditionerOffDeclarationMinPeriod,
            maxObservationTime,
            thermoStateTimeIncrease,
            thermoStateInterval
        } = req.body;

        const result = await OptimizerSettingValueModel.findOneAndUpdate(
            { optimizerID },
            { $set: { ...req.body } },
            { new: true, upsert: true }
        );

        if (result) {
            return res.send({ success: true, message: `Settings values set successfully.` });
        } else {
            return res.status(500).send({ success: false, message: 'Internal Server Error: Unable to set result.' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ success: false, message: `Internal Server Error: ${error.message}` });
    }
};



exports.ResetOptimizerSettingValue = async (req, res) => {

    // first get the optimizer default value
    const defaultValue = await OptimizerDefaultSettingValueModel.findOne();
    let resetValues = {
        powerOnObservation: defaultValue.powerOnObservation,
        maxCompressorTurnoffCountPerHour: defaultValue.maxCompressorTurnoffCountPerHour,
        optimizationTime: defaultValue.optimizationTime,
        steadyStateRoomTemperatureTolerance: defaultValue.steadyStateRoomTemperatureTolerance,
        steadyStateCoilTemperatureTolerance: defaultValue.steadyStateCoilTemperatureTolerance,
        steadyStateSamplingDuration: defaultValue.steadyStateSamplingDuration,
        minAirConditionerOffDuration: defaultValue.minAirConditionerOffDuration,
        airConditionerOffDeclarationMinPeriod: defaultValue.airConditionerOffDeclarationMinPeriod,
        maxObservationTime: defaultValue.maxObservationTime,
        thermoStateTimeIncrease: defaultValue.thermoStateTimeIncrease,
        thermoStateInterval: defaultValue.thermoStateInterval
    };
    // reset particular optimizer
    if (req.body.group === 'optimizer') {
        console.log(`Resetting to default value particular optimizer ${req.body.id}`);
        // Now, you can proceed with your findOneAndUpdate logic
        resetValues.optimizerID = req.body.id;
        const result = await OptimizerSettingValueModel.findOneAndUpdate(
            { optimizerID: req.body.id },
            { $set: resetValues },
            { new: true, upsert: true }
        );

        if (result) {
            return res.send({ success: true, message: `Settings values set successfully.` });
        } else {
            return res.status(500).send({ success: false, message: 'Internal Server Error: Unable to get result.' });
        }
    }


    // reset all optimizer assign with the gateway => optimizers
    if (req.body.group == 'gateway') {
        console.log(`Resetting to default value gateway => optimizers`);
    }
    // reset all optimizer assign with the location => gateways => optimizers
    if (req.body.group == 'location') {
        console.log(`Resetting to default value location => gateways => optimizers`);
    }
    // reset all optimizer assign with the state => locations => gateways => optimizers
    if (req.body.group == 'state') {
        console.log(`Resetting to default value state => locations => gateways => optimizers`);
    }
    // reset all optimizer assign with the enterprise => states => locations => gateways => optimizers
    if (req.body.group == 'enterprise') {
        console.log(`Resetting to default value enterprise => states => locations => gateways => optimizers`);
    }

    // return;


    return res.send(resetValues);


    try {

        const defaultValue = new OptimizerSettingValueModel(resetValues);
        await defaultValue.save();
        res.send({ success: true, message: 'Record inserted.' });


    } catch (error) {
        // Handle any errors that may occur during the process
        console.error(error);
        res.status(500).send({ success: false, message: 'Internal Server Error' });
    }
}