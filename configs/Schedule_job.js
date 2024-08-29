const agenda = require('./agenda');

(
    async function () {
        await agenda.start();

        setInterval(async () => {
            const uniqueIdentifier = Date.now();
            await agenda.schedule('in 5 seconds', 'send email', {
                to: 'example@example.com',
                subject: `Hello World ${uniqueIdentifier}`,
                body: ` This is a test email sent at ${new Date(uniqueIdentifier).toLocaleDateString()}.`,
            })
        }, 5000);
        // Graceful shutdown
        process.on('SIGTERM', async () => {
            await agenda.stop();
            process.exit(0);
        });

        process.on('SIGINT', async () => {
            await agenda.stop();
            process.exit(0);
        });
    })();