const DataLogModel = require('../../models/dataLog.model');
const GatewayModel = require('../../models/gateway.model');
const OptimizerModel = require('../../models/optimizer.model');

exports.Config = async (req, res) => {
    // NGCS2023011003
    const { gateway_id } = req.params;

    const Gateway = await GatewayModel.findOne({ GatewayID: gateway_id });

    // const GatewayUniqueID = Gateway._id;
    const Optimizers = await OptimizerModel.find({ GatewayId: Gateway._id });
    const optObject = Optimizers.map(element => ({
        "optimizer_id": element.OptimizerID,
        "is_bypass": element.Switch,
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

    if (Gateway.isConfigure) {
        property = {
            "flag": Gateway.isConfigure,
            "ssid": Gateway.NetworkSSID,
            "password": Gateway.NetworkPassword
        };
    } else {
        property = {
            "flag": Gateway.isConfigure,
            "ssid": null,
            "password": null
        };
    }
    const NewObj = {
        "gatewayID": Gateway.GatewayID,
        "config": {
            ...property
        },
        "optimizer": optObject

    };
    return res.send(NewObj);
}


exports.Store = async (req, res) => {
    const data = req.body;

    try {
        const GET_Gateway = await GatewayModel.findOne({ GatewayID: req.body.GatewayID });
        const GET_Optimizer = await OptimizerModel.findOne({ OptimizerID: req.body.OptimizerID });

        if (!GET_Gateway) {
            throw new Error(`Gateway with ID ${req.body.GatewayID} not found`);
        }

        if (!GET_Optimizer) {
            throw new Error(`Optimizer with ID ${req.body.OptimizerID} not found`);
        }

        let GT_ID = GET_Gateway._id;
        let OPT_ID = GET_Optimizer._id;

        data.GatewayID = GT_ID;
        data.OptimizerID = OPT_ID;
        // const DataLog = await DataLogModel(data).save();
        // res.status(404).send({ success: true, message: "" });

        const DataLog = await DataLogModel({ ...data, GatewayID: GT_ID, OptimizerID: OPT_ID }).save();

        res.status(200).send({ success: true, message: "DataLog created successfully", DataLog });

    } catch (error) {
        console.error(error.message);
        res.status(404).send({ success: false, message: error.message });
    }

}

// not in use
exports.Property = async (req, res) => {
    const { gateway_id } = req.params;

    const Gateway = await GatewayModel.findOne({ GatewayID: gateway_id });
    if (Gateway.isConfigure) {
        var NewObj = {
            "gatewayID": Gateway.GatewayID,
            "property": {
                "ssid": Gateway.NetworkSSID,
                "password": Gateway.NetworkPassword
            }

        };

    } else {
        var NewObj = {
            "gatewayID": Gateway.GatewayID,
            "property": null

        };
    }
    return res.send(NewObj);
}