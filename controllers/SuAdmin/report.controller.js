const DataLog = require('../../models/dataLog.model');


exports.AllDataLog = async (req, res) => {
    try {
        const allData = await DataLog.find({})
            .sort({ createdAt: -1 })  // Sort by createdAt field in descending order
            .limit(100);  // Limit the result to 100 records
        return res.send(allData);

    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Internal Server Error');
    }
};
