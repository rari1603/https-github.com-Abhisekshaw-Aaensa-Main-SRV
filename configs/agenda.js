require('dotenv').config();
const Agenda = require('agenda');

const mongoConnectionString = process.env.MONGODB_URI;
const dbName = 'test'; // Replace with your preferred database name
const collectionName = 'agendassJobs'; // Default collection name for Agenda jobs

const agenda = new Agenda({
    db: { address: mongoConnectionString, collection: collectionName },
    processEvery: '5 seconds', // Change the frequency of job processing as needed
});

// Define the 'send email' job
agenda.define('send email', async (job) => {
    const { to, subject, body } = job.attrs.data;
    console.log("++++++++++++++");
    console.log(`Sending email to ${to} with subject "${subject}" and body "${body}"`);
    // Here you'd send the email using a service like nodemailer
});



module.exports = agenda;

