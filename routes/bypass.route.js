const express = require('express');
const BypassController = require('../controllers/Bypass/BypassController');
const router = express.Router();

// Store bypass data.
router.get('/enterprise/bypass/data/:enterprise_id', BypassController.EnterpriseBypassStatus);
module.exports = router;