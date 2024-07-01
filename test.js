const fs = require('fs');
const express = require('express');
const app = express();
app.use(express.json());

const COUNTERS_FILE = 'counters.json';

// Function to read the counters from the JSON file
function readCounters() {
    if (!fs.existsSync(COUNTERS_FILE)) {
        fs.writeFileSync(COUNTERS_FILE, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(COUNTERS_FILE, 'utf8'));
}

// Function to write the counters to the JSON file
function writeCounters(counters) {
    fs.writeFileSync(COUNTERS_FILE, JSON.stringify(counters, null, 2));
}

// ACFUN function
function ACFUN(status) {
    console.log(`ACFUN called with status: ${status}`);
    // Perform the required action here
}

// API endpoint to handle incoming data
app.post('/update-status', (req, res) => {
    const { OptimizerID, DeviceStatus } = req.body;
    // console.log('Received request:', req.body);

    if (!OptimizerID || !DeviceStatus) {
        return res.status(400).send('Missing required fields');
    }

    let counters = readCounters();
    // console.log('Current counters:', counters);

    let counterIndex = counters.findIndex(c => c[OptimizerID] !== undefined);
    // console.log('Found counter index:', counterIndex, 'for OptimizerID:', OptimizerID);

    if (counterIndex === -1) {
        // Counter not found, add new counter
        let newCounter = { [OptimizerID]: 0 };
        counters.push(newCounter);
        counterIndex = counters.length - 1;
        // console.log(`Added new counter for OptimizerID ${OptimizerID}`);
    }

    if (DeviceStatus === 'OFF') {
        counters[counterIndex][OptimizerID]++;
        if (counters[counterIndex][OptimizerID] >= 5) {
            counters.splice(counterIndex, 1);
            ACFUN('OFF');
        }
    } else if (DeviceStatus === 'ON') {
        // counters[counterIndex][OptimizerID] = 0;
        counters.splice(counterIndex, 1);
    }

    writeCounters(counters);
    res.send('Status updated successfully');
});

const PORT = 7000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
