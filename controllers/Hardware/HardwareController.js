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