const express = require('express');
const EnterpriseController = require('../controllers/Enterprise/enterpriseController');
const { adminEmptyCheck, duplicateAdminCheck, userEmptyCheck } = require('../middleware/enterprise/enterprise.middleware');
const { emptyUserCheck, duplicateUserCheck } = require('../middleware/auth.validation');
const router = express.Router();


router.get('/get/enterprise/list', EnterpriseController.list).name = "EnterpriseList";

router.post('/add/enterprise', [adminEmptyCheck, duplicateAdminCheck], EnterpriseController.addEnterprise);
router.post('/add/enterprise/user', [userEmptyCheck], EnterpriseController.addEnterpriseUser);



module.exports = router;