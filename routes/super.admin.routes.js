const express = require('express');
const ReportController = require('../controllers/SuAdmin/report.controller');
const UserController = require('../controllers/SuAdmin/user.controller');
const EnterpriseController = require('../controllers/Enterprise/enterpriseController');
const CommonController = require('../controllers/CommonController');
const DeviceController = require('../controllers/SuAdmin/device.controller');
const AuthController = require('../controllers/auth.controller');
const verifyToken = require('../middleware/authentication.middleware');
const routeAccessMiddleware = require('../middleware/access.middleware');
const { adminEmptyCheck, userEmptyCheck } = require('../middleware/enterprise/enterprise.middleware');
const { CheckEntState, CheckEntStateLocation, CheckGateway, CheckOptimizer } = require('../middleware/device/device.middleware');
const { systemInitEmptyCheck } = require('../middleware/systemInt/systemInt.middleware');
const { duplicateUserCheck, duplicateEnterpriseCheck } = require('../middleware/auth.validation');
const router = express.Router();


/************* START REPORT *************/
// Device Data report api
router.post('/get/all/device/data', ReportController.AllDeviceData);
// Meter Data report api
router.post('/get/all/meter/data', ReportController.AllMeterData);
// USAGE TRENDS api
router.post('/get/all/usage/trends',ReportController.UsageTrends)


// Download device report
router.post('/download/all/devicedata/report', ReportController.DownloadDeviceDataReport);
// Download meter report
router.post('/download/all/meterdata/report', ReportController.DownloadMeterDataReport);


// router.post('/get/all/device/data', [verifyToken, routeAccessMiddleware()], ReportController.AllDataLog);
router.get('/get/all/demo/data', ReportController.AllDataLogDemo);
/************* END REPORT *************/


// enterprise list
router.get('/get/enterprise/list/:flag', [verifyToken], EnterpriseController.EnterpriseListData); // flag should be "data"/"name"

// enterprise state list
router.get('/get/enterprise/state/list/:enterprise_id', [verifyToken], EnterpriseController.EnterpriseStateList);
// EnterpriseStateLocationList
router.get('/get/enterprise/state/location/list/:enterprise_id/:state_id', [verifyToken], EnterpriseController.EnterpriseStateLocationList);
// EnterpriseStateLocationGatewayList
router.get('/get/enterprise/state/location/gateway/list/:enterpriseInfo_id', [verifyToken], EnterpriseController.EnterpriseStateLocationGatewayList);
// EnterpriseStateLocationGatewayOptimizerList
router.get('/get/enterprise/state/location/gateway/optimizer/list/:gateway_id', [verifyToken], EnterpriseController.EnterpriseStateLocationGatewayOptimizerList);
// OptimizerDetails
router.get('/get/optimizer/details/:optimizer_id', [verifyToken], EnterpriseController.OptimizerDetails);
// GatewayDetails
router.get('/get/gateway/details/:gateway_id', [verifyToken], EnterpriseController.GatewayDetails);


/*********** START ENTERPRISE ADD & UPDATE ***********/
// add enterprise admin
router.post('/add/enterprise', [verifyToken, routeAccessMiddleware(), adminEmptyCheck, duplicateEnterpriseCheck], UserController.addEnterprise);
router.post('/update/enterprise/:enterprise_id', [verifyToken, routeAccessMiddleware(), adminEmptyCheck], UserController.UpdateEnterprise);
/*********** END ENTERPRISE ADD & UPDATE ***********/


// add enterprise user
router.post('/add/enterprise/user', [verifyToken, routeAccessMiddleware(), userEmptyCheck, duplicateUserCheck], UserController.addEnterpriseUser);

// add system int
router.post('/add/system/integrator', [verifyToken, routeAccessMiddleware(), systemInitEmptyCheck, duplicateUserCheck], UserController.addSystemInt);
// states
router.get('/get/all/states', CommonController.getStates);


/*********** START STATE ADD & UPDATE ***********/
// AddEnterpriseState
router.post('/add/enterprise/state', [verifyToken, routeAccessMiddleware(), CheckEntState], DeviceController.AddEnterpriseState);
// UpdateEnterpriseState
router.post('/update/enterprise/state/:ent_state_id', [verifyToken, routeAccessMiddleware(), CheckEntState], DeviceController.UpdateEnterpriseState);
/*********** END STATE ADD & UPDATE ***********/



/*********** START LOCATION ADD & UPDATE ***********/
// AddEnterpriseStateLocation
router.post('/add/enterprise/state/location', [verifyToken, routeAccessMiddleware(), CheckEntStateLocation], DeviceController.AddEnterpriseStateLocation);
// UpdateEnterpriseStateLocation
router.post('/update/enterprise/state/location/:location_id', [verifyToken, routeAccessMiddleware(), CheckEntStateLocation], DeviceController.UpdateEnterpriseStateLocation);
/*********** END LOCATION ADD & UPDATE ***********/


/*********** START GATEWAY ADD & UPDATE ***********/
// AddGateway
router.post('/add/gateway', [verifyToken, routeAccessMiddleware(), CheckGateway], DeviceController.AddGateway);
// UpdateGateway
router.post('/update/gateway/:gateway_id', [verifyToken, routeAccessMiddleware(), CheckGateway], DeviceController.UpdateGateway);
/*********** END GATEWAY ADD & UPDATE ***********/


/*********** START OPTIMIZER ADD & UPDATE ***********/
// AddOptimizer
router.post('/add/optimizer', [verifyToken, routeAccessMiddleware(), CheckOptimizer], DeviceController.AddOptimizer);
// UpdateOptimizer
router.post('/update/optimizer/:optimizer_id', [verifyToken, routeAccessMiddleware(), CheckOptimizer], DeviceController.UpdateOptimizer);
/*********** END OPTIMIZER ADD & UPDATE ***********/


/******* RECURSIVE DELETE FOR ALL *******/
router.post('/delete/all', [verifyToken, routeAccessMiddleware()], DeviceController.DeleteAll);


// Get all enterprise & system integrator user
router.get('/get/user/data', [verifyToken], UserController.GetEnterpriseSystemIntUsers);

// Get all enterprise & system integrator user
router.get('/get/dashboard/details/data', [verifyToken, routeAccessMiddleware()], CommonController.DashboardDetails);


/**** Delete User ****/
// Delete user
router.post('/delete/user/:user_id', [verifyToken, routeAccessMiddleware()], AuthController.DeleteUser);




/**** Test Delete Optimizer ****/
// TestDeleteGateway
router.get('/delete/gateway/:gateway_id', DeviceController.DeleteOptimizer);
// router.get('/hi', routeAccessMiddleware(), UserController.index);

router.get('/pagination', ReportController.PaginationData);

module.exports = router;