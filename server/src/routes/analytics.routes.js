
const express = require('express');
const { getAnalyticsData } = require('../controllers/analytics.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Analytics routes - admin/staff only
router.get('/', authenticate, authorize(['ADMIN', 'STAFF']), getAnalyticsData);

module.exports = router;
