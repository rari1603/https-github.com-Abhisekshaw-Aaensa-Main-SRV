const express = require('express');
const HardwareController = require('../controllers/Hardware/HardwareController');
const router = express.Router();

router.get('/get/config/:gateway_id', HardwareController.Config);




module.exports = router;