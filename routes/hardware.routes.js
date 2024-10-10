const express = require('express');
const HardwareController = require('../controllers/Hardware/HardwareController');
const { CheckSetOptimizerSetting, CheckResetOptimizerSetting } = require('../middleware/hardware/Hardware.middleware');
const verifyToken = require('../middleware/authentication.middleware');
const routeAccessMiddleware = require('../middleware/access.middleware');
const { logMiddleware } = require('../middleware/log.middleware'); // Import the log middleware
const router = express.Router();


// Store gateway and optimizer data.
router.post('/gateway/save/data', [logMiddleware('info', 'info-write-gateway-save-data')], HardwareController.Store);

//device status -----
router.post('/device/status', HardwareController.deviceStatus);

// Optimizer switch bypass

router.post('/bypass/schedule', [verifyToken, routeAccessMiddleware(), logMiddleware('info', 'info-write-bypass-optimizers')], HardwareController.ScheduleByPass);
router.post('/bypass/onoff', [verifyToken, routeAccessMiddleware(), logMiddleware('info', 'info-write-bypass-optimizers')], HardwareController.TurnByPassOnOff);
router.post('/bypass/delete', [verifyToken, routeAccessMiddleware(), logMiddleware('info', 'info-write-bypass-optimizers')], HardwareController.DeleteScheduleByPass);


// Fetch Configureable Data
router.get('/get/config/:gateway_id', [logMiddleware('info', 'info-read-configureable-data')], HardwareController.ConfigureableData);

// Device configureable ready API
router.post('/device/ready/to/config/:gateway_id', [verifyToken, routeAccessMiddleware(), logMiddleware('info', 'info-write-device-ready-to-config')], HardwareController.DeviceReadyToConfig);

// Check All Devices Online Status API
router.post('/check/all/device/online/status', [logMiddleware('info', 'info-read-check-all-device-online-status')], HardwareController.CheckAllDevicesOnlineStatus);

// InstallationProperty API
router.get('/connectivity/config/service/:gateway_id', [logMiddleware('info', 'info-read-installation-property')], HardwareController.InstallationProperty);


// Optimizer Setting Value
router.post('/optimizer/setting/default/value/:flag?', [logMiddleware('info', 'info-read-optimizer-default-setting')], HardwareController.OptimizerDefaultSettingValue);
router.get('/optimizer/setting/default/value/:flag?', [logMiddleware('info', 'info-read-optimizer-default-setting')], HardwareController.OptimizerDefaultSettingValue);
router.post('/optimizer/setting/value/update', [verifyToken, CheckSetOptimizerSetting, logMiddleware('info', 'info-write-optimizer-setting-value-update')], HardwareController.SetOptimizerSettingValue);
router.post('/reset/optimizer', [verifyToken, CheckResetOptimizerSetting, logMiddleware('info', 'info-write-reset-optimizer')], HardwareController.ResetOptimizerSettingValue);

// Get Optimizer Current Setting Value
router.post('/get/optimizer/current/settings/:optimzerID', [verifyToken, routeAccessMiddleware(), logMiddleware('info', 'info-read-optimizer-current-settings')], HardwareController.GetOptimizerCurrentSettingValue);

// Acknowledgement from the configured gateway API
router.post('/acknowledge/from/conf/gateway/:gateway_id', [logMiddleware('info', 'info-write-acknowledge-from-gateway')], HardwareController.AcknowledgeFromConfGateway);

// Settings Acknowledgement after set/reset
router.post('/setting/acknowledge/after/set/reset', [logMiddleware('info', 'info-write-setting-acknowledge-after-set-reset')], HardwareController.BypassSetRestSettingsAcknowledgement);

module.exports = router;
