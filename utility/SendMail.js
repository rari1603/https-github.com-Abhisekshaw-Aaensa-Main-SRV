const nodemailer = require('nodemailer');


const SendMail = async (to, subject, htmlContent) => {
    try {
        // Initialize nodemailer
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL_ID,
                pass: process.env.EMAIL_APP_PASSWORD,
            },
        });

        const mailOptions = {
            from: "Software Support <no-reply@aaensa.com>",
            to: to,
            subject: subject,
            html: htmlContent,
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        // Log success and return a response
        console.log("Email sent:", info.messageId);
        return { success: true, message: "Email sent successfully." };
    } catch (error) {
        // Log error and return an error response
        console.error("Error sending email:", error);
        return { success: false, message: 'Service Unavailable: Error sending email' };
    }
}


module.exports = {
    SendMail
}