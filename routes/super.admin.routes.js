const express = require('express');
const UserController = require('../controllers/user.controller');
const AuthController = require('../controllers/auth.controller');
const verifyToken = require('../middleware/authentication.middleware');

const router = express.Router();

// router.post('/register', RegisterController.register); // CLosed

router.post('/create-enterprise', verifyToken, AuthController.CreateUser);

router.get('/test', UserController.index);
// router.get('/hi', routeAccessMiddleware(), UserController.index);


module.exports = router;