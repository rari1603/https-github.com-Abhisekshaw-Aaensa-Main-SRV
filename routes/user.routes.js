const express = require('express');
const UserController = require('../controllers/user.controller');
const LoginController = require('../controllers/login.controller');
const RegisterController = require('../controllers/register.controller');
const routeAccessMiddleware = require('../middleware/access.middleware');
const verifyToken = require('../middleware/authentication.middleware');

const router = express.Router();

router.get('/hi', routeAccessMiddleware(), UserController.index);
router.post('/register', RegisterController.register);
router.post('/login', LoginController.login);


module.exports = router;