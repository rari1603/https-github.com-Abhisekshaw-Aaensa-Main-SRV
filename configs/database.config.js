require('dotenv').config();

const mongoose = require('mongoose');


const connectToDatabase = async () => {
    console.log("Trying to connect DB...");
    let currentDate = new Date();

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const dbInfo = {
            status: 'Connected to the database',
            host: mongoose.connection.host,
            DB: mongoose.connection.name,
            Time: currentDate
        };

        console.table(dbInfo);
        console.log("MongoDB Connection Successful");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1); // Exit the process on connection failure
    }

};

module.exports = { connectToDatabase };
