const express = require('express');
const ReportController = require('../controllers/SuAdmin/report.controller');
const verifyToken = require('../middleware/authentication.middleware');
const routeAccessMiddleware = require('../middleware/access.middleware');
const router = express.Router();

router.get('/get/all/data', verifyToken, routeAccessMiddleware(), ReportController.AllDataLog);


// router.get('/hi', routeAccessMiddleware(), UserController.index);


module.exports = router;