const MeterData = async (intervalSeconds, responseData) => {
    try {
        // return (responseData);
        const MAIN_LOOP = responseData.response[0].State;


        const displayObjects = [];
        const NEW_OBJ = {
            // "success": true,
            // "message": "Data fetched successfully",
            "response": [
                {
                    "EnterpriseName": "Testing",
                    "State": []
                }
            ]
        };
        MAIN_LOOP.forEach(mainItem => {
            const stateObj = {
                "stateName": mainItem.stateName,
                "state_ID": mainItem.state_ID,
                "location": [],
            };
            NEW_OBJ.response[0].State.push(stateObj);

            mainItem.location.forEach(stateItem => {
                const locationObj = {
                    "locationName": stateItem.locationName,
                    "location_ID": stateItem.location_ID,
                    "gateway": [],
                };
                stateObj.location.push(locationObj);
                stateItem.gateway.forEach(locationItem => {
                    const gatewayObj = {
                        "GatewayName": locationItem.GatewayName,
                        "Gateway_ID": locationItem.Gateway_ID,
                        "GatewayLogs": [],
                    };
                    locationObj.gateway.push(gatewayObj);
                    const gatewayLogs = locationItem.GatewayLogs;
                    const timestamps = gatewayLogs.map(entry => ({ timestamp: Number(entry.TimeStamp), data: entry }));
                    const result = generateTimestamps(timestamps, intervalSeconds);

                    result.forEach(entry => {
                        gatewayObj.GatewayLogs.push(entry.data)
                        displayObjects.push(entry.data);
                    });

                });
            });
            console.log('<---------------------------------------------------->');
        });



        function findNextAvailableTimestamp(timestamps, currentTimestamp) {
            for (let i = 0; i < timestamps.length; i++) {
                if (timestamps[i].timestamp > currentTimestamp) {
                    return timestamps[i];
                }
            }
            return null; // If no next available timestamp found
        }

        function generateTimestamps(timestamps, intervalSeconds) {
            const generatedTimestamps = [];
            let currentTimestamp = timestamps[0].timestamp;

            for (let i = 0; i < timestamps.length - 1; i++) {
                const nextTimestamp = currentTimestamp + intervalSeconds;

                if (timestamps.some(entry => entry.timestamp === nextTimestamp)) {
                    const nextObject = timestamps.find(entry => entry.timestamp === nextTimestamp);
                    generatedTimestamps.push(nextObject);
                    currentTimestamp = nextTimestamp;
                } else {
                    const nextAvailableTimestamp = findNextAvailableTimestamp(timestamps, nextTimestamp);
                    if (nextAvailableTimestamp !== null) {
                        generatedTimestamps.push(nextAvailableTimestamp);
                        currentTimestamp = nextAvailableTimestamp.timestamp;
                    } else {
                        break; // No further timestamps available
                    }
                }
            }

            return generatedTimestamps;
        }

        return NEW_OBJ;
    } catch (error) {
        return { success: false, message: error.message };
    }
}
const DeviceData = async (intervalSeconds, data) => {
    try {

    } catch (error) {
        return { success: false, message: 'Service Unavailable: Error sending email' };
    }
}


module.exports = {
    MeterData, DeviceData
}