exports.CheckResetOptimizerSetting = async (req, res, next) => {
    const { group, id } = req.body;
    try {
        if (req.user.user.role === 'SuAdmin' || req.user.user.role === 'SystemInt') {
            if (!group) {
                return res.status(401).json({ success: false, message: "Please provide a value for group.", key: "group" });
            }
            if (!id) {
                return res.status(401).json({ success: false, message: "Please provide a value for group id.", key: "group_id" });
            }
            next();
        } else {
            return res.status(403).json({ success: false, message: "Access denied. You does not have the required role.", key: "access_denied" });
        }
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", err: error.message });
    }
};

exports.CheckSetOptimizerSetting = async (req, res, next) => {
    const {
        group,
        id,
        firstPowerOnObservationTime,
        maxObservatioTime,
        OptimizationOnTime,
        thermostatMonitoringInterval,
        thermostatMonitoringTimeIncrement,
        steadyStateTimeRoomTempTolerance,
        steadyStateCoilTempTolerance
    } = req.body;

    try {
        if (req.user.user.role === 'SuAdmin' || req.user.user.role === 'SystemInt') {
            // Check if every field is not empty
            const fields = [
                { value: group, key: "group" },
                { value: id, key: "group_id" },
                { value: firstPowerOnObservationTime, key: "firstPowerOnObservationTime" },
                { value: maxObservatioTime, key: "maxObservatioTime" },
                { value: OptimizationOnTime, key: "OptimizationOnTime" },
                { value: thermostatMonitoringInterval, key: "thermostatMonitoringInterval" },
                { value: thermostatMonitoringTimeIncrement, key: "thermostatMonitoringTimeIncrement" },
                { value: steadyStateTimeRoomTempTolerance, key: "steadyStateTimeRoomTempTolerance" },
                { value: steadyStateCoilTempTolerance, key: "steadyStateCoilTempTolerance" },
            ];

            for (const field of fields) {
                if (!field.value) {
                    return res.status(401).json({ success: false, message: `Please provide a value for ${field.key}.`, key: field.key });
                }
            }
            next();
        } else {
            return res.status(403).json({ success: false, message: "Access denied. You does not have the required role.", key: "access_denied" });
        }

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error", err: error.message });
    }
};
