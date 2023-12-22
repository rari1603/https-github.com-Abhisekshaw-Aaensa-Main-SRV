const express = require('express');
const HardwareController = require('../controllers/Hardware/HardwareController');
const router = express.Router();

router.get('/get/config/:gateway_id', HardwareController.Config);
// router.get('/gateway/config/:gateway_id', HardwareController.Property);


router.post('/gateway/save/data', HardwareController.Store);




module.exports = router;