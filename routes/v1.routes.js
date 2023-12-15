const express = require('express');
const UserController = require('../controllers/user.controller');
const LoginController = require('../controllers/login.controller');
const RegisterController = require('../controllers/auth.controller');
const verifyToken = require('../middleware/authentication.middleware');
const routeAccessMiddleware = require('../middleware/access.middleware');
const router = express.Router();
const TestController = require('../fake/controller/testController');


// router.get('/hi/dude', routeAccessMiddleware(), UserController.index).name = "DudeRoute";
// router.get('/hi/manager', routeAccessMiddleware(), UserController.manager).name = 'ManagerRoute';
// router.post('/register', RegisterController.register).name = 'RegisterRoute';
// router.post('/login', LoginController.login).name = 'LoginRoute';


router.get('/create-gateway', TestController.Gateway);
router.get('/create-optimizer', TestController.Optimizer);
router.get('/fake', TestController.processArray);
router.get('/add/all', TestController.addManyDataDB);




module.exports = router;