const Agenda = require('agenda');
const EnterpriseAuditMeter_job = require('../jobs/EnergyMeterAudit_job');
const AmbientAudit_Job = require('../jobs/ambientInfo_Job');
const Optimizer_Agg_job = require('../jobs/Optimizer_Agg');
const AC_ON_OFF_JOB = require('../jobs/AcOn_OFF_job')
require('dotenv').config();

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
  const cmdlineargs = process.argv.slice(2);
  if(cmdlineargs.length > 0 && cmdlineargs[0] == "cron"){
  await agenda.start();
  console.log("Agenda Started");

  // Clear any existing jobs to prevent duplication
  // await agenda.cancel({ name: 'EnergyMeterAudit' });
  // await agenda.cancel({ name: 'ambientInfo_Job' });
  // await agenda.cancel({ name: 'Optimizer_Agg_job' });
  // await agenda.cancel({ name: 'AC_ON_OFF_JOB' });

  // Schedule the jobs
  // await agenda.every('5 minutes', 'EnergyMeterAudit');
  // await agenda.every('1 hour', 'ambientInfo_Job');
  // await agenda.every('3 hours', 'Optimizer_Agg_job');
  // await agenda.every('3 hours', 'AC_ON_OFF_JOB');


  // Check when the next execution time is for a specific job
  const nextRunOptAggJob = await agenda.jobs({ name: 'Optimizer_Agg_job' }, { nextRunAt: 1 });
  if (nextRunOptAggJob.length > 0) {
    console.log(`Next 'Optimizer_Agg_job' job will run at: ${nextRunOptAggJob[0].attrs.nextRunAt}`);
  } else {
    console.log("No job scheduled, 'scheduling Optimizer_Agg_job' now.");
    await agenda.every('3 hours', 'Optimizer_Agg_job');
  }

  // Check when the next execution time is for a specific job
  const nextRunAcOnOffJob = await agenda.jobs({ name: 'AC_ON_OFF_JOB' }, { nextRunAt: 1 });
  if (nextRunAcOnOffJob.length > 0) {
    console.log(`Next 'AC_ON_OFF_JOB' job will run at: ${nextRunAcOnOffJob[0].attrs.nextRunAt}`);
  } else {
    console.log("No job scheduled, scheduling 'AC_ON_OFF_JOB' now.");
    await agenda.every('3 hours', 'AC_ON_OFF_JOB'); 
 }
}else{
  console.log("Cron jobs not enabled. args:" + cmdlineargs);
}
})();


module.exports = agenda;
