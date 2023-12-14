function fetchData() {
    console.log({ message: "Calling fake data URL." });
    fetch('http://localhost:3000/api/fake/fake')
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
