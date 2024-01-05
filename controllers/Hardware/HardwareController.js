const GatewayLogModel = require('../../models/GatewayLog.model');
const OptimizerLogModel = require('../../models/OptimizerLog.model');
const GatewayModel = require('../../models/gateway.model');
const OptimizerModel = require('../../models/optimizer.model');

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
    res.send(req.params);
}