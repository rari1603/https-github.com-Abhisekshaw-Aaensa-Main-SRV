const express = require('express');
const HardwareController = require('../controllers/Hardware/HardwareController');
const router = express.Router();

router.get('/get/config/:gateway_id', HardwareController.Config);
// called by gateway if is_config: true
router.get('/connectivity/config/service/:gateway_id', HardwareController.Property);
// Feedback api 
router.get('/feedback/service/:gateway_id?/:optimizer?', HardwareController.Feedback);



// Store gateway and optimizer data.
router.post('/gateway/save/data', HardwareController.Store);




module.exports = router;