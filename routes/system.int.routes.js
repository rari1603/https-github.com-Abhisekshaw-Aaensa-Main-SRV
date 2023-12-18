const express = require('express');
const router = express.Router();
const SystemIntController = require('../controllers/SystemInt/SystemIntController');

// set password
router.get('/set/new/password/:hashValue', SystemIntController.SetNewPasswordView);
router.post('/set/new/password/:hashValue', SystemIntController.SetNewPassword);



module.exports = router;