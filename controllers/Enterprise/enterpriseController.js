const EnterpriseAdminModel = require('../../models/enterprise.model');
const EnterpriseStateModel = require('../../models/enterprise_state.model');
const EnterpriseStateLocationModel = require('../../models/enterprise_state_location.model');
const GatewayModel = require('../../models/gateway.model');
const UserModel = require('../../models/user.model');
const bcrypt = require('bcrypt');
const { decode } = require('../../utility/JwtDecoder');
const OptimizerModel = require('../../models/optimizer.model');
const GatewayLogModel = require('../../models/GatewayLog.model');
const OptimizerLogModel = require('../../models/OptimizerLog.model');
const axios = require('axios');
const NewApplianceLogModel = require('../../models/NewApplianceLog.model');



// EnterpriseList
exports.EnterpriseListData = async (req, res) => {



    try {
        const AllEnt = await EnterpriseAdminModel.find({});

        if (req.params.flag === 'name') {
            return res.status(200).json({ success: true, message: "Data fetched successfully", data: AllEnt });
        }

        if (req.params.flag === 'data') {
            const getAllEnterpriseLocation = async (entId) => {
                const data = await EnterpriseStateLocationModel.find({ Enterprise_ID: entId }).exec();
                // console.log("Location=>", data);
                return data;
            };

            const getAllEnterpriseGateway = async (entInfoID) => {
                const data = await GatewayModel.find({ EnterpriseInfo: entInfoID }).exec();
                // console.log("Gateway=>", data);
                return data;
            };

            const getAllEnterpriseOptimizer = async (gatewayID) => {
                const data = await OptimizerModel.find({ GatewayId: gatewayID }).exec();
                // console.log("Optimizer=>", data);
                return data;
            };

            const updatedAllEnt = await Promise.all(AllEnt.map(async (ent) => {
                // Getting all the locations
                const LocationData = await getAllEnterpriseLocation(ent._id);

                // Getting all the gateways
                const GatewayData = await Promise.all(LocationData.map(async (location) => {
                    return await getAllEnterpriseGateway(location._id);
                }));
                const FlattenedGatewayData = GatewayData.flat(); // Use flat to flatten the array

                // Getting all the optimizers
                const OptimizerData = await Promise.all(FlattenedGatewayData.map(async (gateway) => {
                    return await getAllEnterpriseOptimizer(gateway._id);
                }));
                const FlattenedOptimizerData = OptimizerData.flat();


                const data = {
                    location: LocationData.length,
                    gateway: FlattenedGatewayData.length,
                    optimizer: FlattenedOptimizerData.length,
                    power_save_unit: Math.round(Math.random() * (300 - 100) + 1),
                };

                return { ...ent._doc, data };
            }));

            return res.status(200).json({ success: true, message: "Data fetched successfully", data: updatedAllEnt });
        }
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
};

// EnterpriseStateList
exports.EnterpriseStateList = async (req, res) => {
    const { enterprise_id } = req.params;

    try {
        const AllEnterpriseState = await EnterpriseStateModel.find({ Enterprise_ID: enterprise_id }).populate({
            path: 'Enterprise_ID'
        }).populate({
            path: 'State_ID'
        });


        if (AllEnterpriseState.length === 0) {
            return res.status(404).send({ success: false, message: 'No data found for the given enterprise ID.' });
        }

        // Extract the common Enterprise_ID data from the first object
        const { Enterprise_ID, ...commonEnterpriseData } = AllEnterpriseState[0].Enterprise_ID;
        const commonEnterpriseDataWithDoc = { ...commonEnterpriseData._doc };

        const getAllEnterpriseLocation = async (entId, stateId) => {
            const data = await EnterpriseStateLocationModel.find({ Enterprise_ID: entId, State_ID: stateId }).exec();
            // console.log("Location=>", data);
            return data;
        };

        const getAllEnterpriseGateway = async (entInfoID) => {
            const data = await GatewayModel.find({ EnterpriseInfo: entInfoID }).exec();
            // console.log("Gateway=>", data);
            return data;
        };

        const getAllEnterpriseOptimizer = async (gatewayID) => {
            const data = await OptimizerModel.find({ GatewayId: gatewayID }).exec();
            // console.log("Optimizer=>", data);
            return data;
        };

        // Map through the array and add the fields to each object
        const AllEntState = await Promise.all(AllEnterpriseState.map(async (item) => {
            // Getting all the locations
            const LocationData = await getAllEnterpriseLocation(item.Enterprise_ID._id, item.State_ID._id);

            // Getting all the gateways
            const GatewayData = await Promise.all(LocationData.map(async (location) => {
                return await getAllEnterpriseGateway(location._id);
            }));
            const FlattenedGatewayData = GatewayData.flat(); // Use flat to flatten the array

            // Getting all the optimizers
            const OptimizerData = await Promise.all(FlattenedGatewayData.map(async (gateway) => {
                return await getAllEnterpriseOptimizer(gateway._id);
            }));
            const FlattenedOptimizerData = OptimizerData.flat();


            const data = {
                location: LocationData.length,
                gateway: FlattenedGatewayData.length,
                optimizer: FlattenedOptimizerData.length,
                power_save_unit: Math.round(Math.random() * (300 - 100) + 1),
            };

            return { ...item._doc, data };
        }));

        // Remove "Enterprise_ID" field from AllEntState
        AllEntState.forEach(state => {
            delete state.Enterprise_ID;
        });

        // console.log(AllEntState);
        return res.status(200).json(
            {
                success: true,
                message: "Data fetched successfully",
                commonEnterpriseData: commonEnterpriseDataWithDoc,
                AllEntState
            }
        );
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }

}

// EnterpriseStateLocationList
exports.EnterpriseStateLocationList = async (req, res) => {
    const { enterprise_id, state_id } = req.params;

    try {
        const AllEnterpriseStateLocation = await EnterpriseStateLocationModel.find({ Enterprise_ID: enterprise_id, State_ID: state_id }).populate({
            path: 'Enterprise_ID'
        }).populate({
            path: 'State_ID'
        });

        if (AllEnterpriseStateLocation.length === 0) {
            return res.status(404).send({ success: false, message: 'No data found for the given enterprise ID.' });
        }

        // Extract the common Enterprise_ID data from the first object
        const { Enterprise_ID, ...commonEnterpriseData } = AllEnterpriseStateLocation[0].Enterprise_ID;
        const commonEnterpriseDataWithDoc = { ...commonEnterpriseData._doc };

        // Extract the common State_ID data from the first object
        const { State_ID, ...commonStateData } = AllEnterpriseStateLocation[0].State_ID;
        const commonStateDataWithDoc = { ...commonStateData._doc };

        const getAllEnterpriseGateway = async (entInfoID) => {
            const data = await GatewayModel.find({ EnterpriseInfo: entInfoID }).exec();
            // console.log("Gateway=>", data);
            return data;
        };

        const getAllEnterpriseOptimizer = async (gatewayID) => {
            const data = await OptimizerModel.find({ GatewayId: gatewayID }).exec();
            // console.log("Optimizer=>", data);
            return data;
        };

        // Map through the array and add the fields to each object
        const AllEntStateLocation = await Promise.all(AllEnterpriseStateLocation.map(async (location) => {
            // Getting all the gateways
            const GatewayData = await getAllEnterpriseGateway(location._id);
            const FlattenedGatewayData = GatewayData.flat(); // Use flat to flatten the array

            // Getting all the optimizers
            const OptimizerData = await Promise.all(FlattenedGatewayData.map(async (gateway) => {
                return await getAllEnterpriseOptimizer(gateway._id);
            }));
            const FlattenedOptimizerData = OptimizerData.flat();

            const data = {
                gateway: FlattenedGatewayData.length,
                optimizer: FlattenedOptimizerData.length,
                power_save_unit: Math.round(Math.random() * (300 - 100) + 1),
            };

            return { ...location._doc, data };
        }));

        // Remove "Enterprise_ID" & "State_ID" fields from AllEntStateLocation
        AllEntStateLocation.forEach(ent => {
            delete ent.Enterprise_ID;
            delete ent.State_ID;
        });


        // console.log(AllEntStateLocation);
        return res.status(200).json(
            {
                success: true,
                message: "Data fetched successfully",
                commonEnterpriseData: commonEnterpriseDataWithDoc,
                commonStateData: commonStateDataWithDoc,
                AllEntStateLocation
            }
        );
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
}

// EnterpriseStateLocationGatewayList
exports.EnterpriseStateLocationGatewayList = async (req, res) => {
    const { enterpriseInfo_id } = req.params;

    try {
        const AllEnterpriseStateLocationGateway = await GatewayModel.find({ EnterpriseInfo: enterpriseInfo_id }).populate({
            path: 'EnterpriseInfo',
            populate: [
                {
                    path: 'Enterprise_ID',
                },
                {
                    path: 'State_ID',
                },
            ]
        });

        if (AllEnterpriseStateLocationGateway.length === 0) {
            return res.status(404).send({ success: false, message: 'No data found for the given enterprise ID.' });
        }

        // Extract the common Enterprise_ID data from the first object
        const { Enterprise_ID, ...commonEnterpriseData } = AllEnterpriseStateLocationGateway[0].EnterpriseInfo.Enterprise_ID;
        const commonEnterpriseDataWithDoc = { ...commonEnterpriseData._doc };

        // Extract the common State_ID data from the first object
        const { State_ID, ...commonStateData } = AllEnterpriseStateLocationGateway[0].EnterpriseInfo.State_ID;
        const commonStateDataWithDoc = { ...commonStateData._doc };

        // Dynamic extraction of fields for commonLocationDataDoc
        const LocationData = { ...AllEnterpriseStateLocationGateway[0].EnterpriseInfo };
        const commonLocationDataDoc = { ...LocationData._doc };
        if (commonLocationDataDoc.Enterprise_ID && commonLocationDataDoc.State_ID) {
            delete commonLocationDataDoc.Enterprise_ID;
            delete commonLocationDataDoc.State_ID;
        } else {
            return commonLocationDataDoc;
        };

        const getAllEnterpriseOptimizer = async (gatewayID) => {
            const data = await OptimizerModel.find({ GatewayId: gatewayID }).exec();
            // console.log("Optimizer=>", data);
            return data;
        };

        // Map through the array and add the fields to each object
        const AllEntStateLocationGateway = await Promise.all(AllEnterpriseStateLocationGateway.map(async (gateway) => {
            // Getting all the optimizers
            const OptimizerData = await getAllEnterpriseOptimizer(gateway._id);
            const FlattenedOptimizerData = OptimizerData.flat();

            const data = {
                optimizer: FlattenedOptimizerData.length,
                power_save_unit: Math.round(Math.random() * (300 - 100) + 1),
            };

            return { ...gateway._doc, data };
        }));

        // Remove "EnterpriseInfo" field from AllEntStateLocationGateway
        AllEntStateLocationGateway.forEach(ent => {
            delete ent.EnterpriseInfo;
        });

        // return res.send(AllEnterpriseStateLocationGateway[0].EnterpriseInfo._id;);

        return res.status(200).json(
            {
                success: true,
                message: "Data fetched successfully",
                commonEnterpriseData: commonEnterpriseDataWithDoc,
                commonStateData: commonStateDataWithDoc,
                commonLocationData: commonLocationDataDoc,
                AllEntStateLocationGateway
            }
        );
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
}

// EnterpriseStateLocationGatewayOptimizerList
exports.EnterpriseStateLocationGatewayOptimizerList = async (req, res) => {
    const { gateway_id } = req.params;
    console.log("Log start---------------------");
    try {
        console.log("Log with try block---------------------");
        // Step 1: Find the gateway based on the provided gateway ID
        const Gateway = await GatewayModel.findOne({ GatewayID: gateway_id });

        // Check if the gateway exists
        if (!Gateway) {
            return res.status(404).json({ success: false, message: "Gateway ID not found" });
        }

        // Step 2: Find all optimizers associated with the gateway and populate necessary fields
        const AllEnterpriseStateLocationGatewayOptimizer = await OptimizerModel.find({ GatewayId: Gateway._id })
            .populate({
                path: 'GatewayId',
                populate: {
                    path: 'EnterpriseInfo',
                    populate: [
                        { path: 'Enterprise_ID' },
                        { path: 'State_ID' },
                    ]
                }
            });

        // If no optimizers found, return 404
        if (AllEnterpriseStateLocationGatewayOptimizer.length === 0) {
            console.log("No optimizers found for the given gateway ID.");
            return res.status(404).json({ success: false, message: 'No optimizers found for the given gateway ID.' });
        }

        // Step 3: Determine offline optimizers
        const offlineThreshold = new Date(Date.now() - 3 * 60 * 1000); // 3 minutes ago

        // Retrieve the latest logs for all optimizers
        const optimizerIds = AllEnterpriseStateLocationGatewayOptimizer.map(optimizer => optimizer._id);
        const latestLogs = await OptimizerLogModel.aggregate([
            { $match: { OptimizerID: { $in: optimizerIds } } },
            { $sort: { OptimizerID: 1, createdAt: -1 } },
            {
                $group: {
                    _id: "$OptimizerID",
                    latestLog: { $first: "$$ROOT" }
                }
            }
        ]);
        // -------------------------------------------------------

        // -------------------------------------------------------

        // Create a map of optimizerId to its latest log
        const latestLogMap = new Map();
        latestLogs.forEach(log => latestLogMap.set(log.latestLog.OptimizerID.toString(), log.latestLog));

        console.log('Offline Threshold:', offlineThreshold);
        console.log('Latest Log Map:', latestLogMap);

        await Promise.all(AllEnterpriseStateLocationGatewayOptimizer.map(async optimizer => {
            const latestLog = latestLogMap.get(optimizer._id.toString());
            const isOnline = latestLog ? (new Date(latestLog.createdAt) >= offlineThreshold && latestLog.OptimizerMode !== "N/A") : false;

            console.log({
                optimizerId: optimizer._id,
                latestLog: latestLog,
                isOnline: isOnline
            });

            await optimizer.updateOne({ isOnline: isOnline });
        }));


        // Step 4: Prepare response
        const response = {
            success: true,
            message: "Data fetched successfully",
            commonEnterpriseData: true,
            AllEntStateLocationGatewayOptimizer: AllEnterpriseStateLocationGatewayOptimizer.map(ent => ({
                ...ent._doc,
                GatewayId: undefined // Remove "GatewayId" field
            }))
        };

        // Step 5: Return the response
        return res.status(200).json(response);

    } catch (err) {
        console.log("Log end with catch---------------------");
        console.error(err.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
}


// OptimizerDetails
exports.OptimizerDetails = async (req, res) => {
    const { optimizer_id } = req.params;
    try {
        const Optimizer = await OptimizerModel.findOne({ OptimizerID: optimizer_id });

        if (Optimizer) {
            // console.log(Optimizer);
            const Gateway = await GatewayModel.findOne({ _id: Optimizer.GatewayId });
            const Location = await EnterpriseStateLocationModel.findOne({ _id: Gateway.EnterpriseInfo });
            const OptimizerLogData = await OptimizerLogModel
                .findOne({ OptimizerID: Optimizer._id })
                .sort({ createdAt: -1 })  // Sort in descending order based on createdAt
                .limit(1);



            const key = await LocationKey(Location.Lat, Location.Long);
            const weather = await Accuweather(key);

            const DATA = {
                Optimizer: {
                    _id: Optimizer?._id,
                    OptimizerID: Optimizer?.OptimizerID,
                    OptimizerName: Optimizer?.OptimizerName,
                    ACTonnage: Optimizer?.ACTonnage,
                    AC_Energy: Optimizer?.AC_Energy,
                    Fan_consumption: Optimizer?.Fan_consumption,
                },
                Gateway: {
                    _id: Gateway?._id,
                    GatewayID: Gateway?.GatewayID,
                },
                optimizer_mode: OptimizerLogData?.OptimizerMode,
                room_temp: OptimizerLogData?.RoomTemperature,
                coil_temp: OptimizerLogData?.CoilTemperature,
                humidity: OptimizerLogData?.Humidity,
                TimeStamp: OptimizerLogData?.TimeStamp,
                Location,
                AmbientTemperature: weather.data[0].ApparentTemperature.Metric.Value,
                AmbientHumidity: weather.data[0].RelativeHumidity,
            };
            return res.status(200).json({ success: true, message: "Data fetched successfully", data: DATA });

        } else {
            return res.status(404).json({ success: false, message: "Optimizer not found", data: null });
        }
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
};

const { ObjectId } = require('mongoose').Types;

const LocationKey = async (lat, long) => {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=iV4ZAgc5DoSoc3EiDciIas8ePgSn7lH5&q=${lat},${long}`,
        headers: {}
    };

    try {
        const response = await axios.request(config);
        return response.data.Key;
    } catch (error) {
        console.log(error);
        throw error;
    }

}
const Accuweather = async (key) => {
    const axios = require('axios');

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `http://dataservice.accuweather.com/currentconditions/v1/${key}?apikey=iV4ZAgc5DoSoc3EiDciIas8ePgSn7lH5&details=true`,
        headers: {}
    };

    try {
        const response = await axios.request(config);
        console.log(response.data[0]);
        return response;
    } catch (error) {
        console.log(error);
        throw error;
    }

}


// GatewayDetails
exports.GatewayDetails = async (req, res) => {
    const { gateway_id } = req.params;
    try {
        const Gateway = await GatewayModel.findOne({ GatewayID: gateway_id });
        if (Gateway) {
            const GatewayLogData = await GatewayLogModel.findOne({ GatewayID: Gateway._id }).populate({
                'path': 'GatewayID',
                'select': '_id OnboardingDate GatewayID EnterpriseUserID Switch isDelete isConfigure is_Ready_toConfig createdAt updatedAt'
            }).sort({ createdAt: -1 });

            const currentTime = new Date();
            const timestamp = parseInt(GatewayLogData.TimeStamp, 10) * 1000; // Convert seconds to milliseconds
            const logTime = new Date(timestamp);

            const fiveMinutesAgo = new Date(currentTime - 5 * 60 * 1000); // 5 minutes ago

            const DATA = {
                ...GatewayLogData.toObject(),
                Gateway: GatewayLogData.GatewayID,  // Rename GatewayID to Gateway
                isOnline: (logTime > fiveMinutesAgo) ? true : false,
            };

            delete DATA.GatewayID;  // Remove the original GatewayID field

            return res.status(200).json({ success: true, message: "Data fetched successfully", data: DATA });
        } else {
            return res.status(404).json({ success: false, message: "Gateway not found", data: null });
        }
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
};

// SET PASSWORD VIEW
exports.SetNewPasswordView = async (req, res) => {
    try {
        const url = process.env.HOST;
        const decodedHashValue = decode("Bearer " + req.params.hashValue);
        let valid = true;
        let message = "";
        let validationErrors = req.validationErrors || []; // Get validation errors from request object
        // Check if the token has expired
        const currentTimestamp = Math.floor(Date.now() / 1000); // Get current timestamp in seconds
        if (decodedHashValue.exp && currentTimestamp > decodedHashValue.exp) {
            valid = false
            message = 'Token has expired';
        } else {
            valid = true;
            message = 'Token is still valid';
        }
        const DATA = {
            message,
            valid,
            token: req.params.hashValue,
            backend_url: url + "/api/enterprise/set/new/password/" + req.params.hashValue,
            perpose: "Set New Password",
            errors: validationErrors // Pass validation errors to view

        }
        // return res.status(200).json(DATA);
        // return res.send(decodedHashValue);
        return res.render("auth/set_password", {
            title: "Set New Password",
            DATA
        });
    } catch (error) {
        console.log(error.message);
        return res.send({ success: false, message: error.message });
    }
};

// SET PASSWORD
exports.SetNewPassword = async (req, res) => {
    const { _token, password } = req.body;
    try {
        const decodedHashValueEmail = decode("Bearer " + _token).email;
        // const user = await User.findOne({ email: decodedHashValueEmail });
        const hashedPassword = await bcrypt.hash(password, 10);
        const filter = { email: decodedHashValueEmail };
        const update = { password: hashedPassword };

        // Use updateOne to update a single document
        const result = await UserModel.updateOne(filter, update);

        console.log(result);
        // return res.status(200).json({
        //     success: true,
        //     message: "Password reset successfully!",
        // });

        return res.render("auth/success", {});
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

