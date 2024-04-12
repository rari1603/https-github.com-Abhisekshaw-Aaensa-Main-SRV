const timestamps = [
    1711585804, 1711585812, 1711585820, 1711585829, 1711585837, 1711585846, 1711585855, 1711585864, 1711585873, 1711585881,
    1711585890, 1711585899, 1711585907, 1711585916, 1711585924, 1711585932, 1711585941, 1711585949, 1711585958, 1711585966,
    1711585975, 1711585983, 1711585992, 1711586000, 1711586008, 1711586017, 1711586025, 1711586033, 1711586042, 1711586050,
    1711586058, 1711586067, 1711586075, 1711586084, 1711586092, 1711586100, 1711586109, 1711586118, 1711586126, 1711586135,
    1711586143, 1711586152, 1711586160, 1711586169, 1711586177, 1711586185, 1711586194, 1711586202, 1711586210, 1711586219,
    1711586227, 1711586236, 1711586244, 1711586253, 1711586261, 1711586270, 1711586278, 1711586286, 1711586295, 1711586303,
    1711586312, 1711586320, 1711586328, 1711586337, 1711586345, 1711586354, 1711586362, 1711586371, 1711586379, 1711586388,
    1711586396, 1711586404, 1711586413, 1711586421, 1711586430, 1711586438, 1711586446, 1711586455, 1711586463, 1711586472,
    1711586480, 1711586489, 1711586497, 1711586506, 1711586514, 1711586523, 1711586532, 1711586541, 1711586550, 1711586559,
    1711586568, 1711586576, 1711586585, 1711586594, 1711586602, 1711586610, 1711586618, 1711586627, 1711586635, 1711586644
];

const intervalSeconds = 15;

function findNextAvailableTimestamp(currentTimestamp) {
    for (let i = 0; i < timestamps.length; i++) {
        if (timestamps[i] > currentTimestamp) {
            return timestamps[i];
        }
    }
    return null; // If no next available timestamp found
}

function generateTimestamps(timestamps, intervalSeconds) {
    const generatedTimestamps = [];
    let currentTimestamp = timestamps[0];

    for (let i = 0; i < timestamps.length - 1; i++) {
        const nextTimestamp = currentTimestamp + intervalSeconds;

        if (timestamps.includes(nextTimestamp)) {
            generatedTimestamps.push(nextTimestamp);
            currentTimestamp = nextTimestamp;
        } else {
            const nextAvailableTimestamp = findNextAvailableTimestamp(nextTimestamp);
            if (nextAvailableTimestamp !== null) {
                generatedTimestamps.push(nextAvailableTimestamp);
                currentTimestamp = nextAvailableTimestamp;
            } else {
                break; // No further timestamps available
            }
        }
    }

    return generatedTimestamps;
}

const result = generateTimestamps(timestamps, intervalSeconds);
// Output the result
console.log("Report should display data at the following timestamps:");
result.forEach(ts => console.log(ts, new Date(ts * 1000).toLocaleString())); // Convert Unix timestamp to human-readable format

console.log(result);
