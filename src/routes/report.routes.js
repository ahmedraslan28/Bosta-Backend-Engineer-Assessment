const express = require('express');
const router = express.Router();
const { exportPeriodReport, exportAllLastMonth, exportOverdueLastMonth} = require('../controllers/report.controller');
const { reportLimiter } = require('../config/rateLimit.config');
const auth = require('../middlewares/auth.middleware');

router.use(auth);
router.get('/borrows-by-period', reportLimiter, exportPeriodReport);
router.get('/overdue-last-month', exportOverdueLastMonth);
router.get('/borrows-last-month', exportAllLastMonth);

module.exports = router;
