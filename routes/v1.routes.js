const express = require('express');
const UserController = require('../controllers/user.controller');
const LoginController = require('../controllers/login.controller');
const RegisterController = require('../controllers/register.controller');
const verifyToken = require('../middleware/authentication.middleware');
const routeAccessMiddleware = require('../middleware/access.middleware');
const router = express.Router();


router.get('/hi/dude', routeAccessMiddleware(), UserController.index).name = "DudeRoute";
router.get('/hi/manager', routeAccessMiddleware(), UserController.manager).name = 'ManagerRoute';
router.post('/register', RegisterController.register).name = 'RegisterRoute';
router.post('/login', LoginController.login).name = 'LoginRoute';



module.exports = router;