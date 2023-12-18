const express = require('express');
const EnterpriseController = require('../controllers/Enterprise/enterpriseController');
const { adminEmptyCheck, userEmptyCheck } = require('../middleware/enterprise/enterprise.middleware');
const { duplicateUserCheck } = require('../middleware/auth.validation');
const router = express.Router();


router.get('/get/enterprise/list', EnterpriseController.list).name = "EnterpriseList";
// enterprise admin
router.post('/add/enterprise', [adminEmptyCheck, duplicateUserCheck], EnterpriseController.addEnterprise);
// enterprise user
router.post('/add/enterprise/user', [userEmptyCheck, duplicateUserCheck], EnterpriseController.addEnterpriseUser);
// set password
router.get('/set/new/password/:hashValue', EnterpriseController.SetNewPasswordView);
router.post('/set/new/password/:hashValue', EnterpriseController.SetNewPassword);


module.exports = router;