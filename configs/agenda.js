require('dotenv').config();
const { MongoClient } = require('mongodb');
const Agenda = require('agenda');

const mongoConnectionString = process.env.MONGODB_URI;
const dbName = 'test'; // Replace with your preferred database name
const collectionName = 'agendassJobs'; // Default collection name for Agenda jobs

async function setupAgenda() {
    const client = new MongoClient(mongoConnectionString, {
        // useUnifiedTopology: true,
        ssl: true, // Ensure SSL is enabled if required
    });

    try {
        await client.connect();
        console.log('Connected to DocumentDB');

        const db = client.db(dbName);
        // console.log(client);
        // console.log(client.connect());

        // Create indexes for the Agenda jobs collection
        await db.collection(collectionName).createIndex({ name: 1, priority: -1, lockedAt: 1, nextRunAt: 1, disabled: 1 });
        await db.collection(collectionName).createIndex({ lockedAt: 1, name: 1, priority: -1, nextRunAt: 1, disabled: 1 });

        // Initialize Agenda with the MongoDB collection
        const agenda = new Agenda({                                         
            mongo: db,
            db: { collection: collectionName },
            processEvery: '5 seconds', // Check every 5 seconds
        });

        agenda.define('welcome',() => {
            console.log('welcome to Agenda!!!');
        });

        await agenda.start()

        await agenda.every("5 seconds", "welcome");

        // agenda.on('ready', async () => {
        //     console.log('Agenda started');
        //     await agenda.start();
        // });

        // agenda.on('error', (error) => {
        //     console.error('Agenda connection error:', error);
        // });

        //   // Log when a job starts processing
        //   agenda.on('start', (job) => {
        //     console.log(`Job ${job.attrs.name} is starting...`);
        // });

        const closeAgenda = async () => {
            await agenda.stop();
            console.log('Agenda stopped');
        };
        // Return agenda and client for further use
        return { agenda, closeAgenda };

    } catch (error) {
        console.error('Error starting Agenda:', error);
        throw error; // Re-throw the error after logging
    }
}

module.exports = setupAgenda;
