const express = require('express');
const EnterpriseController = require('../controllers/Enterprise/enterpriseController');
const router = express.Router();


router.get('/get/enterprise/list', EnterpriseController.list).name = "EnterpriseList";
router.post('/add/enterprise', EnterpriseController.add).name = 'EnterpriseAdd';



module.exports = router;