const EnterpriseModel = require('../models/enterprise.model');
const EnterpriseStateModel = require('../models/enterprise_state.model');
const EnterpriseUserModel = require('../models/enterprise_user.model');
const EnterpriseStateLocationModel = require('../models/enterprise_state_location.model');
const GatewayModel = require('../models/gateway.model');
const OptimizerModel = require('../models/optimizer.model');
const GatewayLogModel = require('../models/GatewayLog.model');
const OptimizerLogModel = require('../models/OptimizerLog.model');
const NewApplianceLogModel = require('../models/NewApplianceLog.model');

// Enterprise and associated data delete
exports.deleteEnterprise = async (id) => {
    try {
        const deletedEnterprise = await EnterpriseModel.findByIdAndDelete({ _id: id });
        if (!deletedEnterprise) {
            return ({ success: false, message: "Enterprise not found for deletion." });
        }

        const states = await EnterpriseStateModel.find({ Enterprise_ID: id });
        for (const state of states) {
            await this.deleteState(state._id);
            await this.deleteEnterpriseUser(id);
        }


        return ({ success: true, message: "Enterprise and associated data deleted successfully." });
    } catch (err) {
        console.error(err.message);
        return ({ success: false, message: "Internal Server Error", error: err.message });
    }
}

// State and associated data delete
exports.deleteState = async (id) => {
    try {
        const state = await EnterpriseStateModel.findByIdAndDelete({ _id: id });
        if (!state) {
            return ({ success: false, message: "State not found for deletion." });
        }

        const locations = await EnterpriseStateLocationModel.find({ Enterprise_ID: state.Enterprise_ID, State_ID: state.State_ID });
        for (const location of locations) {
            await this.deleteLocation(location._id);
        }

        return ({ success: true, message: "State and associated data deleted successfully." });
    } catch (err) {
        console.error(err.message);
        return ({ success: false, message: "Internal Server Error", error: err.message });
    }
}

// Location and associated data delete
exports.deleteLocation = async (id) => {
    try {
        const deletedLocation = await EnterpriseStateLocationModel.findByIdAndDelete({ _id: id });
        if (!deletedLocation) {
            return ({ success: false, message: "Location not found for deletion." });
        }

        const gateways = await GatewayModel.find({ EnterpriseInfo: id });
        for (const gateway of gateways) {
            await this.deleteGateway(gateway._id);
        }

        return ({ success: true, message: "Location and associated data deleted successfully." });
    } catch (err) {
        console.error(err.message);
        return ({ success: false, message: "Internal Server Error", error: err.message });
    }
}

// Gateway and associated data delete
exports.deleteGateway = async (id) => {
    try {
        const gateway = await GatewayModel.findByIdAndDelete({ _id: id });
        if (!gateway) {
            return ({ success: false, message: "Gateway not found for deletion." });
        }

        await OptimizerModel.deleteMany({ GatewayId: id });
        //await this.deleteGatewayLog(id);
        //await this.deleteOptimizerLog(id);

        return ({ success: true, message: "Gateway and associated data deleted successfully." });
    } catch (err) {
        console.error(err.message);
        return ({ success: false, message: "Internal Server Error", error: err.message });
    }
}

// Optimizer data delete
exports.deleteOptimizer = async (id) => {
    try {
        const optimizerData = await OptimizerModel.findOne({ _id: id });
        //await NewApplianceLogModel.deleteMany({ OptimizerID: optimizerData.OptimizerID });
        const optimizer = await OptimizerModel.findByIdAndDelete({ _id: id });
        if (!optimizer) {
            return ({ success: false, message: "Optimizer not found for deletion." });
        }
        // await this.deleteGatewayLog(id);
        //await this.deleteOptimizerLog(id);
        return ({ success: true, message: "Optimizer deleted successfully." });
    } catch (err) {
        console.error(err.message);
        return ({ success: false, message: "Internal Server Error", error: err.message });
    }
}

// EnterpriseUser data delete
exports.deleteEnterpriseUser = async (id) => {
    try {
        const EnterpriseUser = await EnterpriseUserModel.findByIdAndDelete({ EnterpriseID: id });
        if (!EnterpriseUser) {
            return ({ success: false, message: "EnterpriseUser not found for deletion." });
        }

        return ({ success: true, message: "EnterpriseUser deleted successfully." });
    } catch (err) {
        console.error(err.message);
        return ({ success: false, message: "Internal Server Error", error: err.message });
    }
}

// GatewayLog data delete
exports.deleteGatewayLog = async (id) => {
    try {
        const GatewayLog = await GatewayLogModel.deleteMany({ GatewayID: id });
        if (!GatewayLog) {
            return ({ success: false, message: "GatewayLog not found for deletion." });
        }

        return ({ success: true, message: "GatewayLog deleted successfully." });
    } catch (err) {
        console.error(err.message);
        return ({ success: false, message: "Internal Server Error", error: err.message });
    }
}

// OptimizerLog data delete
exports.deleteOptimizerLog = async (id) => {
    try {
        const OptimizerLog = await OptimizerLogModel.deleteMany({ OptimizerID: id });

        if (!OptimizerLog) {
            return ({ success: false, message: "OptimizerLog not found for deletion." });
        }

        return ({ success: true, message: "OptimizerLog deleted successfully." });
    } catch (err) {
        console.error(err.message);
        return ({ success: false, message: "Internal Server Error", error: err.message });
    }
}