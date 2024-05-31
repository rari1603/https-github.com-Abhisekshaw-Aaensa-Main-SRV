const { stringify } = require("nodemon/lib/utils");

const DeviceDownloadCSV = async (data, Interval) => {
    // Define headers
    const headers = ['GatewayID', 'OptimizerID', 'Date', 'Time', 'RoomTemperature', 'Humidity', 'CoilTemperature', 'OptimizerMode'];


    // Initialize CSV content with headers
    let csvContent = headers.join(',') + '\n';
    // Loop through data and extract required fields
    data.forEach(function (entry) {
        entry.State.forEach(function (state) {
            state.location.forEach(function (location) {
                location.gateway.forEach(function (gateway) {
                    gateway.optimizerLogs.forEach(function (log) {
                        // Add data to CSV content
                        const dateString = new Date(parseInt(log.TimeStamp) * 1000).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split(", ");
                        const TimeString = new Date(parseInt(log.TimeStamp) * 1000).toLocaleString().split(", ");
                        csvContent += `"'${log.Gateway.GatewayID}'","'${log.OptimizerID.OptimizerID}'","${dateString}","${TimeString[1]}","${log.RoomTemperature}","${log.Humidity}","${log.CoilTemperature}","${log.OptimizerMode}"\n`;

                    });
                });
            });
        });
    });

    return csvContent;
}

const MeterDownloadCSV = async (data, Interval) => {
    // return data;
    // Define headers
    const headers = [
        'GatewayID', 'Date', 'Time', 'Ph1:Voltage', 'Ph1:Current', 'Ph1:ActivePower',
        'Ph1:PowerFactor', 'Ph1:ApparentPower', 'Ph2:Voltage', 'Ph2:Current',
        'Ph2:ActivePower', 'Ph2:PowerFactor', 'Ph2:ApparentPower',
        'Ph3:Voltage', 'Ph3:Current', 'Ph3:ActivePower',
        'Ph3:PowerFactor', 'Ph3:ApparentPower',
        'KVAH', 'KWH', 'PF'
    ];

    // Initialize CSV content with headers
    let csvContent = headers.join(',') + '\n';
    // 
    // 
    // Loop through data and extract required fields
    data.forEach(function (entry) {
        entry.State.forEach(function (state) {
            state.location.forEach(function (location) {
                location.gateway.forEach(function (gateway) {
                    gateway.GatewayLogs.forEach(function (meter) {

                        const dateString = new Date(parseInt(meter.TimeStamp) * 1000).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split(", ");
                        const TimeString = new Date(parseInt(meter.TimeStamp) * 1000).toLocaleString().split(", ");
                        csvContent += `"'${gateway.GatewayName}'","${dateString}","${TimeString[1]}","${meter.Phases.Ph1.Voltage}","${meter.Phases.Ph1.Current}","${meter.Phases.Ph1.ActivePower}","${meter.Phases.Ph1.PowerFactor}","${meter.Phases.Ph1.ApparentPower}","${meter.Phases.Ph2.Voltage}","${meter.Phases.Ph2.Current}","${meter.Phases.Ph2.ActivePower}","${meter.Phases.Ph2.PowerFactor}","${meter.Phases.Ph2.ApparentPower}","${meter.Phases.Ph3.Voltage}","${meter.Phases.Ph3.Current}","${meter.Phases.Ph3.ActivePower}","${meter.Phases.Ph3.PowerFactor}","${meter.Phases.Ph3.ApparentPower}","${meter.KVAH}","${meter.KWH}","${meter.PF}"\n`;

                    });
                });
            });
        });
    });

    return csvContent;
}

module.exports = {
    DeviceDownloadCSV,
    MeterDownloadCSV
};
