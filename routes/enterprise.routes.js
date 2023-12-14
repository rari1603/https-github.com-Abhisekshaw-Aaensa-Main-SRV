const express = require('express');
const EnterpriseController = require('../controllers/Enterprise/enterpriseController');
const { adminEmptyCheck } = require('../middleware/enterprise/enterprise.middleware');
const router = express.Router();


router.get('/get/enterprise/list', EnterpriseController.list).name = "EnterpriseList";
router.post('/add/enterprise', [adminEmptyCheck], EnterpriseController.add).name = 'EnterpriseAdd';



module.exports = router;