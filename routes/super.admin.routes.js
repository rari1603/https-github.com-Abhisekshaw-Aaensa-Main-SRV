const express = require('express');
const ReportController = require('../controllers/SuAdmin/report.controller');
const ReplicaController = require('../controllers/DataReplica');
const UserController = require('../controllers/SuAdmin/user.controller');
const EnterpriseController = require('../controllers/Enterprise/enterpriseController');
const CommonController = require('../controllers/CommonController');
const DeviceController = require('../controllers/SuAdmin/device.controller');
const AuthController = require('../controllers/auth.controller');
const ManualAcOnOffInsert = require ('../controllers/SuAdmin/ManualAcOnOff')
const verifyToken = require('../middleware/authentication.middleware');
const routeAccessMiddleware = require('../middleware/access.middleware');
const { adminEmptyCheck, userEmptyCheck } = require('../middleware/enterprise/enterprise.middleware');
const { CheckEntState, CheckEntStateLocation, CheckGateway, CheckOptimizer } = require('../middleware/device/device.middleware');
const { systemInitEmptyCheck } = require('../middleware/systemInt/systemInt.middleware');
const { duplicateUserCheck, duplicateEnterpriseCheck } = require('../middleware/auth.validation');

// Apply routeCapture middleware to capture route info
const { logMiddleware } = require('../middleware/log.middleware');  // Import the middleware
const router = express.Router();

/************* START REPORT *************/
// Device Data report api
router.post('/get/all/device/data', [logMiddleware('info', 'info-read-deviceData')], ReportController.AllDeviceData);
// Meter Data report api
router.post('/get/all/meter/data', [logMiddleware('info', 'info-read-meterData')], ReportController.AllMeterData);
// USAGE TRENDS api
router.post('/get/all/usage/trends', [logMiddleware('info', 'info-read-usageTrends')], ReportController.UsageTrends);

// AC ON OFF api
router.post('/get/all/acon/off', [logMiddleware('info', 'info-read-aconoff')], ReportController.AcOnOff);

// Download device report
router.post('/download/all/devicedata/report', [logMiddleware('info', 'info-read-deviceDataReport')], ReportController.DownloadDeviceDataReport);
// Download meter report
router.post('/download/all/meterdata/report', [logMiddleware('info', 'info-read-meterDataReport')], ReportController.DownloadMeterDataReport);
// Download usageTrend report
router.post('/download/all/usagetrend/report', [logMiddleware('info', 'info-read-usageTrendsReport')], ReportController.DownloadUsageTrendsReport);

// Manual Insertion Ac OnOf 
router.post('/manual/insert/ac/onoff', [logMiddleware('info', 'info-read-usageTrendsReport')], ManualAcOnOffInsert.ManualAcOnOffInsertion);

// Demo data log
router.get('/get/all/demo/data', [logMiddleware('info', 'info-read-demoData')], ReportController.AllDataLogDemo);
/************* END REPORT *************/

/*********** ENTERPRISE ROUTES ***********/
// Enterprise list
router.get('/get/enterprise/list/:flag', [verifyToken, logMiddleware('info', 'info-read-enterpriseList')], EnterpriseController.EnterpriseListData);

// Enterprise state list
router.get('/get/enterprise/state/list/:enterprise_id', [verifyToken, logMiddleware('info', 'info-read-enterpriseStateList')], EnterpriseController.EnterpriseStateList);

// Enterprise state location list
router.get('/get/enterprise/state/location/list/:enterprise_id/:state_id', [verifyToken, logMiddleware('info', 'info-read-enterpriseStateLocationList')], EnterpriseController.EnterpriseStateLocationList);

// Enterprise state location gateway list
router.get('/get/enterprise/state/location/gateway/list/:enterpriseInfo_id', [verifyToken, logMiddleware('info', 'info-read-gatewayList')], EnterpriseController.EnterpriseStateLocationGatewayList);

// Enterprise state location gateway optimizer list
router.get('/get/enterprise/state/location/gateway/optimizer/list/:gateway_id', [verifyToken, logMiddleware('info', 'info-read-optimizerList')], EnterpriseController.EnterpriseStateLocationGatewayOptimizerList);

// Optimizer details
router.get('/get/optimizer/details/:optimizer_id', [verifyToken, logMiddleware('info', 'info-read-optimizerDetails')], EnterpriseController.OptimizerDetails);

// Gateway details
router.get('/get/gateway/details/:gateway_id', [verifyToken, logMiddleware('info', 'info-read-gatewayDetails')], EnterpriseController.GatewayDetails);

// single call for all details (enterprise, state, location, gateway, optimizer)
router.get('/get/enterprise/:enterprise_id', [verifyToken, logMiddleware('info', 'info-read-enterpriseDetail')],  EnterpriseController.SingleEnterpriseData);

// single call for all details (enterprise, state, location, gateway, optimizer)
router.get('/get/enterprise', [verifyToken, logMiddleware('info', 'info-read-enterprisesDetails')], EnterpriseController.AllEnterpriseData);

/*********** END ENTERPRISE ROUTES ***********/

/*********** START ENTERPRISE ADD & UPDATE ***********/
// Add enterprise admin
router.post('/add/enterprise', [verifyToken, routeAccessMiddleware(), adminEmptyCheck, duplicateEnterpriseCheck, logMiddleware('info', 'info-write-addEnterprise')], UserController.addEnterprise);

// Update enterprise admin
router.post('/update/enterprise/:enterprise_id', [verifyToken, routeAccessMiddleware(), adminEmptyCheck, logMiddleware('info', 'info-write-updateEnterprise')], UserController.UpdateEnterprise);
/*********** END ENTERPRISE ADD & UPDATE ***********/

/*********** USER ROUTES ***********/
// Add enterprise user
router.post('/add/enterprise/user', [verifyToken, routeAccessMiddleware(), userEmptyCheck, duplicateUserCheck, logMiddleware('info', 'info-write-addEnterpriseUser')], UserController.addEnterpriseUser);

// Add system integrator
router.post('/add/system/integrator', [verifyToken, routeAccessMiddleware(), systemInitEmptyCheck, duplicateUserCheck, logMiddleware('info', 'info-write-addSystemIntegrator')], UserController.addSystemInt);

// Get all enterprise & system integrator user
router.get('/get/user/data', [verifyToken, logMiddleware('info', 'info-read-enterpriseSystemUsers')], UserController.GetEnterpriseSystemIntUsers);

/*********** START STATE ADD & UPDATE ***********/
// Add enterprise state
router.post('/add/enterprise/state', [verifyToken, routeAccessMiddleware(), CheckEntState, logMiddleware('info', 'info-write-addEnterpriseState')], DeviceController.AddEnterpriseState);

// states
router.get('/get/all/states', [logMiddleware('info', 'info-read')], CommonController.getStates);

// Update enterprise state
router.post('/update/enterprise/state/:ent_state_id', [verifyToken, routeAccessMiddleware(), CheckEntState, logMiddleware('info', 'info-write-updateEnterpriseState')], DeviceController.UpdateEnterpriseState);
/*********** END STATE ADD & UPDATE ***********/

/*********** START LOCATION ADD & UPDATE ***********/
// Add enterprise state location
router.post('/add/enterprise/state/location', [verifyToken, routeAccessMiddleware(), CheckEntStateLocation, logMiddleware('info', 'info-write-addEnterpriseStateLocation')], DeviceController.AddEnterpriseStateLocation);

// Update enterprise state location
router.post('/update/enterprise/state/location/:location_id', [verifyToken, routeAccessMiddleware(), CheckEntStateLocation, logMiddleware('info', 'info-write-updateEnterpriseStateLocation')], DeviceController.UpdateEnterpriseStateLocation);
/*********** END LOCATION ADD & UPDATE ***********/

/*********** START GATEWAY ADD & UPDATE ***********/
// Add gateway
router.post('/add/gateway', [verifyToken, routeAccessMiddleware(), CheckGateway, logMiddleware('info', 'info-write-addGateway')], DeviceController.AddGateway);

// Update gateway
router.post('/update/gateway/:gateway_id', [verifyToken, routeAccessMiddleware(), CheckGateway, logMiddleware('info', 'info-write-updateGateway')], DeviceController.UpdateGateway);
/*********** END GATEWAY ADD & UPDATE ***********/

/*********** START OPTIMIZER ADD & UPDATE ***********/
// Add optimizer
router.post('/add/optimizer', [verifyToken, routeAccessMiddleware(), CheckOptimizer, logMiddleware('info', 'info-write-addOptimizer')], DeviceController.AddOptimizer);

// Update optimizer
router.post('/update/optimizer/:optimizer_id', [verifyToken, routeAccessMiddleware(), CheckOptimizer, logMiddleware('info', 'info-write-updateOptimizer')], DeviceController.UpdateOptimizer);
/*********** END OPTIMIZER ADD & UPDATE ***********/

/******* RECURSIVE DELETE FOR ALL *******/
router.post('/delete/all', [verifyToken, routeAccessMiddleware(), logMiddleware('info', 'info-delete-all')], DeviceController.DeleteAll);

/******* DELETE USER *******/
router.post('/delete/user/:user_id', [verifyToken, routeAccessMiddleware(), logMiddleware('info', 'info-delete-user')], AuthController.DeleteUser);

/******* DELETE GATEWAY *******/
router.get('/delete/gateway/:gateway_id', [logMiddleware('info', 'info-delete-gateway')], DeviceController.DeleteOptimizer);

/******* CLONE DATA API *******/
router.get('/clone/all/data', [logMiddleware('info', 'info-clone-allData')], ReplicaController.CreateClone);

/******* PAGINATION *******/
router.get('/pagination', [logMiddleware('info', 'info-read-pagination')], ReportController.PaginationData);


module.exports = router;
