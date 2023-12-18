const express = require('express');
const ReportController = require('../controllers/SuAdmin/report.controller');
const UserCreateController = require('../controllers/SuAdmin/userCreate.controller');
const EnterpriseController = require('../controllers/Enterprise/enterpriseController');
const verifyToken = require('../middleware/authentication.middleware');
const routeAccessMiddleware = require('../middleware/access.middleware');
const { adminEmptyCheck, userEmptyCheck } = require('../middleware/enterprise/enterprise.middleware');
const { emptyUserCheck, duplicateUserCheck, duplicateEnterpriseCheck } = require('../middleware/auth.validation');
const router = express.Router();

router.get('/get/all/data', [verifyToken, routeAccessMiddleware()], ReportController.AllDataLog);
// enterprise list
router.get('/get/enterprise/list', [verifyToken], EnterpriseController.list).name = "EnterpriseList";
// add enterprise admin
router.post('/add/enterprise', [verifyToken, routeAccessMiddleware(), adminEmptyCheck, duplicateEnterpriseCheck], UserCreateController.addEnterprise);
// add enterprise user
router.post('/add/enterprise/user', [verifyToken, routeAccessMiddleware(), userEmptyCheck, duplicateUserCheck], UserCreateController.addEnterpriseUser);
// add system int
router.post('/integrator/add-user', [verifyToken, routeAccessMiddleware(), emptyUserCheck, duplicateUserCheck], UserCreateController.addSystemInt);


// router.get('/hi', routeAccessMiddleware(), UserController.index);


module.exports = router;