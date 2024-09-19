const Agenda = require('agenda');
const EnterpriseAuditMeter_job = require('../jobs/EnergyMeterAudit_job');
const AmbientAudit_Job = require('../jobs/ambientInfo_Job');
const Optimizer_Agg_job = require('../jobs/Optimizer_Agg');
const AC_ON_OFF_JOB = require('../jobs/AcOn_OFF_job')


const mongoConnectionString = process.env.MONGODB_URI;

const agenda = new Agenda({
  db: { address: mongoConnectionString, collection: 'jobs' }
});

// Initialize all the job definitions
// EnterpriseAuditMeter_job(agenda);
// AmbientAudit_Job(agenda);
// Optimizer_Agg_job(agenda);
// AC_ON_OFF_JOB(agenda);

// Start the Agenda process and re-schedule the jobs
 (async function () {
  await agenda.start();
  console.log("Agenda Started");


  // Clear any existing jobs to prevent duplication
  // await agenda.cancel({ name: 'EnergyMeterAudit' });
  // await agenda.cancel({ name: 'ambientInfo_Job' });
  //  await agenda.cancel({ name: 'Optimizer_Agg_job' });
  //  await agenda.cancel({ name: 'AC_ON_OFF_JOB' });

  // Schedule the jobs
  // await agenda.every('5 minutes', 'EnergyMeterAudit');
  // await agenda.every('1 hour', 'ambientInfo_Job');
  // await agenda.every('3 hours', 'Optimizer_Agg_job');
  // await agenda.every('3 hours', 'AC_ON_OFF_JOB');


})();

module.exports = agenda;
