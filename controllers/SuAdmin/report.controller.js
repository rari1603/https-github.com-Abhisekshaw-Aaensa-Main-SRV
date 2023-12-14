const DataLog = require('../../models/dataLog.model');


exports.AllDataLog = async (req, res) => {
    // console.log(req.body);
    const allData = await DataLog.find({});
    return res.send(allData.reverse());
}
