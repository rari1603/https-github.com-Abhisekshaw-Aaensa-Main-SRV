const express = require('express');
const ReportController = require('../controllers/SuAdmin/report.controller');
const UserCreateController = require('../controllers/SuAdmin/userCreate.controller');
const verifyToken = require('../middleware/authentication.middleware');
const routeAccessMiddleware = require('../middleware/access.middleware');
const { adminEmptyCheck, userEmptyCheck } = require('../middleware/enterprise/enterprise.middleware');
const { duplicateUserCheck } = require('../middleware/auth.validation');
const router = express.Router();

router.get('/get/all/data', verifyToken, routeAccessMiddleware(), ReportController.AllDataLog);
// enterprise admin
router.post('/add/enterprise', [verifyToken, routeAccessMiddleware(), adminEmptyCheck, duplicateUserCheck], UserCreateController.addEnterprise);
// enterprise user
router.post('/add/enterprise/user', [verifyToken, routeAccessMiddleware(), userEmptyCheck, duplicateUserCheck], UserCreateController.addEnterpriseUser);


// router.get('/hi', routeAccessMiddleware(), UserController.index);


module.exports = router;