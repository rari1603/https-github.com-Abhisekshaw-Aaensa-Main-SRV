const express = require('express');
const HardwareController = require('../controllers/Hardware/HardwareController');
const router = express.Router();

router.get('/get/config/:gateway_id', HardwareController.Config);
// called by gateway if is_config: true
router.get('/connectivity/config/service/:gateway_id', HardwareController.Property);
// Feedback api 
router.get('/feedback/service/:gateway_id?/:optimizer?', HardwareController.Feedback);


// Optimizer Setting Value
router.post('/optimizer/setting/default/value/:flag?', HardwareController.OptimizerDefaultSettingValue);  // need middleware here to prevent unwanted access.
router.get('/optimizer/setting/default/value/:flag?', HardwareController.OptimizerDefaultSettingValue);  // need middleware here to prevent unwanted access.
router.post('/optimizer/setting/value/update', HardwareController.SetOptimizerSettingValue);  // need middleware here to prevent unwanted access.
router.post('/reset/optimizer', HardwareController.ResetOptimizerSettingValue);  // need middleware here to prevent unwanted access.





// Store gateway and optimizer data.
router.post('/gateway/save/data', HardwareController.Store);




module.exports = router;