const Agenda = require('agenda');
const EnterpriseAuditMeter_job = require('../jobs/EnergyMeterAudit_job');
const dailyEnterprise_Job = require('../jobs/dailyEnterprise_Job');
const AmbientAudit_Job = require('../jobs/ambientInfo_Job');
const Optimizer_Agg_job = require('../jobs/Optimizer_Agg');
const AC_ON_OFF_JOB = require('../jobs/AcOn_OFF_job')
// const Optimizer_Hist_job = require('../jobs/OptLogHistoricalJob')
// const Gateway_Hist_job = require('../jobs/GatewayLogHistoricalJob')
require('dotenv').config();

const mongoConnectionString = process.env.MONGODB_URI;

const agenda = new Agenda({
  db: { address: mongoConnectionString, collection: 'jobs' }
});

// Initialize all the job definitions
EnterpriseAuditMeter_job(agenda);
dailyEnterprise_Job(agenda);
Optimizer_Agg_job(agenda);
AmbientAudit_Job(agenda);
AC_ON_OFF_JOB(agenda);
// Optimizer_Hist_job(agenda);
// Gateway_Hist_job(agenda);

// Start the Agenda process and re-schedule the jobs
(async function () {



  // await agenda.schedule("in 2 minutes", 'Optimizer_Hist_job');
  // await agenda.schedule("in 1 minutes", 'Gateway_Hist_job');


  const cmdlineargs = process.argv.slice(2);
  console.log({ cmdlineargs });

  if (cmdlineargs.length > 0 && cmdlineargs[0] == "cron") {
    await agenda.start();
    console.log("Agenda Started");

  // Clear any existing jobs to prevent duplication
    // await agenda.cancel({ name: 'EnergyMeterAudit' });
    // await agenda.cancel({ name: 'ambientInfo_Job' });
    // await agenda.cancel({ name: 'Optimizer_Agg_job' });
    // await agenda.cancel({ name: 'AC_ON_OFF_JOB' });
    // await agenda.cancel({ name: 'dailyEnterprise_Job' });




    // Check when the next execution time is for a specific job

    const nextRunAcOnOffJob = await agenda.jobs({ name: 'AC_ON_OFF_JOB' }, { nextRunAt: 1 });
    if (nextRunAcOnOffJob.length > 0) {
      console.log(`Next 'AC_ON_OFF_JOB' job will run at: ${nextRunAcOnOffJob[0].attrs.nextRunAt}`);
    } else {
      console.log("No job scheduled, scheduling 'AC_ON_OFF_JOB' now.");
      await agenda.every('5 */3 * * *', 'AC_ON_OFF_JOB');
    }


    //Check when the next execution time is for a specific job
    const nextRunEnterpriseAuditMeter_job = await agenda.jobs({ name: 'EnergyMeterAudit' }, { nextRunAt: 1 });
    if (nextRunEnterpriseAuditMeter_job.length > 0) {
      console.log(`Next 'EnergyMeterAudit' job will run at: ${nextRunEnterpriseAuditMeter_job[0].attrs.nextRunAt}`);
    } else {
      console.log("No job scheduled, scheduling 'EnergyMeterAudit' now.");
      await agenda.every('*/5 * * * *', 'EnergyMeterAudit');
    }
    // Check when the next execution time is for a specific job
    const nextRunAmbientAudit_Job = await agenda.jobs({ name: 'ambientInfo_Job' }, { nextRunAt: 1 });
    if (nextRunAmbientAudit_Job.length > 0) {
      console.log(`Next 'ambientInfo_Job' job will run at: ${nextRunAmbientAudit_Job[0].attrs.nextRunAt}`);
    } else {
      console.log("No job scheduled, scheduling 'ambientInfo_Job' now.");
      await agenda.every('0 */1 * * *', 'ambientInfo_Job');
    }
    // Check when the next execution time is for a specific job
    const nextRunOptAggJob = await agenda.jobs({ name: 'Optimizer_Agg_job' }, { nextRunAt: 1 });
    if (nextRunOptAggJob.length > 0) {
      console.log(`Next 'Optimizer_Agg_job' job will run at: ${nextRunOptAggJob[0].attrs.nextRunAt}`);
    } else {
      console.log("No job scheduled, 'scheduling Optimizer_Agg_job' now.");
      await agenda.every('0 */3 * * *', 'Optimizer_Agg_job');
      // '0 */3 * * *'
    }
    // Check when the next execution time is for a specific job
    const nextRunDailyEnterprise = await agenda.jobs({ name: 'dailyEnterprise_Job' }, { nextRunAt: 1 });
    if (nextRunDailyEnterprise.length > 0) {
      console.log(`Next 'dailyEnterprise_Job' job will run at: ${nextRunDailyEnterprise[0].attrs.nextRunAt}`);
    } else {
      console.log("No job scheduled, 'scheduling dailyEnterprise_Job' now.");
      await agenda.every('0 0 * * *', 'dailyEnterprise_Job');
    }
  } else {
    console.log("Cron jobs not enabled. args:" + cmdlineargs);
  }
})();


module.exports = agenda;
