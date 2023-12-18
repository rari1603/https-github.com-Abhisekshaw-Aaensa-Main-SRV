const express = require('express');
const ReportController = require('../controllers/SuAdmin/report.controller');
const UserCreateController = require('../controllers/SuAdmin/userCreate.controller');
const EnterpriseController = require('../controllers/Enterprise/enterpriseController');
const CommonController = require('../controllers/CommonController');
const verifyToken = require('../middleware/authentication.middleware');
const routeAccessMiddleware = require('../middleware/access.middleware');
const { adminEmptyCheck, userEmptyCheck } = require('../middleware/enterprise/enterprise.middleware');
const { systemInitEmptyCheck } = require('../middleware/systemInt/systemInt.middleware');
const { duplicateUserCheck, duplicateEnterpriseCheck } = require('../middleware/auth.validation');
const router = express.Router();

router.get('/get/all/data', [verifyToken, routeAccessMiddleware()], ReportController.AllDataLog);
// enterprise list
router.get('/get/enterprise/list', [verifyToken], EnterpriseController.list).name = "EnterpriseList";
// add enterprise admin
router.post('/add/enterprise', [verifyToken, routeAccessMiddleware(), adminEmptyCheck, duplicateEnterpriseCheck], UserCreateController.addEnterprise);
// add enterprise user
router.post('/add/enterprise/user', [verifyToken, routeAccessMiddleware(), userEmptyCheck, duplicateUserCheck], UserCreateController.addEnterpriseUser);
// add system int
router.post('/add/system/integrator', [verifyToken, routeAccessMiddleware(), systemInitEmptyCheck, duplicateUserCheck], UserCreateController.addSystemInt);
// states
router.get('/get/all/states', CommonController.getStates);


// router.get('/hi', routeAccessMiddleware(), UserController.index);


module.exports = router;