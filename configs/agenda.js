const Agenda = require('agenda');
const EnterpriseAuditMeter_job = require('../jobs/EnergyMeterAudit_job');

const mongoConnectionString = process.env.MONGODB_URI;

const agenda = new Agenda({
  db: { address: mongoConnectionString, collection: 'jobs' }
});

// Initialize all the job definitions
EnterpriseAuditMeter_job(agenda);

// Start the Agenda process and re-schedule the jobs
(async function () {
  await agenda.start();
  console.log("Agenda Started");
  

  // Clear any existing jobs to prevent duplication
  await agenda.cancel({ name: 'EnergyMeterAudit' });

  // Schedule the jobs
  await agenda.every('5 seconds', 'EnergyMeterAudit');


})();

module.exports = agenda;
