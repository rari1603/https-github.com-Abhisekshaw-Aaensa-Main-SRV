require('dotenv').config();

const mongoose = require('mongoose');
const OptimizerModel = require('../models/optimizer.model');
const OptimizerLogModel = require('../models/OptimizerLog.model');

const connectToDatabase = async () => {
    console.log("Trying to connect DB...");
    let currentDate = (new Date()).toString();

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const dbInfo = {
            status: 'Connected to the database',
            host: mongoose.connection.host,
            DB: mongoose.connection.name,
            Time: currentDate
        };

        // Create indexes after connection
        // await createIndexes();

        console.table(dbInfo);
        console.log("MongoDB Connection Successful");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
        process.exit(1); // Exit the process on connection failure
    }

};

const createIndexes = async () => {
    try {
        await OptimizerLogModel.createIndexes([{ OptimizerID: 1, createdAt: -1 }]);
        await OptimizerModel.createIndexes([{ _id: 1 }]);
        console.log("Indexes created successfully.");
    } catch (error) {
        console.error("Error creating indexes:", error);
    }
};


module.exports = { connectToDatabase };
