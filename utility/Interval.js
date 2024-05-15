const fs = require('fs');
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
                // Starting timestamp reference point
                if (i === 0 && timestamps.some(entry => entry.timestamp === currentTimestamp)) {
                    // timestamps.some(entry => entry.timestamp === currentTimestamp)
                    const nextObject = timestamps.find(entry => entry.timestamp === currentTimestamp);
                    generatedTimestamps.push(nextObject);
                    currentTimestamp = nextTimestamp;
                }

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

const DeviceData = async (interval, data) => {
    try {

        let intervalArray = [];
        // let interval = 15;
        const responseData = data[0].optimizerLogs;

        let currentTimestamp = Number(responseData[0].TimeStamp);
        for (let i = 0; i < responseData.length - 1; i++) {
            let nextExpectedTimestamp = currentTimestamp + interval;
            // console.log({ nextExpectedTimestamp });
            if (i === 0 && responseData.some(obj => Number(obj.TimeStamp) === currentTimestamp)) {
                console.log("Current");
                // console.log({ nextExpectedTimestamp, currentTimestamp, Stamp: Number(responseData[i].TimeStamp) });
                const nextObject = responseData.find(entry => Number(entry.TimeStamp) === currentTimestamp);
                let objectsWithTimestamp = responseData.filter(obj => obj.TimeStamp === nextObject.TimeStamp);
                intervalArray.push(objectsWithTimestamp);
                currentTimestamp = nextExpectedTimestamp;
            }

            // Check if the next expected timestamp is present in the array
            if (responseData.some(obj => Number(obj.TimeStamp) === nextExpectedTimestamp)) {
                console.log("expected timestamp");
                const nextObject = responseData.find(entry => Number(entry.TimeStamp) === nextExpectedTimestamp);
                let objectsWithTimestamp = responseData.filter(obj => obj.TimeStamp === nextObject.TimeStamp);
                intervalArray.push(objectsWithTimestamp);
                // intervalArray.push({ Match: nextObject });
                currentTimestamp = nextExpectedTimestamp;

            } else {
                const nextAvailableTimestamp = findNextAvailableTimestamp(responseData, nextExpectedTimestamp);
                if (nextAvailableTimestamp !== null) {

                    let objectsWithTimestamp = responseData.filter(obj => obj.TimeStamp === nextAvailableTimestamp.TimeStamp);
                    intervalArray.push(objectsWithTimestamp);
                    // intervalArray.push({ Next: nextAvailableTimestamp });
                    currentTimestamp = Number(nextAvailableTimestamp.TimeStamp);
                } else {
                    break;
                }
            }

        }

        function findNextAvailableTimestamp(responseData, currentTimestamp) {
            for (let i = 0; i < responseData.length; i++) {
                // console.log("responseData", responseData[i].TimeStamp, currentTimestamp);
                if (responseData[i].TimeStamp > currentTimestamp) {
                    return responseData[i];
                }
            }
            return null; // If no next available timestamp found
        }
        const MAIN_ARRAY = intervalArray.flat();
        // fs.writeFileSync("_extra.json", JSON.stringify(MAIN_ARRAY));
        return MAIN_ARRAY;
    } catch (error) {
        return { success: false, message: error.message };
    }
}


module.exports = {
    MeterData, DeviceData
}