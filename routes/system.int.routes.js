const express = require('express');
const SystemIntController = require('../controllers/SystemInt/SystemIntController');
const { emptyUserCheck, duplicateUserCheck } = require('../middleware/auth.validation');
const router = express.Router();


router.post('/integrator/add-user', [emptyUserCheck, duplicateUserCheck], SystemIntController.addSystemInt);



module.exports = router;