const { stringify } = require("nodemon/lib/utils");
const fs = require('fs');

const DeviceDownloadCSV = async (data, Interval) => {
    // Define headers
    const headers = ['GatewayID', 'OptimizerID', 'ACTonnage', "OptimizerName", 'Date', 'Time', 'RoomTemperature', 'Humidity', 'GrillTemperature', 'OptimizerMode'];


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
                        csvContent += `"'${log.Gateway.GatewayID}'","'${log.OptimizerID.OptimizerID}'","${log.OptimizerID.ACTonnage}","${log.OptimizerID.OptimizerName}","${dateString}","${TimeString[1]}","${log.RoomTemperature}","${log.Humidity}","${log.CoilTemperature}","${log.OptimizerMode}"\n`;

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

const UsageTrendDownload = async (data, Interval) => {
    // Function to format time into hrs:min:sec format
    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours} hrs: ${minutes} min: ${seconds} sec`;
    };
    
    const csvData = data.map((item) => {
        const day = new Date(parseInt(item.StartTime) * 1000).toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
        const totalCutoffTimeThrm = formatTime(item.totalCutoffTimeThrm);
        const totalCutoffTimeOpt = formatTime(item.totalCutoffTimeOpt);
        const totalRemainingTime = formatTime(item.totalRemainingTime);
        const totalruntime = formatTime(item.totalRemainingTime + item.totalCutoffTimeOpt + item.totalCutoffTimeThrm);
        
        let acOnTimes = '';
        let acOffTimes = '';
        
        if (Interval === "Day") {
            acOnTimes = `"${item.ACCutoffTimes.filter(time => time.ACOnTime).map(time => new Date(time.ACOnTime * 1000).toLocaleTimeString()).join(', ')}"`;
            acOffTimes = `"${item.ACCutoffTimes.filter(time => time.ACOffTime).map(time => new Date(time.ACOffTime * 1000).toLocaleTimeString()).join(', ')}"`;
        }
        
        return {
            'DAY': day,
            'OPTIMIZER ID': item._id,
            'THERMOSTAT CUTOFF (HRS)': totalCutoffTimeThrm,
            'DEVICE CUTOFF (HRS)': totalCutoffTimeOpt,
            'REMAINING RUNTIME(HRS)': totalRemainingTime,
            'TOTAL RUNTIME(HRS)': totalruntime,
            ...(Interval === "Day" && {'AC ON Time': acOnTimes, 'AC OFF TIME': acOffTimes}),
        };
    });
    
    const headers = ['DAY', 'OPTIMIZER ID', 'THERMOSTAT CUTOFF (HRS)', 'DEVICE CUTOFF (HRS)', 'REMAINING RUNTIME(HRS)', 'TOTAL RUNTIME(HRS)'];
    
    if (Interval === "Day") {
        headers.push('AC ON Time', 'AC OFF TIME');
    }
    
    const csvRows = [headers.join(',')];
    csvData.forEach(row => {
        const value = headers.map(header => row[header]);
        csvRows.push(value.join(','));
        
    });
    
    const csvContent = csvRows.join('\n');
    return csvContent;
};


module.exports = {
    DeviceDownloadCSV,
    MeterDownloadCSV,
    UsageTrendDownload
};
