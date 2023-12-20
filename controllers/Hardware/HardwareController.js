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
        "is_bypass": element.Switch
    }));

    const NewObj = {
        "gatewayID": Gateway.GatewayID,
        "config": {
            "flag": Gateway.isConfigure,
            "ssid": Gateway.NetworkSSID,
            "password": Gateway.NetworkPassword
        },
        "optimizer": optObject

    };
    res.send(NewObj);
    return;

}