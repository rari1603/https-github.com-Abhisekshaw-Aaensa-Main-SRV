// The data you want to post
const DATA = {
    "GatewayID": "9876543210GATEWAYFOUR",
    "TimeStamp": "",
    "OptimizerDetails": [
        {
            "RoomTemperature": 26.9,
            "Humidity": 0.0,
            "CoilTemperature": 25.6,
            "OptimizerID": "1234567890OPTIMIZER_EIGHT",
            "OptimizerMode": "NON-OPTIMIZATION"
        },
        {
            "RoomTemperature": 26.9,
            "Humidity": 0.0,
            "CoilTemperature": 25.6,
            "OptimizerID": "1234567890OPTIMIZER_SEVEN",
            "OptimizerMode": "NON-OPTIMIZATION"
        },
    ],
    "Phases": {
        "Ph1": {
            "Voltage": 0.00,
            "Current": 0.00,
            "ActivePower": 0.00,
            "PowerFactor": 0.00,
            "ApparentPower": 0.00
        },
        "Ph2": {
            "Voltage": 0.000000,
            "Current": 0.000000,
            "ActivePower": 0.000000,
            "PowerFactor": 0.000000,
            "ApparentPower": 0.000000
        },
        "Ph3": {
            "Voltage": 0.000000,
            "Current": 0.000000,
            "ActivePower": 0.00,
            "PowerFactor": 0.000000,
            "ApparentPower": 0.000000
        }
    },
    "KVAH": 0.00,
    "KWH": 0.000000,
    "PF": 0.000000
};

function fetchData() {
    // Get the current timestamp in UTC
    const currentUtcTimestamp = Math.floor(Date.now() / 1000);

    // Define the IST offset (UTC+5.5 for Indian Standard Time)
    const istOffsetSeconds = 5.5 * 60 * 60; // 5.5 hours in seconds

    // Calculate the current timestamp in IST
    const currentIstTimestamp = currentUtcTimestamp + istOffsetSeconds;

    // Update the DATA object with the current IST timestamp
    const updatedData = { ...DATA, TimeStamp: currentIstTimestamp };

    fetch('http://localhost:3000/api/hardware/gateway/save/data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // You may need to add other headers based on your API requirements
        },
        body: JSON.stringify(updatedData),
    })
        .then(response => response.json())
        .then(data => {
            // Process the data as needed
            console.log('Data received:', data);
        })
        .catch(error => {
            console.error('Error fetching data:', error.message);
        });
}

// Call fetchData every 7 seconds
setInterval(fetchData, 7000);
