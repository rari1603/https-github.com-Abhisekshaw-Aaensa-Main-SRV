// jobs/sendEmail.js
module.exports = (agenda) => {
    agenda.define('send email', async (job) => {
      const { to, subject, body } = job.attrs.data;
      console.log(`Sending email to ${to} with subject "${subject}" and body "${body}"`);
      // Here you'd send the email using a service like nodemailer
    });
  };