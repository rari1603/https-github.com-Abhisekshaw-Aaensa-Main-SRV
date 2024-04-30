const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { HandleLoginError, ForgetPasswordValidation } = require('../middleware/auth.validation');
const { SetNewPasswordValidation } = require('../middleware/enterprise/enterprise.middleware');


const router = express.Router();
router.post('/register', AuthController.register); // Closed

router.post('/login', [HandleLoginError], AuthController.login);
router.post('/forget-password', [ForgetPasswordValidation], AuthController.ForgetPassword);
router.get('/forget/password/:hashValue', AuthController.ForgetPasswordView);
router.post('/forget/password/:hashValue',[SetNewPasswordValidation], AuthController.ResetNewPassword);



module.exports = router;