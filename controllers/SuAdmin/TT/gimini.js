function findNextTimestamp(timestamps, intervalSeconds) {
    let result = [];

    for (let i = 0; i < timestamps.length; i++) {
        let currentTimestamp = timestamps[i];
        let nextTimestamp = currentTimestamp + intervalSeconds;

        // Find the next timestamp in the array that is greater than or equal to the calculated nextTimestamp
        let nextIndex = timestamps.findIndex(timestamp => timestamp >= nextTimestamp);

        // If a matching timestamp is found, use it. Otherwise, use the calculated nextTimestamp.
        result.push(nextIndex !== -1 ? timestamps[nextIndex] : nextTimestamp);

        console.log({
            currentTimestamp,
            nextTimestamp,
            result: result[i] // Log the actual next timestamp used
        });
    }

    return result;
}



const timestamps = [
    1711585804, 1711585812, 1711585820, 1711585829, 1711585837, 1711585846, 1711585855, 1711585864, 1711585873,
    1711585881, 1711585890, 1711585899, 1711585907, 1711585916, 1711585924, 1711585932, 1711585941, 1711585949,
    1711585958, 1711585966, 1711585975, 1711585983, 1711585992, 1711586000, 1711586008, 1711586017, 1711586025,
    1711586033, 1711586042, 1711586050, 1711586058, 1711586067, 1711586075, 1711586084, 1711586092, 1711586100
];

const intervalSeconds = 30;
const result = findNextTimestamp(timestamps, intervalSeconds);
console.log(result);
