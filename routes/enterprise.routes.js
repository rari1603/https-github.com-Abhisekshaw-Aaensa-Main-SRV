const express = require('express');
const EnterpriseController = require('../controllers/Enterprise/enterpriseController');
const { SetNewPasswordValidation } = require('../middleware/enterprise/enterprise.middleware');

const router = express.Router();

// set password
router.get('/set/new/password/:hashValue', EnterpriseController.SetNewPasswordView);
router.post('/set/new/password/:hashValue',[SetNewPasswordValidation], EnterpriseController.SetNewPassword);


module.exports = router;