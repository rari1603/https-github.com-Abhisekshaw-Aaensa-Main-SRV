const setupAgenda = require('./agenda');
const NewApplianceLogModel = require('../models/NewApplianceLog.model');
const OptimizerLogModel = require('../models/OptimizerLog.model');

async function scheduleJobs() {
    const { agenda, closeAgenda } = await setupAgenda();
    console.log(agenda);

    agenda.define('Welc22ome',() =>{
        console.log('welcome to Agenda!!!');
    });
   
    // Schedule the job to run every 5 minutes
    await agenda.every('5 seconds', 'Welc22ome');

    process.on('SIGTERM', async () => {
        await closeAgenda();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        await closeAgenda();
        process.exit(0);
    });
}

module.exports = scheduleJobs;
