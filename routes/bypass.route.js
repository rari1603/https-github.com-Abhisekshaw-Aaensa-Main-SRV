const express = require('express');
const BypassController = require('../controllers/Bypass/BypassController');
const router = express.Router();

// Store bypass data.
router.get('/enterprise/bypass/data', BypassController.EnterpriseBypassStatus);
module.exports = router;