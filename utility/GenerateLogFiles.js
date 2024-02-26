// Function to write log to file
const writeToLog = (logData) => {
    const logFilePath = 'logfile.txt';

    // Convert log data to string
    const logMessage = JSON.stringify(logData, null, 2);

    // Append log message to the log file
    fs.appendFile(logFilePath, logMessage + '\n', (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        } else {
            console.log('Log message written to file:', logData);
        }
    });
}