const express = require('express');
const ReportController = require('../controllers/SuAdmin/report.controller');
const UserController = require('../controllers/SuAdmin/user.controller');
const EnterpriseController = require('../controllers/Enterprise/enterpriseController');
const CommonController = require('../controllers/CommonController');
const DeviceController = require('../controllers/SuAdmin/device.controller');
const verifyToken = require('../middleware/authentication.middleware');
const routeAccessMiddleware = require('../middleware/access.middleware');
const { adminEmptyCheck, userEmptyCheck } = require('../middleware/enterprise/enterprise.middleware');
const { CheckEntState, CheckEntStateLocation, CheckGateway, CheckOptimizer } = require('../middleware/device/device.middleware');
const { systemInitEmptyCheck } = require('../middleware/systemInt/systemInt.middleware');
const { duplicateUserCheck, duplicateEnterpriseCheck } = require('../middleware/auth.validation');
const router = express.Router();



router.get('/get/all/data', [verifyToken, routeAccessMiddleware()], ReportController.AllDataLog);
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

// add enterprise admin
router.post('/add/enterprise', [verifyToken, routeAccessMiddleware(), adminEmptyCheck, duplicateEnterpriseCheck], UserController.addEnterprise);


// add enterprise user
router.post('/add/enterprise/user', [verifyToken, routeAccessMiddleware(), userEmptyCheck, duplicateUserCheck], UserController.addEnterpriseUser);
// add system int
router.post('/add/system/integrator', [verifyToken, routeAccessMiddleware(), systemInitEmptyCheck, duplicateUserCheck], UserController.addSystemInt);
// states
router.get('/get/all/states', CommonController.getStates);

// AddEnterpriseState
router.post('/add/enterprise/state', [verifyToken, routeAccessMiddleware(), CheckEntState], DeviceController.AddEnterpriseState);
// AddEnterpriseStateLocation
router.post('/add/enterprise/state/location', [verifyToken, routeAccessMiddleware(), CheckEntStateLocation], DeviceController.AddEnterpriseStateLocation);
// AddGateway
router.post('/add/gateway', [verifyToken, routeAccessMiddleware(), CheckGateway], DeviceController.AddGateway);
// UpdateGateway
router.post('/update/gateway/:gateway_id', [verifyToken, routeAccessMiddleware(), CheckGateway], DeviceController.UpdateGateway);
// AddOptimizer
router.post('/add/optimizer', [verifyToken, routeAccessMiddleware(), CheckOptimizer], DeviceController.AddOptimizer);

// Get all enterprise & system integrator user
router.get('/get/user/data', [verifyToken], UserController.GetEnterpriseSystemIntUsers);


// router.get('/hi', routeAccessMiddleware(), UserController.index);


module.exports = router;