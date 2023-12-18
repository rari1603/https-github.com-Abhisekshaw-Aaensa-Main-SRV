const express = require('express');
const EnterpriseController = require('../controllers/Enterprise/enterpriseController');
const router = express.Router();

// set password
router.get('/set/new/password/:hashValue', EnterpriseController.SetNewPasswordView);
router.post('/set/new/password/:hashValue', EnterpriseController.SetNewPassword);


module.exports = router;