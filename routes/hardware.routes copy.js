const express = require('express');
const HardwareController = require('../controllers/Hardware/HardwareController');
const { CheckSetOptimizerSetting, CheckResetOptimizerSetting } = require('../middleware/hardware/Hardware.middleware');
const verifyToken = require('../middleware/authentication.middleware');
const routeAccessMiddleware = require('../middleware/access.middleware');
const router = express.Router();



// Store gateway and optimizer data.
router.post('/gateway/save/data', HardwareController.Store);

//device status -----
router.post('/device/status',HardwareController.deviceStatus);

// Optimizer switch bypass
router.post('/bypass/optimizers', [verifyToken, routeAccessMiddleware()], HardwareController.BypassOptimizers);
// Fetch Configureable Data
router.get('/get/config/:gateway_id', HardwareController.ConfigureableData);
// Device configureable ready API
router.post('/device/ready/to/config/:gateway_id', [verifyToken, routeAccessMiddleware()], HardwareController.DeviceReadyToConfig);
// Check All Devices Online Status API
router.post('/check/all/device/online/status', HardwareController.CheckAllDevicesOnlineStatus);
// InstallationProperty API
router.get('/connectivity/config/service/:gateway_id', HardwareController.InstallationProperty);

// Optimizer Setting Value
router.post('/optimizer/setting/default/value/:flag?', HardwareController.OptimizerDefaultSettingValue);
router.get('/optimizer/setting/default/value/:flag?', HardwareController.OptimizerDefaultSettingValue);
router.post('/optimizer/setting/value/update', [verifyToken, CheckSetOptimizerSetting], HardwareController.SetOptimizerSettingValue);
router.post('/reset/optimizer', [verifyToken, CheckResetOptimizerSetting], HardwareController.ResetOptimizerSettingValue);

// Get Optimizer Current Setting Value
router.post('/get/optimizer/current/settings/:optimzerID', [verifyToken, routeAccessMiddleware()], HardwareController.GetOptimizerCurrentSettingValue);

// Acknowledgement from the configured gateway API
router.post('/acknowledge/from/conf/gateway/:gateway_id', HardwareController.AcknowledgeFromConfGateway);
// Settings Acknowledgement after set/reset
router.post('/setting/acknowledge/after/set/reset', HardwareController.BypassSetRestSettingsAcknowledgement);







module.exports = router;