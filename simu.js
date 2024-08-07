const express = require('express');
const Chance = require('chance');
const chance = new Chance();
const axios = require('axios');
const app = express();
const port = 9090;

// Define the endpoint
app.get('/simulate', (req, res) => {
    // Simulated data
    const simulatedData = {
        "GatewayID": "NGCS2023011021",
        "meterID": "540640023664",
        "TimeStamp": Math.floor(new Date().getTime() / 1000),
        "OptimizerDetails": [
            {
                "TimeStamp": Math.floor(new Date().getTime() / 1000),
                "RoomTemperature": chance.floating({ min: 20, max: 30, fixed: 1 }),
                "Humidity": chance.floating({ min: 30, max: 50, fixed: 2 }),
                "CoilTemperature": chance.floating({ min: 10, max: 30, fixed: 1 }),
                "OptimizerID": "NGCSEA0A9DB3E8",
                "OptimizerMode": "NON-OPTIMIZATION",
                "CompStatus": "COMPON",
                "Ac_Status": "ON"
            },
            {
                "TimeStamp": Math.floor(new Date().getTime() / 1000),
                "RoomTemperature": chance.floating({ min: 20, max: 30, fixed: 1 }),
                "Humidity": chance.floating({ min: 30, max: 50, fixed: 2 }),
                "CoilTemperature": chance.floating({ min: 10, max: 30, fixed: 1 }),
                "OptimizerID": "NGCSEB146DB9D8",
                "OptimizerMode": "OPTIMIZATION",
                "CompStatus": "COMPOFF",
                "Ac_Status": "ON"
            },
            {
                "TimeStamp": Math.floor(new Date().getTime() / 1000),
                "RoomTemperature": chance.floating({ min: 20, max: 30, fixed: 1 }),
                "Humidity": chance.floating({ min: 30, max: 50, fixed: 2 }),
                "CoilTemperature": chance.floating({ min: 10, max: 30, fixed: 1 }),
                "OptimizerID": "NGCSE732B49530",
                "OptimizerMode": "OPTIMIZATION",
                "CompStatus": "COMPOFF+OPT",
                "Ac_Status": "ON"
            }
        ],
        "Phases": {
            "Ph1": {
                "Voltage": chance.floating({ min: 220, max: 240, fixed: 2 }),
                "Current": chance.floating({ min: 20, max: 40, fixed: 2 }),
                "ActivePower": chance.floating({ min: 5, max: 10, fixed: 2 }),
                "PowerFactor": chance.floating({ min: 0.8, max: 1, fixed: 2 }),
                "ApparentPower": chance.floating({ min: 5, max: 10, fixed: 2 })
            },
            "Ph2": {
                "Voltage": chance.floating({ min: 220, max: 240, fixed: 2 }),
                "Current": chance.floating({ min: 5, max: 15, fixed: 2 }),
                "ActivePower": chance.floating({ min: -1, max: 1, fixed: 2 }),
                "PowerFactor": chance.floating({ min: 0, max: 0.5, fixed: 2 }),
                "ApparentPower": chance.floating({ min: 3, max: 5, fixed: 2 })
            },
            "Ph3": {
                "Voltage": chance.floating({ min: 220, max: 240, fixed: 2 }),
                "Current": chance.floating({ min: 20, max: 40, fixed: 2 }),
                "ActivePower": chance.floating({ min: 5, max: 10, fixed: 2 }),
                "PowerFactor": chance.floating({ min: 0.8, max: 1, fixed: 2 }),
                "ApparentPower": chance.floating({ min: 5, max: 10, fixed: 2 })
            }
        },
        "KVAH": chance.floating({ min: 1000, max: 2000, fixed: 2 }),
        "KWH": chance.floating({ min: 1000, max: 2000, fixed: 2 }),
        "PF": chance.floating({ min: 0.8, max: 1, fixed: 2 })
    };

    console.log("Simulated data:", simulatedData);

    const url = 'http://localhost:8080/api/hardware/gateway/save/data';
    axios.post(url, simulatedData, {
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            console.log('Data posted successfully:', response.data);
            res.send({ message: 'Data posted successfully:', response: response.data });
        })
        .catch(error => {
            console.error('Error posting data:', error.message);
            if (error.response) {
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
                console.error('Error response headers:', error.response.headers);
            }
            res.status(500).send({ message: 'Error posting data', error: error.message });
        });
});

// Start the server
app.listen(port, () => {
    console.log(`API Simulator is running at http://localhost:${port}`);
});
