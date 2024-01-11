// The data you want to post
const DATA = {
    "GatewayID": "WB110120240238ONE",
    "OptimizerDetails": [
        {
            "TimeStamp": "2024-01-11 03:00:00",
            "RoomTemperature": 22.5,
            "Humidity": null,
            "CoilTemperature": 28.9,
            "OptimizerID": "WB110120240238OPTONE",
            "OptimizerMode": "NON-OPTIMIZATION"
        },
        {
            "TimeStamp": "2024-01-11 03:00:00",
            "RoomTemperature": 18.7,
            "Humidity": null,
            "CoilTemperature": 21.8,
            "OptimizerID": "WB110120240242OPTTWO",
            "OptimizerMode": "NON-OPTIMIZATION"
        }
    ],
    "Phases": {
        "Ph1": {
            "Voltage": "1.1203",
            "Current": "2.2130",
            "ActivePower": "2.3654",
            "PowerFactor": "3.8564",
            "ApparentPower": "8.0884"
        },
        "Ph2": {
            "Voltage": "9.15476",
            "Current": "12.4786",
            "ActivePower": "9.123456",
            "PowerFactor": "0.9875",
            "ApparentPower": "7.812451"
        },
        "Ph3": {
            "Voltage": "9.87461",
            "Current": "5.67785",
            "ActivePower": "0.97634",
            "PowerFactor": "6.758487",
            "ApparentPower": "6.02165"
        }
    },
    "KVAH": "25",
    "KWH": "2.0000",
    "PF": "3.1200"
};

function fetchData() {
    console.log({ message: "Calling fake data URL." });
    fetch('http://localhost:3000/api/fake/add/gateway/optimizer/data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // You may need to add other headers based on your API requirements
        },
        body: JSON.stringify(DATA),
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

// Call fetchData every 10 seconds
setInterval(fetchData, 20000);
