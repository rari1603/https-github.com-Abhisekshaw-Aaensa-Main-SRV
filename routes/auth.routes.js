const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { HandleLoginError, ForgetPasswordValidation } = require('../middleware/auth.validation');

const router = express.Router();
router.post('/login', [HandleLoginError], AuthController.login);
router.post('/forget-password', [ForgetPasswordValidation], AuthController.ForgetPassword);
router.get('/forget/password/:hashValue', AuthController.ForgetPasswordView);
router.post('/forget/password/:hashValue', AuthController.ResetNewPassword);



module.exports = router;