const express = require('express');
const UserController = require('../controllers/user.controller');
const LoginController = require('../controllers/login.controller');
const RegisterController = require('../controllers/auth.controller');
const routeAccessMiddleware = require('../middleware/access.middleware');
const verifyToken = require('../middleware/authentication.middleware');

const router = express.Router();

router.post('/login', LoginController.login);
router.post('/register', RegisterController.register);
router.get('/test', UserController.index);
// router.get('/hi', routeAccessMiddleware(), UserController.index);


module.exports = router;