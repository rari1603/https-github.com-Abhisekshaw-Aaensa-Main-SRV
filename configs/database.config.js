require('dotenv').config();

const mongoose = require('mongoose');

const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        const dbInfo = {
            status: 'Connected to the database',
            host: mongoose.connection.host,
            DB: mongoose.connection.name,
        };

        console.table(dbInfo);
    } catch (error) {
        console.error('Error connecting to the database:', error);
        process.exit(1); // Exit the application on database connection error
    }
};

module.exports = { connectToDatabase };
